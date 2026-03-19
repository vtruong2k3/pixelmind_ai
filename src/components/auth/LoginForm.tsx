"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { loginWithEmail, loginWithGoogle } from "@/services/authService";
import { toast } from "sonner";

import GoogleIcon from "@/components/icons/GoogleIcon";
interface LoginFormProps {
  callbackUrl: string;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ callbackUrl, onSwitchToRegister }: LoginFormProps) {
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await loginWithEmail(data, callbackUrl);
      if (res?.error) {
        // Map NextAuth error codes to user-friendly messages
        const errorMsg =
          res.error === "CredentialsSignin"
            ? "Email hoặc mật khẩu không đúng."
            : res.error.includes("xác thực") || res.error.includes("verified")
            ? "Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn."
            : res.error;
        setError("root", { message: errorMsg });
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      const msg = err?.message?.includes("xác thực")
        ? "Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn."
        : "Có lỗi xảy ra. Vui lòng thử lại.";
      setError("root", { message: msg });
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(callbackUrl);
    } catch {
      toast.error("Đăng nhập Google thất bại.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Root error */}
      {errors.root && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-500"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          {errors.root.message}
        </div>
      )}

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || isSubmitting}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60"
        style={{ border: "1px solid #e4e4e7" }}
      >
        {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
        {googleLoading ? "Đang chuyển hướng..." : "Tiếp tục với Google"}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 mono">hoặc</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                border: `1px solid ${errors.email ? "#ef4444" : "#e4e4e7"}`,
                background: "#fff",
              }}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Mật khẩu</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                border: `1px solid ${errors.password ? "#ef4444" : "#e4e4e7"}`,
                background: "#fff",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end -mt-2">
          <a href="/forgot-password" className="text-xs text-violet-500 hover:underline">
            Quên mật khẩu?
          </a>
        </div>
        {/* Submit */}

        <button
          type="submit"
          disabled={isSubmitting || googleLoading}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
          style={{ background: "var(--cta-gradient)", boxShadow: "0 4px 16px rgba(124,58,237,0.25)" }}
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        <p className="text-sm text-center text-gray-400">
          Chưa có tài khoản?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold hover:underline"
            style={{ color: "#7c3aed" }}
          >
            Đăng ký
          </button>
        </p>
      </form>
    </div>
  );
}
