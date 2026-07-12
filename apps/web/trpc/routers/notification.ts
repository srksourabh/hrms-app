import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../server";
import { schema } from "@hrms-app/db";
import { and, eq, desc, count } from "drizzle-orm";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          read: z.boolean().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(schema.tenant.notifications.userId, ctx.user.id!)];
      if (input?.read !== undefined) {
        conditions.push(eq(schema.tenant.notifications.read, input.read));
      }
      return await ctx.db.query.notifications.findMany({
        where: and(...conditions),
        orderBy: desc(schema.tenant.notifications.createdAt),
      });
    }),

  markRead: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    const [notification] = await ctx.db
      .update(schema.tenant.notifications)
      .set({ read: true })
      .where(
        and(eq(schema.tenant.notifications.id, input), eq(schema.tenant.notifications.userId, ctx.user.id!))
      )
      .returning();
    return notification;
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(schema.tenant.notifications)
      .set({ read: true })
      .where(eq(schema.tenant.notifications.userId, ctx.user.id!));
    return { success: true };
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(schema.tenant.notifications)
      .where(
        and(
          eq(schema.tenant.notifications.userId, ctx.user.id!),
          eq(schema.tenant.notifications.read, false)
        )
      );
    return { count: result?.count ?? 0 };
  }),
});
