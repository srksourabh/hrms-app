import { relations } from "drizzle-orm";
import {
  aiSuggestions, aiSkillRecommendations, aiChurnPredictions,
  aiCompliancePredictions, aiRetentionRiskFlags,
} from "./tenant/ai";
import { departments } from "./tenant/departments";
import { employees } from "./tenant/employees";
import { employmentHistory } from "./tenant/employment_history";
import { documents } from "./tenant/documents";
import {
  shifts,
  shiftAssignments,
  attendanceRecords,
  attendanceExceptions,
} from "./tenant/attendance";
import { leaveTypes } from "./tenant/leave_types";
import { leaveRequests } from "./tenant/leave_requests";
import { leaveBalances } from "./tenant/leave_balances";
import { payrollRuns } from "./tenant/payroll_runs";
import { payslips } from "./tenant/payslips";
import { wageFiles } from "./tenant/wage_files";
import { employeeInvitations } from "./tenant/employee-invitations";
import { complianceChecks } from "./tenant/compliance_checks";
import { finalSettlements } from "./tenant/final_settlements";
import { notifications } from "./tenant/notifications";
import { auditLogs } from "./tenant/audit_logs";
import { tenants } from "./public/tenants";
import { users } from "./public/users";
import {
  jobRequisitions,
  candidates,
  applications,
  interviews,
  offers,
  onboardingPlans,
  referrals,
  backgroundChecks,
  referenceChecks,
} from "./tenant/recruitment";
import {
  goals,
  goalKeyResults,
  reviewCycles,
  reviews,
  reviewSections,
  reviewResponses,
  skills,
  employeeSkills,
  skillGaps,
  learningPrograms,
  learningEnrollments,
  careerPaths,
  careerRoles,
  employeeCareerPaths,
  successionPlans,
  successionCandidates,
  engagementSurveys,
  surveyResponses,
  stayInterviews,
  recognitions,
  rewards,
  rewardRedemptions,
  totalRewardsStatements,
  compensationPlans,
  compensationAdjustments,
  talentReviews,
  talentReviewParticipants,
} from "./tenant/retention";

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parent: one(departments, {
    fields: [departments.parentDepartmentId],
    references: [departments.id],
    relationName: "parent",
  }),
  children: many(departments, { relationName: "parent" }),
  head: one(employees, {
    fields: [departments.headEmployeeId],
    references: [employees.id],
  }),
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  manager: one(employees, {
    fields: [employees.managerEmployeeId],
    references: [employees.id],
  }),
  directReports: many(employees, { relationName: "manager" }),
  employmentHistory: many(employmentHistory),
  documents: many(documents),
  leaveRequests: many(leaveRequests),
  leaveBalances: many(leaveBalances),
  payslips: many(payslips),
  finalSettlements: many(finalSettlements),
  shiftAssignments: many(shiftAssignments),
  attendanceRecords: many(attendanceRecords),
  attendanceExceptions: many(attendanceExceptions),
}));

export const employmentHistoryRelations = relations(employmentHistory, ({ one }) => ({
  employee: one(employees, {
    fields: [employmentHistory.employeeId],
    references: [employees.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  employee: one(employees, {
    fields: [documents.employeeId],
    references: [employees.id],
  }),
}));

export const leaveTypesRelations = relations(leaveTypes, ({ many }) => ({
  leaveRequests: many(leaveRequests),
  leaveBalances: many(leaveBalances),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leaveTypeId],
    references: [leaveTypes.id],
  }),
  approvedBy: one(employees, {
    fields: [leaveRequests.approvedByUserId],
    references: [employees.id],
  }),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveBalances.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveBalances.leaveTypeId],
    references: [leaveTypes.id],
  }),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ many }) => ({
  payslips: many(payslips),
  wageFiles: many(wageFiles),
  complianceChecks: many(complianceChecks),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payslips.payrollRunId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payslips.employeeId],
    references: [employees.id],
  }),
}));

export const wageFilesRelations = relations(wageFiles, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [wageFiles.payrollRunId],
    references: [payrollRuns.id],
  }),
}));

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [complianceChecks.payrollRunId],
    references: [payrollRuns.id],
  }),
}));

