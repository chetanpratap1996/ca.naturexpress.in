export interface FirmBrandingConfig {
  firmName: string; // CA Audit Practice (on seal)
  companyName: string; // Corporate entity
  firmShortName: string;
  tagline: string;
  frn: string; // Firm Registration Number (ICAI)
  cin: string; // Corporate Identification Number (MCA)
  headOffice: string;
  managingPartner: string;
  partnerPhone: string;
  supportPhone: string;
  whatsappNumber: string;
  partnerWhatsappNumber: string;
  email: string;
  peerReviewNo: string;
  firmUpiVpa: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
  };
}

export interface ClientBrandingConfig {
  groupName: string;
  primaryContactName: string;
  designation: string;
  phone: string;
  email: string;
  defaultEntityId: string;
}

const isProduction = process.env.NODE_ENV === "production";

export const DEFAULT_FIRM_BRANDING: FirmBrandingConfig = {
  firmName: isProduction ? process.env.NEXT_PUBLIC_FIRM_NAME || "" : "GPA & Co., Chartered Accountants",
  companyName: isProduction ? process.env.NEXT_PUBLIC_COMPANY_NAME || "" : "Brains & Taxes Private Limited",
  firmShortName: isProduction ? process.env.NEXT_PUBLIC_FIRM_SHORT_NAME || "" : "Brains & Taxes",
  tagline: isProduction ? process.env.NEXT_PUBLIC_FIRM_TAGLINE || "" : "Tax, Documents & Compliance Made Simple",
  frn: isProduction ? process.env.NEXT_PUBLIC_FIRM_FRN || "" : "022998C",
  cin: isProduction ? process.env.NEXT_PUBLIC_FIRM_CIN || "" : "U74110MP2017PTC043716",
  headOffice: isProduction ? process.env.NEXT_PUBLIC_FIRM_ADDRESS || "" : "Office No. 103, NM Verge, Y.N. Road, Indore, Madhya Pradesh - 452001",
  managingPartner: isProduction ? process.env.NEXT_PUBLIC_MANAGING_PARTNER || "" : "CA Gunjan Jain (FCA)",
  partnerPhone: isProduction ? process.env.NEXT_PUBLIC_PARTNER_PHONE || "" : "+91 98937 23639",
  supportPhone: isProduction ? process.env.NEXT_PUBLIC_FIRM_PHONE || "" : "+91 79999 95897",
  whatsappNumber: isProduction ? process.env.NEXT_PUBLIC_FIRM_WHATSAPP || "" : "917999995897",
  partnerWhatsappNumber: isProduction ? process.env.NEXT_PUBLIC_PARTNER_WHATSAPP || "" : "919893723639",
  email: isProduction ? process.env.NEXT_PUBLIC_FIRM_EMAIL || "" : "brainsandtaxes@gmail.com",
  peerReviewNo: isProduction ? process.env.NEXT_PUBLIC_PEER_REVIEW_NO || "" : "ICAI/PRB/022998C",
  firmUpiVpa: isProduction ? process.env.NEXT_PUBLIC_FIRM_UPI_VPA || "" : "7999995897@upi",
  bankDetails: {
    bankName: isProduction ? process.env.NEXT_PUBLIC_FIRM_BANK_NAME || "" : "HDFC Bank",
    accountName: isProduction ? process.env.NEXT_PUBLIC_FIRM_BANK_ACCOUNT_NAME || "" : "Brains & Taxes Private Limited",
    accountNumber: isProduction ? process.env.NEXT_PUBLIC_FIRM_BANK_ACCOUNT_NUMBER || "" : "To be confirmed via bank letter",
    ifsc: isProduction ? process.env.NEXT_PUBLIC_FIRM_BANK_IFSC || "" : "HDFC0000281",
    branch: isProduction ? process.env.NEXT_PUBLIC_FIRM_BANK_BRANCH || "" : "Y.N. Road Branch, Indore",
  },
};

export const DEFAULT_CLIENT_BRANDING: ClientBrandingConfig = {
  groupName: "Client Business Group",
  primaryContactName: "Authorized Signatory",
  designation: "Director / CFO",
  phone: "+91 98000 00000",
  email: "accounts@cliententerprise.in",
  defaultEntityId: "",
};

// Safe storage access for dynamic white-labeling
const STORAGE_KEY_FIRM = "bt_firm_branding_v3";
const STORAGE_KEY_CLIENT = "bt_client_branding_v3";

export function getFirmBranding(): FirmBrandingConfig {
  if (typeof window === "undefined") return DEFAULT_FIRM_BRANDING;
  try {
    // Clean legacy corrupted keys if present
    localStorage.removeItem("taxobrain_firm_branding");
    
    const saved = localStorage.getItem(STORAGE_KEY_FIRM);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_FIRM_BRANDING,
        ...parsed,
        bankDetails: {
          ...DEFAULT_FIRM_BRANDING.bankDetails,
          ...(parsed?.bankDetails || {}),
        },
      };
    }
  } catch (e) {
    // fallback cleanly
  }
  return DEFAULT_FIRM_BRANDING;
}

export function saveFirmBranding(config: Partial<FirmBrandingConfig>): FirmBrandingConfig {
  const current = getFirmBranding();
  const updated = {
    ...current,
    ...config,
    bankDetails: {
      ...current.bankDetails,
      ...(config?.bankDetails || {}),
    },
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_FIRM, JSON.stringify(updated));
    } catch (e) {}
  }
  return updated;
}

export function getClientBranding(): ClientBrandingConfig {
  if (typeof window === "undefined") return DEFAULT_CLIENT_BRANDING;
  try {
    // Clean legacy corrupted keys if present
    localStorage.removeItem("taxobrain_client_branding");

    const saved = localStorage.getItem(STORAGE_KEY_CLIENT);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CLIENT_BRANDING, ...parsed };
    }
  } catch (e) {
    // fallback cleanly
  }
  return DEFAULT_CLIENT_BRANDING;
}

export function saveClientBranding(config: Partial<ClientBrandingConfig>): ClientBrandingConfig {
  const current = getClientBranding();
  const updated = { ...current, ...config };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(updated));
    } catch (e) {}
  }
  return updated;
}
