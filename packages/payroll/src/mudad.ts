/**
 * Mudad / WPS Wage File Generation
 *
 * ⚠️  INTERNAL DEMO / MOCK — NOT AN OFFICIAL MUDAD OR BANK FILE ⚠️
 *
 * This module generates a structured internal wage file that is CONCEPTUALLY
 * aligned with the WPS (Wage Protection System) file format. It is NOT a
 * validated WPS file and MUST NOT be submitted to any bank or government
 * authority as if it were official.
 *
 * Until live Mudad API credentials and the current official WPS file specification
 * are obtained, this module exists solely to demonstrate the data shape that
 * would be submitted. All Iqama/bank fields are left empty or synthesised.
 *
 * Requirements for production use:
 * 1. Obtain official WPS/Mudad file specification from SAMA or the relevant bank
 * 2. Register for Mudad API access with approved credentials
 * 3. Validate this output against the official schema
 * 4. Add bank signature / encryption as required
 * 5. Implement individual employee retry logic
 * 6. Store Mudad acknowledgement / rejection per employee
 * 7. Implement 30-day SLA tracking
 *
 * References:
 * - SAMA Wage Protection System (WPS) specification
 * - Mudad API technical documentation
 * - Saudi banks' WPS file requirements
 */

import type { EmployeeContext, PayslipCalculation } from "./types";

export interface MudadEmployeeRecord {
  employeeId:   string;
  fullName:     string;
  /** ⚠️ Iqama/resident ID — left null until verified against live records */
  iqamaNumber:  string | null;
  /** ⚠️ Bank account — left null; requires live IBAN data */
  bankAccount:  string | null;
  basic:        number;
  housing:      number;
  transport:    number;
  overtime:     number;
  grossWage:    number;
  gosiEmployee: number;
  gosiEmployer: number;
  netPay:       number;
}

export interface MudadWageFile {
  /** Marker: this file is DEMO/MOCK and not an official submission */
  _compliance:  "INTERNAL_DEMO_ONLY — NOT FOR OFFICIAL SUBMISSION";
  format:       "mudad-wps-demo";
  period:       string;
  generatedAt:  string;
  /** ⚠️ Official WPS files require a unique batch reference per submission */
  batchReference: string | null;
  totalEmployees: number;
  totalWages:    number;
  /** ⚠️ Total must reconcile to the sum of individual netPay amounts */
  totalNetPay:   number;
  employees:     MudadEmployeeRecord[];
  /** ⚠️ Official WPS XML requires a <processedResult> block per employee */
  _note:        "Iqama, bankAccount, and processedResult fields require live data";
}

export interface MudadGenerationInput {
  periodMonth:  string;  // e.g. "2026-07"
  payslips:    PayslipCalculation[];
  employees:   EmployeeContext[];
  /** Official WPS requires a unique sequential reference per wage file */
  batchReference?: string;
}

export function generateMudadFile(input: MudadGenerationInput): MudadWageFile {
  const employeeMap = new Map(input.employees.map((e) => [e.id, e]));

  const records: MudadEmployeeRecord[] = input.payslips.map((payslip) => {
    const emp = employeeMap.get(payslip.employeeId);
    return {
      employeeId:  payslip.employeeId,
      fullName:    emp?.fullName ?? "Unknown",
      /** ⚠️ Iqama must be validated against Muqeem before inclusion.
       *  Encrypted IDs are stored under `bank_iban_enc` / `iqama_number_enc`;
       *  decoding them is out of scope for the demo, so we always emit null. */
      iqamaNumber: null,
      /** ⚠️ IBAN must come from verified employee bank record */
      bankAccount: null,
      basic:       payslip.basic,
      housing:     payslip.housing,
      transport:   payslip.transport,
      overtime:   payslip.overtime,
      grossWage:  payslip.basic + payslip.housing + payslip.transport + payslip.overtime,
      gosiEmployee: payslip.gosiEmployee,
      gosiEmployer: payslip.gosiEmployer,
      netPay:     payslip.netPay,
    };
  });

  const totalWages  = round(records.reduce((sum, r) => sum + r.grossWage, 0));
  const totalNetPay = round(records.reduce((sum, r) => sum + r.netPay, 0));

  return {
    _compliance:  "INTERNAL_DEMO_ONLY — NOT FOR OFFICIAL SUBMISSION",
    format:       "mudad-wps-demo",
    period:       input.periodMonth,
    generatedAt:  new Date().toISOString(),
    batchReference: input.batchReference ?? null,
    totalEmployees: records.length,
    totalWages,
    totalNetPay,
    employees: records,
    _note: "Iqama, bankAccount, and processedResult fields require live data",
  };
}

