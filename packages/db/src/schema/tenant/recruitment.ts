import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum, date, boolean, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";
import { departments } from "./departments";
import { employees } from "./employees";

export const jobStatusEnum = pgEnum("job_status", ["draft", "open", "paused", "closed", "filled", "cancelled"]);
export const jobTypeEnum = pgEnum("job_type", ["full_time", "part_time", "contract", "internship", "temporary"]);
export const candidateStatusEnum = pgEnum("candidate_status", ["new", "screening", "interviewing", "offer", "hired", "rejected", "withdrawn"]);
export const candidateSourceEnum = pgEnum("candidate_source", ["job_board", "referral", "linkedin", "career_site", "agency", "direct", "other"]);
export const applicationStatusEnum = pgEnum("application_status", ["applied", "screening", "phone_screen", "technical_interview", "final_interview", "offer_extended", "offer_accepted", "offer_declined", "hired", "rejected", "withdrawn"]);
export const interviewTypeEnum = pgEnum("interview_type", ["phone_screen", "video", "in_person", "technical", "panel", "cultural_fit", "final"]);
export const interviewStatusEnum = pgEnum("interview_status", ["scheduled", "completed", "cancelled", "no_show", "rescheduled"]);
export const offerStatusEnum = pgEnum("offer_status", ["draft", "sent", "accepted", "declined", "expired", "withdrawn"]);
export const onboardingStatusEnum = pgEnum("onboarding_status", ["not_started", "in_progress", "completed", "overdue"]);
export const referralStatusEnum = pgEnum("referral_status", ["submitted", "screening", "interviewed", "hired", "rejected", "reward_paid"]);
export const backgroundCheckStatusEnum = pgEnum("background_check_status", ["pending", "in_progress", "clear", "flagged", "failed"]);
export const referenceCheckStatusEnum = pgEnum("reference_check_status", ["pending", "contacted", "completed", "positive", "negative"]);

export const jobRequisitions = pgTable("job_requisitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  status: jobStatusEnum("status").default("draft").notNull(),
  type: jobTypeEnum("type").default("full_time").notNull(),
  location: text("location"),
  isRemote: boolean("is_remote").default(false),
  minSalary: numeric("min_salary", { precision: 12, scale: 2 }),
  maxSalary: numeric("max_salary", { precision: 12, scale: 2 }),
  currency: text("currency").default("SAR"),
  openings: integer("openings").default(1),
  hiringManagerId: uuid("hiring_manager_id").references(() => employees.id, { onDelete: "set null" }),
  recruiterId: uuid("recruiter_id").references(() => employees.id, { onDelete: "set null" }),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("job_requisitions_status_idx").on(table.status),
  departmentIdx: index("job_requisitions_department_idx").on(table.departmentId),
  hiringManagerIdx: index("job_requisitions_hiring_manager_idx").on(table.hiringManagerId),
}));

export const candidates = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"),
  source: text("source"), // job_board, referral, linkedin, direct, agency
  sourceDetails: jsonb("source_details"),
  nationality: text("nationality").default("saudi"),
  currentLocation: text("current_location"),
  noticePeriodDays: integer("notice_period_days"),
  expectedSalary: numeric("expected_salary", { precision: 12, scale: 2 }),
  currentSalary: numeric("current_salary", { precision: 12, scale: 2 }),
  availabilityDate: date("availability_date"),
  tags: text("tags").array(),
  notes: text("notes"),
  gdprConsent: boolean("gdpr_consent").default(false),
  gdprConsentAt: timestamp("gdpr_consent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("candidates_email_idx").on(table.email),
  sourceIdx: index("candidates_source_idx").on(table.source),
}));

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobRequisitionId: uuid("job_requisition_id").notNull().references(() => jobRequisitions.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").default("applied").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  screenedAt: timestamp("screened_at", { withTimezone: true }),
  screenedById: uuid("screened_by_id").references(() => employees.id, { onDelete: "set null" }),
  screeningNotes: text("screening_notes"),
  currentStage: text("current_stage").default("applied"),
  stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true }).defaultNow(),
  disqualificationReason: text("disqualification_reason"),
  referrerEmployeeId: uuid("referrer_employee_id").references(() => employees.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  jobReqIdx: index("applications_job_requisition_idx").on(table.jobRequisitionId),
  candidateIdx: index("applications_candidate_idx").on(table.candidateId),
  statusIdx: index("applications_status_idx").on(table.status),
  uniqueApplication: uniqueIndex("applications_unique_idx").on(table.jobRequisitionId, table.candidateId),
}));

