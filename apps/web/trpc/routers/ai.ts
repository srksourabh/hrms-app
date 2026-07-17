import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, companyProcedure, protectedProcedure } from "../server";
import { schema } from "@hrms-app/db";
import {
  aiAssistantSchema, aiAssistantUpdateSchema,
  aiSuggestionSchema, aiSuggestionUpdateSchema, aiSuggestionQuerySchema,
  aiChurnPredictionQuerySchema,
  aiSkillRecommendationQuerySchema,
  aiCompliancePredictionQuerySchema,
  aiSalaryBenchmarkQuerySchema,
  aiAuditLogQuerySchema,
  aiChatRequestSchema,
  uuidSchema as idSchema,
} from "@hrms-app/validators";
import { and, eq, desc, ilike, sql } from "drizzle-orm";
import { getLlmClient, type LlmConfig } from "@hrms-app/llm";

type ChatRole = "user" | "assistant" | "system";
type ChatMessage = { role: ChatRole; content: string };

/**
 * Deterministic fallback reply shown when no LLM API key is configured.
 * Keeps the chat panel working in demo mode / first-run setups.
 */
function stubReply(messages: ChatMessage[], lang: "en" | "ar"): string {
  const last = messages[messages.length - 1]?.content ?? "";
  const isArabic = lang === "ar";
  if (isArabic) {
    return `**ملاحظة:** لم يتم تكوين مزوّد الذكاء الاصطناعي بعد، لذا أعطيك ردًا إرشاديًا مبدئيًا.

سؤالك: "${last.slice(0, 240)}"

* عادةً ما أستخدم **نظام العمل السعودي**، **GOSI**، **Mudad/WPS**، و**منصة قوى** للرد على أسئلة الموارد البشرية في المملكة.
* يمكنك تفعيل الذكاء الاصطناعي الكامل بإضافة مفتاح **GEMINI_API_KEY** أو **ANTHROPIC_API_KEY** في متغيرات بيئة Vercel (Production).
* في هذه الأثناء، راجع **docs/saudi-statutory-requirements.md** داخل المستودع للحصول على معلومات تفصيلية.

> لمزيد من التفاعل، أضف المفتاح ثم أعد النشر.`;
  }
  return `**Note:** No AI provider is configured yet, so this is a placeholder reply.

Your question: "${last.slice(0, 240)}"

* I would normally consult **Saudi Labour Law**, **GOSI**, **Mudad/WPS**, and **Qiwa** to answer HR/payroll questions in the Kingdom.
* To enable full AI, add a **GEMINI_API_KEY** or **ANTHROPIC_API_KEY** to your Vercel Production environment variables.
* In the meantime, see **docs/saudi-statutory-requirements.md** in the repository for the detailed reference.

> Add the key, redeploy, and this panel will deliver real answers.`;
}

