import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@hrms-app/auth";
import { adminDb } from "@hrms-app/db";
import { sql, type SQL } from "drizzle-orm";

export const DEFAULT_TENANT_ID = "11111111-1111-4111-8111-111111111111";

type SessionUser = Session["user"];

export interface DepartmentRow {
  id: string;
  name: string;
  nameAr: string | null;
  code: string;
  managerEmployeeId: string | null;
  managerName: string | null;
  locationCity: string;
  isActive: boolean;
  employeeCount: number;
}

export interface DesignationRow {
  id: string;
  title: string;
  titleAr: string | null;
  grade: string | null;
  departmentId: string | null;
  departmentName: string | null;
  minSalary: number;
  maxSalary: number;
  isManagerial: boolean;
  isActive: boolean;
}

export interface EmployeeRow {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  nationality: string;
  departmentId: string | null;
  departmentName: string | null;
  designationId: string | null;
  designationTitle: string | null;
  managerEmployeeId: string | null;
  managerName: string | null;
  locationName: string | null;
  employmentStatus: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  qiwaContractStatus: string;
  accessRole: string | null;
  accessEmails: string | null;
}

export interface LocationRow {
  id: string;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AttendanceRow {
  id: string;
  employeeId: string;
  fullName: string;
  workDate: string;
  punchInAt: string | null;
  punchOutAt: string | null;
  punchInLocation: string | null;
  punchOutLocation: string | null;
  totalMinutes: number;
  status: string;
}

export interface LeaveRow {
  id: string;
  employeeId: string;
  fullName: string;
  leaveType: string | null;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  managerComment: string | null;
}

export interface ExpenseRow {
  id: string;
  employeeId: string;
  fullName: string;
  expenseDate: string;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  managerComment: string | null;
}

export interface PayrollPeriodRow {
  id: string;
  periodMonth: string;
  status: string;
  grossPay: number;
  employeeGosi: number;
  employerGosi: number;
  netPay: number;
}

export interface PayrollItemRow {
  id: string;
  fullName: string;
  nationality: string;
  qiwaContractStatus: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  employeeGosi: number;
  employerGosi: number;
  eosbAccrual: number;
  grossPay: number;
  netPay: number;
  wpsStatus: string;
}

export interface ComplianceRow {
  id: string;
  employeeName: string | null;
  itemType: string;
  title: string;
  status: string;
  dueDate: string | null;
  referenceNumber: string | null;
  notes: string | null;
}

export interface LocationTrackingRow {
  employeeId: string;
  fullName: string;
  departmentName: string | null;
  designationTitle: string | null;
  assignedLocation: string | null;
  city: string | null;
  lastWorkDate: string | null;
  lastPunchInAt: string | null;
  lastPunchOutAt: string | null;
  lastLocationName: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
}

export interface ReportRow {
  id: string;
  reportType: "daily" | "weekly" | "monthly";
  periodStart: string;
  periodEnd: string;
  headcount: number;
  presentCount: number;
  leavePendingCount: number;
  expensePendingAmount: number;
  payrollNetAmount: number;
  complianceAttentionCount: number;
  summary: string | null;
}

function isTransientDbConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /connection closed|connection terminated|econnreset|socket hang up|timeout/i.test(message);
}

async function rows<T>(query: SQL, attempt = 1): Promise<T[]> {
  try {
    return (await adminDb.execute(query)) as unknown as T[];
  } catch (error) {
    if (attempt < 3 && isTransientDbConnectionError(error)) {
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
      return rows<T>(query, attempt + 1);
    }
    throw error;
  }
}

function toNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function toCoordinate(value: FormDataEntryValue | null, min: number, max: number): number | null {
  const n = Number(value ?? Number.NaN);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function toText(value: FormDataEntryValue | null, fallback = ""): string {
  return String(value ?? fallback).trim();
}

function toNullableText(value: FormDataEntryValue | null): string | null {
  const text = toText(value);
  return text.length > 0 ? text : null;
}

function toNullableUuid(value: FormDataEntryValue | null): string | null {
  const text = toText(value);
  return text.length > 0 ? text : null;
}

function toBool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export function tenantIdFor(user: SessionUser): string {
  return user.tenantId || DEFAULT_TENANT_ID;
}

function requireHr(user: SessionUser): void {
  const allowed = new Set(["super_admin", "hr_manager", "hr_specialist", "payroll_admin", "department_manager"]);
  if (!allowed.has(user.role ?? "")) {
    throw new Error("Only HR and manager roles can change company HR records.");
  }
}

function requirePeopleAdmin(user: SessionUser): void {
  const allowed = new Set(["super_admin", "hr_manager", "hr_specialist"]);
  if (!allowed.has(user.role ?? "")) {
    throw new Error("Only Admin and HR can change employee records.");
  }
}

function requireAdmin(user: SessionUser): void {
  if (user.role !== "super_admin") {
    throw new Error("Only Admin can promote employees or change login roles.");
  }
}

export async function getDashboardData(tenantId: string) {
  const [metrics] = await rows<{
    employees: number;
    departments: number;
    pendingLeave: number;
    pendingExpenses: number;
    payrollNet: number;
    complianceAttention: number;
  }>(sql`
    select
      (select count(*)::int from public.hr_employees where tenant_id = ${tenantId} and employment_status = 'active') as employees,
      (select count(*)::int from public.hr_departments where tenant_id = ${tenantId} and is_active = true) as departments,
      (select count(*)::int from public.hr_leave_requests where tenant_id = ${tenantId} and status = 'pending') as "pendingLeave",
      (select count(*)::int from public.hr_expenses where tenant_id = ${tenantId} and status = 'pending') as "pendingExpenses",
      coalesce((select net_pay from public.hr_payroll_periods where tenant_id = ${tenantId} order by period_month desc limit 1), 0)::float as "payrollNet",
      (select count(*)::int from public.hr_compliance_items where tenant_id = ${tenantId} and status in ('attention','overdue','pending')) as "complianceAttention"
  `);
  const reports = await getReports(tenantId);
  const employees = await getEmployees(tenantId);
  return { metrics, reports, employees: employees.slice(0, 5) };
}

export async function getDepartments(tenantId: string): Promise<DepartmentRow[]> {
  return rows<DepartmentRow>(sql`
    select d.id, d.name, d.name_ar as "nameAr", d.code, d.manager_employee_id as "managerEmployeeId",
      m.full_name as "managerName", d.location_city as "locationCity", d.is_active as "isActive",
      count(e.id)::int as "employeeCount"
    from public.hr_departments d
    left join public.hr_employees m on m.id = d.manager_employee_id
    left join public.hr_employees e on e.department_id = d.id and e.employment_status = 'active'
    where d.tenant_id = ${tenantId}
    group by d.id, m.full_name
    order by d.name
  `);
}

export async function getDesignations(tenantId: string): Promise<DesignationRow[]> {
  return rows<DesignationRow>(sql`
    select g.id, g.title, g.title_ar as "titleAr", g.grade, g.department_id as "departmentId",
      d.name as "departmentName", g.min_salary::float as "minSalary", g.max_salary::float as "maxSalary",
      g.is_managerial as "isManagerial", g.is_active as "isActive"
    from public.hr_designations g
    left join public.hr_departments d on d.id = g.department_id
    where g.tenant_id = ${tenantId}
    order by g.title
  `);
}

export async function getEmployees(tenantId: string): Promise<EmployeeRow[]> {
  return rows<EmployeeRow>(sql`
    select e.id, e.employee_code as "employeeCode", e.full_name as "fullName", e.email, e.phone, e.nationality,
      e.department_id as "departmentId", d.name as "departmentName", e.designation_id as "designationId",
      g.title as "designationTitle", e.manager_employee_id as "managerEmployeeId", m.full_name as "managerName",
      l.name as "locationName", e.employment_status as "employmentStatus", e.base_salary::float as "baseSalary",
      e.housing_allowance::float as "housingAllowance", e.transport_allowance::float as "transportAllowance",
      e.qiwa_contract_status as "qiwaContractStatus",
      access.access_role as "accessRole",
      access.access_emails as "accessEmails"
    from public.hr_employees e
    left join public.hr_departments d on d.id = e.department_id
    left join public.hr_designations g on g.id = e.designation_id
    left join public.hr_employees m on m.id = e.manager_employee_id
    left join public.hr_locations l on l.id = e.work_location_id
    left join lateral (
      select
        (array_agg(u.role order by case u.role
          when 'super_admin' then 1
          when 'hr_manager' then 2
          when 'hr_specialist' then 3
          when 'payroll_admin' then 4
          when 'department_manager' then 5
          when 'employee' then 6
          else 99
        end, u.email))[1] as access_role,
        string_agg(u.email, ', ' order by u.email) as access_emails
      from public.users u
      where u.tenant_id = e.tenant_id and u.employee_id = e.id
    ) access on true
    where e.tenant_id = ${tenantId}
    order by e.employee_code
  `);
}

export async function getLocations(tenantId: string): Promise<LocationRow[]> {
  return rows<LocationRow>(sql`
    select id, name, city, latitude::float as latitude, longitude::float as longitude
    from public.hr_locations
    where tenant_id = ${tenantId} and is_active = true
    order by city, name
  `);
}

export async function getAttendance(tenantId: string, employeeId?: string | null): Promise<AttendanceRow[]> {
  return rows<AttendanceRow>(sql`
    select a.id, a.employee_id as "employeeId", e.full_name as "fullName", a.work_date::text as "workDate",
      a.punch_in_at::text as "punchInAt", a.punch_out_at::text as "punchOutAt",
      a.punch_in_location as "punchInLocation", a.punch_out_location as "punchOutLocation",
      a.total_minutes as "totalMinutes", a.status
    from public.hr_attendance a
    join public.hr_employees e on e.id = a.employee_id
    where a.tenant_id = ${tenantId} and (${employeeId ?? null}::uuid is null or a.employee_id = ${employeeId ?? null}::uuid)
    order by a.work_date desc, e.full_name
    limit 60
  `);
}

export async function getLeaveRequests(tenantId: string, employeeId?: string | null): Promise<LeaveRow[]> {
  return rows<LeaveRow>(sql`
    select r.id, r.employee_id as "employeeId", e.full_name as "fullName", t.name as "leaveType",
      r.start_date::text as "startDate", r.end_date::text as "endDate", r.days::float as days,
      r.reason, r.status, r.manager_comment as "managerComment"
    from public.hr_leave_requests r
    join public.hr_employees e on e.id = r.employee_id
    left join public.hr_leave_types t on t.id = r.leave_type_id
    where r.tenant_id = ${tenantId} and (${employeeId ?? null}::uuid is null or r.employee_id = ${employeeId ?? null}::uuid)
    order by r.created_at desc
  `);
}

export async function getLeaveTypes(tenantId: string) {
  return rows<{ id: string; name: string; annualEntitlementDays: number }>(sql`
    select id, name, annual_entitlement_days::float as "annualEntitlementDays"
    from public.hr_leave_types
    where tenant_id = ${tenantId}
    order by name
  `);
}

export async function getExpenses(tenantId: string, employeeId?: string | null): Promise<ExpenseRow[]> {
  return rows<ExpenseRow>(sql`
    select x.id, x.employee_id as "employeeId", e.full_name as "fullName", x.expense_date::text as "expenseDate",
      x.category, x.amount::float as amount, x.currency, x.description, x.status, x.manager_comment as "managerComment"
    from public.hr_expenses x
    join public.hr_employees e on e.id = x.employee_id
    where x.tenant_id = ${tenantId} and (${employeeId ?? null}::uuid is null or x.employee_id = ${employeeId ?? null}::uuid)
    order by x.created_at desc
  `);
}

export async function getPayroll(tenantId: string) {
  const periods = await rows<PayrollPeriodRow>(sql`
    select id, period_month::text as "periodMonth", status, gross_pay::float as "grossPay",
      employee_gosi::float as "employeeGosi", employer_gosi::float as "employerGosi", net_pay::float as "netPay"
    from public.hr_payroll_periods
    where tenant_id = ${tenantId}
    order by period_month desc
  `);
  const periodId = periods[0]?.id ?? null;
  const items = periodId
    ? await rows<PayrollItemRow>(sql`
      select i.id, e.full_name as "fullName", e.nationality, e.qiwa_contract_status as "qiwaContractStatus",
        i.basic_salary::float as "basicSalary",
        i.housing_allowance::float as "housingAllowance", i.transport_allowance::float as "transportAllowance",
        i.employee_gosi::float as "employeeGosi", i.employer_gosi::float as "employerGosi",
        i.eosb_accrual::float as "eosbAccrual", i.gross_pay::float as "grossPay",
        i.net_pay::float as "netPay", i.wps_status as "wpsStatus"
      from public.hr_payroll_items i
      join public.hr_employees e on e.id = i.employee_id
      where i.tenant_id = ${tenantId} and i.payroll_period_id = ${periodId}
      order by e.full_name
    `)
    : [];
  return { periods, items };
}

export async function getLocationTracking(tenantId: string): Promise<LocationTrackingRow[]> {
  return rows<LocationTrackingRow>(sql`
    select e.id as "employeeId", e.full_name as "fullName", d.name as "departmentName",
      g.title as "designationTitle", l.name as "assignedLocation", l.city,
      latest.work_date::text as "lastWorkDate", latest.punch_in_at::text as "lastPunchInAt",
      latest.punch_out_at::text as "lastPunchOutAt",
      coalesce(latest.punch_out_location, latest.punch_in_location, l.name) as "lastLocationName",
      coalesce(latest.punch_out_latitude, latest.punch_in_latitude, l.latitude)::float as latitude,
      coalesce(latest.punch_out_longitude, latest.punch_in_longitude, l.longitude)::float as longitude,
      latest.status
    from public.hr_employees e
    left join public.hr_departments d on d.id = e.department_id
    left join public.hr_designations g on g.id = e.designation_id
    left join public.hr_locations l on l.id = e.work_location_id
    left join lateral (
      select a.work_date, a.punch_in_at, a.punch_out_at, a.punch_in_location, a.punch_out_location,
        a.punch_in_latitude, a.punch_in_longitude, a.punch_out_latitude, a.punch_out_longitude, a.status
      from public.hr_attendance a
      where a.tenant_id = e.tenant_id and a.employee_id = e.id
      order by a.work_date desc, a.updated_at desc
      limit 1
    ) latest on true
    where e.tenant_id = ${tenantId} and e.employment_status = 'active'
    order by d.name nulls last, e.full_name
  `);
}

export async function getCompliance(tenantId: string): Promise<ComplianceRow[]> {
  return rows<ComplianceRow>(sql`
    select c.id, e.full_name as "employeeName", c.item_type as "itemType", c.title, c.status,
      c.due_date::text as "dueDate", c.reference_number as "referenceNumber", c.notes
    from public.hr_compliance_items c
    left join public.hr_employees e on e.id = c.employee_id
    where c.tenant_id = ${tenantId}
    order by c.due_date nulls last, c.title
  `);
}

export async function getReports(tenantId: string): Promise<ReportRow[]> {
  return rows<ReportRow>(sql`
    select id, report_type as "reportType", period_start::text as "periodStart", period_end::text as "periodEnd",
      headcount, present_count as "presentCount", leave_pending_count as "leavePendingCount",
      expense_pending_amount::float as "expensePendingAmount", payroll_net_amount::float as "payrollNetAmount",
      compliance_attention_count as "complianceAttentionCount", summary
    from public.hr_report_snapshots
    where tenant_id = ${tenantId}
    order by case report_type when 'daily' then 1 when 'weekly' then 2 else 3 end
  `);
}

export async function createEmployee(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    insert into public.hr_employees (
      tenant_id, employee_code, full_name, email, phone, nationality, department_id, designation_id,
      manager_employee_id, hire_date, employment_status, base_salary, housing_allowance, transport_allowance,
      qiwa_contract_status
    ) values (
      ${tenantId}, ${toText(formData.get("employeeCode"))}, ${toText(formData.get("fullName"))},
      ${toText(formData.get("email"))}, ${toNullableText(formData.get("phone"))}, ${toText(formData.get("nationality"), "Saudi")},
      ${toNullableUuid(formData.get("departmentId"))}::uuid, ${toNullableUuid(formData.get("designationId"))}::uuid,
      ${toNullableUuid(formData.get("managerEmployeeId"))}::uuid, ${toText(formData.get("hireDate"), new Date().toISOString().slice(0, 10))}::date,
      ${toText(formData.get("employmentStatus"), "active")}, ${toNumber(formData.get("baseSalary"))},
      ${toNumber(formData.get("housingAllowance"))}, ${toNumber(formData.get("transportAllowance"))},
      ${toText(formData.get("qiwaContractStatus"), "pending")}
    )
  `);
  revalidatePath("/employees");
  revalidatePath("/");
}

export async function updateEmployee(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    update public.hr_employees
    set full_name = ${toText(formData.get("fullName"))}, email = ${toText(formData.get("email"))},
      phone = ${toNullableText(formData.get("phone"))}, department_id = ${toNullableUuid(formData.get("departmentId"))}::uuid,
      designation_id = ${toNullableUuid(formData.get("designationId"))}::uuid,
      manager_employee_id = ${toNullableUuid(formData.get("managerEmployeeId"))}::uuid,
      employment_status = ${toText(formData.get("employmentStatus"), "active")},
      base_salary = ${toNumber(formData.get("baseSalary"))},
      housing_allowance = ${toNumber(formData.get("housingAllowance"))},
      transport_allowance = ${toNumber(formData.get("transportAllowance"))},
      qiwa_contract_status = ${toText(formData.get("qiwaContractStatus"), "pending")},
      updated_at = now()
    where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid
  `);
  revalidatePath("/employees");
  revalidatePath("/payroll");
  revalidatePath("/");
}