export function mudadToXml(file: MudadWageFile): string {
  const rows = file.employees
    .map((e) => `  <employee>
    <employeeId>${escapeXml(e.employeeId)}</employeeId>
    <fullName>${escapeXml(e.fullName)}</fullName>
    <!-- ⚠️ Iqama and bankAccount omitted until live data verified -->
    <basic>${e.basic.toFixed(2)}</basic>
    <housing>${e.housing.toFixed(2)}</housing>
    <transport>${e.transport.toFixed(2)}</transport>
    <overtime>${e.overtime.toFixed(2)}</overtime>
    <grossWage>${e.grossWage.toFixed(2)}</grossWage>
    <gosiEmployee>${e.gosiEmployee.toFixed(2)}</gosiEmployee>
    <gosiEmployer>${e.gosiEmployer.toFixed(2)}</gosiEmployer>
    <netPay>${e.netPay.toFixed(2)}</netPay>
    <!-- ⚠️ processedResult block required in official WPS file — not yet implemented -->
  </employee>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- INTERNAL DEMO FILE — NOT FOR OFFICIAL SUBMISSION -->
<!-- _compliance: ${file._compliance} -->
<!-- _note: ${file._note} -->
<wageFile format="${file.format}">
  <period>${escapeXml(file.period)}</period>
  <generatedAt>${file.generatedAt}</generatedAt>
  <batchReference>${file.batchReference ?? "DEMO-REF"}</batchReference>
  <totalEmployees>${file.totalEmployees}</totalEmployees>
  <totalWages>${file.totalWages.toFixed(2)}</totalWages>
  <totalNetPay>${file.totalNetPay.toFixed(2)}</totalNetPay>
  <employees>
${rows}
  </employees>
  <!-- ⚠️ Official WPS file requires <processedResult> per employee and bank signature block -->
</wageFile>`;
}

export function mudadToCsv(file: MudadWageFile): string {
  const header = [
    "employeeId",
    "fullName",
    "iqamaNumber /* ⚠️ live data required */",
    "bankAccount /* ⚠️ live data required */",
    "basic", "housing", "transport", "overtime",
    "grossWage", "gosiEmployee", "gosiEmployer", "netPay",
    "processedResult /* ⚠️ official WPS requires this */",
  ].join(",");

  const rows = file.employees.map((e) =>
    [
      e.employeeId,
      `"${e.fullName}"`,
      e.iqamaNumber ?? "/* LIVE DATA REQUIRED */",
      e.bankAccount ?? "/* LIVE DATA REQUIRED */",
      e.basic.toFixed(2),
      e.housing.toFixed(2),
      e.transport.toFixed(2),
      e.overtime.toFixed(2),
      e.grossWage.toFixed(2),
      e.gosiEmployee.toFixed(2),
      e.gosiEmployer.toFixed(2),
      e.netPay.toFixed(2),
      "/* PENDING BANK ACKNOWLEDGEMENT */",
    ].join(",")
  );

  return [
    `# INTERNAL DEMO FILE — NOT FOR OFFICIAL SUBMISSION`,
    `# _compliance: ${file._compliance}`,
    `# ${file._note}`,
    header,
    ...rows,
  ].join("\n");
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