export const aiRouter = createTRPCRouter({
  assistant: createTRPCRouter({
    list: companyProcedure
      .query(async ({ ctx }) => {
        return await ctx.db.query.aiAssistants.findMany({
          orderBy: desc(schema.tenant.aiAssistants.createdAt),
        });
      }),

    getById: companyProcedure
      .input(z.object({ id: idSchema }))
      .query(async ({ ctx, input }) => {
        return await ctx.db.query.aiAssistants.findFirst({
          where: eq(schema.tenant.aiAssistants.id, input.id),
        });
      }),

    create: companyProcedure
      .input(aiAssistantSchema)
      .mutation(async ({ ctx, input }) => {
        const [result] = await ctx.db.insert(schema.tenant.aiAssistants).values(input).returning();
        return result;
      }),

    update: companyProcedure
      .input(z.object({ id: idSchema, data: aiAssistantUpdateSchema }))
      .mutation(async ({ ctx, input }) => {
        const [result] = await ctx.db.update(schema.tenant.aiAssistants)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(schema.tenant.aiAssistants.id, input.id))
          .returning();
        return result;
      }),

    delete: companyProcedure
      .input(z.object({ id: idSchema }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(schema.tenant.aiAssistants)
          .where(eq(schema.tenant.aiAssistants.id, input.id));
      }),
  }),

  suggestion: createTRPCRouter({
    list: companyProcedure
      .input(aiSuggestionQuerySchema.optional().default({}))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input?.type) conditions.push(eq(schema.tenant.aiSuggestions.type, input.type));
        if (input?.status) conditions.push(eq(schema.tenant.aiSuggestions.status, input.status));
        if (input?.employeeId) conditions.push(eq(schema.tenant.aiSuggestions.employeeId, input.employeeId));
        if (input?.departmentId) conditions.push(eq(schema.tenant.aiSuggestions.departmentId, input.departmentId));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;

        const [items, total] = await Promise.all([
          ctx.db.query.aiSuggestions.findMany({
            where,
            with: { employee: true, department: true },
            orderBy: desc(schema.tenant.aiSuggestions.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          ctx.db.$count(schema.tenant.aiSuggestions, where),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
  }),

  // ─────────────────────────────────────────────────────────────
  // Native AI chat — Saudi HR-aware assistant that consults the
  // active LLM (Gemini or Claude) with tenant context.
  // ─────────────────────────────────────────────────────────────
  chat: createTRPCRouter({
    send: protectedProcedure
      .input(aiChatRequestSchema)
      .mutation(async ({ ctx, input }) => {
        const role = ctx.session!.user.role;
        const preferredLanguage = (ctx.session!.user.preferredLanguage ?? "en") as "en" | "ar";

        // Live tenant context. Wrap in try/catch so a misconfigured DB never
        // blocks the assistant from responding. Use $count() instead of
        // pulling every row — the chat panel only needs the headline number.
        let contextLine = "Tenant: demo data (no live counts available).";
        try {
          const [empCount, activeCount, deptCount, openJobsCount] = await Promise.all([
            ctx.db.$count(schema.tenant.employees).catch(() => 0),
            ctx.db
              .$count(schema.tenant.employees, eq(schema.tenant.employees.employmentStatus, "active"))
              .catch(() => 0),
            ctx.db.$count(schema.tenant.departments).catch(() => 0),
            ctx.db
              .$count(schema.tenant.jobRequisitions, eq(schema.tenant.jobRequisitions.status, "open"))
              .catch(() => 0),
          ]);
          contextLine = `Tenant: ${activeCount} active employees (${empCount} total), ${deptCount} departments, ${openJobsCount} open positions.`;
        } catch {
          // Keep the stub context.
        }

        const TOPIC_PROMPTS: Record<string, string> = {
          general: "You are Taāzur AI, a Saudi HR & payroll assistant. Answer in the caller's preferred language, cite Saudi Labour Law, GOSI, Mudad/Qiwa/Muqeem where relevant, and keep the tone professional and concise.",
          saudi_statutory: "You are a Saudi HR compliance specialist. Always cite the relevant article of the Saudi Labour Law, GOSI regulations, or Nitaqat bands. Use the caller's preferred language.",
          leave_policy: "You advise on Saudi leave entitlements: 21 days annual leave (after 1 year), 30 days sick leave, 90 days maternity, 3 days paternity, 10 days exam leave. Always answer in the caller's preferred language.",
          payroll: "You are a Saudi payroll specialist. Cover GOSI 9.75% employee / 11.75% employer (new system) and 5% / 7.5% (old system), WPS via Mudad, end-of-service benefits (half month per year for first 5 years, full month thereafter), Iqama renewal timelines. Always answer in the caller's preferred language.",
          expense_policy: "You advise on Saudi business expense policy. Cover receipt requirements, per diem, GOSI/tax treatment, reimbursement timelines (WPS), VAT considerations. Always answer in the caller's preferred language.",
          recruitment: "You advise on Saudi recruitment: Nitaqat Saudization targets by activity, GOSI registration, work permit / Iqama transfer, MOL contract attestation via Qiwa. Always answer in the caller's preferred language.",
          onboarding: "You walk a new hire through their first 30 days: Iqama medical, GOSI registration, bank account (WPS-ready), Qiwa contract upload, Mudad onboarding. Always answer in the caller's preferred language.",
          performance: "You advise on Saudi performance management: 90-day probation (Article 53), appraisal cycles, EOSB triggers, training plans tied to Nitaqat improvement. Always answer in the caller's preferred language.",
        };

        const systemPrompt = [
          TOPIC_PROMPTS[input.topic] ?? TOPIC_PROMPTS.general,
          contextLine,
          `Caller role: ${role}. Preferred language: ${preferredLanguage === "ar" ? "Arabic" : "English"}.`,
          "Keep the response under 350 words unless the caller asks for detail. Use markdown.",
        ].join("\n\n");

        const config: LlmConfig = { provider: (process.env.LLM_PROVIDER as any) ?? "claude" };
        const haveKey = !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
        if (!haveKey) {
          return { reply: stubReply(input.messages, preferredLanguage), source: "stub" as const };
        }

        const client = getLlmClient();
        if (!client) {
          return { reply: stubReply(input.messages, preferredLanguage), source: "stub" as const };
        }

        const res = await client.complete({
          system: systemPrompt,
          messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: input.temperature ?? 0.3,
          maxTokens: 800,
          model: input.model,
        });

        // Audit the call (best-effort).
        try {
          await ctx.db.insert(schema.tenant.aiAuditLogs).values({
            employeeId: null,
            userId: (ctx.session!.user as any).id ?? null,
            action: "chat",
            model: res.model,
            promptTokens: res.usage?.inputTokens ?? null,
            completionTokens: res.usage?.outputTokens ?? null,
            metadata: { topic: input.topic, source: res.provider },
          });
        } catch {
          /* never block a user reply on audit failure */
        }

        return { reply: res.text, source: "llm" as const };
      }),
  }),
});