export async function deleteEmployee(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  const id = toText(formData.get("id"));
  await adminDb.execute(sql`update public.users set employee_id = null where employee_id = ${id}::uuid`);
  await adminDb.execute(sql`delete from public.hr_employees where tenant_id = ${tenantId} and id = ${id}::uuid`);
  revalidatePath("/employees");
  revalidatePath("/");
}

export async function updateEmployeeAccessRole(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requireAdmin(user);
  const tenantId = tenantIdFor(user);
  const employeeId = toText(formData.get("employeeId"));
  const nextRole = toText(formData.get("role"), "employee");
  const allowedRoles = new Set([
    "super_admin",
    "hr_manager",
    "hr_specialist",
    "payroll_admin",
    "department_manager",
    "employee",
  ]);
  if (!allowedRoles.has(nextRole)) throw new Error("Unsupported employee login role.");

  const [employee] = await rows<{
    id: string;
    email: string;
    fullName: string;
  }>(sql`
    select id, email, full_name as "fullName"
    from public.hr_employees
    where tenant_id = ${tenantId} and id = ${employeeId}::uuid
    limit 1
  `);
  if (!employee) throw new Error("Employee not found.");

  await adminDb.execute(sql`
    update public.users
    set role = ${nextRole}, updated_at = now()
    where tenant_id = ${tenantId}
      and employee_id = ${employeeId}::uuid
      and (${nextRole} = 'super_admin' or role <> 'super_admin')
  `);

  await adminDb.execute(sql`
    insert into public.users (
      tenant_id, email, password_hash, name, role, employee_id, preferred_language,
      email_verified, created_at, updated_at
    )
    select ${tenantId}::uuid, ${employee.email}, source.password_hash, ${employee.fullName}, ${nextRole},
      ${employee.id}::uuid, 'en', now(), now(), now()
    from (
      select password_hash
      from public.users
      where tenant_id = ${tenantId} and password_hash is not null
      order by case when email = 'admin@rukn-energy.example' then 0 else 1 end, created_at
      limit 1
    ) source
    where not exists (
      select 1 from public.users
      where tenant_id = ${tenantId} and employee_id = ${employee.id}::uuid
    )
    on conflict (email) do update set
      role = excluded.role,
      employee_id = excluded.employee_id,
      name = excluded.name,
      updated_at = now()
  `);

  revalidatePath("/employees");
  revalidatePath("/");
}

