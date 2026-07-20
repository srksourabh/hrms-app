/**
 * Dependency-free TOTP (RFC 6238) — HMAC-SHA1, 30-second step, 6 digits.
 * Used for optional MFA on privileged accounts (C4). No third-party library.
 */
import { createHmac, randomBytes } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

/** Generate a new base32 TOTP secret (160 bits). */
export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let secret = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const idx = parseInt(bits.slice(i, i + 5), 2);
    secret += BASE32_ALPHABET[idx];
  }
  return secret;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = "";
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", key).update(buf).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0xf;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/**
 * Verify a submitted 6-digit code against the secret, allowing ±`window` steps
 * of clock drift (default ±1 = ±30s).
 */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const code = (token ?? "").trim();
  if (!/^\d{6}$/.test(code)) return false;
  const key = base32Decode(secret);
  if (key.length === 0) return false;
  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  for (let w = -window; w <= window; w++) {
    if (hotp(key, counter + w) === code) return true;
  }
  return false;
}

/** Build an otpauth:// URI for authenticator-app enrollment (QR code). */
export function totpAuthUri(secret: string, account: string, issuer = "Taazur"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
