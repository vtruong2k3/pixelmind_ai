"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") ?? "";
  const email = searchParams?.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Token/email missing — show invalid state
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="w-full max-w-sm mx-auto px-6 text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <Lock size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Liên kết không hợp lệ</h1>
          <p className="text-sm text-gray-500 mb-6">
            Liên kết đặt lại mật khẩu này không hợp lệ hoặc đã hết hạn.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--cta-gradient)" }}
          >
            Yêu cầu đặt lại mật khẩu mới
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="w-full max-w-sm mx-auto px-6 text-center">
          <Link href="/" className="flex items-center gap-2 mb-10 justify-center">
            <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="7" fill="#7c3aed" />
              <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white" />
            </svg>
            <span className="font-bold text-gray-900 text-sm">PixelMind AI</span>
          </Link>

          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Mật khẩu đã đặt lại!</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "var(--cta-gradient)" }}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Mật khẩu phải có ít nhất 8 ký tự.");
    if (password !== confirm) return setError("Xác nhận mật khẩu không khớp.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đặt lại mật khẩu thất bại.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Không thể kết nối tới máy chủ. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafafa" }}>
      <div className="w-full max-w-sm mx-auto px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 justify-center">
          <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="7" fill="#7c3aed" />
            <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white" />
          </svg>
          <span className="font-bold text-gray-900 text-sm">PixelMind AI</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Đặt mật khẩu mới</h1>
        <p className="text-sm text-gray-400 mb-8">Nhập mật khẩu mới cho tài khoản <strong className="text-gray-600">{email}</strong>.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="new-password"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 placeholder:text-gray-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 placeholder:text-gray-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          {/* Strength hint */}
          <div className="flex gap-1 mt-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  background:
                    password.length === 0 ? "#e5e7eb" :
                    password.length < 8 && i < 1 ? "#ef4444" :
                    password.length >= 8 && password.length < 12 && i < 2 ? "#f59e0b" :
                    password.length >= 12 && i < 3 ? "#10b981" :
                    password.length >= 16 ? "#7c3aed" : "#e5e7eb",
                }}
              />
            ))}
          </div>

          <button
            id="reset-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-1 transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
            style={{ background: "var(--cta-gradient)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
          >
            {loading ? "Đang xử lý..." : "Đặt mật khẩu mới"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-400 mt-6">
          <Link href="/login" className="text-violet-600 font-medium hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
