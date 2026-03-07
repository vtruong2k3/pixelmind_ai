"use client";
import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

function AdminLoginContent() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="w-full rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            {/* Shield icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(79,70,229,0.25) 100%)",
                border: "1px solid rgba(124,58,237,0.3)",
              }}
            >
              <ShieldCheck size={28} style={{ color: "#a78bfa" }} />
            </div>

            {/* Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold mb-3"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
                letterSpacing: "0.08em",
              }}
            >
              <Lock size={10} />
              RESTRICTED ACCESS
            </div>

            <h1
              className="text-2xl font-bold text-center"
              style={{ color: "#fff", letterSpacing: "-0.03em" }}
            >
              Quản trị viên
            </h1>
            <p
              className="text-sm mt-1.5 text-center"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Đăng nhập vào trang quản trị PixelMind AI
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "rgba(255,255,255,0.05)",
              marginBottom: "1.5rem",
            }}
          />

          {/* Form */}
          <AdminLoginForm />
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          Chỉ dành cho quản trị viên &amp; nhân viên.{" "}
          <Link
            href="/login"
            className="underline underline-offset-2 transition-colors"
            style={{ color: "rgba(167,139,250,0.5)" }}
          >
            Đăng nhập thông thường →
          </Link>
        </p>

        {/* Watermark */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <svg width="18" height="18" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="7" fill="#7c3aed" />
            <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white" />
            <circle cx="23" cy="11" r="2.5" fill="white" opacity="0.85" />
          </svg>
          <span
            className="text-xs font-semibold"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            PixelMind AI
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  return (
    <Suspense>
      <AdminLoginContent />
    </Suspense>
  );
}
