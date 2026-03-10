import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromAddress =
  process.env.SMTP_FROM || '"PixelMind AI" <noreply@pixelmind.ai>';

/* ======================================================
   1. EMAIL XÁC THỰC ĐĂNG KÝ
   ====================================================== */
export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Xác thực Email - PixelMind AI</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#7c3aed 100%);padding:48px 40px 44px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
            <tr><td style="background:rgba(255,255,255,0.18);border-radius:14px;padding:12px;">
              <svg width="40" height="40" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="34" height="34" rx="7" fill="white" fill-opacity="0.25"/>
                <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white"/>
              </svg>
            </td></tr>
          </table>
          <p style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">PixelMind AI</p>
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;line-height:1.3;">Xác nhận địa chỉ Email</h1>
          <p style="color:rgba(255,255,255,0.82);margin:12px 0 0;font-size:15px;line-height:1.5;">Chỉ cần một bước nữa để hoàn tất đăng ký!</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:40px 44px 36px;">
          <p style="margin:0 0 14px;color:#1f2937;font-size:16px;font-weight:600;">Xin chào,</p>
          <p style="margin:0 0 22px;color:#4b5563;font-size:15px;line-height:1.75;">
            Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color:#6366f1;">PixelMind AI</strong>.
            Để bắt đầu sử dụng đầy đủ tính năng và nhận <strong>10 credits miễn phí</strong>, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấn vào nút bên dưới.
          </p>

          <!-- CTA BUTTON -->
          <table cellpadding="0" cellspacing="0" style="margin:32px auto;">
            <tr><td align="center" style="border-radius:10px;background:linear-gradient(135deg,#6366f1,#7c3aed);box-shadow:0 6px 20px rgba(99,102,241,0.45);">
              <a href="${verifyUrl}" style="display:inline-block;padding:16px 52px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                ✅ Xác nhận Email ngay
              </a>
            </td></tr>
          </table>

          <!-- INFO BOX -->
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0;color:#6d28d9;font-size:13px;line-height:1.65;">
                ⏰ <strong>Lưu ý:</strong> Đường liên kết này chỉ có hiệu lực trong <strong>24 giờ</strong>.
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
              </p>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">Nút không hoạt động? Dán liên kết sau vào trình duyệt:</p>
          <p style="margin:0;word-break:break-all;font-size:11px;color:#a1a1aa;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;">${verifyUrl}</p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr><td style="padding:0 44px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>
      <tr>
        <td style="padding:22px 44px 32px;text-align:center;">
          <p style="margin:0 0 6px;color:#9ca3af;font-size:12px;">&copy; ${year} PixelMind AI. All rights reserved.</p>
          <p style="margin:0;color:#c4c4cc;font-size:11px;">Email được gửi tự động, vui lòng không phản hồi.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "[PixelMind AI] Xác nhận địa chỉ email của bạn",
      html,
    });
    console.log("[mail] Verification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("[mail] Error sending verification email:", error);
    return false;
  }
}

/* ======================================================
   2. EMAIL THÔNG BÁO MUA GÓI
   ====================================================== */
export async function sendPackageUpgradeEmail(
  email: string,
  planName: string,
  duration: string,
  expiresAt: Date
) {
  const planKey = planName.toLowerCase();
  const planLabel =
    planKey === "max"
      ? "Max"
      : planKey === "pro"
      ? "Pro"
      : planKey === "starter"
      ? "Starter"
      : planName;
  const badgeText =
    planKey === "max" ? "VIP MAX" : planKey === "pro" ? "PRO" : "STARTER";
  const badgeColor =
    planKey === "max"
      ? "#b45309"
      : planKey === "pro"
      ? "#7c3aed"
      : "#2563eb";

  const expiresFormatted = expiresAt.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Nâng cấp gói thành công - PixelMind AI</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e1b4b 0%,#3730a3 45%,#4c1d95 100%);padding:48px 40px 44px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
            <tr><td style="background:rgba(255,255,255,0.12);border-radius:14px;padding:12px;">
              <svg width="40" height="40" viewBox="0 0 34 34" fill="none">
                <rect width="34" height="34" rx="7" fill="white" fill-opacity="0.25"/>
                <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white"/>
              </svg>
            </td></tr>
          </table>
          <p style="color:rgba(255,255,255,0.65);font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">PixelMind AI</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
            <tr><td style="background:${badgeColor};border-radius:20px;padding:6px 22px;">
              <span style="color:#fff;font-size:13px;font-weight:800;letter-spacing:2px;">${badgeText}</span>
            </td></tr>
          </table>
          <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;line-height:1.35;">Nâng cấp thành công! 🎉</h1>
          <p style="color:rgba(255,255,255,0.78);margin:12px 0 0;font-size:15px;">Gói <strong>${planLabel}</strong> đã được kích hoạt cho tài khoản của bạn.</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:40px 44px 0;">
          <p style="margin:0 0 14px;color:#1f2937;font-size:16px;font-weight:600;">Xin chào,</p>
          <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.75;">
            Giao dịch của bạn đã được xử lý <strong>thành công</strong>.
            Cảm ơn bạn đã tin tưởng và lựa chọn <strong style="color:#7c3aed;">PixelMind AI</strong>!
          </p>

          <!-- CHI TIẾT GÓI -->
          <table cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #c4b5fd;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:22px 24px;">
              <p style="margin:0 0 16px;color:#4c1d95;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">📋 Chi tiết gói dịch vụ</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #ddd6fe;color:#6b7280;font-size:14px;">Gói đã mua</td>
                  <td style="padding:10px 0;border-bottom:1px solid #ddd6fe;text-align:right;"><strong style="color:#1e1b4b;font-size:15px;">${planLabel}</strong></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #ddd6fe;color:#6b7280;font-size:14px;">Thời gian sử dụng</td>
                  <td style="padding:10px 0;border-bottom:1px solid #ddd6fe;text-align:right;"><strong style="color:#1e1b4b;font-size:15px;">${duration}</strong></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:14px;">Ngày hết hạn</td>
                  <td style="padding:10px 0;text-align:right;"><strong style="color:#dc2626;font-size:15px;">⏰ ${expiresFormatted}</strong></td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- NHẮC NHỞ GIA HẠN -->
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0;color:#92400e;font-size:13px;line-height:1.7;">
                💡 <strong>Nhắc nhở:</strong> Hệ thống sẽ tự động gửi cảnh báo gia hạn trước khi gói của bạn hết hạn.
                Vui lòng gia hạn kịp thời để không bị gián đoạn dịch vụ.
              </p>
            </td></tr>
          </table>

          <p style="margin:0 0 32px;color:#6b7280;font-size:14px;line-height:1.7;">
            Chúc bạn có những trải nghiệm tuyệt vời với các tính năng AI cao cấp.
            Nếu cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi!
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr><td style="padding:0 44px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>
      <tr>
        <td style="padding:22px 44px 32px;text-align:center;">
          <p style="margin:0 0 6px;color:#9ca3af;font-size:12px;">&copy; ${year} PixelMind AI. All rights reserved.</p>
          <p style="margin:0;color:#c4c4cc;font-size:11px;">Email được gửi tự động, vui lòng không phản hồi.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `[PixelMind AI] Nâng cấp gói ${planLabel} thành công! 🎉`,
      html,
    });
    console.log("[mail] Package upgrade email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("[mail] Error sending upgrade email:", error);
    return false;
  }
}
