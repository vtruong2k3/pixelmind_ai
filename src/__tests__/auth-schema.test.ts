// src/__tests__/auth-schema.test.ts
// Unit tests for the forgot-password and reset-password request validation

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Schemas (replicated from API route validation logic) ───────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu ít nhất 8 ký tự"),
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("forgotPasswordSchema", () => {
  it("✅ validates a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "test@example.com" }).success).toBe(true);
  });

  it("❌ rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("❌ rejects empty email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const valid = {
    token: "abc123xyz",
    email: "user@example.com",
    password: "StrongPass1",
  };

  it("✅ validates complete valid data", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("❌ fails if password < 8 chars", () => {
    expect(resetPasswordSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });

  it("❌ fails if token is empty", () => {
    expect(resetPasswordSchema.safeParse({ ...valid, token: "" }).success).toBe(false);
  });

  it("❌ fails if email is invalid", () => {
    expect(resetPasswordSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });
});
