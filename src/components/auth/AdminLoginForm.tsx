"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, Mail, Lock, ShieldAlert } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { loginWithEmail } from "@/services/authService";

export default function AdminLoginForm() {
  const [showPw, setShowPw] = useState(false);

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
      const res = await loginWithEmail(data, "/dashboard");
      if (res?.error) {
        setError("root", { message: "Email hoặc mật khẩu không đúng." });
        return;
      }
      // Login thành công → redirect về /dashboard
      // Middleware sẽ tự chặn nếu không đủ quyền (< STAFF)
      window.location.href = "/dashboard";
    } catch {
      setError("root", { message: "Có lỗi xảy ra. Vui lòng thử lại." });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Root error */}
      {errors.root && (
        <div
          className="px-4 py-3 rounded-xl text-sm flex items-start gap-2"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.18)",
            color: "#f87171",
          }}
        >
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <span>{errors.root.message}</span>
        </div>
      )}

      {/* Email / Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Email */}
        <div>
          <label
            className="text-xs font-semibold mb-1.5 block"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Email
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.2)" }}
            />
            <input
              {...register("email")}
              type="email"
              placeholder="admin@example.com"
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                border: `1px solid ${errors.email ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
              }}
            />
          </div>
          {errors.email && (
            <p className="text-xs mt-1" style={{ color: "#f87171" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            className="text-xs font-semibold mb-1.5 block"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Mật khẩu
          </label>
          <div className="relative">
            <Lock
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.2)" }}
            />
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                border: `1px solid ${errors.password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs mt-1" style={{ color: "#f87171" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
          style={{
            background: isSubmitting
              ? "rgba(124,58,237,0.5)"
              : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
          }}
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isSubmitting ? "Đang xác thực..." : "Đăng nhập Quản trị"}
        </button>
      </form>
    </div>
  );
}
