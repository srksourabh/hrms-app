import { describe, it, expect, vi, afterEach } from "vitest";
import { generateTotpSecret, verifyTotp, totpAuthUri } from "../totp";

// RFC 6238 SHA1 seed = ASCII "12345678901234567890" (20 bytes).
// base32 of that seed:
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

afterEach(() => {
  vi.useRealTimers();
});

describe("TOTP", () => {
  it("matches the RFC 6238 vector at T=59s (287082)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(59 * 1000)); // 59 seconds past the epoch
    expect(verifyTotp(RFC_SECRET, "287082")).toBe(true);
    // A different valid-format code at the same instant must fail.
    expect(verifyTotp(RFC_SECRET, "000000")).toBe(false);
  });

  it("matches the RFC 6238 vector at T=1111111109s (081804)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1111111109 * 1000));
    expect(verifyTotp(RFC_SECRET, "081804")).toBe(true);
  });

  it("generates a base32 secret and rejects malformed codes", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(16);
    expect(verifyTotp(secret, "")).toBe(false);
    expect(verifyTotp(secret, "12345")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "1234567")).toBe(false);
  });

  it("builds an otpauth URI with issuer and secret", () => {
    const uri = totpAuthUri("ABCDEFGHIJKLMNOP", "user@example.com", "Saudi HRMS Portal");
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("secret=ABCDEFGHIJKLMNOP");
    expect(uri).toContain("issuer=Saudi+HRMS+Portal");
  });
});
