import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../server";
import { schema } from "@hrms-app/db";
import {
  aiAssistantSchema, aiAssistantUpdateSchema,
  aiSuggestionSchema, aiSuggestionUpdateSchema, aiSuggestionQuerySchema,
  aiChurnPredictionQuerySchema,
  aiSkillRecommendationQuerySchema,
  aiCompliancePredictionQuerySchema,
  aiSalaryBenchmarkQuerySchema,
  aiAuditLogQuerySchema,
  idSchema,
} from "@hrms-app/validators";
import { and, eq, desc, ilike } from "drizzle-orm";

export const aiRouter = createTRPCRouter({
  assistant: createTRPCRouter({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await ctx.db.query.aiAssistants.findMany({
          orderBy: desc(schema.tenant.aiAssistants.createdAt),
        });
      }),

    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.aiAssistants.findFirst({
          where: eq(schema.tenant.aiAssistants.id, input),
        });
      }),

    create: protectedProcedure
      .input(aiAssistantSchema)
      .mutation(async ({ ctx, input }) => {
        const [result] = await ctx.db.insert(schema.tenant.aiAssistants).values(input).returning();
        return result;
      }),

    update: protectedProcedure
      .input(z.object({ id: idSchema, data: aiAssistantUpdateSchema }))
      .mutation(async ({ ctx, input }) => {
        const [result] = await ctx.db.update(schema.tenant.aiAssistants)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.aiAssistants.id, input.id))
          .returning();
        return result;
      }),

    delete: protectedProcedure
      .input(idSchema)
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.aiAssistants)
          .where(eq(schema.tenant.aiAssistants.id, input));
      }),
  }),

  suggestion: createTRPCRouter({
    list: protectedProcedure
      .input(aiSuggestionQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.type) conditions.push(eq(schema.tenant.aiSuggestions.type, input.type));
        if (input?.status) conditions.push(eq(schema.tenant.aiSuggestions.status, input.status));
        if (input?.employeeId) conditions.push(eq(schema.tenant.aiSuggestions.employeeId, input.employeeId));
        if (input?.departmentId) conditions.push(eq(schema.tenant.aiSuggestions.departmentId, input.departmentId));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.aiSuggestions.findMany({
            where,
            with: { employee: true, department: true },
            orderBy: desc(schema.tenant.aiSuggestions.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.aiSuggestions, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.aiSuggestions.findFirst({
          where: eq(schema.tenant.aiSuggestions.id, input),
          with: { employee: true, department: true },
        });
      }),

    create: protectedProcedure
      .input(aiSuggestionSchema)
      .mutation(async ({ ctx, input }) => {
        const [result] = await ctx.db.insert(schema.tenant.aiSuggestions).values(input).returning();
        return result;
      }),

    update: protectedProcedure
      .input(z.object({ id: idSchema, data: aiSuggestionUpdateSchema }))
      .mutation(async ({ ctx, input }) => {
        const [result] = await ctx.db.update(schema.tenant.aiSuggestions)
          .set({ ...input.data })
          .where(eq(schema.tenant.aiSuggestions.id, input.id))
          .returning();
        return result;
      }),
  }),

  churnPrediction: createTRPCRouter({
    list: protectedProcedure
      .input(aiChurnPredictionQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.riskLevel) conditions.push(eq(schema.tenant.aiChurnPredictions.riskLevel, input.riskLevel));
        if (input?.employeeId) conditions.push(eq(schema.tenant.aiChurnPredictions.employeeId, input.employeeId));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.aiChurnPredictions.findMany({
            where,
            with: { employee: true },
            orderBy: desc(schema.tenant.aiChurnPredictions.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.aiChurnPredictions, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.aiChurnPredictions.findFirst({
          where: eq(schema.tenant.aiChurnPredictions.id, input),
          with: { employee: true },
        });
      }),
  }),

  skillRecommendation: createTRPCRouter({
    list: protectedProcedure
      .input(aiSkillRecommendationQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.aiSkillRecommendations.employeeId, input.employeeId));
        if (input?.priority) conditions.push(eq(schema.tenant.aiSkillRecommendations.priority, input.priority));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.aiSkillRecommendations.findMany({
            where,
            with: { employee: true },
            orderBy: desc(schema.tenant.aiSkillRecommendations.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.aiSkillRecommendations, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(idSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.aiSkillRecommendations.findFirst({
          where: eq(schema.tenant.aiSkillRecommendations.id, input),
          with: { employee: true },
        });
      }),
  }),

  compliancePrediction: createTRPCRouter({
    list: protectedProcedure
      .input(aiCompliancePredictionQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.riskType) conditions.push(eq(schema.tenant.aiCompliancePredictions.riskType, input.riskType));
        if (input?.riskLevel) conditions.push(eq(schema.tenant.aiCompliancePredictions.riskLevel, input.riskLevel));
        if (input?.departmentId) conditions.push(eq(schema.tenant.aiCompliancePredictions.departmentId, input.departmentId));
        if (input?.isResolved !== undefined) conditions.push(eq(schema.tenant.aiCompliancePredictions.isResolved, input.isResolved));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.aiCompliancePredictions.findMany({
            where,
            with: { employee: true, department: true },
            orderBy: desc(schema.tenant.aiCompliancePredictions.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.aiCompliancePredictions, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
  }),

  salaryBenchmark: createTRPCRouter({
    list: protectedProcedure
      .input(aiSalaryBenchmarkQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.jobTitle) conditions.push(ilike(schema.tenant.aiSalaryBenchmarks.jobTitle, `%${input.jobTitle}%`));
        if (input?.region) conditions.push(eq(schema.tenant.aiSalaryBenchmarks.region, input.region));
        if (input?.industry) conditions.push(eq(schema.tenant.aiSalaryBenchmarks.industry, input.industry));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.aiSalaryBenchmarks.findMany({
            where,
            orderBy: desc(schema.tenant.aiSalaryBenchmarks.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.aiSalaryBenchmarks, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
  }),

  auditLog: createTRPCRouter({
    list: protectedProcedure
      .input(aiAuditLogQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.action) conditions.push(eq(schema.tenant.aiAuditLogs.action, input.action));
        if (input?.entityType) conditions.push(eq(schema.tenant.aiAuditLogs.entityType, input.entityType));
        if (input?.success !== undefined) conditions.push(eq(schema.tenant.aiAuditLogs.success, input.success));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.aiAuditLogs.findMany({
            where,
            orderBy: desc(schema.tenant.aiAuditLogs.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.aiAuditLogs, where),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
  }),
});
