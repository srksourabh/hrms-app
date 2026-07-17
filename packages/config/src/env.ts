import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters")
    .refine((v) => !/dev-secret/i.test(v), {
      message: "AUTH_SECRET cannot reuse the documented dev fallback",
    }),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // LLM provider configuration (see packages/llm).
  // PRD Section 4 documents Claude as the default; runtime provider is
  // overridable via LLM_PROVIDER for cases where the platform is run with
  // a different vendor (e.g. Gemini 2.5 Flash). API key is required only
  // for the active provider.
  LLM_PROVIDER: z.enum(["claude", "gemini"]).default("claude"),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Demo mode: when "true", the four fixed demo identities in
  // packages/auth/src/demo-identities.ts are accepted at sign-in.
  // Production tenants must leave this unset or "false".
  DEMO_MODE: z.enum(["true", "false"]).default("false"),
  // Mirror of DEMO_MODE that the client bundle can read. Set this
  // alongside DEMO_MODE in Vercel to surface the sample-credentials
  // block on the login page for prospect walkthroughs. Never enable
  // in a production tenant.
  NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).default("false"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error(
      `Invalid environment variables: ${Object.keys(parsed.error.flatten().fieldErrors).join(", ")}. ` +
        "Set DATABASE_URL and AUTH_SECRET (>=32 chars, not the documented dev fallback) before starting the app.",
    );
  }

  return parsed.data;
}

export const env = validateEnv();
