"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Optional label, e.g. "users" or "jobs" */
  itemLabel?: string;
}

export function DashboardPagination({
  page, totalPages, total, onPageChange, itemLabel = "kết quả",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * Math.ceil(total / totalPages) + 1;
  const to   = Math.min(page * Math.ceil(total / totalPages), total);

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      {/* Info */}
      <p className="text-[10px]" style={{ color: "#52525b" }}>
        {from}–{to} / {total.toLocaleString("vi-VN")} {itemLabel}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onPageChange(1)} disabled={page <= 1}
          className="h-7 w-7 p-0 text-zinc-500 hover:text-white" title="Trang đầu">
          <ChevronsLeft size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="h-7 w-7 p-0 text-zinc-500 hover:text-white" title="Trang trước">
          <ChevronLeft size={13} />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5 mx-1">
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="w-7 text-center text-[10px]" style={{ color: "#3f3f46" }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className="h-7 w-7 rounded-md text-xs font-semibold transition-all"
                style={p === page
                  ? { background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.25)" }
                  : { color: "#71717a" }
                }
                onMouseEnter={e => { if (p !== page) (e.target as HTMLElement).style.background = "#27272a"; }}
                onMouseLeave={e => { if (p !== page) (e.target as HTMLElement).style.background = "transparent"; }}
              >
                {p}
              </button>
            )
          )}
        </div>

        <Button size="sm" variant="ghost" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="h-7 w-7 p-0 text-zinc-500 hover:text-white" title="Trang sau">
          <ChevronRight size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}
          className="h-7 w-7 p-0 text-zinc-500 hover:text-white" title="Trang cuối">
          <ChevronsRight size={13} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Generate page numbers with ellipsis
 * e.g. [1, 2, "...", 5, 6, 7, "...", 10]
 */
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) pages.push("...");

  // Show pages around current
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  // Always show last page
  if (total > 1) pages.push(total);

  return pages;
}
