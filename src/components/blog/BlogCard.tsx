"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, User } from "lucide-react";
import type { Blog } from "@/types";

interface BlogCardProps {
  blog:  Blog;
  index: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function initials(name: string | null, email: string) {
  const src = name ?? email;
  return src.slice(0, 2).toUpperCase();
}

// Fallback cover images (violet-themed gradients)
const FALLBACK_COVERS = [
  "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
  "linear-gradient(135deg,#6d28d9 0%,#7c3aed 60%,#a78bfa 100%)",
  "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a78bfa 100%)",
];

export default function BlogCard({ blog, index }: BlogCardProps) {
  const fallback = FALLBACK_COVERS[index % FALLBACK_COVERS.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Cover */}
      <Link href={`/blog/${blog.slug}`} className="block relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {blog.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: fallback }}
          >
            <span className="text-white/40 text-5xl font-black select-none">
              {blog.title[0]}
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <Link href={`/blog/${blog.slug}`}>
          <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors mb-2">
            {blog.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
            {blog.excerpt}
          </p>
        )}

        {/* Footer — author + date */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-2">
            {blog.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={blog.author.image}
                alt={blog.author.name ?? ""}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}
              >
                {initials(blog.author.name, blog.author.email)}
              </div>
            )}
            <span className="text-xs text-gray-500 font-medium truncate max-w-[90px]">
              {blog.author.name ?? blog.author.email}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={11} />
            {formatDate(blog.createdAt)}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