export async function createDepartment(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    insert into public.hr_departments (tenant_id, name, name_ar, code, manager_employee_id, cost_center, location_city)
    values (${tenantId}, ${toText(formData.get("name"))}, ${toNullableText(formData.get("nameAr"))},
      ${toText(formData.get("code")).toUpperCase()}, ${toNullableUuid(formData.get("managerEmployeeId"))}::uuid,
      ${toNullableText(formData.get("costCenter"))}, ${toText(formData.get("locationCity"), "Riyadh")})
  `);
  revalidatePath("/departments");
}

export async function updateDepartment(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    update public.hr_departments
    set name = ${toText(formData.get("name"))}, name_ar = ${toNullableText(formData.get("nameAr"))},
      code = ${toText(formData.get("code")).toUpperCase()}, manager_employee_id = ${toNullableUuid(formData.get("managerEmployeeId"))}::uuid,
      cost_center = ${toNullableText(formData.get("costCenter"))}, location_city = ${toText(formData.get("locationCity"), "Riyadh")},
      is_active = ${toBool(formData.get("isActive"))}, updated_at = now()
    where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid
  `);
  revalidatePath("/departments");
}

export async function deleteDepartment(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`delete from public.hr_departments where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid`);
  revalidatePath("/departments");
}

export async function createDesignation(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    insert into public.hr_designations (tenant_id, department_id, title, title_ar, grade, min_salary, max_salary, is_managerial)
    values (${tenantId}, ${toNullableUuid(formData.get("departmentId"))}::uuid, ${toText(formData.get("title"))},
      ${toNullableText(formData.get("titleAr"))}, ${toNullableText(formData.get("grade"))},
      ${toNumber(formData.get("minSalary"))}, ${toNumber(formData.get("maxSalary"))}, ${toBool(formData.get("isManagerial"))})
  `);
  revalidatePath("/designations");
}

export async function updateDesignation(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    update public.hr_designations
    set department_id = ${toNullableUuid(formData.get("departmentId"))}::uuid, title = ${toText(formData.get("title"))},
      title_ar = ${toNullableText(formData.get("titleAr"))}, grade = ${toNullableText(formData.get("grade"))},
      min_salary = ${toNumber(formData.get("minSalary"))}, max_salary = ${toNumber(formData.get("maxSalary"))},
      is_managerial = ${toBool(formData.get("isManagerial"))}, is_active = ${toBool(formData.get("isActive"))},
      updated_at = now()
    where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid
  `);
  revalidatePath("/designations");
}