export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  type: interviewTypeEnum("type").notNull(),
  status: interviewStatusEnum("status").default("scheduled").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  location: text("location"),
  meetingUrl: text("meeting_url"),
  interviewerIds: uuid("interviewer_ids").array().notNull(),
  feedback: jsonb("feedback"),
  score: integer("score"),
  recommendation: text("recommendation"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index("interviews_application_idx").on(table.applicationId),
  scheduledIdx: index("interviews_scheduled_idx").on(table.scheduledAt),
  statusIdx: index("interviews_status_idx").on(table.status),
}));

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  jobRequisitionId: uuid("job_requisition_id").notNull().references(() => jobRequisitions.id, { onDelete: "cascade" }),
  status: offerStatusEnum("status").default("draft").notNull(),
  baseSalary: numeric("base_salary", { precision: 12, scale: 2 }).notNull(),
  housingAllowance: numeric("housing_allowance", { precision: 12, scale: 2 }).default("0"),
  transportAllowance: numeric("transport_allowance", { precision: 12, scale: 2 }).default("0"),
  otherAllowances: numeric("other_allowances", { precision: 12, scale: 2 }).default("0"),
  bonusStructure: text("bonus_structure"),
  benefits: jsonb("benefits"),
  startDate: date("start_date"),
  probationMonths: integer("probation_months").default(3),
  offerLetterUrl: text("offer_letter_url"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  declineReason: text("decline_reason"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdById: uuid("created_by_id").references(() => employees.id, { onDelete: "set null" }),
  approvedById: uuid("approved_by_id").references(() => employees.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index("offers_application_idx").on(table.applicationId),
  candidateIdx: index("offers_candidate_idx").on(table.candidateId),
  statusIdx: index("offers_status_idx").on(table.status),
}));

export const onboardingPlans = pgTable("onboarding_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dayNumber: integer("day_number").notNull(), // 1, 30, 60, 90
  status: onboardingStatusEnum("status").default("not_started").notNull(),
  assignedToId: uuid("assigned_to_id").references(() => employees.id, { onDelete: "set null" }),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedById: uuid("completed_by_id").references(() => employees.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("onboarding_plans_employee_idx").on(table.employeeId),
  dayIdx: index("onboarding_plans_day_idx").on(table.dayNumber),
  statusIdx: index("onboarding_plans_status_idx").on(table.status),
}));

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerEmployeeId: uuid("referrer_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  jobRequisitionId: uuid("job_requisition_id").references(() => jobRequisitions.id, { onDelete: "set null" }),
  status: referralStatusEnum("status").default("submitted").notNull(),
  rewardAmount: numeric("reward_amount", { precision: 12, scale: 2 }),
  rewardPaidAt: timestamp("reward_paid_at", { withTimezone: true }),
  rewardPaidById: uuid("reward_paid_by_id").references(() => employees.id, { onDelete: "set null" }),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  referrerIdx: index("referrals_referrer_idx").on(table.referrerEmployeeId),
  candidateIdx: index("referrals_candidate_idx").on(table.candidateId),
  statusIdx: index("referrals_status_idx").on(table.status),
}));

export const backgroundChecks = pgTable("background_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  status: backgroundCheckStatusEnum("status").default("pending").notNull(),
  provider: text("provider"),
  providerReferenceId: text("provider_reference_id"),
  checks: jsonb("checks"), // { criminal: true, education: true, employment: true, credit: false }
  result: jsonb("result"),
  initiatedAt: timestamp("initiated_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  candidateIdx: index("background_checks_candidate_idx").on(table.candidateId),
  statusIdx: index("background_checks_status_idx").on(table.status),
}));

export const referenceChecks = pgTable("reference_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  refereeName: text("referee_name").notNull(),
  refereeTitle: text("referee_title"),
  refereeCompany: text("referee_company"),
  refereeEmail: text("referee_email"),
  refereePhone: text("referee_phone"),
  relationship: text("relationship"),
  status: referenceCheckStatusEnum("status").default("pending").notNull(),
  feedback: jsonb("feedback"),
  conductedAt: timestamp("conducted_at", { withTimezone: true }),
  conductedById: uuid("conducted_by_id").references(() => employees.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  candidateIdx: index("reference_checks_candidate_idx").on(table.candidateId),
  statusIdx: index("reference_checks_status_idx").on(table.status),
}));