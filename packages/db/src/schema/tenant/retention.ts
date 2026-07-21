import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum, date, boolean, numeric, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { departments } from "./departments";
import { employees } from "./employees";

export const goalTypeEnum = pgEnum("goal_type", ["okr", "kpi", "project", "development", "behavioral"]);
export const goalStatusEnum = pgEnum("goal_status", ["draft", "active", "on_track", "at_risk", "off_track", "completed", "cancelled"]);
export const reviewCycleStatusEnum = pgEnum("review_cycle_status", ["planned", "open", "self_review", "manager_review", "calibration", "completed", "archived"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "in_progress", "submitted", "acknowledged", "completed"]);
export const reviewTypeEnum = pgEnum("review_type", ["annual", "mid_year", "probation", "project", "360"]);
export const skillCategoryEnum = pgEnum("skill_category", ["technical", "soft", "leadership", "domain", "language", "certification"]);
export const proficiencyLevelEnum = pgEnum("proficiency_level", ["beginner", "intermediate", "advanced", "expert"]);
export const learningTypeEnum = pgEnum("learning_type", ["course", "workshop", "certification", "mentoring", "coaching", "on_the_job", "conference", "webinar", "self_study"]);
export const learningStatusEnum = pgEnum("learning_status", ["planned", "enrolled", "in_progress", "completed", "cancelled", "expired"]);
export const careerPathStatusEnum = pgEnum("career_path_status", ["active", "paused", "completed", "archived"]);
export const successionStatusEnum = pgEnum("succession_status", ["identified", "developing", "ready", "promoted", "departed"]);
export const engagementSurveyStatusEnum = pgEnum("engagement_survey_status", ["draft", "scheduled", "open", "closed", "analyzed", "action_planning", "completed"]);
export const stayInterviewStatusEnum = pgEnum("stay_interview_status", ["scheduled", "completed", "action_required", "closed"]);
export const recognitionTypeEnum = pgEnum("recognition_type", ["peer", "manager", "company", "anniversary", "achievement", "innovation", "values", "wellness"]);
export const rewardTypeEnum = pgEnum("reward_type", ["monetary", "non_monetary", "time_off", "gift", "experience", "development", "public_recognition"]);

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  managerId: uuid("manager_id").references(() => employees.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  type: goalTypeEnum("type").default("okr").notNull(),
  status: goalStatusEnum("status").default("draft").notNull(),
  weight: integer("weight").default(100),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  progress: integer("progress").default(0),
  metrics: jsonb("metrics"),
  parentGoalId: uuid("parent_goal_id"),
  reviewCycleId: uuid("review_cycle_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("goals_employee_idx").on(table.employeeId),
  managerIdx: index("goals_manager_idx").on(table.managerId),
  statusIdx: index("goals_status_idx").on(table.status),
  reviewCycleIdx: index("goals_review_cycle_idx").on(table.reviewCycleId),
  parentIdx: index("goals_parent_idx").on(table.parentGoalId),
  parentFk: foreignKey({ columns: [table.parentGoalId], foreignColumns: [table.id] }).onDelete("set null"),
}));

export const goalKeyResults = pgTable("goal_key_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: numeric("target_value", { precision: 12, scale: 2 }),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }),
  unit: text("unit"),
  weight: integer("weight").default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  goalIdx: index("goal_key_results_goal_idx").on(table.goalId),
}));

export const reviewCycles = pgTable("review_cycles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: reviewTypeEnum("type").default("annual").notNull(),
  status: reviewCycleStatusEnum("status").default("planned").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  selfReviewStartDate: date("self_review_start_date"),
  selfReviewEndDate: date("self_review_end_date"),
  managerReviewStartDate: date("manager_review_start_date"),
  managerReviewEndDate: date("manager_review_end_date"),
  calibrationStartDate: date("calibration_start_date"),
  calibrationEndDate: date("calibration_end_date"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("review_cycles_status_idx").on(table.status),
  dateIdx: index("review_cycles_date_idx").on(table.startDate, table.endDate),
}));

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewCycleId: uuid("review_cycle_id").notNull().references(() => reviewCycles.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  managerId: uuid("manager_id").references(() => employees.id, { onDelete: "set null" }),
  status: reviewStatusEnum("status").default("pending").notNull(),
  type: reviewTypeEnum("type").default("annual").notNull(),
  selfReview: jsonb("self_review"),
  managerReview: jsonb("manager_review"),
  finalRating: integer("final_rating"),
  calibrationNotes: text("calibration_notes"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cycleIdx: index("reviews_cycle_idx").on(table.reviewCycleId),
  employeeIdx: index("reviews_employee_idx").on(table.employeeId),
  managerIdx: index("reviews_manager_idx").on(table.managerId),
  statusIdx: index("reviews_status_idx").on(table.status),
  uniqueReview: uniqueIndex("reviews_unique_idx").on(table.reviewCycleId, table.employeeId),
}));

