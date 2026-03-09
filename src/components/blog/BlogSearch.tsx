"use client";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface BlogSearchProps {
  value:    string;
  onChange: (value: string) => void;
}

export default function BlogSearch({ value, onChange }: BlogSearchProps) {
  const [local, setLocal] = useState(value);

  // Debounce 350ms
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder="Tìm kiếm bài viết..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder-gray-400 text-gray-800"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Xóa tìm kiếm"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
