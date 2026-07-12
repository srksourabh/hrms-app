import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import {
  createJobRequisitionSchema,
  updateJobRequisitionSchema,
  jobRequisitionQuerySchema,
  createCandidateSchema,
  updateCandidateSchema,
  candidateQuerySchema,
  createApplicationSchema,
  updateApplicationSchema,
  applicationQuerySchema,
  createInterviewSchema,
  updateInterviewSchema,
  interviewQuerySchema,
  createOfferSchema,
  updateOfferSchema,
  offerQuerySchema,
  createOnboardingPlanSchema,
  updateOnboardingPlanSchema,
  onboardingPlanQuerySchema,
  createReferralSchema,
  updateReferralSchema,
  referralQuerySchema,
  createBackgroundCheckSchema,
  updateBackgroundCheckSchema,
  backgroundCheckQuerySchema,
  createReferenceCheckSchema,
  updateReferenceCheckSchema,
  referenceCheckQuerySchema,
  applicationStatusEnum,
} from "@hrms-app/validators";
import { and, eq, desc, ilike, or, gte, lte, inArray } from "drizzle-orm";



export const recruitmentRouter = createTRPCRouter({
  jobRequisition: createTRPCRouter({
    list: protectedProcedure
      .input(jobRequisitionQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.status) conditions.push(eq(schema.tenant.jobRequisitions.status, input.status));
        if (input?.departmentId) conditions.push(eq(schema.tenant.jobRequisitions.departmentId, input.departmentId));
        if (input?.hiringManagerId) conditions.push(eq(schema.tenant.jobRequisitions.hiringManagerId, input.hiringManagerId));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.jobRequisitions.findMany({
            where,
            with: {
              department: true,
              hiringManager: true,
              recruiter: true,
            },
            orderBy: desc(schema.tenant.jobRequisitions.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.jobRequisitions, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.jobRequisitions.findFirst({
          where: eq(schema.tenant.jobRequisitions.id, input),
          with: {
            department: true,
            hiringManager: true,
            recruiter: true,
            applications: {
              with: { candidate: true },
            },
          },
        });
      }),

    create: requireRole("super_admin", "hr_manager", "recruiter")
      .input(createJobRequisitionSchema)
      .mutation(async ({ ctx, input }) => {
        const [jobRequisition] = await ctx.db.insert(schema.tenant.jobRequisitions).values(input).returning();
        return jobRequisition;
      }),

    update: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.object({ id: z.string().uuid(), data: updateJobRequisitionSchema }))
      .mutation(async ({ ctx, input }) => {
        const [jobRequisition] = await ctx.db
          .update(schema.tenant.jobRequisitions)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.jobRequisitions.id, input.id))
          .returning();
        return jobRequisition;
      }),

    delete: requireRole("super_admin")
      .input(z.string().uuid())
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.query.applications.findFirst({
          where: eq(schema.tenant.applications.jobRequisitionId, input),
        });
        if (existing) {
          throw new Error("Cannot delete job requisition with existing applications");
        }
        await ctx.db.delete(schema.tenant.jobRequisitions).where(eq(schema.tenant.jobRequisitions.id, input));
        return { success: true };
      }),

    post: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const [jobRequisition] = await ctx.db
          .update(schema.tenant.jobRequisitions)
          .set({ status: "open", postedAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.tenant.jobRequisitions.id, input.id))
          .returning();
        return jobRequisition;
      }),

    close: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.string().uuid())
      .mutation(async ({ ctx, input }) => {
        const [jobRequisition] = await ctx.db
          .update(schema.tenant.jobRequisitions)
          .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.tenant.jobRequisitions.id, input))
          .returning();
        return jobRequisition;
      }),
  }),

  candidate: createTRPCRouter({
    list: protectedProcedure
      .input(candidateQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.source) conditions.push(eq(schema.tenant.candidates.source, input.source));
        if (input?.search) {
          conditions.push(
            or(
              ilike(schema.tenant.candidates.firstName, `%${input.search}%`),
              ilike(schema.tenant.candidates.lastName, `%${input.search}%`),
              ilike(schema.tenant.candidates.email, `%${input.search}%`),
            )
          );
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.candidates.findMany({
            where,
            orderBy: desc(schema.tenant.candidates.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.candidates, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.candidates.findFirst({
          where: eq(schema.tenant.candidates.id, input),
          with: {
            applications: {
              with: { jobRequisition: true },
            },
            offers: true,
            referrals: { with: { referrer: true } },
            backgroundChecks: true,
            referenceChecks: true,
          },
        });
      }),

    create: requireRole("super_admin", "hr_manager", "recruiter")
      .input(createCandidateSchema)
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input,
          gdprConsentAt: input.gdprConsent ? new Date() : null,
        };
        const [candidate] = await ctx.db.insert(schema.tenant.candidates).values(data).returning();
        return candidate;
      }),

    update: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.object({ id: z.string().uuid(), data: updateCandidateSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          gdprConsentAt: input.data.gdprConsent ? new Date() : undefined,
        };
        const [candidate] = await ctx.db
          .update(schema.tenant.candidates)
          .set(data)
          .where(eq(schema.tenant.candidates.id, input.id))
          .returning();
        return candidate;
      }),

    delete: requireRole("super_admin")
      .input(z.string().uuid())
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.candidates).where(eq(schema.tenant.candidates.id, input));
        return { success: true };
      }),
  }),

  application: createTRPCRouter({
    list: protectedProcedure
      .input(applicationQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.jobRequisitionId) conditions.push(eq(schema.tenant.applications.jobRequisitionId, input.jobRequisitionId));
        if (input?.candidateId) conditions.push(eq(schema.tenant.applications.candidateId, input.candidateId));
        if (input?.status) conditions.push(eq(schema.tenant.applications.status, input.status));

if (ctx.user.role === "employee") {
          const user = await ctx.adminDb.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, ctx.user.id!),
          });
          if (user?.employeeId) {
            conditions.push(eq(schema.tenant.applications.referrerEmployeeId, user.employeeId));
          }
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.applications.findMany({
            where,
            with: {
              jobRequisition: true,
              candidate: true,
              screenedBy: true,
              referrer: true,
              interviews: true,
              offers: true,
            },
            orderBy: desc(schema.tenant.applications.appliedAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.applications, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.applications.findFirst({
          where: eq(schema.tenant.applications.id, input),
          with: {
            jobRequisition: { with: { department: true } },
            candidate: true,
            screenedBy: true,
            referrer: true,
            interviews: { with: { interviewers: true } },
            offers: true,
            referrals: true,
          },
        });
      }),

    create: protectedProcedure
      .input(createApplicationSchema)
      .mutation(async ({ ctx, input }) => {
        const [application] = await ctx.db.insert(schema.tenant.applications).values({
          ...input,
          appliedAt: new Date(),
        }).returning();
        return application;
      }),

    update: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.object({ id: z.string().uuid(), data: updateApplicationSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          stageEnteredAt: input.data.currentStage ? new Date() : undefined,
          screenedAt: input.data.status === "screening" ? new Date() : undefined,
        };
        const [application] = await ctx.db
          .update(schema.tenant.applications)
          .set(data)
          .where(eq(schema.tenant.applications.id, input.id))
          .returning();
        return application;
      }),

    updateStatus: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.object({ id: z.string().uuid(), status: applicationStatusEnum }))
      .mutation(async ({ ctx, input }) => {
        const [application] = await ctx.db
          .update(schema.tenant.applications)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(schema.tenant.applications.id, input.id))
          .returning();
        return application;
      }),

