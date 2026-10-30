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
  qrCodeUrl?: string;
  gstin?: string;
  bankDetails: {
    bankName: process.env.NEXT_PUBLIC_FIRM_BANK_NAME || "ICICI Bank",
    accountName: process.env.NEXT_PUBLIC_FIRM_BANK_ACCOUNT_NAME || "Brains & Taxes Private Limited",
    accountType: process.env.NEXT_PUBLIC_FIRM_BANK_ACCOUNT_TYPE || "Current Account",
    accountNumber: process.env.NEXT_PUBLIC_FIRM_BANK_ACCOUNT_NO || "657005601799",
    ifsc: process.env.NEXT_PUBLIC_FIRM_BANK_IFSC || "ICIC0006570",
    branch: process.env.NEXT_PUBLIC_FIRM_BANK_BRANCH || "New Palasia, Indore",
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