export async function deleteDesignation(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requirePeopleAdmin(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`delete from public.hr_designations where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid`);
  revalidatePath("/designations");
}

export async function punchAttendance(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const canPunchForOthers = ["super_admin", "hr_manager", "hr_specialist", "department_manager"].includes(user.role ?? "");
  const employeeId = canPunchForOthers
    ? toText(formData.get("employeeId"), user.employeeId ?? "")
    : user.employeeId ?? "";
  if (!employeeId) throw new Error("No employee profile is linked to this login.");
  const mode = toText(formData.get("mode"), "in");
  if (mode !== "in" && mode !== "out") throw new Error("Unsupported attendance punch mode.");
  const lat = toCoordinate(formData.get("latitude"), -90, 90);
  const lng = toCoordinate(formData.get("longitude"), -180, 180);
  const accuracy = toNumber(formData.get("accuracy"), Number.NaN);
  const location = toNullableText(formData.get("locationName")) ?? "Unspecified location";
  const accuracyNote = Number.isFinite(accuracy) && accuracy >= 0 ? `GPS accuracy ${Math.round(accuracy)}m` : null;

  const [employee] = await rows<{ id: string }>(sql`
    select id
    from public.hr_employees
    where tenant_id = ${tenantId}
      and id = ${employeeId}::uuid
      and employment_status <> 'terminated'
    limit 1
  `);
  if (!employee) throw new Error("Employee is not active or does not belong to this company.");

  if (mode === "out") {
    await adminDb.execute(sql`
      insert into public.hr_attendance (
        tenant_id, employee_id, work_date, punch_out_at, punch_out_latitude,
        punch_out_longitude, punch_out_location, status, notes
      )
      values (${tenantId}, ${employeeId}::uuid, current_date, now(), ${lat}, ${lng}, ${location}, 'manual_review', ${accuracyNote})
      on conflict (tenant_id, employee_id, work_date) do update
      set punch_out_at = now(), punch_out_latitude = excluded.punch_out_latitude, punch_out_longitude = excluded.punch_out_longitude,
        punch_out_location = excluded.punch_out_location,
        total_minutes = case
          when public.hr_attendance.punch_in_at is null then 0
          else greatest(0, extract(epoch from (now() - public.hr_attendance.punch_in_at)) / 60)::int
        end,
        status = case when public.hr_attendance.punch_in_at is null then 'manual_review' else 'present' end,
        notes = coalesce(excluded.notes, public.hr_attendance.notes),
        updated_at = now()
    `);
  } else {
    await adminDb.execute(sql`
      insert into public.hr_attendance (
        tenant_id, employee_id, work_date, punch_in_at, punch_in_latitude,
        punch_in_longitude, punch_in_location, status, notes
      )
      values (${tenantId}, ${employeeId}::uuid, current_date, now(), ${lat}, ${lng}, ${location}, 'present', ${accuracyNote})
      on conflict (tenant_id, employee_id, work_date) do update
      set punch_in_at = coalesce(public.hr_attendance.punch_in_at, excluded.punch_in_at),
        punch_in_latitude = coalesce(public.hr_attendance.punch_in_latitude, excluded.punch_in_latitude),
        punch_in_longitude = coalesce(public.hr_attendance.punch_in_longitude, excluded.punch_in_longitude),
        punch_in_location = coalesce(public.hr_attendance.punch_in_location, excluded.punch_in_location),
        total_minutes = case
          when public.hr_attendance.punch_out_at is null then public.hr_attendance.total_minutes
          else greatest(0, extract(epoch from (
            public.hr_attendance.punch_out_at - coalesce(public.hr_attendance.punch_in_at, excluded.punch_in_at)
          )) / 60)::int
        end,
        status = case
          when public.hr_attendance.punch_out_at is not null
            and public.hr_attendance.punch_out_at < coalesce(public.hr_attendance.punch_in_at, excluded.punch_in_at)
          then 'manual_review'
          else 'present'
        end,
        notes = coalesce(public.hr_attendance.notes, excluded.notes),
        updated_at = now()
    `);
  }
  revalidatePath("/attendance/me");
  revalidatePath("/attendance/portal");
  revalidatePath("/attendance/reports");
  revalidatePath("/");
}