myApplications: protectedProcedure.query(async ({ ctx }) => {
      const user = await ctx.adminDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.user.id!),
      });
      if (!user?.employeeId) return [];

      const candidate = await ctx.db.query.candidates.findFirst({
        where: eq(schema.tenant.candidates.email, user.email),
      });
      if (!candidate) return [];

      return await ctx.db.query.applications.findMany({
        where: eq(schema.tenant.applications.candidateId, candidate.id),
        with: { jobRequisition: true, interviews: true, offers: true },
        orderBy: desc(schema.tenant.applications.appliedAt),
      });
    }),
  }),

  interview: createTRPCRouter({
    list: protectedProcedure
      .input(interviewQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.applicationId) conditions.push(eq(schema.tenant.interviews.applicationId, input.applicationId));
        if (input?.status) conditions.push(eq(schema.tenant.interviews.status, input.status));
        if (input?.type) conditions.push(eq(schema.tenant.interviews.type, input.type));
        if (input?.fromDate) conditions.push(gte(schema.tenant.interviews.scheduledAt, new Date(input.fromDate)));
        if (input?.toDate) conditions.push(lte(schema.tenant.interviews.scheduledAt, new Date(input.toDate)));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.interviews.findMany({
            where,
            with: {
              application: { with: { candidate: true, jobRequisition: true } },
            },
            orderBy: desc(schema.tenant.interviews.scheduledAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.interviews, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.interviews.findFirst({
          where: eq(schema.tenant.interviews.id, input),
          with: {
            application: { with: { candidate: true, jobRequisition: true } },
          },
        });
      }),

    create: requireRole("super_admin", "hr_manager", "recruiter", "department_manager")
      .input(createInterviewSchema)
      .mutation(async ({ ctx, input }) => {
        const [interview] = await ctx.db.insert(schema.tenant.interviews).values(input).returning();
        return interview;
      }),

    update: requireRole("super_admin", "hr_manager", "recruiter", "department_manager")
      .input(z.object({ id: z.string().uuid(), data: updateInterviewSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          completedAt: input.data.status === "completed" ? new Date() : undefined,
          cancelledAt: input.data.status === "cancelled" ? new Date() : undefined,
        };
        const [interview] = await ctx.db
          .update(schema.tenant.interviews)
          .set(data)
          .where(eq(schema.tenant.interviews.id, input.id))
          .returning();
        return interview;
      }),

    delete: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.string().uuid())
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.interviews).where(eq(schema.tenant.interviews.id, input));
        return { success: true };
      }),

