/**
 * HR document generation (DOC-001..004).
 *
 * Documents are produced as self-contained bilingual HTML. Browsers render
 * Arabic shaping + bidirectional text natively, so no font-embedding /
 * reshaping toolchain is required; the HTML can be viewed, printed, or
 * saved-as-PDF by the user. Every template merges real data (no placeholders)
 * and marks the Arabic version as the prevailing text (Art 8 practice).
 */

export interface CompanyInfo {
  nameEn: string;
  nameAr: string;
  crNumber?: string;
}

export interface EmployeeDocData {
  fullName: string;
  nationalId?: string | null;
  position?: string | null;
  department?: string | null;
  joinDate: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  nationality?: string | null;
}

export interface SettlementLineItems {
  eosbAmount: number;
  unpaidSalary: number;
  leaveEncashment: number;
  otherDues: number;
  deductions: number;
}

const ARABIC_PREVAILS_EN =
  "In the event of any discrepancy between the Arabic and English versions of this document, the Arabic version shall prevail.";
const ARABIC_PREVAILS_AR =
  "في حال وجود أي اختلاف بين النسختين العربية والإنجليزية من هذا المستند، تكون النسخة العربية هي المعتمدة.";

function sar(value: number): string {
  return `SAR ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function actualWage(e: EmployeeDocData): number {
  return e.basicSalary + e.housingAllowance + e.transportAllowance;
}

function shell(titleEn: string, bodyEn: string, titleAr: string, bodyAr: string): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${esc(titleEn)}</title>
<style>
  body { font-family: Arial, "Segoe UI", sans-serif; color:#1e293b; margin:0; padding:40px; }
  .doc { max-width:800px; margin:0 auto; }
  .en { direction:ltr; text-align:left; }
  .ar { direction:rtl; text-align:right; }
  h1 { font-size:20px; margin:0 0 16px; }
  hr { border:none; border-top:1px solid #cbd5e1; margin:28px 0; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  td { padding:6px 8px; border-bottom:1px solid #e2e8f0; }
  .label { color:#64748b; }
  .total td { font-weight:bold; border-top:2px solid #94a3b8; }
  .prevail { font-size:12px; color:#475569; margin-top:24px; }
</style></head>
<body><div class="doc">
  <section class="en"><h1>${esc(titleEn)}</h1>${bodyEn}</section>
  <hr>
  <section class="ar"><h1>${esc(titleAr)}</h1>${bodyAr}</section>
  <p class="prevail en">${esc(ARABIC_PREVAILS_EN)}</p>
  <p class="prevail ar">${esc(ARABIC_PREVAILS_AR)}</p>
</div></body></html>`;
}

export function generateSalaryCertificate(company: CompanyInfo, e: EmployeeDocData): string {
  const bodyEn = `
    <p>This is to certify that <strong>${esc(e.fullName)}</strong>${e.nationalId ? ` (ID ${esc(e.nationalId)})` : ""}
    is employed by <strong>${esc(company.nameEn)}</strong> as <strong>${esc(e.position ?? "Employee")}</strong>
    since ${esc(e.joinDate)}.</p>
    <table>
      <tr><td class="label">Basic salary</td><td>${sar(e.basicSalary)}</td></tr>
      <tr><td class="label">Housing allowance</td><td>${sar(e.housingAllowance)}</td></tr>
      <tr><td class="label">Transport allowance</td><td>${sar(e.transportAllowance)}</td></tr>
      <tr class="total"><td>Total monthly salary</td><td>${sar(actualWage(e))}</td></tr>
    </table>
    <p>This certificate is issued at the employee's request.</p>`;
  const bodyAr = `
    <p>نشهد بأن <strong>${esc(e.fullName)}</strong> يعمل لدى <strong>${esc(company.nameAr)}</strong>
    بوظيفة <strong>${esc(e.position ?? "موظف")}</strong> منذ ${esc(e.joinDate)}.</p>
    <table>
      <tr><td class="label">الراتب الأساسي</td><td>${sar(e.basicSalary)}</td></tr>
      <tr><td class="label">بدل السكن</td><td>${sar(e.housingAllowance)}</td></tr>
      <tr><td class="label">بدل النقل</td><td>${sar(e.transportAllowance)}</td></tr>
      <tr class="total"><td>إجمالي الراتب الشهري</td><td>${sar(actualWage(e))}</td></tr>
    </table>
    <p>صدرت هذه الشهادة بناءً على طلب الموظف.</p>`;
  return shell("Salary Certificate", bodyEn, "شهادة راتب", bodyAr);
}

