// GET /api/momo/callback — User redirect after MoMo payment
// MoMo redirects user here with query params indicating result

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resultCode = searchParams.get("resultCode");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  console.log(`[momo/callback] resultCode=${resultCode} orderId=${orderId} message=${message}`);

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (resultCode === "0") {
    // Success — IPN already processed credits, just redirect
    return NextResponse.redirect(`${baseUrl}/pricing?momo=success`);
  } else {
    // Failed or cancelled
    const errorMsg = encodeURIComponent(message ?? "Thanh toán thất bại");
    return NextResponse.redirect(`${baseUrl}/pricing?momo=error&message=${errorMsg}`);
  }
}
