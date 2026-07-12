import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@hrms-app/auth";
import { adminDb, getTenantDb, tenants } from "@hrms-app/db";



export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth();
  let tenantDb = undefined;

  const tenantId = session?.user?.tenantId;
  if (tenantId) {
    const tenant = await adminDb.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.id, tenantId),
    });
    if (tenant) {
      tenantDb = getTenantDb(tenant.schemaName);
    }
  }

  return {
    adminDb,
    tenantDb,
    session,
    headers: opts.headers,
    reqId: crypto.randomUUID(),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.tenantDb) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No tenant context" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
      db: ctx.tenantDb as any,
    },
  });
});

export function requireRole(...roles: string[]) {
  return t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!ctx.tenantDb) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No tenant context" });
    }
    if (!roles.includes(ctx.session.user.role ?? "")) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({
      ctx: { ...ctx, user: ctx.session.user, db: ctx.tenantDb as any },
    });
  });
}
