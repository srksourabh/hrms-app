import { createTRPCRouter } from "./server";
import { authRouter } from "./routers/auth";
import { employeeRouter } from "./routers/employee";
import { departmentRouter } from "./routers/department";
import { userRouter } from "./routers/user";
import { leaveRouter } from "./routers/leave";
import { payrollRouter } from "./routers/payroll";
import { documentRouter } from "./routers/document";
import { notificationRouter } from "./routers/notification";
import { settlementRouter } from "./routers/settlement";
import { recruitmentRouter } from "./routers/recruitment";
import { retentionRouter } from "./routers/retention";
import { complianceRouter } from "./routers/compliance";
import { qiwaRouter } from "./routers/qiwa";
import { expenseRouter } from "./routers/expense";
import { policyRouter } from "./routers/policy";
import { aiRouter } from "./routers/ai";
import { inviteRouter } from "./routers/invite";
import { attendanceRouter } from "./routers/attendance";
import { guideMapRouter } from "./routers/guideMap";
import { auditRouter } from "./routers/audit";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  employee: employeeRouter,
  department: departmentRouter,
  leave: leaveRouter,
  payroll: payrollRouter,
  document: documentRouter,
  notification: notificationRouter,
  settlement: settlementRouter,
  recruitment: recruitmentRouter,
  compliance: complianceRouter,
  retention: retentionRouter,
  qiwa: qiwaRouter,
  expense: expenseRouter,
  policy: policyRouter,
  ai: aiRouter,
  invite: inviteRouter,
  attendance: attendanceRouter,
  guideMap: guideMapRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;