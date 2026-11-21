/**
 * INDIAN GSTIN VALIDATOR & MOD-36 CHECKSUM ENGINE
 * Conforming strictly to Goods and Services Tax Network (GSTN) Specifications
 * 
 * GSTIN Structure (15 Characters):
 * - Chars 1-2:   State Code (01-38, 97, 99)
 * - Chars 3-7:   First 5 chars of PAN (Alphabetic)
 * - Chars 8-11:  Next 4 chars of PAN (Numeric)
 * - Char 12:     10th char of PAN (Alphabetic check)
 * - Char 13:     Entity registration count for same PAN in state (1-9 or A-Z)
 * - Char 14:     Default character 'Z'
 * - Char 15:     Modulo 36 Checksum digit (0-9 or A-Z)
 */

export const GST_CHAR_MAP = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const GST_STATE_MAP: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu (Historic)",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction / Non-Resident",
};

/**
 * Computes the expected 15th checksum character of a 14-char or 15-char GSTIN
 * using the official GSTN Modulo 36 algorithm.
 */
export function calculateGstinChecksum(gstin: string): string | null {
  if (!gstin || gstin.length < 14) return null;
  const clean = gstin.trim().toUpperCase();

  let total = 0;
  for (let i = 0; i < 14; i++) {
    const ch = clean[i];
    const charIndex = GST_CHAR_MAP.indexOf(ch);
    if (charIndex === -1) return null;

    // Alternating weights: even indices (0, 2, 4...) factor 1, odd indices (1, 3, 5...) factor 2
    const factor = i % 2 === 0 ? 1 : 2;
    const product = charIndex * factor;

    // Quotient + Remainder when divided by 36
    total += Math.floor(product / 36) + (product % 36);
  }

  const remainder = total % 36;
  const checkIndex = (36 - remainder) % 36;
  return GST_CHAR_MAP[checkIndex];
}

export interface GstinValidationResult {
  isValid: boolean;
  cleanGstin: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  entityType?: "Company" | "Individual / Proprietorship" | "Firm / LLP" | "Trust / Society" | "Government" | "Other";
  expectedChecksum?: string;
  actualChecksum?: string;
  error?: string;
}

/**
 * 0ms Offline GSTIN Validator.
 * Performs format check, state code validation, PAN structure validation, and Mod-36 checksum verification.
 * ZERO API calls consumed.
 */
export function validateGstinDetailed(rawGstin?: string): GstinValidationResult {
  if (!rawGstin) {
    return { isValid: false, cleanGstin: "", error: "GSTIN is required." };
  }

  const clean = rawGstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { 
      isValid: false, 
      cleanGstin: clean, 
      error: `GSTIN must be exactly 15 characters (currently ${clean.length}).` 
    };
  }

  // Regex format: 2 digits + 5 letters + 4 digits + 1 letter + 1 entity code + 'Z' + 1 checksum
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(clean)) {
    return { 
      isValid: false, 
      cleanGstin: clean, 
      error: "Invalid GSTIN format. Expected: 2-digit State + 10-char PAN + 1-char Entity + 'Z' + Check digit." 
    };
  }

  const stateCode = clean.substring(0, 2);
  const stateName = GST_STATE_MAP[stateCode];
  if (!stateName) {
    return { 
      isValid: false, 
      cleanGstin: clean, 
      stateCode, 
      error: `Invalid State Code '${stateCode}'. Must be between 01 and 38, or 97/99.` 
    };
  }

  const pan = clean.substring(2, 12);
  const entityChar = pan.charAt(3);
  let entityType: GstinValidationResult["entityType"] = "Other";
  if (entityChar === "C") entityType = "Company";
  else if (entityChar === "P") entityType = "Individual / Proprietorship";
  else if (entityChar === "F") entityType = "Firm / LLP";
  else if (entityChar === "T" || entityChar === "A") entityType = "Trust / Society";
  else if (entityChar === "G") entityType = "Government";

  // Compute Mod-36 Checksum
  const expectedChecksum = calculateGstinChecksum(clean);
  const actualChecksum = clean.charAt(14);

  if (!expectedChecksum || expectedChecksum !== actualChecksum) {
    return {
      isValid: false,
      cleanGstin: clean,
      stateCode,
      stateName,
      pan,
      entityType,
      expectedChecksum: expectedChecksum || undefined,
      actualChecksum,
      error: `Invalid GSTIN Checksum. Expected character '${expectedChecksum}', but found '${actualChecksum}'. Please verify typos.`
    };
  }

  return {
    isValid: true,
    cleanGstin: clean,
    stateCode,
    stateName,
    pan,
    entityType,
    expectedChecksum,
    actualChecksum
  };
}
