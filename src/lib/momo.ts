// src/lib/momo.ts
// MoMo Vietnam Payment Gateway helpers

import crypto from "crypto";

/* ── Config ── */
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE!;
const MOMO_ACCESS_KEY   = process.env.MOMO_ACCESS_KEY!;
const MOMO_SECRET_KEY   = process.env.MOMO_SECRET_KEY!;

const MOMO_MODE = process.env.MOMO_MODE ?? "sandbox";
const MOMO_ENDPOINT = MOMO_MODE === "production"
  ? "https://payment.momo.vn"
  : "https://test-payment.momo.vn";

/* ── Signature helpers ── */

/** Create HMAC SHA256 signature */
export function createSignature(rawSignature: string): string {
  return crypto
    .createHmac("sha256", MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest("hex");
}

/** Verify callback/IPN signature */
export function verifyIpnSignature(params: {
  accessKey?: string;
  amount: number;
  extraData: string;
  message: string;
  orderId: string;
  orderInfo: string;
  orderType: string;
  partnerCode: string;
  payType: string;
  requestId: string;
  responseTime: number;
  resultCode: number;
  transId: number;
}): boolean {
  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}` +
    `&amount=${params.amount}` +
    `&extraData=${params.extraData}` +
    `&message=${params.message}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&orderType=${params.orderType}` +
    `&partnerCode=${params.partnerCode}` +
    `&payType=${params.payType}` +
    `&requestId=${params.requestId}` +
    `&responseTime=${params.responseTime}` +
    `&resultCode=${params.resultCode}` +
    `&transId=${params.transId}`;

  const expectedSignature = createSignature(rawSignature);
  // Use params that has signature field
  const receivedSignature = (params as any).signature;
  return expectedSignature === receivedSignature;
}

/* ── Create payment ── */
export interface CreateMoMoPaymentParams {
  orderId: string;        // unique order ID
  requestId: string;      // unique request ID
  amount: number;         // VND amount
  orderInfo: string;      // description
  extraData: string;      // base64 encoded JSON
  redirectUrl: string;    // where user returns after payment
  ipnUrl: string;         // server callback URL
}

export interface MoMoCreateResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export async function createMoMoPayment(params: CreateMoMoPaymentParams): Promise<MoMoCreateResponse> {
  const { orderId, requestId, amount, orderInfo, extraData, redirectUrl, ipnUrl } = params;

  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${MOMO_PARTNER_CODE}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=captureWallet`;

  const signature = createSignature(rawSignature);

  const body = {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey: MOMO_ACCESS_KEY,
    requestType: "captureWallet",
    ipnUrl,
    redirectUrl,
    orderId,
    amount,
    orderInfo,
    requestId,
    extraData,
    signature,
    lang: "vi",
  };

  const res = await fetch(`${MOMO_ENDPOINT}/v2/gateway/api/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.resultCode !== 0) {
    console.error("[momo] Create payment failed:", data);
    throw new Error(data.message ?? "MoMo payment creation failed");
  }

  return data as MoMoCreateResponse;
}
