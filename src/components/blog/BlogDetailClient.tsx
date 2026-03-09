"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchBlogBySlug } from "@/services/blogService";
import BlogDetailHero from "./BlogDetailHero";

interface BlogDetailClientProps {
  slug: string;
}

export default function BlogDetailClient({ slug }: BlogDetailClientProps) {
  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ["blog", slug],
    queryFn:  () => fetchBlogBySlug(slug),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 animate-pulse space-y-6">
        {/* Cover skeleton */}
        <div className="w-full h-64 bg-gray-100 rounded-2xl" />
        {/* Title */}
        <div className="h-8 bg-gray-100 rounded-xl w-3/4" />
        <div className="h-5 bg-gray-100 rounded w-1/2" />
        {/* Content */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-4 bg-gray-100 rounded ${i % 3 === 2 ? "w-4/5" : "w-full"}`} />
        ))}
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-gray-500 text-sm">Bài viết không tồn tại hoặc đã bị xóa.</p>
      </div>
    );
  }

  return (
    <article className="bg-white min-h-screen">
      {/* Hero */}
      <BlogDetailHero blog={blog} />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28 }}
        className="max-w-3xl mx-auto px-6 pb-20"
      >
        <div
          className="max-w-none text-gray-700 leading-[1.8] break-words
            [&_h1]:font-extrabold [&_h1]:text-gray-900 [&_h1]:text-3xl [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4 [&_p]:last:mb-0
            [&_a]:text-violet-600 [&_a]:no-underline hover:[&_a]:underline
            [&_strong]:text-gray-900 [&_strong]:font-bold
            [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-gray-600 [&_li]:mb-1
            [&_ol]:list-decimal [&_ol]:pl-5
            [&_blockquote]:border-l-4 [&_blockquote]:border-violet-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500
            [&_code]:bg-violet-50 [&_code]:text-violet-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
            [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-xl [&_pre]:p-5
            [&_img]:rounded-xl [&_img]:shadow-md"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </motion.div>
    </article>
  );
}