export const reviewSections = pgTable("review_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewCycleId: uuid("review_cycle_id").notNull().references(() => reviewCycles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  weight: integer("weight").default(100),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cycleIdx: index("review_sections_cycle_idx").on(table.reviewCycleId),
}));

export const reviewResponses = pgTable("review_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  sectionId: uuid("section_id").notNull().references(() => reviewSections.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  responses: jsonb("responses"),
  rating: integer("rating"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  reviewIdx: index("review_responses_review_idx").on(table.reviewId),
  sectionIdx: index("review_responses_section_idx").on(table.sectionId),
  reviewerIdx: index("review_responses_reviewer_idx").on(table.reviewerId),
  uniqueResponse: uniqueIndex("review_responses_unique_idx").on(table.reviewId, table.sectionId, table.reviewerId),
}));

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: skillCategoryEnum("category").default("technical").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex("skills_name_idx").on(table.name),
  categoryIdx: index("skills_category_idx").on(table.category),
}));

export const employeeSkills = pgTable("employee_skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  proficiencyLevel: proficiencyLevelEnum("proficiency_level").default("beginner").notNull(),
  yearsExperience: integer("years_experience"),
  lastUsed: date("last_used"),
  isPrimary: boolean("is_primary").default(false),
  verifiedById: uuid("verified_by_id").references(() => employees.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("employee_skills_employee_idx").on(table.employeeId),
  skillIdx: index("employee_skills_skill_idx").on(table.skillId),
  uniqueSkill: uniqueIndex("employee_skills_unique_idx").on(table.employeeId, table.skillId),
}));

export const skillGaps = pgTable("skill_gaps", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  requiredLevel: proficiencyLevelEnum("required_level").notNull(),
  currentLevel: proficiencyLevelEnum("current_level").notNull(),
  gapReason: text("gap_reason"),
  identifiedAt: timestamp("identified_at", { withTimezone: true }).defaultNow().notNull(),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("skill_gaps_employee_idx").on(table.employeeId),
  skillIdx: index("skill_gaps_skill_idx").on(table.skillId),
}));

export const learningPrograms = pgTable("learning_programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: learningTypeEnum("type").default("course").notNull(),
  provider: text("provider"),
  url: text("url"),
  durationHours: integer("duration_hours"),
  cost: numeric("cost", { precision: 12, scale: 2 }),
  currency: text("currency").default("SAR"),
  skills: uuid("skills").array(),
  prerequisites: uuid("prerequisites").array(),
  isActive: boolean("is_active").default(true),
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("learning_programs_type_idx").on(table.type),
  activeIdx: index("learning_programs_active_idx").on(table.isActive),
}));

export const learningEnrollments = pgTable("learning_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  programId: uuid("program_id").notNull().references(() => learningPrograms.id, { onDelete: "cascade" }),
  status: learningStatusEnum("status").default("planned").notNull(),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  dueDate: date("due_date"),
  progress: integer("progress").default(0),
  score: numeric("score", { precision: 5, scale: 2 }),
  certificateUrl: text("certificate_url"),
  feedback: jsonb("feedback"),
  approvedById: uuid("approved_by_id").references(() => employees.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("learning_enrollments_employee_idx").on(table.employeeId),
  programIdx: index("learning_enrollments_program_idx").on(table.programId),
  statusIdx: index("learning_enrollments_status_idx").on(table.status),
}));

