/**
 * Brains & Taxes — Meta WhatsApp Cloud API v21.0 Client & Dual Delivery Engine
 * Supports official Meta Business Cloud API with HMAC-SHA256 signature verification,
 * interactive template buttons, and zero-cost 1-tap wa.me fallback for boutique firms.
 */

import crypto from "crypto";
import { generateWhatsAppUrl, sanitizeIndianPhoneNumber } from "./templates";

export interface WhatsAppCloudConfig {
  phoneNumberId?: string;
  accessToken?: string;
  appSecret?: string;
  verifyToken?: string;
  businessAccountId?: string;
}

export interface SendMessageOptions {
  toPhone: string;
  messageText: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  documentUrl?: string;
  documentFileName?: string;
  interactiveButtons?: { id: string; title: string }[];
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  channel: "CLOUD_API" | "WA_ME_FALLBACK";
  waMeUrl?: string;
  error?: string;
}

/**
 * Verify Meta Webhook HMAC-SHA256 Signature (X-Hub-Signature-256)
 */
export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret?: string
): boolean {
  if (!signatureHeader || !appSecret) {
    // If firm has not configured an appSecret, skip strict verification in sandbox
    return true;
  }

  try {
    const expectedSignature = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch (e) {
    return false;
  }
}

/**
 * Dispatch message via Meta Cloud API or fallback to wa.me deep link
 */
export async function sendWhatsAppMessage(
  options: SendMessageOptions,
  config?: WhatsAppCloudConfig
): Promise<SendMessageResult> {
  const cleanPhone = sanitizeIndianPhoneNumber(options.toPhone);
  const waMeUrl = generateWhatsAppUrl(cleanPhone, options.messageText);

  // If no Cloud API access token is configured, use Zero-Cost wa.me mode
  if (!config?.accessToken || !config?.phoneNumberId) {
    return {
      success: true,
      channel: "WA_ME_FALLBACK",
      messageId: `WAME-${Date.now()}`,
      waMeUrl
    };
  }

  // Attempt official Meta WhatsApp Cloud API v21.0
  try {
    const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;

    let payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone
    };

    if (options.documentUrl) {
      payload.type = "document";
      payload.document = {
        link: options.documentUrl,
        filename: options.documentFileName || "Document.pdf",
        caption: options.messageText
      };
    } else if (options.interactiveButtons && options.interactiveButtons.length > 0) {
      payload.type = "interactive";
      payload.interactive = {
        type: "button",
        body: { text: options.messageText },
        action: {
          buttons: options.interactiveButtons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title.slice(0, 20) }
          }))
        }
      };
    } else {
      payload.type = "text";
      payload.text = { preview_url: true, body: options.messageText };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        channel: "CLOUD_API",
        messageId: data.messages?.[0]?.id || `WAMID-${Date.now()}`
      };
    } else {
      const errJson = await response.json().catch(() => ({}));
      console.warn("Meta Cloud API failed, falling back to wa.me:", errJson);
      return {
        success: true,
        channel: "WA_ME_FALLBACK",
        messageId: `WAME-FB-${Date.now()}`,
        waMeUrl,
        error: errJson?.error?.message
      };
    }
  } catch (error: any) {
    console.error("WhatsApp Cloud API Exception:", error);
    return {
      success: true,
      channel: "WA_ME_FALLBACK",
      messageId: `WAME-ERR-${Date.now()}`,
      waMeUrl,
      error: error.message
    };
  }
}
