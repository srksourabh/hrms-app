import { z } from "zod";
import { createTRPCRouter, companyProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";

const qiwaEnvironment = z.enum(["production", "sandbox"]);

const qiwaApiConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  environment: qiwaEnvironment,
  baseUrl: z.string().url(),
});

export type QiwaApiConfig = z.infer<typeof qiwaApiConfigSchema>;

export const qiwaEmployeeSchema = z.object({
  id: z.string().uuid().optional(),
  qiwaEmployeeId: z.string().optional(),
  fullName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nationality: z.string(),
  iqamaNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  iqamaExpiryDate: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().optional(),
  currency: z.string().default("SAR"),
  workHours: z.string().optional(),
  workDays: z.string().optional(),
  housingAllowance: z.number().optional(),
  transportAllowance: z.number().optional(),
  gosiContribution: z.number().optional(),
  employerContribution: z.number().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  maritalStatus: z.string().optional(),
  educationLevel: z.string().optional(),
  jobLevel: z.string().optional(),
  joiningDate: z.string().optional(),
  terminationDate: z.string().optional(),
  noticePeriodDays: z.number().optional(),
  otherAllowances: z.record(z.any()).optional(),
  isSaudizationPriority: z.boolean().optional(),
});

export type QiwaEmployee = z.infer<typeof qiwaEmployeeSchema>;

export const qiwaContractSchema = z.object({
  id: z.string().uuid().optional(),
  qiwaEmployeeId: z.string().optional(),
  contractType: z.enum(["permanent", "contract", "probation"]),
  jobTitle: z.string(),
  department: z.string(),
  salary: z.number(),
  currency: z.string().default("SAR"),
  workHours: z.string(),
  workDays: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  terminationDate: z.string().optional(),
  resignationDate: z.string().optional(),
  noticePeriodDays: z.number().default(60),
  housingAllowance: z.number().default(0),
  transportAllowance: z.number().default(0),
  otherAllowances: z.record(z.any()).optional(),
  gosiContribution: z.number().default(0),
  employerContribution: z.number().default(0),
  nationality: z.string(),
  iqamaExpiryDate: z.string().optional(),
  isSaudizationPriority: z.boolean().default(false),
});

export type QiwaContract = z.infer<typeof qiwaContractSchema>;

