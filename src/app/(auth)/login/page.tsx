"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthBranding from "@/components/auth/AuthBranding";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

type AuthMode = "login" | "register";

function LoginContent() {
  const [mode, setMode] = useState<AuthMode>("login");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/studio";
  const verified = searchParams?.get("verified");
  const errorParam = searchParams?.get("error");

  return (
    <div className="min-h-screen flex" style={{ background: "#fafafa" }}>
      {/* Left branding panel */}
      <AuthBranding />

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center flex-1 p-6">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="7" fill="#7c3aed" />
            <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white" />
          </svg>
          <span className="font-bold text-gray-900 text-sm">PixelMind AI</span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
            {mode === "login" ? "Chào mừng bạn" : "Tạo tài khoản"}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {mode === "login"
              ? "10 credits miễn phí khi đăng ký lần đầu."
              : "Điền thông tin để bắt đầu ngay hôm nay."}
          </p>

          {verified === "true" && mode === "login" && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm text-green-700 bg-green-50 border border-green-200">
              Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.
            </div>
          )}

          {errorParam && mode === "login" && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              {errorParam === "InvalidToken" && "Liên kết xác thực không hợp lệ hoặc không tồn tại."}
              {errorParam === "TokenExpired" && "Liên kết xác thực đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại."}
              {errorParam === "VerificationFailed" && "Xác thực thất bại. Vui lòng thử lại sau."}
              {errorParam === "UserNotFound" && "Không tìm thấy người dùng cho liên kết xác thực này."}
              {!["InvalidToken", "TokenExpired", "VerificationFailed", "UserNotFound"].includes(errorParam) && "Đã có lỗi xảy ra trong quá trình xác thực."}
            </div>
          )}

          {mode === "login" ? (
            <LoginForm
              callbackUrl={callbackUrl}
              onSwitchToRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              callbackUrl={callbackUrl}
              onSwitchToLogin={() => setMode("login")}
            />
          )}

          <p className="text-xs text-gray-300 mt-6 text-center">
            Bằng cách tiếp tục, bạn đồng ý với{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-gray-500">Điều khoản</Link>
            {" "}và{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-gray-500">Chính sách bảo mật</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
