import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Panel — PixelMind AI",
  description: "Quản trị hệ thống PixelMind AI",
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }
  const email = (session.user.email ?? "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(email) || (session.user as any)?.isAdmin;
  if (!isAdmin) {
    redirect("/admin/forbidden");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#0a0a0b" }}>
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