export async function createLeaveRequest(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const employeeId = toText(formData.get("employeeId"), user.employeeId ?? "");
  await adminDb.execute(sql`
    insert into public.hr_leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, days, reason)
    values (${tenantId}, ${employeeId}::uuid, ${toNullableUuid(formData.get("leaveTypeId"))}::uuid,
      ${toText(formData.get("startDate"))}::date, ${toText(formData.get("endDate"))}::date,
      ${toNumber(formData.get("days"), 1)}, ${toNullableText(formData.get("reason"))})
  `);
  revalidatePath("/leave");
  revalidatePath("/");
}

export async function decideLeave(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requireHr(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    update public.hr_leave_requests
    set status = ${toText(formData.get("status"))}, approved_by_employee_id = ${user.employeeId || null}::uuid,
      approved_at = now(), manager_comment = ${toNullableText(formData.get("managerComment"))}, updated_at = now()
    where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid
  `);
  revalidatePath("/leave");
}

export async function createExpense(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  const tenantId = tenantIdFor(user);
  const employeeId = toText(formData.get("employeeId"), user.employeeId ?? "");
  await adminDb.execute(sql`
    insert into public.hr_expenses (tenant_id, employee_id, expense_date, category, amount, description)
    values (${tenantId}, ${employeeId}::uuid, ${toText(formData.get("expenseDate"))}::date,
      ${toText(formData.get("category"), "other")}, ${toNumber(formData.get("amount"))}, ${toNullableText(formData.get("description"))})
  `);
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function decideExpense(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requireHr(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    update public.hr_expenses
    set status = ${toText(formData.get("status"))}, approved_by_employee_id = ${user.employeeId || null}::uuid,
      approved_at = now(), manager_comment = ${toNullableText(formData.get("managerComment"))}, updated_at = now()
    where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid
  `);
  revalidatePath("/expenses");
}

