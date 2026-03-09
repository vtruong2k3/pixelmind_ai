"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fetchBlogs } from "@/services/blogService";
import type { Blog } from "@/types";

interface BlogRelatedProps {
  currentSlug: string;
}

function RelatedCard({ blog, index }: { blog: Blog; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        href={`/blog/${blog.slug}`}
        className="group flex gap-4 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all"
      >
        {/* Thumbnail */}
        <div className="shrink-0 w-20 h-16 rounded-lg overflow-hidden">
          {blog.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}
            />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-violet-700 transition-colors leading-snug">
            {blog.title}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlogRelated({ currentSlug }: BlogRelatedProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["blogs-related"],
    queryFn:  () => fetchBlogs({ page: 1, limit: 6 }),
    staleTime: 1000 * 60 * 5,
  });

  const related = data?.blogs.filter((b) => b.slug !== currentSlug).slice(0, 3) ?? [];

  if (isLoading || related.length === 0) return null;

  return (
    <aside className="max-w-3xl mx-auto px-6 pb-16">
      {/* Divider */}
      <div className="h-px bg-gray-100 mb-10" />

      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-gray-900">Bài viết liên quan</h3>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs font-semibold transition-colors"
          style={{ color: "#7c3aed" }}
        >
          Xem tất cả <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {related.map((blog, i) => (
          <RelatedCard key={blog.id} blog={blog} index={i} />
        ))}
      </div>
    </aside>
  );
}
