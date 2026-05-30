"use server";

import crypto from "crypto";

// Helper function to hash user data precisely how Meta requires it
const hashData = (data: string) => {
  if (!data) return "";
  return crypto.createHash("sha256").update(data.trim().toLowerCase()).digest("hex");
};

export async function trackMetaPurchase(orderData: {
  orderId: string;
  value: number;
  currency: string;
  userEmail: string;
  userPhone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}) {
  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const CAPI_TOKEN = process.env.META_CAPI_TOKEN;

  if (!PIXEL_ID || !CAPI_TOKEN) {
    console.error("Meta CAPI Error: Missing environment variables.");
    return { success: false };
  }

  // 1. Construct the payload matching Meta's strict Conversion API schema
  const payload = {
    test_event_code: "TEST12345",
    data: [
        {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        // ... the rest of your data
      },
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        action_source: "website",
        user_data: {
          em: [hashData(orderData.userEmail)], // Hashed Email
          ph: orderData.userPhone ? [hashData(orderData.userPhone)] : [], // Hashed Phone
          client_ip_address: orderData.clientIpAddress || "",
          client_user_agent: orderData.clientUserAgent || "",
        },
        custom_data: {
          currency: orderData.currency || "INR",
          value: orderData.value,
          content_ids: [orderData.orderId],
          content_type: "product",
        },
      },
    ],
  };

  // 2. Transmit directly to Meta's Graph API
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Meta CAPI Rejection:", result);
      return { success: false, error: result };
    }

    return { success: true, eventId: result.fbtrace_id };
  } catch (error) {
    console.error("Meta CAPI Network Error:", error);
    return { success: false };
  }
}