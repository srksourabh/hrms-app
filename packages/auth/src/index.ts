import NextAuth, { type DefaultSession, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { adminDb } from '@hrms-app/db';
import { users, tenants } from '@hrms-app/db';
import { compare } from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { resolveDemoIdentity } from './demo-identities';
import { verifyTotp } from './totp';

// ── Account lockout (C2) ──────────────────────────────────────────────────────
// Durable per-account lockout with exponential backoff, stored on the users
// table. All DB access is exception-wrapped so login keeps working even if the
// lockout columns have not been migrated yet (migration 0008).
const MAX_FAILED_ATTEMPTS = 5;

async function getLockState(userId: string): Promise<{ attempts: number; lockedUntil: Date | null } | null> {
  try {
    const rows = (await adminDb.execute(
      sql`SELECT failed_login_attempts AS attempts, locked_until AS locked_until FROM users WHERE id = ${userId}`,
    )) as unknown as { attempts: number | null; locked_until: string | Date | null }[];
    const row = rows?.[0];
    if (!row) return null;
    return {
      attempts: Number(row.attempts ?? 0),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
    };
  } catch {
    return null; // columns not present yet — lockout disabled until migrated
  }
}

async function recordFailedAttempt(userId: string, priorAttempts: number): Promise<void> {
  const attempts = priorAttempts + 1;
  try {
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockMinutes = Math.min(5 * 2 ** (attempts - MAX_FAILED_ATTEMPTS), 60);
      const until = new Date(Date.now() + lockMinutes * 60_000).toISOString();
      await adminDb.execute(
        sql`UPDATE users SET failed_login_attempts = ${attempts}, locked_until = ${until} WHERE id = ${userId}`,
      );
    } else {
      await adminDb.execute(sql`UPDATE users SET failed_login_attempts = ${attempts} WHERE id = ${userId}`);
    }
  } catch {
    /* lockout columns not migrated — best effort */
  }
}

async function clearLockState(userId: string): Promise<void> {
  try {
    await adminDb.execute(sql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ${userId}`);
  } catch {
    /* best effort */
  }
}

type AuthResult = ReturnType<typeof NextAuth>;

declare module 'next-auth' {
  interface User {
    role?: string;
    tenantId?: string;
    employeeId?: string;
    preferredLanguage?: 'en' | 'ar';
  }

  interface Session {
    user: {
      id: string;
      tenantId: string;
      employeeId: string;
      role: string;
      regulatoryContext: 'saudi' | 'india';
      preferredLanguage: 'en' | 'ar';
    } & DefaultSession['user'];
  }

  interface JWT {
    role?: string;
    tenantId?: string;
    employeeId?: string;
    id?: string;
    regulatoryContext?: 'saudi' | 'india';
    preferredLanguage?: 'en' | 'ar';
  }
}

const nextAuthResult: AuthResult = NextAuth({
  trustHost: true,
  logger: {
    error(error) {
      console.error('[next-auth][error]', error instanceof Error ? error.message : String(error));
    },
    warn(code) { console.warn('[next-auth][warn]', code); },
  },
  // 30-minute idle timeout (C3 / AUTH-007): the JWT expires 30 min after it
  // was last issued; it is re-issued on activity (updateAge), so active users
  // stay signed in while idle sessions expire and require re-authentication.
  session: { strategy: 'jwt', maxAge: 30 * 60, updateAge: 5 * 60 },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp: { label: 'Authenticator code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email as string;
        const password = credentials.password as string;

        const demoModeEnabled = process.env.DEMO_MODE === "true";
        const demoIdentity = resolveDemoIdentity(email, password, demoModeEnabled);
        if (demoIdentity) {
          return {
            id: demoIdentity.id,
            email: demoIdentity.email,
            name: demoIdentity.name,
            role: demoIdentity.role,
            tenantId: demoIdentity.tenantId,
            employeeId: demoIdentity.employeeId,
            image: demoIdentity.image,
            preferredLanguage: demoIdentity.preferredLanguage,
          };
        }

        const user = await adminDb.query.users.findFirst({ where: eq(users.email, email) });
        if (!user || !user.passwordHash) return null;

        // Reject if the account is currently locked.
        const lock = await getLockState(user.id);
        if (lock?.lockedUntil && lock.lockedUntil > new Date()) {
          console.warn('[auth] login blocked: account temporarily locked');
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          await recordFailedAttempt(user.id, lock?.attempts ?? 0);
          console.warn('[auth] failed login attempt for', email);
          return null;
        }

        // MFA gate (C4) — enforced only for accounts that have enrolled a
        // secret, so accounts without MFA are unaffected. A wrong/missing code
        // does not count toward lockout (the password was correct).
        if (user.mfaSecret) {
          const totp = typeof credentials.totp === 'string' ? credentials.totp : '';
          if (!verifyTotp(user.mfaSecret, totp)) {
            console.warn('[auth] MFA verification failed for', email);
            return null;
          }
        }

        // Successful login — clear any prior failed-attempt state.
        if (lock && (lock.attempts > 0 || lock.lockedUntil)) {
          await clearLockState(user.id);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tenantId: user.tenantId,
          employeeId: user.employeeId ?? undefined,
          preferredLanguage: user.preferredLanguage ?? "en",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First sign-in: copy the user fields the seed stores.
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.employeeId = user.employeeId;
        if (user.tenantId) {
          const tenant = await adminDb.query.tenants.findFirst({ where: eq(tenants.id, user.tenantId) });
          token.regulatoryContext = tenant?.regulatoryContext ?? 'saudi';
        } else {
          token.regulatoryContext = 'saudi';
        }
        token.preferredLanguage = user.preferredLanguage ?? 'en';
      }
      // Subsequent requests: if the token was issued before the employeeId
      // bug was fixed (no employeeId captured at first login), re-hydrate
      // it from the DB so employee-role users are no longer orphaned.
      else if (token.sub && !token.employeeId) {
        try {
          const u = await adminDb.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, token.sub as string),
          });
          if (u?.employeeId) token.employeeId = u.employeeId;
        } catch {
          /* never block a session refresh on a transient DB issue */
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.role = (token.role as string) ?? '';
        session.user.tenantId = (token.tenantId as string) ?? '';
        session.user.employeeId = (token.employeeId as string) ?? '';
        session.user.regulatoryContext = (token.regulatoryContext as 'saudi' | 'india') ?? 'saudi';
        session.user.preferredLanguage = (token.preferredLanguage as 'en' | 'ar') ?? 'en';
      }
      return session;
    },
  },
});

export const handlers = nextAuthResult.handlers;
export const signIn = nextAuthResult.signIn as (options: { redirect: boolean; callbackUrl?: string }) => Promise<void>;
export const signOut = nextAuthResult.signOut as (options: { redirect: boolean; callbackUrl?: string }) => Promise<void>;
export const auth = nextAuthResult.auth as () => Promise<Session | null>;

export { generateTotpSecret, verifyTotp, totpAuthUri } from './totp';