export const finalSettlementsRelations = relations(finalSettlements, ({ one }) => ({
  employee: one(employees, {
    fields: [finalSettlements.employeeId],
    references: [employees.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const jobRequisitionsRelations = relations(jobRequisitions, ({ one, many }) => ({
  department: one(departments, {
    fields: [jobRequisitions.departmentId],
    references: [departments.id],
  }),
  hiringManager: one(employees, {
    fields: [jobRequisitions.hiringManagerId],
    references: [employees.id],
    relationName: "hiringManager",
  }),
  recruiter: one(employees, {
    fields: [jobRequisitions.recruiterId],
    references: [employees.id],
    relationName: "recruiter",
  }),
  applications: many(applications),
  offers: many(offers),
  referrals: many(referrals),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
  offers: many(offers),
  referrals: many(referrals),
  backgroundChecks: many(backgroundChecks),
  referenceChecks: many(referenceChecks),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  jobRequisition: one(jobRequisitions, {
    fields: [applications.jobRequisitionId],
    references: [jobRequisitions.id],
  }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  screenedBy: one(employees, {
    fields: [applications.screenedById],
    references: [employees.id],
  }),
  referrer: one(employees, {
    fields: [applications.referrerEmployeeId],
    references: [employees.id],
  }),
  interviews: many(interviews),
  offers: many(offers),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  application: one(applications, {
    fields: [offers.applicationId],
    references: [applications.id],
  }),
  candidate: one(candidates, {
    fields: [offers.candidateId],
    references: [candidates.id],
  }),
  jobRequisition: one(jobRequisitions, {
    fields: [offers.jobRequisitionId],
    references: [jobRequisitions.id],
  }),
  createdBy: one(employees, {
    fields: [offers.createdById],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [offers.approvedById],
    references: [employees.id],
  }),
}));

export const onboardingPlansRelations = relations(onboardingPlans, ({ one }) => ({
  employee: one(employees, {
    fields: [onboardingPlans.employeeId],
    references: [employees.id],
  }),
  assignedTo: one(employees, {
    fields: [onboardingPlans.assignedToId],
    references: [employees.id],
  }),
  completedBy: one(employees, {
    fields: [onboardingPlans.completedById],
    references: [employees.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(employees, {
    fields: [referrals.referrerEmployeeId],
    references: [employees.id],
  }),
  candidate: one(candidates, {
    fields: [referrals.candidateId],
    references: [candidates.id],
  }),
  jobRequisition: one(jobRequisitions, {
    fields: [referrals.jobRequisitionId],
    references: [jobRequisitions.id],
  }),
  rewardPaidBy: one(employees, {
    fields: [referrals.rewardPaidById],
    references: [employees.id],
  }),
}));

export const backgroundChecksRelations = relations(backgroundChecks, ({ one }) => ({
  candidate: one(candidates, {
    fields: [backgroundChecks.candidateId],
    references: [candidates.id],
  }),
  application: one(applications, {
    fields: [backgroundChecks.applicationId],
    references: [applications.id],
  }),
}));

export const referenceChecksRelations = relations(referenceChecks, ({ one }) => ({
  candidate: one(candidates, {
    fields: [referenceChecks.candidateId],
    references: [candidates.id],
  }),
  application: one(applications, {
    fields: [referenceChecks.applicationId],
    references: [applications.id],
  }),
  conductedBy: one(employees, {
    fields: [referenceChecks.conductedById],
    references: [employees.id],
  }),
}));

export const employeeInvitationsRelations = relations(employeeInvitations, ({ one }) => ({
  invitedBy: one(users, {
    fields: [employeeInvitations.invitedByUserId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employeeInvitations.departmentId],
    references: [departments.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  employee: one(employees, {
    fields: [goals.employeeId],
    references: [employees.id],
  }),
  manager: one(employees, {
    fields: [goals.managerId],
    references: [employees.id],
  }),
  parent: one(goals, {
    fields: [goals.parentGoalId],
    references: [goals.id],
    relationName: "parent",
  }),
  children: many(goals, { relationName: "parent" }),
  keyResults: many(goalKeyResults),
}));

export const goalKeyResultsRelations = relations(goalKeyResults, ({ one }) => ({
  goal: one(goals, {
    fields: [goalKeyResults.goalId],
    references: [goals.id],
  }),
}));

export const reviewCyclesRelations = relations(reviewCycles, ({ many }) => ({
  reviews: many(reviews),
  sections: many(reviewSections),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  cycle: one(reviewCycles, {
    fields: [reviews.reviewCycleId],
    references: [reviewCycles.id],
  }),
  employee: one(employees, {
    fields: [reviews.employeeId],
    references: [employees.id],
  }),
  manager: one(employees, {
    fields: [reviews.managerId],
    references: [employees.id],
  }),
  responses: many(reviewResponses),
}));

export const reviewSectionsRelations = relations(reviewSections, ({ one, many }) => ({
  cycle: one(reviewCycles, {
    fields: [reviewSections.reviewCycleId],
    references: [reviewCycles.id],
  }),
  responses: many(reviewResponses),
}));

export const reviewResponsesRelations = relations(reviewResponses, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewResponses.reviewId],
    references: [reviews.id],
  }),
  section: one(reviewSections, {
    fields: [reviewResponses.sectionId],
    references: [reviewSections.id],
  }),
  reviewer: one(employees, {
    fields: [reviewResponses.reviewerId],
    references: [employees.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  employeeSkills: many(employeeSkills),
  skillGaps: many(skillGaps),
}));

export const employeeSkillsRelations = relations(employeeSkills, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeSkills.employeeId],
    references: [employees.id],
  }),
  skill: one(skills, {
    fields: [employeeSkills.skillId],
    references: [skills.id],
  }),
  verifiedBy: one(employees, {
    fields: [employeeSkills.verifiedById],
    references: [employees.id],
  }),
}));

export const skillGapsRelations = relations(skillGaps, ({ one }) => ({
  employee: one(employees, {
    fields: [skillGaps.employeeId],
    references: [employees.id],
  }),
  skill: one(skills, {
    fields: [skillGaps.skillId],
    references: [skills.id],
  }),
}));

export const learningProgramsRelations = relations(learningPrograms, ({ many }) => ({
  enrollments: many(learningEnrollments),
}));

export const learningEnrollmentsRelations = relations(learningEnrollments, ({ one }) => ({
  employee: one(employees, {
    fields: [learningEnrollments.employeeId],
    references: [employees.id],
  }),
  program: one(learningPrograms, {
    fields: [learningEnrollments.programId],
    references: [learningPrograms.id],
  }),
  approvedBy: one(employees, {
    fields: [learningEnrollments.approvedById],
    references: [employees.id],
  }),
}));

export const careerRolesRelations = relations(careerRoles, ({ one, many }) => ({
  department: one(departments, {
    fields: [careerRoles.departmentId],
    references: [departments.id],
  }),
  fromPaths: many(careerPaths, { relationName: "fromRole" }),
  toPaths: many(careerPaths, { relationName: "toRole" }),
  employeeCareerPaths: many(employeeCareerPaths),
  successionPlans: many(successionPlans),
}));

export const careerPathsRelations = relations(careerPaths, ({ one, many }) => ({
  fromRole: one(careerRoles, {
    fields: [careerPaths.fromRoleId],
    references: [careerRoles.id],
    relationName: "fromRole",
  }),
  toRole: one(careerRoles, {
    fields: [careerPaths.toRoleId],
    references: [careerRoles.id],
    relationName: "toRole",
  }),
  employeeCareerPaths: many(employeeCareerPaths),
}));

export const employeeCareerPathsRelations = relations(employeeCareerPaths, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeCareerPaths.employeeId],
    references: [employees.id],
  }),
  careerPath: one(careerPaths, {
    fields: [employeeCareerPaths.careerPathId],
    references: [careerPaths.id],
  }),
}));

export const successionPlansRelations = relations(successionPlans, ({ one, many }) => ({
  role: one(careerRoles, {
    fields: [successionPlans.roleId],
    references: [careerRoles.id],
  }),
  department: one(departments, {
    fields: [successionPlans.departmentId],
    references: [departments.id],
  }),
  incumbent: one(employees, {
    fields: [successionPlans.incumbentId],
    references: [employees.id],
  }),
  candidates: many(successionCandidates),
}));

export const successionCandidatesRelations = relations(successionCandidates, ({ one }) => ({
  plan: one(successionPlans, {
    fields: [successionCandidates.successionPlanId],
    references: [successionPlans.id],
  }),
  employee: one(employees, {
    fields: [successionCandidates.employeeId],
    references: [employees.id],
  }),
  nominatedBy: one(employees, {
    fields: [successionCandidates.nominatedById],
    references: [employees.id],
  }),
}));

export const engagementSurveysRelations = relations(engagementSurveys, ({ many }) => ({
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(engagementSurveys, {
    fields: [surveyResponses.surveyId],
    references: [engagementSurveys.id],
  }),
  employee: one(employees, {
    fields: [surveyResponses.employeeId],
    references: [employees.id],
  }),
}));

export const stayInterviewsRelations = relations(stayInterviews, ({ one }) => ({
  employee: one(employees, {
    fields: [stayInterviews.employeeId],
    references: [employees.id],
  }),
  interviewer: one(employees, {
    fields: [stayInterviews.interviewerId],
    references: [employees.id],
  }),
}));

export const recognitionsRelations = relations(recognitions, ({ one }) => ({
  fromEmployee: one(employees, {
    fields: [recognitions.fromEmployeeId],
    references: [employees.id],
  }),
  toEmployee: one(employees, {
    fields: [recognitions.toEmployeeId],
    references: [employees.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  redemptions: many(rewardRedemptions),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  reward: one(rewards, {
    fields: [rewardRedemptions.rewardId],
    references: [rewards.id],
  }),
  employee: one(employees, {
    fields: [rewardRedemptions.employeeId],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [rewardRedemptions.approvedById],
    references: [employees.id],
  }),
}));

export const totalRewardsStatementsRelations = relations(totalRewardsStatements, ({ one }) => ({
  employee: one(employees, {
    fields: [totalRewardsStatements.employeeId],
    references: [employees.id],
  }),
}));

export const compensationPlansRelations = relations(compensationPlans, ({ many }) => ({
  adjustments: many(compensationAdjustments),
}));

export const compensationAdjustmentsRelations = relations(compensationAdjustments, ({ one }) => ({
  plan: one(compensationPlans, {
    fields: [compensationAdjustments.planId],
    references: [compensationPlans.id],
  }),
  employee: one(employees, {
    fields: [compensationAdjustments.employeeId],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [compensationAdjustments.approvedById],
    references: [employees.id],
  }),
}));

export const talentReviewsRelations = relations(talentReviews, ({ many }) => ({
  participants: many(talentReviewParticipants),
}));

export const talentReviewParticipantsRelations = relations(talentReviewParticipants, ({ one }) => ({
  review: one(talentReviews, {
    fields: [talentReviewParticipants.talentReviewId],
    references: [talentReviews.id],
  }),
  employee: one(employees, {
    fields: [talentReviewParticipants.employeeId],
    references: [employees.id],
  }),
  reviewer: one(employees, {
    fields: [talentReviewParticipants.reviewerId],
    references: [employees.id],
  }),
}));

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one }) => ({
  employee: one(employees, {
    fields: [aiSuggestions.employeeId],
    references: [employees.id],
  }),
  department: one(departments, {
    fields: [aiSuggestions.departmentId],
    references: [departments.id],
  }),
}));

export const aiChurnPredictionsRelations = relations(aiChurnPredictions, ({ one }) => ({
  employee: one(employees, {
    fields: [aiChurnPredictions.employeeId],
    references: [employees.id],
  }),
}));

export const aiCompliancePredictionsRelations = relations(aiCompliancePredictions, ({ one }) => ({
  employee: one(employees, {
    fields: [aiCompliancePredictions.employeeId],
    references: [employees.id],
  }),
  department: one(departments, {
    fields: [aiCompliancePredictions.departmentId],
    references: [departments.id],
  }),
}));

export const aiSkillRecommendationsRelations = relations(aiSkillRecommendations, ({ one }) => ({
  employee: one(employees, {
    fields: [aiSkillRecommendations.employeeId],
    references: [employees.id],
  }),
}));

export const aiRetentionRiskFlagsRelations = relations(aiRetentionRiskFlags, ({ one }) => ({
  employee: one(employees, {
    fields: [aiRetentionRiskFlags.employeeId],
    references: [employees.id],
  }),
}));

export const shiftsRelations = relations(shifts, ({ many }) => ({
  assignments: many(shiftAssignments),
  attendanceRecords: many(attendanceRecords),
}));

export const shiftAssignmentsRelations = relations(shiftAssignments, ({ one }) => ({
  employee: one(employees, {
    fields: [shiftAssignments.employeeId],
    references: [employees.id],
  }),
  shift: one(shifts, {
    fields: [shiftAssignments.shiftId],
    references: [shifts.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one, many }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id],
  }),
  shift: one(shifts, {
    fields: [attendanceRecords.shiftId],
    references: [shifts.id],
  }),
  exceptions: many(attendanceExceptions),
}));

export const attendanceExceptionsRelations = relations(attendanceExceptions, ({ one }) => ({
  record: one(attendanceRecords, {
    fields: [attendanceExceptions.attendanceRecordId],
    references: [attendanceRecords.id],
  }),
  employee: one(employees, {
    fields: [attendanceExceptions.employeeId],
    references: [employees.id],
  }),
}));
