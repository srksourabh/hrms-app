"use server";

import { AuthError } from "next-auth";
import { signIn } from "@hrms-app/auth";

export interface LoginState {
  error: string;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const isDemo = formData.get("intent") === "demo";
  const email = isDemo ? "admin@demo.com" : String(formData.get("email") ?? "");
  const password = isDemo ? "Demo@1234" : String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: isDemo
          ? "Demo access is temporarily unavailable. Please try again."
          : "بيانات الدخول غير صحيحة",
      };
    }
    throw error;
  }

  return { error: "" };
}
