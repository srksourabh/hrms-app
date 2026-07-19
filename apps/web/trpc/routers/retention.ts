import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { goalStatusEnum, createGoalSchema, updateGoalSchema, goalQuerySchema, createGoalKeyResultSchema, updateGoalKeyResultSchema, createReviewCycleSchema, updateReviewCycleSchema, reviewCycleQuerySchema, createReviewSchema, updateReviewSchema, reviewQuerySchema, createReviewSectionSchema, updateReviewSectionSchema, createReviewResponseSchema, updateReviewResponseSchema, createSkillSchema, updateSkillSchema, skillQuerySchema, createEmployeeSkillSchema, updateEmployeeSkillSchema, employeeSkillQuerySchema, createSkillGapSchema, updateSkillGapSchema, createLearningProgramSchema, updateLearningProgramSchema, learningProgramQuerySchema, createLearningEnrollmentSchema, updateLearningEnrollmentSchema, learningEnrollmentQuerySchema, successionStatusEnum, createCareerRoleSchema, updateCareerRoleSchema, careerRoleQuerySchema, createCareerPathSchema, updateCareerPathSchema, createEmployeeCareerPathSchema, updateEmployeeCareerPathSchema, createSuccessionPlanSchema, updateSuccessionPlanSchema, createSuccessionCandidateSchema, updateSuccessionCandidateSchema, stayInterviewStatusEnum, createEngagementSurveySchema, updateEngagementSurveySchema, engagementSurveyQuerySchema, createSurveyResponseSchema, updateSurveyResponseSchema, createStayInterviewSchema, updateStayInterviewSchema, createRecognitionSchema, createRewardSchema, updateRewardSchema, rewardQuerySchema, createRewardRedemptionSchema, createTotalRewardsStatementSchema, totalRewardsQuerySchema, createCompensationPlanSchema, updateCompensationPlanSchema, createCompensationAdjustmentSchema, updateCompensationAdjustmentSchema, compensationAdjustmentQuerySchema, createTalentReviewSchema, updateTalentReviewSchema, createTalentReviewParticipantSchema, updateTalentReviewParticipantSchema, idSchema } from "@hrms-app/validators";
import { and, eq, desc } from "drizzle-orm";
export const retentionRouter = createTRPCRouter({
  goal: createTRPCRouter({
    // Self-service: the current employee's own goals (for the profile page).
    mine: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.employeeId) return [];
      return await ctx.db.query.goals.findMany({
        where: eq(schema.tenant.goals.employeeId, ctx.user.employeeId),
        orderBy: desc(schema.tenant.goals.createdAt),
        limit: 10,
      });
    }),
    list: protectedProcedure
      .input(goalQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.goals.employeeId, input.employeeId));
        if (input?.status) conditions.push(eq(schema.tenant.goals.status, input.status));
        if (input?.type) conditions.push(eq(schema.tenant.goals.type, input.type));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.goals.findMany({
            where,
            with: {
              employee: true,
              manager: true,
              parent: true,
              children: true,
              keyResults: true,
            },
            orderBy: desc(schema.tenant.goals.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.goals, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.goals.findFirst({
          where: eq(schema.tenant.goals.id, input),
          with: {
            employee: true,
            manager: true,
            parent: true,
            children: true,
            keyResults: true,
          },
        });
      }),
    create: requireRole("super_admin", "hr_manager", "department_manager")
      .input(createGoalSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.goals).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager", "department_manager")
      .input(z.object({ id: idSchema, data: updateGoalSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.goals)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.goals.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.goals).where(eq(schema.tenant.goals.id, input));
        return { success: true };
      }),
    updateStatus: requireRole("super_admin", "hr_manager", "department_manager")
      .input(z.object({ id: idSchema, status: goalStatusEnum }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.goals)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(schema.tenant.goals.id, input.id))
          .returning();
        return item;
      }),
    updateProgress: requireRole("super_admin", "hr_manager", "department_manager")
      .input(z.object({ id: idSchema, progress: z.number().min(0).max(100) }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.goals)
          .set({ progress: input.progress, updatedAt: new Date() })
          .where(eq(schema.tenant.goals.id, input.id))
          .returning();
        return item;
      }),
  }),
  goalKeyResult: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        goalId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.goalId) conditions.push(eq(schema.tenant.goalKeyResults.goalId, input.goalId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.goalKeyResults.findMany({
            where,
            with: { goal: true },
            orderBy: desc(schema.tenant.goalKeyResults.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.goalKeyResults, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.goalKeyResults.findFirst({
          where: eq(schema.tenant.goalKeyResults.id, input),
          with: { goal: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createGoalKeyResultSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.goalKeyResults).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateGoalKeyResultSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.goalKeyResults)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.goalKeyResults.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.goalKeyResults).where(eq(schema.tenant.goalKeyResults.id, input));
        return { success: true };
      }),
  }),
  reviewCycle: createTRPCRouter({
    list: protectedProcedure
      .input(reviewCycleQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.status) conditions.push(eq(schema.tenant.reviewCycles.status, input.status));
        if (input?.type) conditions.push(eq(schema.tenant.reviewCycles.type, input.type));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.reviewCycles.findMany({
            where,
            with: { reviews: true, sections: true },
            orderBy: desc(schema.tenant.reviewCycles.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.reviewCycles, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.reviewCycles.findFirst({
          where: eq(schema.tenant.reviewCycles.id, input),
          with: { reviews: true, sections: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createReviewCycleSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.reviewCycles).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateReviewCycleSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.reviewCycles)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.reviewCycles.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.reviewCycles).where(eq(schema.tenant.reviewCycles.id, input));
        return { success: true };
      }),
  }),
  review: createTRPCRouter({
    list: protectedProcedure
      .input(reviewQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.reviewCycleId) conditions.push(eq(schema.tenant.reviews.reviewCycleId, input.reviewCycleId));
        if (input?.employeeId) conditions.push(eq(schema.tenant.reviews.employeeId, input.employeeId));
        if (input?.status) conditions.push(eq(schema.tenant.reviews.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.reviews.findMany({
            where,
            with: {
              cycle: true,
              employee: true,
              manager: true,
              responses: true,
            },
            orderBy: desc(schema.tenant.reviews.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.reviews, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.reviews.findFirst({
          where: eq(schema.tenant.reviews.id, input),
          with: {
            cycle: true,
            employee: true,
            manager: true,
            responses: true,
          },
        });
      }),
    create: requireRole("super_admin", "hr_manager", "department_manager")
      .input(createReviewSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.reviews).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager", "department_manager")
      .input(z.object({ id: idSchema, data: updateReviewSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.reviews)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.reviews.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.reviews).where(eq(schema.tenant.reviews.id, input));
        return { success: true };
      }),
  }),
  reviewSection: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        reviewCycleId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.reviewCycleId) conditions.push(eq(schema.tenant.reviewSections.reviewCycleId, input.reviewCycleId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.reviewSections.findMany({
            where,
            with: { cycle: true, responses: true },
            orderBy: desc(schema.tenant.reviewSections.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.reviewSections, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.reviewSections.findFirst({
          where: eq(schema.tenant.reviewSections.id, input),
          with: { cycle: true, responses: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createReviewSectionSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.reviewSections).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateReviewSectionSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.reviewSections)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.reviewSections.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.reviewSections).where(eq(schema.tenant.reviewSections.id, input));
        return { success: true };
      }),
  }),
  reviewResponse: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        reviewId: z.string().uuid().optional(),
        sectionId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.reviewId) conditions.push(eq(schema.tenant.reviewResponses.reviewId, input.reviewId));
        if (input?.sectionId) conditions.push(eq(schema.tenant.reviewResponses.sectionId, input.sectionId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.reviewResponses.findMany({
            where,
            with: { review: true, section: true, reviewer: true },
            orderBy: desc(schema.tenant.reviewResponses.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.reviewResponses, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.reviewResponses.findFirst({
          where: eq(schema.tenant.reviewResponses.id, input),
          with: { review: true, section: true, reviewer: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager", "department_manager")
      .input(createReviewResponseSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.reviewResponses).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager", "department_manager")
      .input(z.object({ id: idSchema, data: updateReviewResponseSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.reviewResponses)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.reviewResponses.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.reviewResponses).where(eq(schema.tenant.reviewResponses.id, input));
        return { success: true };
      }),
  }),
  skill: createTRPCRouter({
    list: protectedProcedure
      .input(skillQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.category) conditions.push(eq(schema.tenant.skills.category, input.category));
        if (input?.isActive !== undefined) conditions.push(eq(schema.tenant.skills.isActive, input.isActive));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.skills.findMany({
            where,
            with: { employeeSkills: true, skillGaps: true },
            orderBy: desc(schema.tenant.skills.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.skills, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.skills.findFirst({
          where: eq(schema.tenant.skills.id, input),
          with: { employeeSkills: true, skillGaps: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createSkillSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.skills).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateSkillSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.skills)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.skills.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.skills).where(eq(schema.tenant.skills.id, input));
        return { success: true };
      }),
  }),
  employeeSkill: createTRPCRouter({
    list: protectedProcedure
      .input(employeeSkillQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.employeeSkills.employeeId, input.employeeId));
        if (input?.skillId) conditions.push(eq(schema.tenant.employeeSkills.skillId, input.skillId));
        if (input?.proficiencyLevel) conditions.push(eq(schema.tenant.employeeSkills.proficiencyLevel, input.proficiencyLevel));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.employeeSkills.findMany({
            where,
            with: { employee: true, skill: true, verifiedBy: true },
            orderBy: desc(schema.tenant.employeeSkills.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.employeeSkills, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.employeeSkills.findFirst({
          where: eq(schema.tenant.employeeSkills.id, input),
          with: { employee: true, skill: true, verifiedBy: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createEmployeeSkillSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.employeeSkills).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateEmployeeSkillSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.employeeSkills)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.employeeSkills.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.employeeSkills).where(eq(schema.tenant.employeeSkills.id, input));
        return { success: true };
      }),
  }),
  skillGap: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.string().uuid().optional(),
        skillId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.skillGaps.employeeId, input.employeeId));
        if (input?.skillId) conditions.push(eq(schema.tenant.skillGaps.skillId, input.skillId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.skillGaps.findMany({
            where,
            with: { employee: true, skill: true },
            orderBy: desc(schema.tenant.skillGaps.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.skillGaps, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.skillGaps.findFirst({
          where: eq(schema.tenant.skillGaps.id, input),
          with: { employee: true, skill: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createSkillGapSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.skillGaps).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateSkillGapSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.skillGaps)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.skillGaps.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.skillGaps).where(eq(schema.tenant.skillGaps.id, input));
        return { success: true };
      }),
  }),
  learningProgram: createTRPCRouter({
    list: protectedProcedure
      .input(learningProgramQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.type) conditions.push(eq(schema.tenant.learningPrograms.type, input.type));
        if (input?.isActive !== undefined) conditions.push(eq(schema.tenant.learningPrograms.isActive, input.isActive));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.learningPrograms.findMany({
            where,
            with: { enrollments: true },
            orderBy: desc(schema.tenant.learningPrograms.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.learningPrograms, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.learningPrograms.findFirst({
          where: eq(schema.tenant.learningPrograms.id, input),
          with: { enrollments: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createLearningProgramSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.learningPrograms).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateLearningProgramSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.learningPrograms)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.learningPrograms.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.learningPrograms).where(eq(schema.tenant.learningPrograms.id, input));
        return { success: true };
      }),
  }),
  learningEnrollment: createTRPCRouter({
    list: protectedProcedure
      .input(learningEnrollmentQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.learningEnrollments.employeeId, input.employeeId));
        if (input?.programId) conditions.push(eq(schema.tenant.learningEnrollments.programId, input.programId));
        if (input?.status) conditions.push(eq(schema.tenant.learningEnrollments.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.learningEnrollments.findMany({
            where,
            with: { employee: true, program: true, approvedBy: true },
            orderBy: desc(schema.tenant.learningEnrollments.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.learningEnrollments, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.learningEnrollments.findFirst({
          where: eq(schema.tenant.learningEnrollments.id, input),
          with: { employee: true, program: true, approvedBy: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createLearningEnrollmentSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.learningEnrollments).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateLearningEnrollmentSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.learningEnrollments)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.learningEnrollments.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.learningEnrollments).where(eq(schema.tenant.learningEnrollments.id, input));
        return { success: true };
      }),
  }),
  careerRole: createTRPCRouter({
    list: protectedProcedure
      .input(careerRoleQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.departmentId) conditions.push(eq(schema.tenant.careerRoles.departmentId, input.departmentId));
        if (input?.isActive !== undefined) conditions.push(eq(schema.tenant.careerRoles.isActive, input.isActive));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.careerRoles.findMany({
            where,
            with: { department: true, fromPaths: true, toPaths: true },
            orderBy: desc(schema.tenant.careerRoles.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.careerRoles, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.careerRoles.findFirst({
          where: eq(schema.tenant.careerRoles.id, input),
          with: { department: true, fromPaths: true, toPaths: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createCareerRoleSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.careerRoles).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateCareerRoleSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.careerRoles)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.careerRoles.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.careerRoles).where(eq(schema.tenant.careerRoles.id, input));
        return { success: true };
      }),
  }),
  careerPath: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        fromRoleId: z.string().uuid().optional(),
        toRoleId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.fromRoleId) conditions.push(eq(schema.tenant.careerPaths.fromRoleId, input.fromRoleId));
        if (input?.toRoleId) conditions.push(eq(schema.tenant.careerPaths.toRoleId, input.toRoleId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.careerPaths.findMany({
            where,
            with: { fromRole: true, toRole: true, employeeCareerPaths: true },
            orderBy: desc(schema.tenant.careerPaths.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.careerPaths, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.careerPaths.findFirst({
          where: eq(schema.tenant.careerPaths.id, input),
          with: { fromRole: true, toRole: true, employeeCareerPaths: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createCareerPathSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.careerPaths).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateCareerPathSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.careerPaths)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.careerPaths.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.careerPaths).where(eq(schema.tenant.careerPaths.id, input));
        return { success: true };
      }),
  }),
  employeeCareerPath: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.string().uuid().optional(),
        careerPathId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.employeeCareerPaths.employeeId, input.employeeId));
        if (input?.careerPathId) conditions.push(eq(schema.tenant.employeeCareerPaths.careerPathId, input.careerPathId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.employeeCareerPaths.findMany({
            where,
            with: { employee: true, careerPath: true },
            orderBy: desc(schema.tenant.employeeCareerPaths.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.employeeCareerPaths, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.employeeCareerPaths.findFirst({
          where: eq(schema.tenant.employeeCareerPaths.id, input),
          with: { employee: true, careerPath: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createEmployeeCareerPathSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.employeeCareerPaths).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateEmployeeCareerPathSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.employeeCareerPaths)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.employeeCareerPaths.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.employeeCareerPaths).where(eq(schema.tenant.employeeCareerPaths.id, input));
        return { success: true };
      }),
  }),
  successionPlan: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        roleId: z.string().uuid().optional(),
        departmentId: z.string().uuid().optional(),
        status: successionStatusEnum.optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.roleId) conditions.push(eq(schema.tenant.successionPlans.roleId, input.roleId));
        if (input?.departmentId) conditions.push(eq(schema.tenant.successionPlans.departmentId, input.departmentId));
        if (input?.status) conditions.push(eq(schema.tenant.successionPlans.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.successionPlans.findMany({
            where,
            with: { role: true, department: true, incumbent: true, candidates: true },
            orderBy: desc(schema.tenant.successionPlans.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.successionPlans, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.successionPlans.findFirst({
          where: eq(schema.tenant.successionPlans.id, input),
          with: { role: true, department: true, incumbent: true, candidates: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createSuccessionPlanSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.successionPlans).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateSuccessionPlanSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.successionPlans)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.successionPlans.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.successionPlans).where(eq(schema.tenant.successionPlans.id, input));
        return { success: true };
      }),
  }),
  successionCandidate: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        successionPlanId: z.string().uuid().optional(),
        employeeId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.successionPlanId) conditions.push(eq(schema.tenant.successionCandidates.successionPlanId, input.successionPlanId));
        if (input?.employeeId) conditions.push(eq(schema.tenant.successionCandidates.employeeId, input.employeeId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.successionCandidates.findMany({
            where,
            with: { plan: true, employee: true, nominatedBy: true },
            orderBy: desc(schema.tenant.successionCandidates.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.successionCandidates, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.successionCandidates.findFirst({
          where: eq(schema.tenant.successionCandidates.id, input),
          with: { plan: true, employee: true, nominatedBy: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createSuccessionCandidateSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.successionCandidates).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateSuccessionCandidateSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.successionCandidates)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.successionCandidates.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.successionCandidates).where(eq(schema.tenant.successionCandidates.id, input));
        return { success: true };
      }),
  }),
  engagementSurvey: createTRPCRouter({
    list: protectedProcedure
      .input(engagementSurveyQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.status) conditions.push(eq(schema.tenant.engagementSurveys.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.engagementSurveys.findMany({
            where,
            with: { responses: true },
            orderBy: desc(schema.tenant.engagementSurveys.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.engagementSurveys, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.engagementSurveys.findFirst({
          where: eq(schema.tenant.engagementSurveys.id, input),
          with: { responses: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createEngagementSurveySchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.engagementSurveys).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateEngagementSurveySchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.engagementSurveys)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.engagementSurveys.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.engagementSurveys).where(eq(schema.tenant.engagementSurveys.id, input));
        return { success: true };
      }),
    open: requireRole("super_admin", "hr_manager")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.engagementSurveys)
          .set({ status: "open", updatedAt: new Date() })
          .where(eq(schema.tenant.engagementSurveys.id, input))
          .returning();
        return item;
      }),
    close: requireRole("super_admin", "hr_manager")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.engagementSurveys)
          .set({ status: "closed", updatedAt: new Date() })
          .where(eq(schema.tenant.engagementSurveys.id, input))
          .returning();
        return item;
      }),
  }),
  surveyResponse: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        surveyId: z.string().uuid().optional(),
        employeeId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.surveyId) conditions.push(eq(schema.tenant.surveyResponses.surveyId, input.surveyId));
        if (input?.employeeId) conditions.push(eq(schema.tenant.surveyResponses.employeeId, input.employeeId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.surveyResponses.findMany({
            where,
            with: { survey: true, employee: true },
            orderBy: desc(schema.tenant.surveyResponses.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.surveyResponses, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.surveyResponses.findFirst({
          where: eq(schema.tenant.surveyResponses.id, input),
          with: { survey: true, employee: true },
        });
      }),
    create: protectedProcedure
      .input(createSurveyResponseSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.surveyResponses).values(input).returning();
        return item;
      }),
    update: protectedProcedure
      .input(z.object({ id: idSchema, data: updateSurveyResponseSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.surveyResponses)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.surveyResponses.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.surveyResponses).where(eq(schema.tenant.surveyResponses.id, input));
        return { success: true };
      }),
  }),
  stayInterview: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.string().uuid().optional(),
        interviewerId: z.string().uuid().optional(),
        status: stayInterviewStatusEnum.optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.stayInterviews.employeeId, input.employeeId));
        if (input?.interviewerId) conditions.push(eq(schema.tenant.stayInterviews.interviewerId, input.interviewerId));
        if (input?.status) conditions.push(eq(schema.tenant.stayInterviews.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.stayInterviews.findMany({
            where,
            with: { employee: true, interviewer: true },
            orderBy: desc(schema.tenant.stayInterviews.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.stayInterviews, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.stayInterviews.findFirst({
          where: eq(schema.tenant.stayInterviews.id, input),
          with: { employee: true, interviewer: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createStayInterviewSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.stayInterviews).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateStayInterviewSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.stayInterviews)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.stayInterviews.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.stayInterviews).where(eq(schema.tenant.stayInterviews.id, input));
        return { success: true };
      }),
    complete: requireRole("super_admin", "hr_manager")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.stayInterviews)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(schema.tenant.stayInterviews.id, input))
          .returning();
        return item;
      }),
  }),
  recognition: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        fromEmployeeId: z.string().uuid().optional(),
        toEmployeeId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.fromEmployeeId) conditions.push(eq(schema.tenant.recognitions.fromEmployeeId, input.fromEmployeeId));
        if (input?.toEmployeeId) conditions.push(eq(schema.tenant.recognitions.toEmployeeId, input.toEmployeeId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.recognitions.findMany({
            where,
            with: { fromEmployee: true, toEmployee: true },
            orderBy: desc(schema.tenant.recognitions.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.recognitions, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.recognitions.findFirst({
          where: eq(schema.tenant.recognitions.id, input),
          with: { fromEmployee: true, toEmployee: true },
        });
      }),
    create: protectedProcedure
      .input(createRecognitionSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.recognitions).values(input).returning();
        return item;
      }),
    update: protectedProcedure
      .input(z.object({ id: idSchema, data: createRecognitionSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.recognitions)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.recognitions.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.recognitions).where(eq(schema.tenant.recognitions.id, input));
        return { success: true };
      }),
  }),
  reward: createTRPCRouter({
    list: protectedProcedure
      .input(rewardQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.type) conditions.push(eq(schema.tenant.rewards.type, input.type));
        if (input?.isActive !== undefined) conditions.push(eq(schema.tenant.rewards.isActive, input.isActive));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.rewards.findMany({
            where,
            with: { redemptions: true },
            orderBy: desc(schema.tenant.rewards.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.rewards, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.rewards.findFirst({
          where: eq(schema.tenant.rewards.id, input),
          with: { redemptions: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createRewardSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.rewards).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateRewardSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.rewards)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.rewards.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.rewards).where(eq(schema.tenant.rewards.id, input));
        return { success: true };
      }),
  }),
  rewardRedemption: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        rewardId: z.string().uuid().optional(),
        employeeId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.rewardId) conditions.push(eq(schema.tenant.rewardRedemptions.rewardId, input.rewardId));
        if (input?.employeeId) conditions.push(eq(schema.tenant.rewardRedemptions.employeeId, input.employeeId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.rewardRedemptions.findMany({
            where,
            with: { reward: true, employee: true, approvedBy: true },
            orderBy: desc(schema.tenant.rewardRedemptions.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.rewardRedemptions, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.rewardRedemptions.findFirst({
          where: eq(schema.tenant.rewardRedemptions.id, input),
          with: { reward: true, employee: true, approvedBy: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createRewardRedemptionSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.rewardRedemptions).values(input).returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.rewardRedemptions).where(eq(schema.tenant.rewardRedemptions.id, input));
        return { success: true };
      }),
  }),
  totalRewardsStatement: createTRPCRouter({
    list: protectedProcedure
      .input(totalRewardsQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.totalRewardsStatements.employeeId, input.employeeId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.totalRewardsStatements.findMany({
            where,
            with: { employee: true },
            orderBy: desc(schema.tenant.totalRewardsStatements.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.totalRewardsStatements, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.totalRewardsStatements.findFirst({
          where: eq(schema.tenant.totalRewardsStatements.id, input),
          with: { employee: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createTotalRewardsStatementSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.totalRewardsStatements).values(input).returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.totalRewardsStatements).where(eq(schema.tenant.totalRewardsStatements.id, input));
        return { success: true };
      }),
  }),
  compensationPlan: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.type) conditions.push(eq(schema.tenant.compensationPlans.type, input.type));
        if (input?.status) conditions.push(eq(schema.tenant.compensationPlans.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.compensationPlans.findMany({
            where,
            with: { adjustments: true },
            orderBy: desc(schema.tenant.compensationPlans.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.compensationPlans, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.compensationPlans.findFirst({
          where: eq(schema.tenant.compensationPlans.id, input),
          with: { adjustments: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createCompensationPlanSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.compensationPlans).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateCompensationPlanSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.compensationPlans)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.compensationPlans.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.compensationPlans).where(eq(schema.tenant.compensationPlans.id, input));
        return { success: true };
      }),
  }),
  compensationAdjustment: createTRPCRouter({
    list: protectedProcedure
      .input(compensationAdjustmentQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.planId) conditions.push(eq(schema.tenant.compensationAdjustments.planId, input.planId));
        if (input?.employeeId) conditions.push(eq(schema.tenant.compensationAdjustments.employeeId, input.employeeId));
        if (input?.status) conditions.push(eq(schema.tenant.compensationAdjustments.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.compensationAdjustments.findMany({
            where,
            with: { plan: true, employee: true, approvedBy: true },
            orderBy: desc(schema.tenant.compensationAdjustments.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.compensationAdjustments, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.compensationAdjustments.findFirst({
          where: eq(schema.tenant.compensationAdjustments.id, input),
          with: { plan: true, employee: true, approvedBy: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createCompensationAdjustmentSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.compensationAdjustments).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateCompensationAdjustmentSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.compensationAdjustments)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.compensationAdjustments.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.compensationAdjustments).where(eq(schema.tenant.compensationAdjustments.id, input));
        return { success: true };
      }),
  }),
  talentReview: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.status) conditions.push(eq(schema.tenant.talentReviews.status, input.status));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.talentReviews.findMany({
            where,
            with: { participants: true },
            orderBy: desc(schema.tenant.talentReviews.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.talentReviews, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.talentReviews.findFirst({
          where: eq(schema.tenant.talentReviews.id, input),
          with: { participants: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createTalentReviewSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.talentReviews).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateTalentReviewSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.talentReviews)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.talentReviews.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.talentReviews).where(eq(schema.tenant.talentReviews.id, input));
        return { success: true };
      }),
  }),
  talentReviewParticipant: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        talentReviewId: z.string().uuid().optional(),
        employeeId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      }).optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.talentReviewId) conditions.push(eq(schema.tenant.talentReviewParticipants.talentReviewId, input.talentReviewId));
        if (input?.employeeId) conditions.push(eq(schema.tenant.talentReviewParticipants.employeeId, input.employeeId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const [items, total] = await Promise.all([
          ctx.db.query.talentReviewParticipants.findMany({
            where,
            with: { review: true, employee: true, reviewer: true },
            orderBy: desc(schema.tenant.talentReviewParticipants.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.talentReviewParticipants, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.talentReviewParticipants.findFirst({
          where: eq(schema.tenant.talentReviewParticipants.id, input),
          with: { review: true, employee: true, reviewer: true },
        });
      }),
    create: requireRole("super_admin", "hr_manager")
      .input(createTalentReviewParticipantSchema)
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db.insert(schema.tenant.talentReviewParticipants).values(input).returning();
        return item;
      }),
    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: idSchema, data: updateTalentReviewParticipantSchema }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await ctx.db
          .update(schema.tenant.talentReviewParticipants)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.talentReviewParticipants.id, input.id))
          .returning();
        return item;
      }),
    delete: requireRole("super_admin")
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.talentReviewParticipants).where(eq(schema.tenant.talentReviewParticipants.id, input));
        return { success: true };
      }),
  }),
});
