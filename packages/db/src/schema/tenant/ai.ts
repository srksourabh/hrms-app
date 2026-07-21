import { pgTable, uuid, text, timestamp, jsonb, pgEnum, date, boolean, numeric, integer, index } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { departments } from "./departments";
import { jobRequisitions } from "./recruitment";

export const aiSuggestionTypeEnum = pgEnum("ai_suggestion_type", [
  "salary_benchmark", "skill_recommendation", "churn_prediction",
  "compliance_risk", "candidate_match", "interview_feedback",
  "jd_enhancement", "survey_sentiment", "career_path", "learning_recommendation",
  "compensation_insight", "retention_risk", "general",
]);
export const aiSuggestionStatusEnum = pgEnum("ai_suggestion_status", ["pending", "applied", "dismissed", "in_progress"]);
export const aiConfidenceLevelEnum = pgEnum("ai_confidence_level", ["low", "medium", "high", "very_high"]);

export const aiAssistants = pgTable("ai_assistants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // Active LLM provider (informational; default model resolved by
  // packages/llm at request time). Leave empty to use the platform
  // default (Claude per PRD Section 4).
  model: text("model").notNull(),
  systemPrompt: text("system_prompt"),
  capabilities: jsonb("capabilities").default([]),
  isActive: boolean("is_active").default(true).notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  type: aiSuggestionTypeEnum("type").notNull(),
  status: aiSuggestionStatusEnum("status").default("pending").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  suggestion: jsonb("suggestion").notNull(),
  reasoning: text("reasoning"),
  confidence: aiConfidenceLevelEnum("confidence").default("medium").notNull(),
  source: text("source"),
  metadata: jsonb("metadata"),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  appliedBy: uuid("applied_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("ai_suggestions_employee_idx").on(table.employeeId),
  typeIdx: index("ai_suggestions_type_idx").on(table.type),
  statusIdx: index("ai_suggestions_status_idx").on(table.status),
  deptIdx: index("ai_suggestions_dept_idx").on(table.departmentId),
}));

export const aiJobDescriptionEnhancements = pgTable("ai_jd_enhancements", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobRequisitionId: uuid("job_requisition_id").notNull().references(() => jobRequisitions.id, { onDelete: "cascade" }),
  originalContent: text("original_content").notNull(),
  enhancedContent: text("enhanced_content").notNull(),
  changes: jsonb("changes"),
  suggestions: jsonb("suggestions"),
  modelUsed: text("model_used"),
  isApplied: boolean("is_applied").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  jobIdx: index("ai_jd_enhancements_job_idx").on(table.jobRequisitionId),
}));

export const aiCandidateMatchings = pgTable("ai_candidate_matchings", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id"),
  jobRequisitionId: uuid("job_requisition_id"),
  matchScore: numeric("match_score", { precision: 5, scale: 2 }).notNull(),
  skillMatch: jsonb("skill_match"),
  experienceMatch: jsonb("experience_match"),
  educationMatch: jsonb("education_match"),
  cultureFitScore: numeric("culture_fit_score", { precision: 5, scale: 2 }),
  overallAssessment: text("overall_assessment"),
  strengths: jsonb("strengths"),
  gaps: jsonb("gaps"),
  recommendations: jsonb("recommendations"),
  modelUsed: text("model_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  candidateIdx: index("ai_candidate_matchings_candidate_idx").on(table.candidateId),
  jobIdx: index("ai_candidate_matchings_job_idx").on(table.jobRequisitionId),
}));

export const aiInterviewFeedback = pgTable("ai_interview_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  interviewId: uuid("interview_id"),
  transcriptSummary: text("transcript_summary"),
  keyTopics: jsonb("key_topics"),
  sentimentAnalysis: jsonb("sentiment_analysis"),
  skillAssessment: jsonb("skill_assessment"),
  redFlags: jsonb("red_flags"),
  greenFlags: jsonb("green_flags"),
  overallRating: integer("overall_rating"),
  hiringRecommendation: text("hiring_recommendation"),
  suggestedQuestions: jsonb("suggested_questions"),
  modelUsed: text("model_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  interviewIdx: index("ai_interview_feedback_interview_idx").on(table.interviewId),
}));

