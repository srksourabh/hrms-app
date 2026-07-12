import NextAuth, { type DefaultSession, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { adminDb } from "@hrms-app/db";
import { users, tenants } from "@hrms-app/db";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

type AuthResult = ReturnType<typeof NextAuth>;

declare module "next-auth" {
  interface User {
    role?: string;
    tenantId?: string;
    preferredLanguage?: "en" | "ar";
  }

  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: string;
      regulatoryContext: "saudi" | "india";
      preferredLanguage: "en" | "ar";
    } & DefaultSession["user"];
  }

  interface JWT {
    role?: string;
    tenantId?: string;
    id?: string;
    regulatoryContext?: "saudi" | "india";
    preferredLanguage?: "en" | "ar";
  }
}

const nextAuthResult: AuthResult = NextAuth({
  trustHost: true,
  logger: {
    error(error) {
      console.error("[next-auth][error]", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
    },
    warn(code) { console.warn("[next-auth][warn]", code); },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const isDemoLogin =
          process.env.DEMO_MODE === "true" &&
          email === "admin@demo.com" &&
          password === "Demo@1234";

        if (isDemoLogin) {
          return {
            id: "demo-user",
            email,
            name: "Sourabh",
            role: "hr_manager",
          };
        }

        const user = await adminDb.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account: _account }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;

        if (user.tenantId) {
          const tenant = await adminDb.query.tenants.findFirst({
            where: eq(tenants.id, user.tenantId),
          });
          token.regulatoryContext = tenant?.regulatoryContext ?? "saudi";
        } else {
          token.regulatoryContext = "saudi";
        }

        token.preferredLanguage = user.preferredLanguage ?? "en";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.role = (token.role as string) ?? "";
        session.user.tenantId = (token.tenantId as string) ?? "";
        session.user.regulatoryContext = (token.regulatoryContext as "saudi" | "india") ?? "saudi";
        session.user.preferredLanguage = (token.preferredLanguage as "en" | "ar") ?? "en";
      }
      return session;
    },
  },
});

export const handlers = nextAuthResult.handlers;
export const signIn = nextAuthResult.signIn as (
  provider: "credentials",
  options: { email: string; password: string; redirectTo: string },
) => Promise<void>;
export const signOut = nextAuthResult.signOut as (options: { redirect: boolean; callbackUrl?: string }) => Promise<void>;
export const auth = nextAuthResult.auth as () => Promise<Session | null>;
