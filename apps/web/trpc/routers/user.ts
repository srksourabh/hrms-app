import { createTRPCRouter, protectedProcedure } from "../server";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.adminDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.user.id!),
    });
    return user;
  }),
});
