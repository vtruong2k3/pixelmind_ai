// src/lib/roles.ts
// Hệ thống phân quyền 3 cấp: USER → STAFF → ADMIN

export type UserRole = "USER" | "STAFF" | "ADMIN";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER:  0,
  STAFF: 1,
  ADMIN: 2,
};

/**
 * Kiểm tra user có ít nhất role yêu cầu không
 * @param userRole - role hiện tại của user
 * @param minRole  - role tối thiểu cần có
 */
export function hasMinRole(userRole: string | undefined | null, minRole: UserRole): boolean {
  if (!userRole) return false;
  const userLevel  = ROLE_HIERARCHY[userRole as UserRole] ?? -1;
  const minLevel   = ROLE_HIERARCHY[minRole];
  return userLevel >= minLevel;
}

/**
 * Dùng trong API routes (Server Actions / Route Handlers)
 * Trả về Response 401/403 nếu không đủ quyền, null nếu OK
 */
export function requireRoleResponse(
  role: string | undefined | null,
  minRole: UserRole
): Response | null {
  if (!role) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!hasMinRole(role, minRole)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

/** Label hiển thị */
export const ROLE_LABELS: Record<UserRole, string> = {
  USER:  "Người dùng",
  STAFF: "Nhân viên",
  ADMIN: "Quản trị viên",
};

/** Badge color */
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  USER:  { bg: "bg-zinc-800",   text: "text-zinc-300"  },
  STAFF: { bg: "bg-blue-900/50", text: "text-blue-300"  },
  ADMIN: { bg: "bg-red-900/50",  text: "text-red-400"   },
};
