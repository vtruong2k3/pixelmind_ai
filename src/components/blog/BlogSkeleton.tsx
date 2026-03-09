"use client";

// Skeleton card — mimics BlogCard layout
function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
      {/* Cover skeleton */}
      <div className="bg-gray-100" style={{ aspectRatio: "16/9" }} />

      {/* Body */}
      <div className="p-5 flex flex-col gap-3">
        {/* Title */}
        <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/2" />

        {/* Excerpt */}
        <div className="space-y-2 mt-1">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
          <div className="h-3 bg-gray-100 rounded w-4/6" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

interface BlogSkeletonProps {
  count?: number;
}

export default function BlogSkeleton({ count = 9 }: BlogSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
