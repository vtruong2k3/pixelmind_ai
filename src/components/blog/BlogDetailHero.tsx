"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Clock } from "lucide-react";
import type { BlogDetail } from "@/types";

interface BlogDetailHeroProps {
  blog: BlogDetail;
}

function formatDate(iso: string) {
  const d = iso.substring(0, 10).split("-");
  return `${d[2]}/${d[1]}/${d[0]}`;
}

function estimateReadingTime(content: string) {
  const words = content.replace(/<[^>]*>/g, "").trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogDetailHero({ blog }: BlogDetailHeroProps) {
  const readTime = estimateReadingTime(blog.content);

  return (
    <section className="relative bg-white">
      {/* Cover image at the very top */}
      {blog.coverImage && (
        <div className="relative w-full overflow-hidden" style={{ maxHeight: 480 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full object-cover"
            style={{ maxHeight: 480 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.95) 100%)" }}
          />
        </div>
      )}

      {/* No cover — gradient blob */}
      {!blog.coverImage && (
        <div
          className="w-full h-48"
          style={{ background: "linear-gradient(135deg,#dc2626 0%,#7c3aed 100%)", opacity: 0.08 }}
        />
      )}

      {/* Content header */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "#7c3aed" }}
          >
            <ArrowLeft size={15} />
            Quay lại Blog
          </Link>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-snug mb-5"
        >
          {blog.title}
        </motion.h1>

        {/* Meta row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="flex flex-wrap items-center gap-4"
        >
          {/* Author */}
          <div className="flex items-center gap-2">
            {blog.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={blog.author.image}
                alt={blog.author.name ?? ""}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}
              >
                {(blog.author.name ?? blog.author.email).slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-gray-800">
              {blog.author.name ?? blog.author.email}
            </span>
          </div>

          {/* Divider */}
          <span className="w-px h-4 bg-gray-200" />

          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Calendar size={13} />
            {formatDate(blog.createdAt)}
          </div>

          {/* Reading time */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Clock size={13} />
            {readTime} phút đọc
          </div>
        </motion.div>

        {/* Excerpt */}
        {blog.excerpt && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-5 text-base text-gray-500 leading-relaxed border-l-4 pl-4"
            style={{ borderColor: "#7c3aed" }}
          >
            {blog.excerpt}
          </motion.p>
        )}

        {/* Divider */}
        <div className="mt-8 h-px bg-gray-100" />
      </div>
    </section>
  );
}