export const careerPaths = pgTable("career_paths", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  fromRoleId: uuid("from_role_id").references(() => careerRoles.id, { onDelete: "set null" }),
  toRoleId: uuid("to_role_id").notNull().references(() => careerRoles.id, { onDelete: "cascade" }),
  status: careerPathStatusEnum("status").default("active").notNull(),
  estimatedMonths: integer("estimated_months"),
  requiredSkills: uuid("required_skills").array(),
  requiredExperience: jsonb("required_experience"),
  milestones: jsonb("milestones"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fromRoleIdx: index("career_paths_from_role_idx").on(table.fromRoleId),
  toRoleIdx: index("career_paths_to_role_idx").on(table.toRoleId),
  statusIdx: index("career_paths_status_idx").on(table.status),
}));

export const careerRoles = pgTable("career_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  level: integer("level").notNull(),
  minSalary: numeric("min_salary", { precision: 12, scale: 2 }),
  maxSalary: numeric("max_salary", { precision: 12, scale: 2 }),
  currency: text("currency").default("SAR"),
  requiredSkills: uuid("required_skills").array(),
  requiredExperience: jsonb("required_experience"),
  competencies: jsonb("competencies"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  titleIdx: uniqueIndex("career_roles_title_idx").on(table.title),
  departmentIdx: index("career_roles_department_idx").on(table.departmentId),
  levelIdx: index("career_roles_level_idx").on(table.level),
}));

export const employeeCareerPaths = pgTable("employee_career_paths", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  careerPathId: uuid("career_path_id").notNull().references(() => careerPaths.id, { onDelete: "cascade" }),
  status: careerPathStatusEnum("status").default("active").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  targetCompletionDate: date("target_completion_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  currentMilestone: integer("current_milestone").default(0),
  progress: integer("progress").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("employee_career_paths_employee_idx").on(table.employeeId),
  pathIdx: index("employee_career_paths_path_idx").on(table.careerPathId),
  statusIdx: index("employee_career_paths_status_idx").on(table.status),
}));

export const successionPlans = pgTable("succession_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: uuid("role_id").notNull().references(() => careerRoles.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  incumbentId: uuid("incumbent_id").references(() => employees.id, { onDelete: "set null" }),
  status: successionStatusEnum("status").default("identified").notNull(),
  riskLevel: text("risk_level"),
  readinessDate: date("readiness_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("succession_plans_role_idx").on(table.roleId),
  departmentIdx: index("succession_plans_department_idx").on(table.departmentId),
  statusIdx: index("succession_plans_status_idx").on(table.status),
}));

export const successionCandidates = pgTable("succession_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  successionPlanId: uuid("succession_plan_id").notNull().references(() => successionPlans.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  status: successionStatusEnum("status").default("identified").notNull(),
  readinessScore: integer("readiness_score"),
  developmentAreas: jsonb("development_areas"),
  developmentPlan: text("development_plan"),
  nominatedById: uuid("nominated_by_id").references(() => employees.id, { onDelete: "set null" }),
  nominatedAt: timestamp("nominated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  planIdx: index("succession_candidates_plan_idx").on(table.successionPlanId),
  employeeIdx: index("succession_candidates_employee_idx").on(table.employeeId),
  statusIdx: index("succession_candidates_status_idx").on(table.status),
}));

export const engagementSurveys = pgTable("engagement_surveys", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: engagementSurveyStatusEnum("status").default("draft").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  questions: jsonb("questions"),
  targetAudience: jsonb("target_audience"),
  isAnonymous: boolean("is_anonymous").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("engagement_surveys_status_idx").on(table.status),
}));

export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  surveyId: uuid("survey_id").notNull().references(() => engagementSurveys.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
  responses: jsonb("responses"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  surveyIdx: index("survey_responses_survey_idx").on(table.surveyId),
  employeeIdx: index("survey_responses_employee_idx").on(table.employeeId),
}));

export const stayInterviews = pgTable("stay_interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  interviewerId: uuid("interviewer_id").references(() => employees.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: stayInterviewStatusEnum("status").default("scheduled").notNull(),
  responses: jsonb("responses"),
  riskFactors: jsonb("risk_factors"),
  actionItems: jsonb("action_items"),
  followUpDate: date("follow_up_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("stay_interviews_employee_idx").on(table.employeeId),
  statusIdx: index("stay_interviews_status_idx").on(table.status),
}));

