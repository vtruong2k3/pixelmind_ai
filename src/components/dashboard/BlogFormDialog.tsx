"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload, X, Image as ImageIcon, Wand2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button }   from "@/components/ui/button";
import { Switch }   from "@/components/ui/switch";

import { blogFormSchema, type BlogFormValues } from "@/lib/schemas/blog";
import {
  adminCreateBlog,
  adminUpdateBlog,
  adminFetchBlogById,
  adminUploadImage,
} from "@/services/adminBlogService";
import type { Blog } from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function autoSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

// ── ImageUploader sub-component ───────────────────────────────────────────────

interface ImageUploaderProps {
  value:    string;
  onChange: (url: string) => void;
}

function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef        = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File tối đa 5MB");
      return;
    }
    setUploading(true);
    try {
      const url = await adminUploadImage(file);
      onChange(url);
      toast.success("Tải ảnh thành công");
    } catch (err: any) {
      toast.error(err.message ?? "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-zinc-700 group" style={{ aspectRatio: "16/7" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button" size="sm" variant="secondary"
              onClick={() => inputRef.current?.click()}
              className="text-xs"
            >
              <Upload size={12} className="mr-1" /> Thay ảnh
            </Button>
            <Button
              type="button" size="sm" variant="destructive"
              onClick={() => onChange("")}
              className="text-xs"
            >
              <X size={12} className="mr-1" /> Xóa
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
            cursor-pointer transition-all py-10
            ${dragOver
              ? "border-violet-500 bg-violet-500/10"
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
            }
          `}
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.12)" }}>
                <ImageIcon size={20} style={{ color: "#a78bfa" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-300">
                  Kéo thả hoặc <span style={{ color: "#a78bfa" }}>chọn ảnh</span>
                </p>
                <p className="text-xs text-zinc-600 mt-1">JPEG, PNG, WEBP, GIF · Tối đa 5MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL fallback input */}
      <div className="flex gap-2">
        <Input
          placeholder="Hoặc dán URL ảnh..."
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600 h-8"
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface BlogFormDialogProps {
  open:       boolean;
  onOpenChange: (open: boolean) => void;
  /** undefined = create mode; Blog = edit mode */
  blog?:      Blog;
}

export function BlogFormDialog({ open, onOpenChange, blog }: BlogFormDialogProps) {
  const qc     = useQueryClient();
  const isEdit = !!blog;

  // Fetch full content khi edit
  const { data: fullBlog } = useQuery({
    queryKey: ["admin-blog-detail", blog?.id],
    queryFn:  () => adminFetchBlogById(blog!.id),
    enabled:  isEdit && open,
    staleTime: 0,
  });

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: "", slug: "", excerpt: "", content: "",
      coverImage: "", published: false,
    },
  });

  // Reset form khi mở dialog
  useEffect(() => {
    if (!open) return;
    if (isEdit && fullBlog) {
      form.reset({
        title:      fullBlog.title,
        slug:       fullBlog.slug,
        excerpt:    fullBlog.excerpt    ?? "",
        content:    fullBlog.content    ?? "",
        coverImage: fullBlog.coverImage ?? "",
        published:  fullBlog.published,
      });
    } else if (!isEdit) {
      form.reset({
        title: "", slug: "", excerpt: "", content: "",
        coverImage: "", published: false,
      });
    }
  }, [open, fullBlog, isEdit, form]);

  // Auto-slug từ title (chỉ khi tạo mới)
  const titleValue = form.watch("title");
  useEffect(() => {
    if (!isEdit) {
      form.setValue("slug", autoSlug(titleValue), { shouldValidate: false });
    }
  }, [titleValue, isEdit, form]);

  const createMutation = useMutation({
    mutationFn: adminCreateBlog,
    onSuccess: () => {
      toast.success("Đã tạo bài viết mới!");
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: BlogFormValues) => adminUpdateBlog(blog!.id, data),
    onSuccess: () => {
      toast.success("Đã lưu thay đổi!");
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      qc.removeQueries({ queryKey: ["admin-blog-detail", blog?.id] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: BlogFormValues) => {
    if (isEdit) updateMutation.mutate(values);
    else         createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[92vh] overflow-y-auto p-0"
        style={{ background: "#111113", border: "1px solid #27272a" }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-white text-base font-bold flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)" }}>
              <Wand2 size={14} style={{ color: "#a78bfa" }} />
            </div>
            {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            {isEdit
              ? "Cập nhật thông tin, nội dung và ảnh bìa"
              : "Điền đầy đủ thông tin để tạo bài viết mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 pt-4 space-y-5">

            {/* ── Cover Image ── */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs font-semibold">Ảnh bìa</FormLabel>
                  <FormControl>
                    <ImageUploader value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Title ── */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs font-semibold">
                    Tiêu đề <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nhập tiêu đề bài viết..."
                      className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-violet-500 focus-visible:ring-violet-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            {/* ── Slug ── */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs font-semibold">
                    Slug (URL) <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden focus-within:border-violet-500 transition-colors">
                      <span className="px-3 text-xs text-zinc-600 border-r border-zinc-700 h-9 flex items-center select-none">
                        /blog/
                      </span>
                      <input
                        {...field}
                        placeholder="ten-bai-viet"
                        className="flex-1 h-9 px-3 bg-transparent text-white text-sm placeholder-zinc-600 outline-none"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-zinc-600 text-[11px]">
                    URL sẽ là: /blog/{field.value || "ten-bai-viet"}
                  </FormDescription>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            {/* ── Excerpt ── */}
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs font-semibold">Tóm tắt</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Mô tả ngắn hiển thị trong danh sách blog..."
                      className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 resize-none focus:border-violet-500 focus-visible:ring-violet-500/20"
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage className="text-red-400 text-xs" />
                    <span className="text-zinc-700 text-[11px]">
                      {(field.value ?? "").length}/500
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* ── Content ── */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1.5">
                    <FormLabel className="text-zinc-300 text-xs font-semibold">
                      Nội dung <span className="text-red-400">*</span>
                    </FormLabel>
                    <span className="text-zinc-600 text-[10px] font-mono">HTML</span>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={12}
                      placeholder={"<h2>Tiêu đề phần</h2>\n<p>Nội dung bài viết...</p>"}
                      className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 font-mono text-xs resize-y focus:border-violet-500 focus-visible:ring-violet-500/20 leading-relaxed"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            {/* ── Published ── */}
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl p-4"
                  style={{ background: "#18181b", border: "1px solid #27272a" }}>
                  <div>
                    <FormLabel className="text-zinc-200 text-sm font-semibold cursor-pointer">
                      Xuất bản ngay
                    </FormLabel>
                    <FormDescription className="text-zinc-500 text-xs">
                      {field.value
                        ? "Bài viết sẽ hiện trên trang /blog"
                        : "Bài viết đang ở chế độ nháp"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isEdit ? "Lưu thay đổi" : "Tạo bài viết"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
