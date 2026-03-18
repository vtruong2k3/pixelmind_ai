/**
 * lib/export-csv.ts — Client-side CSV generation and download
 */

type Row = Record<string, unknown>;

/**
 * Convert array of objects to CSV and trigger download
 */
export function exportCSV(data: Row[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Excel UTF-8
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Flatten an admin user object for CSV export
 */
export function flattenUser(u: any) {
  return {
    ID: u.id,
    Name: u.name ?? "",
    Email: u.email,
    Role: u.role,
    Credits: u.credits,
    Plan: u.plan,
    "Plan Expires": u.planExpiresAt ?? "",
    Banned: u.isBanned ? "Yes" : "No",
    "Ban Reason": u.banReason ?? "",
    Jobs: u._count?.jobs ?? "",
    Transactions: u._count?.creditTransactions ?? "",
    "Created At": u.createdAt,
  };
}

/**
 * Flatten a job object for CSV export
 */
export function flattenJob(j: any) {
  return {
    ID: j.id,
    Feature: j.featureName,
    Status: j.status,
    Quality: j.quality,
    Credits: j.creditUsed,
    User: j.user?.email ?? "",
    "Created At": j.createdAt,
    Error: j.errorMsg ?? "",
  };
}

/**
 * Flatten a credit transaction for CSV export
 */
export function flattenTransaction(t: any) {
  return {
    ID: t.id,
    Type: t.type,
    Amount: t.amount,
    Description: t.description,
    User: t.user?.email ?? "",
    "Created At": t.createdAt,
  };
}
