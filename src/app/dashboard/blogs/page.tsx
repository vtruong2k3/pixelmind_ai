"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff,
  BookOpen, ExternalLink, X, RefreshCw, Filter,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { BlogFormDialog }   from "@/components/dashboard/BlogFormDialog";
import { BlogDeleteDialog } from "@/components/dashboard/BlogDeleteDialog";

import { useDashboardStore } from "@/store/dashboardStore";
import { adminFetchBlogs }   from "@/services/adminBlogService";
import type { Blog } from "@/types";

// ── Pagination component ──────────────────────────────────────────────────────

function Pagination({
  page, totalPages, onPageChange,
}: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-8 w-8 p-0 text-zinc-400 hover:text-white disabled:opacity-30">
        ‹
      </Button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = i + 1;
        return (
          <Button key={p} variant="ghost" size="sm"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 p-0 text-sm transition-all ${
              p === page
                ? "text-white font-bold"
                : "text-zinc-500 hover:text-white"
            }`}
            style={p === page ? { background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.3)" } : {}}
          >
            {p}
          </Button>
        );
      })}
      <Button variant="ghost" size="sm" disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="h-8 w-8 p-0 text-zinc-400 hover:text-white disabled:opacity-30">
        ›
      </Button>
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} style={{ borderColor: "#1f1f23" }}>
          <TableCell><Skeleton className="h-12 w-12 rounded-lg bg-zinc-800" /></TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48 bg-zinc-800 mb-2" />
            <Skeleton className="h-3 w-32 bg-zinc-800/60" />
          </TableCell>
          <TableCell><Skeleton className="h-3 w-24 bg-zinc-800" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 bg-zinc-800 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-3 w-20 bg-zinc-800" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20 bg-zinc-800 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardBlogsPage() {
  const { blogsFilter, setBlogsFilter, resetBlogsFilter } = useDashboardStore();
  const { page, search } = blogsFilter;

  const [searchInput, setSearchInput] = useState(search);
  const [statusFilter, setStatusFilter] = useState<"" | "published" | "draft">("");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        setBlogsFilter({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput, search, setBlogsFilter]);

  // Dialogs
  const [formOpen,   setFormOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editBlog,   setEditBlog]   = useState<Blog | undefined>(undefined);
  const [deleteBlog, setDeleteBlog] = useState<Blog | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-blogs", page, search, statusFilter],
    queryFn:  () => adminFetchBlogs({ page, limit: 10, search, status: statusFilter }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setBlogsFilter({ search: searchInput, page: 1 });
  }, [searchInput, setBlogsFilter]);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setStatusFilter("");
    resetBlogsFilter();
  }, [resetBlogsFilter]);

  const openCreate = () => { setEditBlog(undefined); setFormOpen(true); };
  const openEdit   = (b: Blog) => { setEditBlog(b); setFormOpen(true); };
  const openDelete = (b: Blog) => { setDeleteBlog(b); setDeleteOpen(true); };

  const hasFilter = search || statusFilter;

  const thCls = "text-xs font-semibold text-zinc-500 uppercase tracking-wide py-3";

  return (
    <div className="p-6 max-w-[1200px]">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.15)" }}
          >
            <BookOpen size={18} style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Quản lý Blog</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {data ? `${data.total} bài viết` : "Đang tải..."}
            </p>
          </div>
        </div>

        <Button
          onClick={openCreate}
          className="gap-2 font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}
        >
          <Plus size={15} />
          Tạo bài viết
        </Button>
      </motion.div>

      {/* ── Filters bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-3 mb-5"
      >
        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-1 max-w-sm items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tiêu đề, slug..."
              className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 h-9 focus:border-violet-500 text-sm"
            />
          </div>
        </form>

        {/* Status filter */}
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v as any); setBlogsFilter({ page: 1 }); }}>
          <SelectTrigger
            className="w-36 h-9 bg-zinc-900 border-zinc-700 text-zinc-300 text-sm focus:border-violet-500 focus:ring-0 shrink-0">
            <Filter size={13} className="mr-1 text-zinc-500" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="published">Đã xuất bản</SelectItem>
            <SelectItem value="draft">Nháp</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset */}
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={handleReset}
            className="h-9 text-zinc-400 hover:text-white gap-1.5 shrink-0">
            <X size={13} /> Reset
          </Button>
        )}

        {/* Refresh */}
        <Button variant="ghost" size="icon"
          onClick={() => refetch()}
          className="h-9 w-9 text-zinc-500 hover:text-white ml-auto shrink-0">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </motion.div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid #27272a" }}
      >
        <Table style={{ background: "#0c0c0e" }}>
          <TableHeader style={{ background: "#111113", borderBottom: "1px solid #27272a" }}>
            <TableRow style={{ borderColor: "#27272a" }}>
              <TableHead className={`${thCls} w-16`}>Ảnh</TableHead>
              <TableHead className={thCls}>Bài viết</TableHead>
              <TableHead className={thCls}>Tác giả</TableHead>
              <TableHead className={thCls}>Trạng thái</TableHead>
              <TableHead className={thCls}>Ngày tạo</TableHead>
              <TableHead className={`${thCls} text-right`}>Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && <SkeletonRows />}

            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-red-400 text-sm">
                  Lỗi tải dữ liệu —{" "}
                  <button onClick={() => refetch()} className="underline hover:no-underline">
                    thử lại
                  </button>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && data?.blogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(124,58,237,0.08)" }}>
                      <BookOpen size={22} style={{ color: "#52525b" }} />
                    </div>
                    <p className="text-zinc-600 text-sm">
                      {search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có bài viết nào"}
                    </p>
                    {!search && (
                      <Button size="sm" onClick={openCreate}
                        className="gap-1.5 text-white text-xs mt-1"
                        style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
                        <Plus size={12} /> Tạo bài viết đầu tiên
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && data?.blogs.map((blog, i) => (
              <TableRow
                key={blog.id}
                style={{
                  borderColor: "#141416",
                  background: i % 2 === 0 ? "#0c0c0e" : "#0e0e10",
                }}
                className="group"
              >
                {/* Cover thumbnail */}
                <TableCell className="py-3 pl-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                    {blog.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-lg font-black text-white/30"
                        style={{ background: "linear-gradient(135deg,#27272a,#18181b)" }}
                      >
                        {blog.title[0]}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Title + slug */}
                <TableCell className="py-3">
                  <p className="text-sm font-semibold text-white line-clamp-1 max-w-[280px] group-hover:text-violet-300 transition-colors">
                    {blog.title}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">/blog/{blog.slug}</p>
                  {blog.excerpt && (
                    <p className="text-xs text-zinc-600 mt-1 line-clamp-1 max-w-[260px]">
                      {blog.excerpt}
                    </p>
                  )}
                </TableCell>

                {/* Author */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    {blog.author.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={blog.author.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                        {(blog.author.name ?? blog.author.email)[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-zinc-400 truncate max-w-[100px]">
                      {blog.author.name ?? blog.author.email}
                    </span>
                  </div>
                </TableCell>

                {/* Status badge */}
                <TableCell className="py-3">
                  {blog.published ? (
                    <Badge className="gap-1.5 text-[11px] font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border-0">
                      <Eye size={10} /> Xuất bản
                    </Badge>
                  ) : (
                    <Badge className="gap-1.5 text-[11px] font-semibold px-2.5 py-1 bg-zinc-800 text-zinc-400 hover:bg-zinc-800 border-0">
                      <EyeOff size={10} /> Nháp
                    </Badge>
                  )}
                </TableCell>

                {/* Date */}
                <TableCell className="py-3">
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {blog.createdAt.substring(0, 10).split('-').reverse().join('/')}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 text-right pr-4">
                  <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {blog.published && (
                      <a
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Xem trên web"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors inline-flex"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(blog)}
                      title="Chỉnh sửa"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => openDelete(blog)}
                      title="Xóa"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* ── Footer: pagination + count ── */}
        {data && (data.totalPages > 1 || data.total > 0) && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: "#111113", borderTop: "1px solid #1f1f23" }}
          >
            <p className="text-xs text-zinc-500">
              Hiển thị{" "}
              <span className="text-zinc-300 font-semibold">
                {Math.min((page - 1) * 10 + 1, data.total)}–
                {Math.min(page * 10, data.total)}
              </span>{" "}
              trong{" "}
              <span className="text-zinc-300 font-semibold">{data.total}</span>{" "}
              bài viết
            </p>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={(p) => setBlogsFilter({ page: p })}
            />
          </div>
        )}
      </motion.div>

      {/* ── Dialogs ── */}
      <BlogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        blog={editBlog}
      />
      <BlogDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        blog={deleteBlog}
      />
    </div>
  );
}