export const recognitions = pgTable("recognitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromEmployeeId: uuid("from_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  toEmployeeId: uuid("to_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: recognitionTypeEnum("type").default("peer").notNull(),
  message: text("message").notNull(),
  values: text("values").array(),
  isPublic: boolean("is_public").default(true),
  rewardId: uuid("reward_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fromIdx: index("recognitions_from_idx").on(table.fromEmployeeId),
  toIdx: index("recognitions_to_idx").on(table.toEmployeeId),
  typeIdx: index("recognitions_type_idx").on(table.type),
}));

export const rewards = pgTable("rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: rewardTypeEnum("type").default("non_monetary").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }),
  currency: text("currency").default("SAR"),
  quantity: integer("quantity").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("rewards_type_idx").on(table.type),
  activeIdx: index("rewards_active_idx").on(table.isActive),
}));

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  rewardId: uuid("reward_id").notNull().references(() => rewards.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).defaultNow().notNull(),
  approvedById: uuid("approved_by_id").references(() => employees.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  rewardIdx: index("reward_redemptions_reward_idx").on(table.rewardId),
  employeeIdx: index("reward_redemptions_employee_idx").on(table.employeeId),
}));

export const totalRewardsStatements = pgTable("total_rewards_statements", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  baseSalary: numeric("base_salary", { precision: 12, scale: 2 }),
  housingAllowance: numeric("housing_allowance", { precision: 12, scale: 2 }),
  transportAllowance: numeric("transport_allowance", { precision: 12, scale: 2 }),
  otherAllowances: numeric("other_allowances", { precision: 12, scale: 2 }),
  bonus: numeric("bonus", { precision: 12, scale: 2 }),
  benefitsValue: numeric("benefits_value", { precision: 12, scale: 2 }),
  equityValue: numeric("equity_value", { precision: 12, scale: 2 }),
  totalValue: numeric("total_value", { precision: 12, scale: 2 }),
  currency: text("currency").default("SAR"),
  breakdown: jsonb("breakdown"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("total_rewards_employee_idx").on(table.employeeId),
  periodIdx: index("total_rewards_period_idx").on(table.periodStart, table.periodEnd),
  uniqueStatement: uniqueIndex("total_rewards_unique_idx").on(table.employeeId, table.periodStart, table.periodEnd),
}));

export const compensationPlans = pgTable("compensation_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  effectiveDate: date("effective_date").notNull(),
  endDate: date("end_date"),
  eligibilityCriteria: jsonb("eligibility_criteria"),
  budget: numeric("budget", { precision: 14, scale: 2 }),
  currency: text("currency").default("SAR"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("compensation_plans_status_idx").on(table.status),
}));

export const compensationAdjustments = pgTable("compensation_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => compensationPlans.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  adjustmentType: text("adjustment_type").notNull(),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }),
  proposedValue: numeric("proposed_value", { precision: 12, scale: 2 }),
  changeAmount: numeric("change_amount", { precision: 12, scale: 2 }),
  changePercentage: numeric("change_percentage", { precision: 5, scale: 2 }),
  justification: text("justification"),
  status: text("status").default("pending"),
  approvedById: uuid("approved_by_id").references(() => employees.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  effectiveDate: date("effective_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  planIdx: index("compensation_adjustments_plan_idx").on(table.planId),
  employeeIdx: index("compensation_adjustments_employee_idx").on(table.employeeId),
  statusIdx: index("compensation_adjustments_status_idx").on(table.status),
}));

export const talentReviews = pgTable("talent_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  reviewDate: date("review_date").notNull(),
  status: text("status").default("planned"),
  participants: uuid("participants").array(),
  facilitatorId: uuid("facilitator_id").references(() => employees.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("talent_reviews_status_idx").on(table.status),
}));

export const talentReviewParticipants = pgTable("talent_review_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  talentReviewId: uuid("talent_review_id").notNull().references(() => talentReviews.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => employees.id, { onDelete: "set null" }),
  performanceRating: integer("performance_rating"),
  potentialRating: integer("potential_rating"),
  nineBoxPosition: text("nine_box_position"),
  strengths: text("strengths"),
  developmentAreas: text("development_areas"),
  nextSteps: text("next_steps"),
  isHighPotential: boolean("is_high_potential").default(false),
  retentionRisk: text("retention_risk"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  reviewIdx: index("talent_review_participants_review_idx").on(table.talentReviewId),
  employeeIdx: index("talent_review_participants_employee_idx").on(table.employeeId),
  reviewerIdx: index("talent_review_participants_reviewer_idx").on(table.reviewerId),
}));