// src/lib/discord.ts

export const DISCORD_PAYMENT_WEBHOOK_URL = process.env.DISCORD_PAYMENT_WEBHOOK_URL!;

interface PaymentDetails {
  email: string;
  username: string;
  planName: string;
  credits: number;
  amountUSD: number;
  purchaseDate: Date;
  expirationDate: Date;
}

export async function sendDiscordPaymentNotification(details: PaymentDetails) {
  try {
    if (!DISCORD_PAYMENT_WEBHOOK_URL) {
      console.warn("Discord webhook URL is not configured.");
      return;
    }

    const payload = {
      username: "PixelMind AI",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",

      embeds: [
        {
          title: "💳 Payment Successful",
          description: "A new subscription payment has been completed.",
          color: 0x2ecc71,

          thumbnail: {
            url: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          },

          fields: [
            {
              name: "👤 User",
              value: `**${details.username}**`,
              inline: true,
            },
            {
              name: "📧 Email",
              value: `**${details.email}**`,
              inline: true,
            },
            {
              name: "📦 Plan",
              value: `**${details.planName}**`,
              inline: true,
            },
            {
              name: "💰 Amount",
              value: `**$${details.amountUSD.toFixed(2)} USD**`,
              inline: true,
            },
            {
              name: "🪙 Credits",
              value: `**+${details.credits} Credits**`,
              inline: true,
            },
            {
              name: "📅 Purchase Time",
              value: `${details.purchaseDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
              inline: true,
            },
            {
              name: "⏳ Expiration",
              value: `${details.expirationDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
              inline: true,
            },
          ],


          footer: {
            text: "PixelMind AI • Payment System",
          },

          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(DISCORD_PAYMENT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to send Discord notification. Status: ${response.status}`, await response.text());
    }
  } catch (error) {
    console.error("Error sending Discord payment notification:", error);
  }
}