myInterviews: protectedProcedure.query(async ({ ctx }) => {
      const user = await ctx.adminDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.user.id!),
      });
      if (!user?.employeeId) return [];

      return await ctx.db.query.interviews.findMany({
        where: inArray(schema.tenant.interviews.interviewerIds as any, [user.employeeId]),
        with: { application: { with: { candidate: true, jobRequisition: true } } },
        orderBy: desc(schema.tenant.interviews.scheduledAt),
      });
    }),
  }),

  offer: createTRPCRouter({
    list: protectedProcedure
      .input(offerQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.applicationId) conditions.push(eq(schema.tenant.offers.applicationId, input.applicationId));
        if (input?.candidateId) conditions.push(eq(schema.tenant.offers.candidateId, input.candidateId));
        if (input?.jobRequisitionId) conditions.push(eq(schema.tenant.offers.jobRequisitionId, input.jobRequisitionId));
        if (input?.status) conditions.push(eq(schema.tenant.offers.status, input.status));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.offers.findMany({
            where,
            with: {
              application: { with: { candidate: true, jobRequisition: true } },
              candidate: true,
              jobRequisition: true,
              createdBy: true,
              approvedBy: true,
            },
            orderBy: desc(schema.tenant.offers.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.offers, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.offers.findFirst({
          where: eq(schema.tenant.offers.id, input),
          with: {
            application: { with: { candidate: true, jobRequisition: true } },
            candidate: true,
            jobRequisition: true,
            createdBy: true,
            approvedBy: true,
          },
        });
      }),

    create: requireRole("super_admin", "hr_manager")
      .input(createOfferSchema)
      .mutation(async ({ ctx, input }) => {
        const [offer] = await ctx.db.insert(schema.tenant.offers).values(input).returning();
        return offer;
      }),

    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updateOfferSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          sentAt: input.data.status === "sent" ? new Date() : undefined,
          acceptedAt: input.data.status === "accepted" ? new Date() : undefined,
          declinedAt: input.data.status === "declined" ? new Date() : undefined,
        };
        const [offer] = await ctx.db
          .update(schema.tenant.offers)
          .set(data)
          .where(eq(schema.tenant.offers.id, input.id))
          .returning();
        return offer;
      }),

    send: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const [offer] = await ctx.db
          .update(schema.tenant.offers)
          .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.tenant.offers.id, input.id))
          .returning();
        return offer;
      }),

    accept: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const [offer] = await ctx.db
          .update(schema.tenant.offers)
          .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.tenant.offers.id, input.id))
          .returning();
        return offer;
      }),

    decline: protectedProcedure
      .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const [offer] = await ctx.db
          .update(schema.tenant.offers)
          .set({ status: "declined", declinedAt: new Date(), declineReason: input.reason, updatedAt: new Date() })
          .where(eq(schema.tenant.offers.id, input.id))
          .returning();
        return offer;
      }),
  }),

  onboardingPlan: createTRPCRouter({
    list: protectedProcedure
      .input(onboardingPlanQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.employeeId) conditions.push(eq(schema.tenant.onboardingPlans.employeeId, input.employeeId));
        if (input?.dayNumber) conditions.push(eq(schema.tenant.onboardingPlans.dayNumber, input.dayNumber));
        if (input?.status) conditions.push(eq(schema.tenant.onboardingPlans.status, input.status));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.onboardingPlans.findMany({
            where,
            with: {
              employee: true,
              assignedTo: true,
              completedBy: true,
            },
            orderBy: desc(schema.tenant.onboardingPlans.dayNumber),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.onboardingPlans, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.onboardingPlans.findFirst({
          where: eq(schema.tenant.onboardingPlans.id, input),
          with: { employee: true, assignedTo: true, completedBy: true },
        });
      }),

    create: requireRole("super_admin", "hr_manager")
      .input(createOnboardingPlanSchema)
      .mutation(async ({ ctx, input }) => {
        const [plan] = await ctx.db.insert(schema.tenant.onboardingPlans).values(input).returning();
        return plan;
      }),

    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updateOnboardingPlanSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          completedAt: input.data.status === "completed" ? new Date() : undefined,
        };
        const [plan] = await ctx.db
          .update(schema.tenant.onboardingPlans)
          .set(data)
          .where(eq(schema.tenant.onboardingPlans.id, input.id))
          .returning();
        return plan;
      }),

    byEmployee: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.onboardingPlans.findMany({
          where: eq(schema.tenant.onboardingPlans.employeeId, input),
          with: { assignedTo: true, completedBy: true },
          orderBy: desc(schema.tenant.onboardingPlans.dayNumber),
        });
      }),
  }),

  referral: createTRPCRouter({
    list: protectedProcedure
      .input(referralQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.referrerEmployeeId) conditions.push(eq(schema.tenant.referrals.referrerEmployeeId, input.referrerEmployeeId));
        if (input?.candidateId) conditions.push(eq(schema.tenant.referrals.candidateId, input.candidateId));
        if (input?.jobRequisitionId) conditions.push(eq(schema.tenant.referrals.jobRequisitionId, input.jobRequisitionId));
        if (input?.status) conditions.push(eq(schema.tenant.referrals.status, input.status));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.referrals.findMany({
            where,
            with: { referrer: true, candidate: true, jobRequisition: true, rewardPaidBy: true },
            orderBy: desc(schema.tenant.referrals.submittedAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.referrals, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.referrals.findFirst({
          where: eq(schema.tenant.referrals.id, input),
          with: { referrer: true, candidate: true, jobRequisition: true, rewardPaidBy: true },
        });
      }),

    create: protectedProcedure
      .input(createReferralSchema)
      .mutation(async ({ ctx, input }) => {
        const [referral] = await ctx.db.insert(schema.tenant.referrals).values(input).returning();
        return referral;
      }),

    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updateReferralSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          rewardPaidAt: input.data.status === "reward_paid" ? new Date() : undefined,
        };
        const [referral] = await ctx.db
          .update(schema.tenant.referrals)
          .set(data)
          .where(eq(schema.tenant.referrals.id, input.id))
          .returning();
        return referral;
      }),

