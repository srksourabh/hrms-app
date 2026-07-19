import { z } from "zod";

export const jobStatusEnum = z.enum(["draft", "open", "paused", "closed", "filled", "cancelled"]);
export const jobTypeEnum = z.enum(["full_time", "part_time", "contract", "internship", "temporary"]);
export const candidateStatusEnum = z.enum(["new", "screening", "interviewing", "offer", "hired", "rejected", "withdrawn"]);
export const candidateSourceEnum = z.enum(["job_board", "referral", "linkedin", "career_site", "agency", "direct", "other"]);
export const applicationStatusEnum = z.enum(["applied", "screening", "phone_screen", "technical_interview", "final_interview", "offer_extended", "offer_accepted", "offer_declined", "hired", "rejected", "withdrawn"]);
export const interviewTypeEnum = z.enum(["phone_screen", "video", "in_person", "technical", "panel", "cultural_fit", "final"]);
export const interviewStatusEnum = z.enum(["scheduled", "completed", "cancelled", "no_show", "rescheduled"]);
export const offerStatusEnum = z.enum(["draft", "sent", "accepted", "declined", "expired", "withdrawn"]);
export const onboardingStatusEnum = z.enum(["not_started", "in_progress", "completed", "overdue"]);
export const referralStatusEnum = z.enum(["submitted", "screening", "interviewed", "hired", "rejected", "reward_paid"]);
export const backgroundCheckStatusEnum = z.enum(["pending", "in_progress", "clear", "flagged", "failed"]);
export const referenceCheckStatusEnum = z.enum(["pending", "contacted", "completed", "positive", "negative"]);

export const createJobRequisitionSchema = z.object({
  departmentId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  type: jobTypeEnum.default("full_time"),
  location: z.string().optional(),
  isRemote: z.boolean().default(false),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
  currency: z.string().length(3).default("SAR"),
  openings: z.number().int().positive().default(1),
  hiringManagerId: z.string().uuid().optional(),
  recruiterId: z.string().uuid().optional(),
});

export const updateJobRequisitionSchema = createJobRequisitionSchema.partial();

export const jobRequisitionQuerySchema = z.object({
  status: jobStatusEnum.optional(),
  departmentId: z.string().uuid().optional(),
  hiringManagerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createCandidateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  currentTitle: z.string().optional(),
  currentCompany: z.string().optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  noticePeriodDays: z.number().int().min(0).optional(),
  expectedSalary: z.number().positive().optional(),
  currency: z.string().length(3).default("SAR"),
  source: candidateSourceEnum.default("direct"),
  sourceDetails: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number().int(),
  })).optional(),
  availability: z.string().optional(),
  willingToRelocate: z.boolean().default(false),
  preferredLocations: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  gdprConsent: z.boolean().default(false),
});

export const updateCandidateSchema = createCandidateSchema.partial();

export const candidateQuerySchema = z.object({
  status: candidateStatusEnum.optional(),
  source: candidateSourceEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createApplicationSchema = z.object({
  jobRequisitionId: z.string().uuid(),
  candidateId: z.string().uuid(),
  referrerEmployeeId: z.string().uuid().optional(),
});

export const updateApplicationSchema = z.object({
  status: applicationStatusEnum.optional(),
  currentStage: z.string().optional(),
  screeningNotes: z.string().optional(),
  disqualificationReason: z.string().optional(),
  screenedById: z.string().uuid().optional(),
});

export const applicationQuerySchema = z.object({
  jobRequisitionId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  status: applicationStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  type: interviewTypeEnum,
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(60),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  interviewerIds: z.array(z.string().uuid()).min(1),
});

export const updateInterviewSchema = z.object({
  status: interviewStatusEnum.optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  interviewerIds: z.array(z.string().uuid()).optional(),
  feedback: z.record(z.unknown()).optional(),
  score: z.number().int().min(1).max(10).optional(),
  recommendation: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const interviewQuerySchema = z.object({
  applicationId: z.string().uuid().optional(),
  status: interviewStatusEnum.optional(),
  type: interviewTypeEnum.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createOfferSchema = z.object({
  applicationId: z.string().uuid(),
  candidateId: z.string().uuid(),
  jobRequisitionId: z.string().uuid(),
  baseSalary: z.number().positive(),
  housingAllowance: z.number().min(0).default(0),
  transportAllowance: z.number().min(0).default(0),
  otherAllowances: z.number().min(0).default(0),
  bonusStructure: z.string().optional(),
  benefits: z.record(z.unknown()).optional(),
  startDate: z.string().date(),
  // Statutory probation cap: 180 days (6 months) — Saudi Labour Law (CON-004).
  probationMonths: z.number().int().min(0).max(6, "Probation may not exceed 6 months (180 days)").default(3),
  offerLetterUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  createdById: z.string().uuid().optional(),
  approvedById: z.string().uuid().optional(),
});

export const updateOfferSchema = z.object({
  status: offerStatusEnum.optional(),
  baseSalary: z.number().positive().optional(),
  housingAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
  otherAllowances: z.number().min(0).optional(),
  bonusStructure: z.string().optional(),
  benefits: z.record(z.unknown()).optional(),
  startDate: z.string().date().optional(),
  probationMonths: z.number().int().min(0).max(6, "Probation may not exceed 6 months (180 days)").optional(),
  offerLetterUrl: z.string().url().optional(),
  declineReason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  approvedById: z.string().uuid().optional(),
});

export const offerQuerySchema = z.object({
  applicationId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  jobRequisitionId: z.string().uuid().optional(),
  status: offerStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createOnboardingPlanSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dayNumber: z.number().int().positive(),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
});

export const updateOnboardingPlanSchema = z.object({
  status: onboardingStatusEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
  completedAt: z.string().datetime().optional(),
  completedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const onboardingPlanQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  dayNumber: z.number().int().positive().optional(),
  status: onboardingStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createReferralSchema = z.object({
  referrerEmployeeId: z.string().uuid(),
  candidateId: z.string().uuid(),
  jobRequisitionId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateReferralSchema = z.object({
  status: referralStatusEnum.optional(),
  rewardAmount: z.number().min(0).optional(),
  rewardPaidAt: z.string().datetime().optional(),
  rewardPaidById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const referralQuerySchema = z.object({
  referrerEmployeeId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  jobRequisitionId: z.string().uuid().optional(),
  status: referralStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createBackgroundCheckSchema = z.object({
  candidateId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  provider: z.string().optional(),
  providerReferenceId: z.string().optional(),
  checks: z.record(z.boolean()).optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateBackgroundCheckSchema = z.object({
  status: backgroundCheckStatusEnum.optional(),
  result: z.record(z.unknown()).optional(),
  completedAt: z.string().datetime().optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const backgroundCheckQuerySchema = z.object({
  candidateId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  status: backgroundCheckStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createReferenceCheckSchema = z.object({
  candidateId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  refereeName: z.string().min(1).max(200),
  refereeTitle: z.string().optional(),
  refereeCompany: z.string().optional(),
  refereeEmail: z.string().email().optional(),
  refereePhone: z.string().optional(),
  relationship: z.string().optional(),
});

export const updateReferenceCheckSchema = z.object({
  status: referenceCheckStatusEnum.optional(),
  feedback: z.record(z.unknown()).optional(),
  conductedAt: z.string().datetime().optional(),
  conductedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const referenceCheckQuerySchema = z.object({
  candidateId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  status: referenceCheckStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});