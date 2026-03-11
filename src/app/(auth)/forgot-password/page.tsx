"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Vui lòng nhập địa chỉ email.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi. Thử lại sau.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Không thể kết nối tới máy chủ. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
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

          <div className="text-center">
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Email đã gửi!</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Nếu email <strong className="text-gray-700">{email}</strong> tồn tại trong hệ thống,
              bạn sẽ nhận được link đặt lại mật khẩu trong vòng vài phút.
            </p>
            <p className="text-xs text-gray-400 mb-8">Kiểm tra cả thư mục Spam nếu không thấy email.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
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

        <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Quên mật khẩu?</h1>
        <p className="text-sm text-gray-400 mb-8">
          Nhập email bạn đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 placeholder:text-gray-300 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <button
            id="forgot-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
            style={{ background: "var(--cta-gradient)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
          >
            {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-400 mt-6">
          Nhớ mật khẩu?{" "}
          <Link href="/login" className="text-violet-600 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
