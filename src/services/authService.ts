// src/services/authService.ts
import axios from "axios";
import { signIn } from "next-auth/react";
import type { LoginInput, RegisterInput } from "@/lib/schemas/auth";

const api = axios.create({ baseURL: "/api" });

// ── Register via API ──────────────────────────────────────────
export async function registerUser(data: RegisterInput): Promise<{ success: boolean; message?: string }> {
  const res = await api.post<{ error?: string; message?: string }>("/auth/register", {
    name: data.name,
    email: data.email,
    password: data.password,
  });
  return { success: true, message: res.data.message };
}

// ── Login via NextAuth credentials ───────────────────────────
export async function loginWithEmail(data: LoginInput, callbackUrl: string) {
  const res = await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
    callbackUrl,
  });
  return res;
}

// ── Login via Google ──────────────────────────────────────────
export async function loginWithGoogle(callbackUrl: string) {
  return signIn("google", { callbackUrl });
}
