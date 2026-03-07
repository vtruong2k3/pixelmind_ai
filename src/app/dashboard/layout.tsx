import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardClientLayout } from "@/components/dashboard/DashboardClientLayout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? headersList.get("x-pathname") ?? "";

  // /dashboard/login — không cần auth, không có sidebar
  if (pathname === "/dashboard/login" || pathname.startsWith("/dashboard/login")) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0b" }}>
        {children}
      </div>
    );
  }

  const session = await auth();
  if (!session?.user) redirect("/dashboard/login");

  return (
    // DashboardClientLayout = 1 QueryClient singleton chia sẻ cho toàn bộ dashboard
    // → navigate giữa pages không re-fetch nếu data còn trong cache (staleTime 1 phút)
    <DashboardClientLayout>
      <div className="flex min-h-screen" style={{ background: "#0a0a0b" }}>
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </DashboardClientLayout>
  );
}
