/**
 * Brains & Taxes — NPCI UPI v2.0 Dynamic Engine & App Deep-Link Dispatcher
 * 
 * Complies strictly with NPCI UPI Linking Specifications:
 * upi://pay?pa=<vpa>&pn=<merchant>&am=<amount>&cu=INR&tn=<note>&tr=<ref>
 * 
 * Generates:
 * 1. Standard Universal NPCI UPI URI
 * 2. 1-Tap Intent URIs for Indian Mobile Ecosystem (PhonePe, GPay, Paytm, BHIM)
 * 3. Offline Data URL QR Codes using local qrcode generator (0ms, 0 external API cost)
 */

import QRCode from "qrcode";

export interface NpciUpiParams {
  firmVpa: string;            // e.g. ca.gunjan@icici or 9893723639@okbizaxis
  merchantName: string;       // e.g. "Brains & Taxes CA Firm"
  amount: number;             // e.g. 4500.00
  invoiceNo: string;          // e.g. "INV-2026-1024"
  clientName?: string;        // e.g. "Pratwi Solutions"
  transactionNote?: string;   // Optional custom note
}

export interface UpiDeepLinks {
  universalUri: string;
  phonePeUri: string;
  gPayUri: string;
  paytmUri: string;
  bhimUri: string;
  formattedAmount: string;
}

/**
 * Generates official NPCI-compliant universal and app-specific UPI deep-links
 */
export function generateNpciUpiDeepLinks(params: NpciUpiParams): UpiDeepLinks {
  const vpa = params.firmVpa.trim();
  const name = params.merchantName.trim();
  const amt = params.amount.toFixed(2);
  const ref = params.invoiceNo.trim();
  
  const rawNote = params.transactionNote || 
    `Fee ${params.invoiceNo} ${params.clientName ? "- " + params.clientName.slice(0, 15) : ""}`;
  const note = rawNote.trim();

  // NPCI UPI Standard Query String
  const query = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: amt,
    cu: "INR",
    tr: ref,
    tn: note
  }).toString();

  const universalUri = `upi://pay?${query}`;

  return {
    universalUri,
    phonePeUri: `phonepe://pay?${query}`,
    gPayUri: `gpay://upi/pay?${query}`,
    paytmUri: `paytmmp://pay?${query}`,
    bhimUri: `bhim://pay?${query}`,
    formattedAmount: `₹${params.amount.toLocaleString("en-IN")}`
  };
}

/**
 * Universal NPCI Dynamic UPI URI helper supporting both config object and positional arguments
 */
export function generateNpciDynamicUpiUri(
  vpaOrParams: string | { vpa?: string; firmVpa?: string; payeeName?: string; merchantName?: string; amount: number; invoiceNo: string; note?: string; clientName?: string },
  merchantName?: string,
  amount?: number,
  invoiceNo?: string,
  clientName?: string
): string {
  if (typeof vpaOrParams === "object") {
    const vpa = (vpaOrParams.firmVpa || vpaOrParams.vpa || "BRAINSANDTAXES@icici").trim();
    const name = (vpaOrParams.merchantName || vpaOrParams.payeeName || "GPA & Co., Chartered Accountants").trim();
    const amt = vpaOrParams.amount.toFixed(2);
    const ref = (vpaOrParams.invoiceNo || "INV").trim();
    const note = (vpaOrParams.note || `Fee ${vpaOrParams.invoiceNo}`).trim();
    const query = new URLSearchParams({
      pa: vpa,
      pn: name,
      am: amt,
      cu: "INR",
      tr: ref,
      tn: note
    }).toString();
    return `upi://pay?${query}`;
  } else {
    const vpa = vpaOrParams.trim();
    const name = (merchantName || "GPA & Co., Chartered Accountants").trim();
    const amt = (amount || 0).toFixed(2);
    const ref = (invoiceNo || "INV").trim();
    const note = `Fee ${ref} ${clientName ? "- " + clientName.slice(0, 15) : ""}`.trim();
    const query = new URLSearchParams({
      pa: vpa,
      pn: name,
      am: amt,
      cu: "INR",
      tr: ref,
      tn: note
    }).toString();
    return `upi://pay?${query}`;
  }
}

/**
 * Generates an SVG or PNG QR Code data URL locally in 0ms (zero external network calls)
 */
export async function generateUpiQrDataUrl(
  universalUpiUri: string, 
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<string> {
  const opts = {
    width: options?.width || 280,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || "#1e293b", // Slate 800 (clean, readable)
      light: options?.color?.light || "#ffffff" // Clean white background
    },
    errorCorrectionLevel: "M" as const
  };

  try {
    return await QRCode.toDataURL(universalUpiUri, opts);
  } catch (err) {
    console.error("Failed to generate UPI QR code:", err);
    return "";
  }
}
