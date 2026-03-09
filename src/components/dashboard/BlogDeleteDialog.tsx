"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { adminDeleteBlog } from "@/services/adminBlogService";
import type { Blog } from "@/types";

interface BlogDeleteDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  blog:         Blog | null;
}

export function BlogDeleteDialog({ open, onOpenChange, blog }: BlogDeleteDialogProps) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => adminDeleteBlog(blog!.id),
    onSuccess: () => {
      toast.success("Đã xóa bài viết");
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!blog) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        style={{ background: "#111113", border: "1px solid #27272a" }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(239,68,68,0.12)" }}
            >
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <DialogTitle className="text-white text-base font-bold">
              Xóa bài viết?
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-sm leading-relaxed pl-[52px]">
            Bài viết{" "}
            <span className="text-zinc-200 font-semibold">
              &ldquo;{blog.title}&rdquo;
            </span>{" "}
            sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            className="flex-1 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-2 font-semibold"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Xóa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
