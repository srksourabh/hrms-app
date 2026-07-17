/**
 * Unit tests for the inline passwordStrength function used in the signup form.
 *
 * Pure function so we re-declare it here for testing. If you change the
 * implementation in apps/web/app/(auth)/signup/page.tsx, mirror the change here.
 */
import { describe, expect, it } from "vitest";

type Score = 0 | 1 | 2 | 3 | 4;
function passwordStrength(pw: string): { score: Score; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const labels = ["", "Weak", "Fair", "Good", "Strong"] as const;
  return { score: score as Score, label: labels[score] ?? "" };
}

describe("passwordStrength", () => {
  it("empty password returns score 0 and empty label", () => {
    expect(passwordStrength("")).toEqual({ score: 0, label: "" });
  });

  it("short lowercase is score 0 (no rules met)", () => {
    expect(passwordStrength("abc")).toEqual({ score: 0, label: "" });
  });

  it("8+ chars all lowercase is score 1 (Weak)", () => {
    expect(passwordStrength("abcdefgh")).toEqual({ score: 1, label: "Weak" });
  });

  it("8+ chars + uppercase is score 2 (Fair)", () => {
    expect(passwordStrength("Abcdefgh")).toEqual({ score: 2, label: "Fair" });
  });

  it("8+ chars + uppercase + number is score 3 (Good)", () => {
    expect(passwordStrength("Abcdefg1")).toEqual({ score: 3, label: "Good" });
  });

  it("8+ chars + uppercase + number + special is score 4 (Strong)", () => {
    expect(passwordStrength("Abcdefg1!")).toEqual({ score: 4, label: "Strong" });
  });

  it("length bonus is one point, no more no less", () => {
    expect(passwordStrength("Aa1!").score).toBe(3); // short but otherwise complete
    expect(passwordStrength("Aaaaaaaaa1!").score).toBe(4);
  });
});
