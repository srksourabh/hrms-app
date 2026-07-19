import { describe, it, expect } from "vitest";
import { generateMudadFile, mudadToXml, mudadToCsv } from "../mudad";
import type { EmployeeContext, PayslipCalculation } from "../types";

const emp: EmployeeContext = {
  id: "emp-1",
  fullName: "Ahmed Al-Saud",
  nationality: "saudi",
  gosiSystem: null,
  salaryBasic: 10000,
  salaryHousing: 2000,
  salaryTransport: 1000,
  hireDate: "2020-01-01",
  employmentStatus: "active",
  bankIbanEnc: "SA123456",
  gosiRegistrationDate: "2020-01-15",
};

const slip: PayslipCalculation = {
  employeeId: "emp-1",
  basic: 10000,
  housing: 2000,
  transport: 1000,
  overtime: 500,
  gosiEmployee: 1300,
  gosiEmployer: 1267.5,
  deductions: 0,
  netPay: 12200,
};

describe("generateMudadFile", () => {
  it("generates file structure with correct totals", () => {
    const result = generateMudadFile({
      periodMonth: "2026-07",
      payslips: [slip],
      employees: [emp],
    });

    expect(result.format).toBe("mudad-wps-demo");
    expect(result.period).toBe("2026-07");
    expect(result.totalEmployees).toBe(1);
    expect(result.totalWages).toBe(13500);
    expect(result.employees[0]?.fullName).toBe("Ahmed Al-Saud");
  });
});

describe("mudadToXml", () => {
  it("generates valid XML", () => {
    const file = generateMudadFile({ periodMonth: "2026-07", payslips: [slip], employees: [emp] });
    const xml = mudadToXml(file);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<wageFile format=\"mudad-wps-demo\">");
    expect(xml).toContain("<period>2026-07</period>");
    expect(xml).toContain("<fullName>Ahmed Al-Saud</fullName>");
    expect(xml).toContain("</wageFile>");
  });
});

describe("mudadToCsv", () => {
  it("generates valid CSV with header", () => {
    const file = generateMudadFile({ periodMonth: "2026-07", payslips: [slip], employees: [emp] });
    const csv = mudadToCsv(file);

    expect(csv).toContain("employeeId,fullName,iqamaNumber");
    expect(csv).toContain("Ahmed Al-Saud");
  });
});