export const aiSkillRecommendations = pgTable("ai_skill_recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  currentSkills: jsonb("current_skills"),
  targetRole: text("target_role"),
  recommendedSkills: jsonb("recommended_skills").notNull(),
  learningPath: jsonb("learning_path"),
  estimatedTimeline: text("estimated_timeline"),
  priority: aiConfidenceLevelEnum("priority").default("medium"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("ai_skill_recs_employee_idx").on(table.employeeId),
}));

export const aiSalaryBenchmarks = pgTable("ai_salary_benchmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobTitle: text("job_title").notNull(),
  industry: text("industry"),
  region: text("region").notNull(),
  experienceLevel: text("experience_level").notNull(),
  p10: numeric("p10", { precision: 12, scale: 2 }),
  p25: numeric("p25", { precision: 12, scale: 2 }),
  p50: numeric("p50", { precision: 12, scale: 2 }),
  p75: numeric("p75", { precision: 12, scale: 2 }),
  p90: numeric("p90", { precision: 12, scale: 2 }),
  currency: text("currency").default("SAR"),
  source: text("source"),
  dataFreshness: date("data_freshness"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiChurnPredictions = pgTable("ai_churn_predictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(),
  keyFactors: jsonb("key_factors"),
  predictedTimeline: text("predicted_timeline"),
  retentionStrategies: jsonb("retention_strategies"),
  modelVersion: text("model_version"),
  predictionDate: date("prediction_date").notNull(),
  isAccurate: boolean("is_accurate"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("ai_churn_predictions_employee_idx").on(table.employeeId),
  riskIdx: index("ai_churn_predictions_risk_idx").on(table.riskLevel),
}));

export const aiCompliancePredictions = pgTable("ai_compliance_predictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
  riskType: text("risk_type").notNull(),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(),
  findings: jsonb("findings"),
  recommendations: jsonb("recommendations"),
  regulatoryReferences: jsonb("regulatory_references"),
  isResolved: boolean("is_resolved").default(false),
  predictionDate: date("prediction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  deptIdx: index("ai_compliance_preds_dept_idx").on(table.departmentId),
  employeeIdx: index("ai_compliance_preds_employee_idx").on(table.employeeId),
  typeIdx: index("ai_compliance_preds_type_idx").on(table.riskType),
}));

export const aiSurveySentiments = pgTable("ai_survey_sentiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  surveyId: uuid("survey_id"),
  responseId: uuid("response_id"),
  overallSentiment: text("overall_sentiment").notNull(),
  sentimentScore: numeric("sentiment_score", { precision: 5, scale: 2 }),
  categoryBreakdown: jsonb("category_breakdown"),
  keyThemes: jsonb("key_themes"),
  actionItems: jsonb("action_items"),
  employeeGroup: text("employee_group"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  surveyIdx: index("ai_survey_sentiments_survey_idx").on(table.surveyId),
}));

export const aiAuditLogs = pgTable("ai_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  promptPreview: text("prompt_preview"),
  responsePreview: text("response_preview"),
  modelUsed: text("model_used"),
  tokensUsed: integer("tokens_used"),
  durationMs: integer("duration_ms"),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  performedBy: uuid("performed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actionIdx: index("ai_audit_logs_action_idx").on(table.action),
  entityIdx: index("ai_audit_logs_entity_idx").on(table.entityType, table.entityId),
}));

export const aiRetentionRiskFlags = pgTable("ai_retention_risk_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  flagType: text("flag_type").notNull(),
  riskLevel: text("risk_level").notNull(),
  description: text("description").notNull(),
  indicators: jsonb("indicators"),
  suggestedActions: jsonb("suggested_actions"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("ai_retention_risk_flags_employee_idx").on(table.employeeId),
  typeIdx: index("ai_retention_risk_flags_type_idx").on(table.flagType),
}));
