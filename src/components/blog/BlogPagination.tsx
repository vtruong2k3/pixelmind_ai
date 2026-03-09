"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPaginationProps {
  page:       number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function BlogPagination({ page, totalPages, onPageChange }: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  // Tạo danh sách số trang để hiển thị (max 5 nút)
  const getPages = () => {
    const delta = 2;
    const range: (number | "...")[] = [];
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);

    return range;
  };

  const pages = getPages();

  const btnBase =
    "w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all";
  const btnActive =
    "text-white shadow-sm";
  const btnInactive =
    "text-gray-600 hover:bg-gray-100 border border-gray-200";
  const btnDisabled =
    "text-gray-300 border border-gray-100 cursor-not-allowed";

  return (
    <nav
      className="flex items-center justify-center gap-1.5 mt-12"
      aria-label="Phân trang"
    >
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`${btnBase} ${
              p === page
                ? `${btnActive}`
                : btnInactive
            }`}
            style={
              p === page
                ? { background: "linear-gradient(135deg,#dc2626 0%,#7c3aed 100%)" }
                : {}
            }
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btnBase} ${page >= totalPages ? btnDisabled : btnInactive}`}
        aria-label="Trang sau"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