export async function updatePayrollStatus(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requireHr(user);
  const tenantId = tenantIdFor(user);
  const status = toText(formData.get("status"), "review");
  const periodId = toText(formData.get("id"));
  await adminDb.execute(sql`
    update public.hr_payroll_periods
    set status = ${status}, approved_by_employee_id = ${user.employeeId || null}::uuid,
      approved_at = case when ${status} in ('approved','wps_exported','paid','locked') then now() else approved_at end,
      updated_at = now()
    where tenant_id = ${tenantId} and id = ${periodId}::uuid
  `);
  if (status === "wps_exported" || status === "paid") {
    await adminDb.execute(sql`
      update public.hr_payroll_items
      set wps_status = ${status === "paid" ? "paid" : "exported"}
      where tenant_id = ${tenantId} and payroll_period_id = ${periodId}::uuid
    `);
  }
  revalidatePath("/payroll");
}

export async function updateComplianceStatus(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  requireHr(user);
  const tenantId = tenantIdFor(user);
  await adminDb.execute(sql`
    update public.hr_compliance_items
    set status = ${toText(formData.get("status"))}, notes = ${toNullableText(formData.get("notes"))}, updated_at = now()
    where tenant_id = ${tenantId} and id = ${toText(formData.get("id"))}::uuid
  `);
  revalidatePath("/compliance");
}
