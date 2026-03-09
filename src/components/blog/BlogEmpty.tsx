"use client";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface BlogEmptyProps {
  search?: string;
}

export default function BlogEmpty({ search }: BlogEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(124,58,237,0.08)" }}
      >
        <FileText size={28} style={{ color: "#7c3aed" }} />
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {search ? "Không tìm thấy bài viết" : "Chưa có bài viết nào"}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
        {search
          ? `Không có kết quả cho "${search}". Thử từ khóa khác nhé!`
          : "Các bài viết sẽ xuất hiện ở đây sau khi được xuất bản."}
      </p>
    </motion.div>
  );
}
