"use client";
import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";

export default function BlogHero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-20">
      {/* Background gradient blobs */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(ellipse, #7c3aed 0%, #4f46e5 60%, transparent 100%)" }}
        aria-hidden
      />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.18)",
            color: "#7c3aed",
          }}
        >
          <Sparkles size={12} />
          PixelMind Blog
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4"
        >
          Khám phá thế giới{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI sáng tạo
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed"
        >
          Hướng dẫn, tips &amp; tricks, cập nhật tính năng mới nhất từ PixelMind AI
        </motion.p>

        {/* Icon decoration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex justify-center mt-8"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
          >
            <BookOpen size={26} color="white" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
