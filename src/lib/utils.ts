import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString("vi-VN");
}

export function bytesToMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
