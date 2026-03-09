"use client";
import { useQuery } from "@tanstack/react-query";
import { useBlogStore } from "@/store/blogStore";
import { fetchBlogs } from "@/services/blogService";
import BlogSearch from "./BlogSearch";
import BlogCard from "./BlogCard";
import BlogSkeleton from "./BlogSkeleton";
import BlogPagination from "./BlogPagination";
import BlogEmpty from "./BlogEmpty";

const LIMIT = 9;

export default function BlogListClient() {
  const { page, search, setPage, setSearch } = useBlogStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blogs", page, search],
    queryFn:  () => fetchBlogs({ page, limit: LIMIT, search }),
    placeholderData: (prev) => prev, // giữ UI cũ khi đang fetch trang mới
    staleTime: 1000 * 60 * 2, // 2 phút
  });

  return (
    <section className="max-w-[1200px] mx-auto px-6 pb-20">
      {/* Search bar */}
      <div className="flex justify-center mb-10">
        <BlogSearch value={search} onChange={setSearch} />
      </div>

      {/* Count */}
      {!isLoading && data && data.total > 0 && (
        <p className="text-sm text-gray-400 mb-6 text-center">
          Tìm thấy <strong className="text-gray-700">{data.total}</strong> bài viết
          {search && (
            <>
              {" "}cho từ khóa <strong className="text-violet-600">"{search}"</strong>
            </>
          )}
        </p>
      )}

      {/* Loading */}
      {isLoading && <BlogSkeleton count={LIMIT} />}

      {/* Error */}
      {isError && (
        <div className="text-center py-20 text-red-500 text-sm">
          Có lỗi xảy ra khi tải bài viết. Vui lòng thử lại.
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && (
        <>
          {data?.blogs.length === 0 ? (
            <BlogEmpty search={search} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.blogs.map((blog, i) => (
                <BlogCard key={blog.id} blog={blog} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <BlogPagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </>
      )}
    </section>
  );
}