myReferrals: protectedProcedure.query(async ({ ctx }) => {
      const user = await ctx.adminDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.user.id!),
      });
      if (!user?.employeeId) return [];

      return await ctx.db.query.referrals.findMany({
        where: eq(schema.tenant.referrals.referrerEmployeeId, user.employeeId),
        with: { candidate: true, jobRequisition: true },
        orderBy: desc(schema.tenant.referrals.submittedAt),
      });
    }),
  }),

  backgroundCheck: createTRPCRouter({
    list: protectedProcedure
      .input(backgroundCheckQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.candidateId) conditions.push(eq(schema.tenant.backgroundChecks.candidateId, input.candidateId));
        if (input?.applicationId) conditions.push(eq(schema.tenant.backgroundChecks.applicationId, input.applicationId));
        if (input?.status) conditions.push(eq(schema.tenant.backgroundChecks.status, input.status));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.backgroundChecks.findMany({
            where,
            with: { candidate: true, application: { with: { jobRequisition: true } } },
            orderBy: desc(schema.tenant.backgroundChecks.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.backgroundChecks, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.backgroundChecks.findFirst({
          where: eq(schema.tenant.backgroundChecks.id, input),
          with: { candidate: true, application: true },
        });
      }),

    create: requireRole("super_admin", "hr_manager", "recruiter")
      .input(createBackgroundCheckSchema)
      .mutation(async ({ ctx, input }) => {
        const [check] = await ctx.db.insert(schema.tenant.backgroundChecks).values({
          ...input,
          initiatedAt: new Date(),
        }).returning();
        return check;
      }),

    update: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.object({ id: z.string().uuid(), data: updateBackgroundCheckSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          completedAt: input.data.status === "clear" || input.data.status === "flagged" || input.data.status === "failed" ? new Date() : undefined,
        };
        const [check] = await ctx.db
          .update(schema.tenant.backgroundChecks)
          .set(data)
          .where(eq(schema.tenant.backgroundChecks.id, input.id))
          .returning();
        return check;
      }),
  }),

  referenceCheck: createTRPCRouter({
    list: protectedProcedure
      .input(referenceCheckQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.candidateId) conditions.push(eq(schema.tenant.referenceChecks.candidateId, input.candidateId));
        if (input?.applicationId) conditions.push(eq(schema.tenant.referenceChecks.applicationId, input.applicationId));
        if (input?.status) conditions.push(eq(schema.tenant.referenceChecks.status, input.status));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.referenceChecks.findMany({
            where,
            with: { candidate: true, application: { with: { jobRequisition: true } }, conductedBy: true },
            orderBy: desc(schema.tenant.referenceChecks.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.referenceChecks, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    getById: protectedProcedure
      .input(z.string().uuid())
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.referenceChecks.findFirst({
          where: eq(schema.tenant.referenceChecks.id, input),
          with: { candidate: true, application: true, conductedBy: true },
        });
      }),

    create: requireRole("super_admin", "hr_manager", "recruiter")
      .input(createReferenceCheckSchema)
      .mutation(async ({ ctx, input }) => {
        const [check] = await ctx.db.insert(schema.tenant.referenceChecks).values(input).returning();
        return check;
      }),

    update: requireRole("super_admin", "hr_manager", "recruiter")
      .input(z.object({ id: z.string().uuid(), data: updateReferenceCheckSchema }))
      .mutation(async ({ ctx, input }) => {
        const data = {
          ...input.data,
          updatedAt: new Date(),
          conductedAt: input.data.status === "completed" || input.data.status === "positive" || input.data.status === "negative" ? new Date() : undefined,
        };
        const [check] = await ctx.db
          .update(schema.tenant.referenceChecks)
          .set(data)
          .where(eq(schema.tenant.referenceChecks.id, input.id))
          .returning();
        return check;
      }),
  }),
});
