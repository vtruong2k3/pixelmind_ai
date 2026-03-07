// src/services/api.ts
// Axios base instance — dùng chung cho tất cả services

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Response interceptor — tự động extract data hoặc throw error
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error ?? err.message ?? "Lỗi không xác định";
    return Promise.reject(new Error(msg));
  }
);

export default api;