export const qiwaSubmissionResponseSchema = z.object({
  success: z.boolean(),
  qiwaEmployeeId: z.string().optional(),
  contractId: z.string().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export type QiwaSubmissionResponse = z.infer<typeof qiwaSubmissionResponseSchema>;

export const qiwaSyncStatusSchema = z.enum([
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "terminated",
]);

export type QiwaSyncStatus = z.infer<typeof qiwaSyncStatusSchema>;

interface QiwaAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class QiwaApiClient {
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private config: QiwaApiConfig) {}

  private getAccessToken(): string {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }
    return this.accessToken;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getAccessToken()}`,
      "Content-Type": "application/json",
    };
  }

  async authenticate(): Promise<QiwaAuthResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/v2/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qiwa authentication failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as QiwaAuthResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

    return data;
  }

  async testConnectivity(): Promise<boolean> {
    try {
      await fetch(`${this.config.baseUrl}/api/v2/health`, {
        headers: this.getHeaders(),
      });
      return true;
    } catch {
      return false;
    }
  }
}

function getQiwaConfig(): QiwaApiConfig | null {
  const clientId = process.env.QIWA_CLIENT_ID;
  const clientSecret = process.env.QIWA_CLIENT_SECRET;
  const environment = (process.env.QIWA_ENVIRONMENT ?? "sandbox") as "production" | "sandbox";

  if (!clientId || !clientSecret) {
    return null;
  }

  const baseUrl =
    environment === "production"
      ? "https://api.qiwa.sa"
      : "https://sandbox-api.qiwa.sa";

  return { clientId, clientSecret, environment, baseUrl };
}

function toQiwaEmployee(
  row: typeof schema.tenant.employees.$inferSelect & { department?: { name: string } },
): QiwaEmployee {
  const hireDate = row.hireDate;
  const joiningDate = formatDateOnly(hireDate);
  return {
    fullName: row.fullName,
    nationality: row.nationality,
    salary: Number(row.salaryBasic) || 0,
    currency: "SAR",
    workHours: "8",
    workDays: "Sunday-Monday-Tuesday-Wednesday-Thursday",
    housingAllowance: Number(row.salaryHousing) || 0,
    transportAllowance: Number(row.salaryTransport) || 0,
    gosiContribution: 0,
    employerContribution: 0,
    joiningDate,
    noticePeriodDays: 60,
    isSaudizationPriority: false,
  };
}

function formatDateOnly(value: Date | string | null | undefined, fallback?: string): string {
  if (!value) return fallback ?? todayDateOnly();
  if (typeof value === "string") return takeDatePart(value);
  return takeDatePart(value.toISOString());
}

function todayDateOnly(): string {
  return takeDatePart(new Date().toISOString());
}

function takeDatePart(iso: string): string {
  // ISO 8601 strings from toISOString() or stored DB timestamps always contain "T";
  // split returns at minimum one element. The fallback returns the full string,
  // which downstream Zod/JSON still accepts as a valid ISO value.
  const part = iso.split("T")[0];
  return part ?? iso;
}

export const qiwaRouter = createTRPCRouter({
  sync: companyProcedure
    .input(
      z.object({
        employeeId: z.string().uuid(),
        action: z.enum(["create", "update", "terminate"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const config = getQiwaConfig();
      if (!config) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Qiwa API credentials not configured",
        });
      }

      const client = new QiwaApiClient(config);
      let accessToken: string;

      try {
        const authResult = await client.authenticate();
        accessToken = authResult.access_token;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Qiwa authentication failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      const employee = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.id, input.employeeId),
      });

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      }

      const qiwaEmployee: QiwaEmployee = toQiwaEmployee(employee);
      let result: { success: boolean; qiwaEmployeeId?: string; errors?: string[] };

      try {
        switch (input.action) {
          case "create": {
            const response = await fetch("https://api.qiwa.sa/api/v2/employees", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(qiwaEmployee),
            });
            const data = await response.json();
            result = {
              success: response.ok,
              qiwaEmployeeId: data.employeeId ?? data.id,
              errors: data.errors,
            };
            break;
          }
          case "update": {
            const existingQiwaId = await ctx.db.query.qiwaContracts.findFirst({
              where: eq(schema.tenant.qiwaContracts.employeeId, input.employeeId),
            });
            if (!existingQiwaId?.qiwaEmployeeId) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "No Qiwa contract found for this employee",
              });
            }
            const response = await fetch(
              `https://api.qiwa.sa/api/v2/employees/${existingQiwaId.qiwaEmployeeId}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(qiwaEmployee),
              },
            );
            const data = await response.json();
            result = {
              success: response.ok,
              qiwaEmployeeId: existingQiwaId.qiwaEmployeeId,
              errors: data.errors,
            };
            break;
          }
          case "terminate": {
            const existingQiwaId = await ctx.db.query.qiwaContracts.findFirst({
              where: eq(schema.tenant.qiwaContracts.employeeId, input.employeeId),
            });
            if (!existingQiwaId?.qiwaEmployeeId) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "No Qiwa contract found for this employee",
              });
            }
            const response = await fetch(
              `https://api.qiwa.sa/api/v2/employees/${existingQiwaId.qiwaEmployeeId}/termination`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  terminationDate: employee.terminationDate?.toISOString(),
                }),
              },
            );
            const data = await response.json();
            result = {
              success: response.ok,
              qiwaEmployeeId: existingQiwaId.qiwaEmployeeId,
              errors: data.errors,
            };
            break;
          }
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Qiwa API error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      const contractType = "permanent" as const;
      const contractData: QiwaContract = {
        qiwaEmployeeId: result.qiwaEmployeeId ?? "",
        contractType,
        jobTitle: employee.fullName,
        department: employee.department?.name ?? "General",
        salary: Number(employee.salaryBasic) || 0,
        currency: qiwaEmployee.currency ?? "SAR",
        workHours: qiwaEmployee.workHours ?? "8",
        workDays: qiwaEmployee.workDays ?? "Sunday-Monday-Tuesday-Wednesday-Thursday",
        housingAllowance: qiwaEmployee.housingAllowance ?? 0,
        transportAllowance: qiwaEmployee.transportAllowance ?? 0,
        gosiContribution: qiwaEmployee.gosiContribution ?? 0,
        employerContribution: qiwaEmployee.employerContribution ?? 0,
        startDate: formatDateOnly(employee.hireDate),
        nationality: qiwaEmployee.nationality ?? "unknown",
        noticePeriodDays: 60,
        isSaudizationPriority: false,
      };

      await ctx.db
        .insert(schema.tenant.qiwaContracts)
        .values({
          employeeId: input.employeeId,
          qiwaEmployeeId: result.qiwaEmployeeId,
          jobTitle: employee.fullName,
          department: employee.department?.name ?? "General",
          salary: employee.salaryBasic.toString(),
          nationality: employee.nationality,
          startDate: employee.hireDate,
          status: "submitted",
          qiwaPayload: qiwaEmployee as any,
          qiwaResponse: result as any,
          lastSyncAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.tenant.qiwaContracts.employeeId,
          set: {
            qiwaEmployeeId: result.qiwaEmployeeId,
            status: "submitted",
            qiwaPayload: qiwaEmployee as any,
            qiwaResponse: result as any,
            lastSyncAt: new Date(),
            syncError: result.errors?.join(", ") ?? null,
          },
        });

      return {
        success: result.success,
        qiwaEmployeeId: result.qiwaEmployeeId,
        errors: result.errors,
      };
    }),

  list: companyProcedure
    .input(
      z.object({
        status: z.enum(["draft", "submitted", "accepted", "rejected", "terminated"]).optional(),
        pageSize: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.status ? eq(schema.tenant.qiwaContracts.status, input.status) : undefined;

      const contracts = await ctx.db.query.qiwaContracts.findMany({
        where,
        with: { employee: true },
        orderBy: desc(schema.tenant.qiwaContracts.createdAt),
        limit: input.pageSize,
        offset: input.cursor ? parseInt(input.cursor) : 0,
      });

      return { contracts, nextCursor: contracts.length };
    }),

  getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.qiwaContracts.findFirst({
      where: eq(schema.tenant.qiwaContracts.id, input),
      with: { employee: true },
    });
  }),

  getByEmployee: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.qiwaContracts.findFirst({
      where: eq(schema.tenant.qiwaContracts.employeeId, input),
      with: { employee: true },
    });
  }),

  testConnection: companyProcedure.query(async () => {
    const config = getQiwaConfig();
    if (!config) {
      return { connected: false, error: "Qiwa API credentials not configured" };
    }

    try {
      const client = new QiwaApiClient(config);
      await client.authenticate();
      const isConnected = await client.testConnectivity();
      return { connected: isConnected };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  dashboard: companyProcedure.query(async ({ ctx }) => {
    const [total, submitted, accepted, rejected, terminated] = await Promise.all([
      ctx.db.query.qiwaContracts.count(),
      ctx.db.query.qiwaContracts.count({ where: eq(schema.tenant.qiwaContracts.status, "submitted") }),
      ctx.db.query.qiwaContracts.count({ where: eq(schema.tenant.qiwaContracts.status, "accepted") }),
      ctx.db.query.qiwaContracts.count({ where: eq(schema.tenant.qiwaContracts.status, "rejected") }),
      ctx.db.query.qiwaContracts.count({ where: eq(schema.tenant.qiwaContracts.status, "terminated") }),
    ]);

    const recentSyncs = await ctx.db.query.qiwaContracts.findMany({
      orderBy: desc(schema.tenant.qiwaContracts.lastSyncAt),
      with: { employee: true },
      limit: 10,
    });

    return {
      summary: { total, submitted, accepted, rejected, terminated },
      recentSyncs,
    };
  }),
});