export function generateExperienceLetter(company: CompanyInfo, e: EmployeeDocData, lastDay: string): string {
  const bodyEn = `
    <p>This is to certify that <strong>${esc(e.fullName)}</strong> was employed by
    <strong>${esc(company.nameEn)}</strong> as <strong>${esc(e.position ?? "Employee")}</strong>
    ${e.department ? `in the ${esc(e.department)} department ` : ""}from ${esc(e.joinDate)} to ${esc(lastDay)}.</p>
    <p>During this period the employee discharged their duties professionally. This letter is issued
    free of charge in accordance with Article 64 of the Saudi Labour Law.</p>`;
  const bodyAr = `
    <p>نشهد بأن <strong>${esc(e.fullName)}</strong> عمل لدى <strong>${esc(company.nameAr)}</strong>
    بوظيفة <strong>${esc(e.position ?? "موظف")}</strong> ${e.department ? `في إدارة ${esc(e.department)} ` : ""}
    خلال الفترة من ${esc(e.joinDate)} إلى ${esc(lastDay)}.</p>
    <p>وقد أدى الموظف مهامه باحترافية خلال هذه الفترة. صدرت هذه الشهادة مجاناً وفقاً للمادة 64 من نظام العمل السعودي.</p>`;
  return shell("Experience Letter", bodyEn, "شهادة خبرة", bodyAr);
}

export function generateFinalSettlementStatement(
  company: CompanyInfo,
  e: EmployeeDocData,
  items: SettlementLineItems,
  lastDay: string,
): { html: string; netPayable: number } {
  const netPayable =
    Math.round((items.eosbAmount + items.unpaidSalary + items.leaveEncashment + items.otherDues - items.deductions) * 100) /
    100;
  const rows = (labelEn: string, labelAr: string, amount: number, negative = false) =>
    ({ en: `<tr><td class="label">${labelEn}</td><td>${negative ? "−" : ""}${sar(Math.abs(amount))}</td></tr>`,
       ar: `<tr><td class="label">${labelAr}</td><td>${negative ? "−" : ""}${sar(Math.abs(amount))}</td></tr>` });

  const lines = [
    rows("End-of-service benefit", "مكافأة نهاية الخدمة", items.eosbAmount),
    rows("Unpaid salary", "الراتب المستحق", items.unpaidSalary),
    rows("Leave encashment", "بدل الإجازات", items.leaveEncashment),
    rows("Other dues", "مستحقات أخرى", items.otherDues),
    rows("Deductions", "الاستقطاعات", items.deductions, true),
  ];

  const bodyEn = `
    <p>Final settlement for <strong>${esc(e.fullName)}</strong> by <strong>${esc(company.nameEn)}</strong>, last working day ${esc(lastDay)}.</p>
    <table>${lines.map((l) => l.en).join("")}
      <tr class="total"><td>Net payable</td><td>${sar(netPayable)}</td></tr>
    </table>`;
  const bodyAr = `
    <p>المخالصة النهائية للموظف <strong>${esc(e.fullName)}</strong>، آخر يوم عمل ${esc(lastDay)}.</p>
    <table>${lines.map((l) => l.ar).join("")}
      <tr class="total"><td>صافي المستحق</td><td>${sar(netPayable)}</td></tr>
    </table>`;
  return { html: shell("Final Settlement Statement", bodyEn, "بيان المخالصة النهائية", bodyAr), netPayable };
}
