"use client";
import { useEffect, useCallback, useState } from "react";
import { CheckCircle2, XCircle, Ban, Zap, X, RefreshCw, MessageCircle } from "lucide-react";

export type PaymentDialogState = "idle" | "loading" | "success" | "error" | "cancelled";

interface PaymentResultDialogProps {
  state: PaymentDialogState;
  planName?: string;
  creditsAdded?: number;
  newBalance?: number;
  errorMessage?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export default function PaymentResultDialog({
  state,
  planName,
  creditsAdded,
  newBalance,
  errorMessage,
  onClose,
  onRetry,
}: PaymentResultDialogProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; size: number; angle: number }[]>([]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Auto-close sau 3 giây khi success / error / cancelled
  useEffect(() => {
    if (state !== "success" && state !== "error" && state !== "cancelled") return;
    const timer = setTimeout(handleClose, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Fade-in khi mở
  useEffect(() => {
    if (state !== "idle") {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [state]);

  // Tạo confetti particles khi success
  useEffect(() => {
    if (state === "success") {
      const colors = ["#7c3aed", "#a855f7", "#4f46e5", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];
      setParticles(
        Array.from({ length: 28 }, (_, i) => ({
          x: 40 + Math.random() * 20,
          y: 20 + Math.random() * 30,
          color: colors[i % colors.length],
          size: 5 + Math.random() * 7,
          angle: Math.random() * 360,
        }))
      );
    } else {
      setParticles([]);
    }
  }, [state]);


  if (state === "idle") return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9999,
        background: "rgba(0,0,0,0.38)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
        padding: "16px",
      }}
      onClick={(e) => { if (state !== "loading" && e.target === e.currentTarget) handleClose(); }}
    >
      {/* ── Confetti particles (success only) ── */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-sm pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            transform: `rotate(${p.angle}deg)`,
            animation: `confettiFall ${1.2 + Math.random() * 1.2}s ease-out ${Math.random() * 0.4}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      {/* ── Modal Card ── */}
      <div
        className="relative w-full rounded-3xl overflow-hidden"
        style={{
          maxWidth: "440px",
          background: "#fff",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.94) translateY(12px)",
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",
        }}
      >
        {/* Top gradient strip */}
        <div
          className="h-1 w-full"
          style={{
            background: state === "loading"
              ? "linear-gradient(90deg,#7c3aed,#4f46e5,#a855f7)"
              : state === "success"
              ? "linear-gradient(90deg,#10b981,#06b6d4,#7c3aed)"
              : state === "cancelled"
              ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
              : "linear-gradient(90deg,#ef4444,#f97316)",
          }}
        />

        <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4 sm:gap-5">

          {/* ── LOADING STATE ── */}
          {state === "loading" && (
            <>
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Outer ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "3px solid #ede9fe",
                    borderTopColor: "#7c3aed",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
                {/* Inner ring */}
                <div
                  className="absolute inset-3 rounded-full"
                  style={{
                    border: "3px solid #ddd6fe",
                    borderTopColor: "#4f46e5",
                    animation: "spin 1.4s linear infinite reverse",
                  }}
                />
                <Zap size={22} style={{ color: "#7c3aed" }} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1.5">Đang xử lý thanh toán</h2>
                <p className="text-sm text-gray-400">Vui lòng không đóng trang này…</p>
              </div>
              <div className="w-full px-4">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "#f3f0ff" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
                      animation: "progressSlide 1.6s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-300 mono">Đang kết nối với PayPal…</p>
            </>
          )}

          {/* ── CANCELLED STATE ── */}
          {state === "cancelled" && (
            <>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#fef3c7,#fde68a)",
                  boxShadow: "0 0 0 8px #fffbeb",
                }}
              >
                <Ban size={36} style={{ color: "#d97706" }} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Đã hủy thanh toán</h2>
                <p className="text-sm text-gray-400 max-w-xs">
                  Bạn đã hủy quá trình thanh toán. Credits chưa được trừ.
                </p>
              </div>

              <div
                className="w-full px-4 py-3 rounded-xl text-left"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
              >
                <p className="text-xs font-medium" style={{ color: "#92400e" }}>
                  💡 Bạn có thể quay lại và thanh toán bất cứ lúc nào. Credits sẽ được cộng ngay sau khi hoàn tất.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-95 border"
                style={{ borderColor: "#e4e4e7", color: "#71717a" }}
              >
                Đóng
              </button>
            </>
          )}

          {/* ── SUCCESS STATE ── */}
          {state === "success" && (
            <>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
                    boxShadow: "0 0 0 8px #ecfdf5",
                  }}
                >
                  <CheckCircle2 size={36} style={{ color: "#10b981" }} />
                </div>
                {/* Pulse ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "2px solid #10b981",
                    animation: "pulseRing 1.5s ease-out 0.3s forwards",
                    opacity: 0,
                  }}
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">
                  Thanh toán thành công! 🎉
                </h2>
                <p className="text-sm text-gray-400">
                  Gói <span className="font-bold text-violet-600">{planName}</span> đã được kích hoạt
                </p>
              </div>

              {/* Credits badge */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl w-full"
                style={{ background: "linear-gradient(135deg,#f3f0ff,#ede9fe)", border: "1px solid #ddd6fe" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                >
                  <Zap size={18} color="#fff" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400">Credits được cộng</p>
                  <p className="text-xl font-black mono" style={{ color: "#7c3aed" }}>
                    +{creditsAdded?.toLocaleString()}
                  </p>
                </div>
                {newBalance !== undefined && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-400">Số dư mới</p>
                    <p className="text-lg font-black mono text-gray-700">{newBalance.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Validity note */}
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Gói có hiệu lực 30 ngày kể từ hôm nay
              </p>

              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                }}
              >
                Tuyệt vời! Bắt đầu tạo ảnh →
              </button>
            </>
          )}

          {/* ── ERROR STATE ── */}
          {state === "error" && (
            <>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#fee2e2,#fecaca)",
                  boxShadow: "0 0 0 8px #fff1f1",
                }}
              >
                <XCircle size={36} style={{ color: "#ef4444" }} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Thanh toán thất bại</h2>
                <p className="text-sm text-gray-400 max-w-xs">
                  {errorMessage ?? "Đã có lỗi xảy ra trong quá trình xử lý thanh toán."}
                </p>
              </div>

              {/* Error detail box */}
              <div
                className="w-full px-4 py-3 rounded-xl text-left"
                style={{ background: "#fff5f5", border: "1px solid #fecaca" }}
              >
                <p className="text-xs text-red-400 font-mono leading-relaxed">
                  💡 Kiểm tra lại thẻ/tài khoản PayPal và thử lại. Nếu vấn đề vẫn tiếp diễn, hãy liên hệ hỗ trợ với mã lỗi bên dưới.
                </p>
              </div>

              <div className="flex gap-2.5 w-full">
                {onRetry && (
                  <button
                    onClick={() => { handleClose(); setTimeout(onRetry!, 250); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                    }}
                  >
                    <RefreshCw size={14} /> Thử lại
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#e4e4e7", color: "#71717a" }}
                >
                  <MessageCircle size={14} /> Đóng
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Global CSS animations ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes progressSlide {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
        @keyframes confettiFall {
          0%   { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0) scale(1); }
          100% { opacity: 0; transform: rotate(calc(var(--r, 0deg) + 360deg)) translateY(140px) scale(0.4); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
