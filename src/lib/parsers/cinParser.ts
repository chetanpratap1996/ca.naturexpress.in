/**
 * Brains & Taxes — Enterprise 21-Character CIN Parser & Corporate Governance Engine
 * Synthesizes patterns from MCA21 v2/v3 and Companies Act 2013 statutory rules.
 * 
 * Standard CIN Format (21 characters):
 * [Listing(1)][NIC(5)][State(2)][Year(4)][CompanyType(3)][RegNumber(6)]
 * Example: U74110MP2017PTC043716 (GPA & Co. / Brains & Taxes Entity)
 *          L17110MH1973PLC019786 (Reliance Industries Limited)
 */

export interface ParsedCinResult {
  isValid: boolean;
  cin: string;
  listingStatus: "Listed" | "Unlisted" | "Foreign" | "Unknown";
  isListed: boolean;
  nicCode: string;
  industryDescription: string;
  stateCode: string;
  stateName: string;
  rocOffice: string;
  incorporationYear: number;
  companyAgeYears: number;
  categoryCode: string;
  categoryName: string;
  isPrivateLimited: boolean;
  isPublicLimited: boolean;
  isOnePersonCompany: boolean;
  isSection8NonProfit: boolean;
  registrationNumber: string;
  governanceRequirements: {
    minimumDirectors: number;
    statutoryAuditMandatory: boolean;
    xbrlFilingMandatory: boolean;
    annualGeneralMeetingDays: number; // 180 days (by 30th Sept)
    mcaAnnualReturnForm: "MGT-7" | "MGT-7A";
    mcaFinancialStatementsForm: "AOC-4" | "AOC-4_XBRL";
  };
  error?: string;
}

// 5-digit National Industrial Classification (NIC-2008) Major Divisions
export const NIC_DIVISION_MAP: Record<string, string> = {
  // Agriculture & Mining
  "01": "Crop and animal production, hunting and related service activities",
  "02": "Forestry and logging",
  "03": "Fishing and aquaculture",
  "05": "Mining of coal and lignite",
  "06": "Extraction of crude petroleum and natural gas",
  "08": "Other mining and quarrying",
  
  // Manufacturing
  "10": "Manufacture of food products",
  "11": "Manufacture of beverages",
  "13": "Manufacture of textiles",
  "14": "Manufacture of wearing apparel",
  "17": "Manufacture of paper and paper products",
  "20": "Manufacture of chemicals and chemical products",
  "21": "Manufacture of pharmaceuticals, medicinal chemical and botanical products",
  "24": "Manufacture of basic metals & steel products",
  "25": "Manufacture of fabricated metal products",
  "26": "Manufacture of computer, electronic and optical products",
  "27": "Manufacture of electrical equipment",
  "28": "Manufacture of machinery and equipment",
  "29": "Manufacture of motor vehicles, trailers and semi-trailers",
  "30": "Manufacture of other transport equipment",
  
  // Utilities & Construction
  "35": "Electricity, gas, steam and air conditioning supply",
  "36": "Water collection, treatment and supply",
  "41": "Construction of buildings",
  "42": "Civil engineering",
  "43": "Specialised construction activities",
  
  // Trade & Logistics
  "45": "Wholesale and retail trade and repair of motor vehicles and motorcycles",
  "46": "Wholesale trade, except of motor vehicles and motorcycles",
  "47": "Retail trade, except of motor vehicles and motorcycles",
  "49": "Land transport and transport via pipelines",
  "50": "Water transport",
  "51": "Air transport",
  "52": "Warehousing and support activities for transportation",
  "53": "Postal and courier activities",
  
  // IT, Telecom & Professional Services
  "58": "Publishing activities",
  "61": "Telecommunications",
  "62": "Computer programming, consultancy and related activities (IT & Software)",
  "63": "Information service activities & cloud data hosting",
  "64": "Financial service activities (NBFCs & Banking)",
  "65": "Insurance, reinsurance and pension funding",
  "66": "Other financial activities & mutual fund asset management",
  "68": "Real estate activities",
  "69": "Legal and accounting activities",
  "70": "Activities of head offices; management consultancy activities",
  "71": "Architectural and engineering activities; technical testing and analysis",
  "72": "Scientific research and development",
  "73": "Advertising and market research",
  "74": "Other professional, scientific and technical activities (Accounting & Tax Advisory)",
  "85": "Education",
  "86": "Human health activities & hospitals",
  "90": "Creative, arts and entertainment activities"
};

// 2-letter State Code to Name and ROC Office
export const STATE_ROC_MAP: Record<string, { name: string; roc: string }> = {
  AN: { name: "Andaman & Nicobar Islands", roc: "ROC Kolkata" },
  AP: { name: "Andhra Pradesh", roc: "ROC Vijayawada" },
  AR: { name: "Arunachal Pradesh", roc: "ROC Shillong" },
  AS: { name: "Assam", roc: "ROC Shillong" },
  BR: { name: "Bihar", roc: "ROC Patna" },
  CH: { name: "Chandigarh", roc: "ROC Chandigarh" },
  CT: { name: "Chhattisgarh", roc: "ROC Bilaspur" },
  DD: { name: "Daman & Diu", roc: "ROC Goa" },
  DL: { name: "Delhi", roc: "ROC Delhi & Haryana" },
  DN: { name: "Dadra & Nagar Haveli", roc: "ROC Ahmedabad" },
  GA: { name: "Goa", roc: "ROC Goa" },
  GJ: { name: "Gujarat", roc: "ROC Ahmedabad" },
  HP: { name: "Himachal Pradesh", roc: "ROC Chandigarh" },
  HR: { name: "Haryana", roc: "ROC Delhi & Haryana" },
  JH: { name: "Jharkhand", roc: "ROC Ranchi" },
  JK: { name: "Jammu & Kashmir", roc: "ROC Jammu" },
  KA: { name: "Karnataka", roc: "ROC Bangalore" },
  KL: { name: "Kerala", roc: "ROC Ernakulam" },
  LA: { name: "Ladakh", roc: "ROC Jammu" },
  LD: { name: "Lakshadweep", roc: "ROC Ernakulam" },
  MH: { name: "Maharashtra", roc: "ROC Mumbai / Pune" },
  ML: { name: "Meghalaya", roc: "ROC Shillong" },
  MN: { name: "Manipur", roc: "ROC Shillong" },
  MP: { name: "Madhya Pradesh", roc: "ROC Gwalior" },
  MZ: { name: "Mizoram", roc: "ROC Shillong" },
  NL: { name: "Nagaland", roc: "ROC Shillong" },
  OR: { name: "Odisha", roc: "ROC Cuttack" },
  PB: { name: "Punjab", roc: "ROC Chandigarh" },
  PY: { name: "Puducherry", roc: "ROC Chennai" },
  RJ: { name: "Rajasthan", roc: "ROC Jaipur" },
  SK: { name: "Sikkim", roc: "ROC Kolkata" },
  TG: { name: "Telangana", roc: "ROC Hyderabad" },
  TN: { name: "Tamil Nadu", roc: "ROC Chennai / Coimbatore" },
  TR: { name: "Tripura", roc: "ROC Shillong" },
  TS: { name: "Telangana", roc: "ROC Hyderabad" },
  UK: { name: "Uttarakhand", roc: "ROC Kanpur" },
  UP: { name: "Uttar Pradesh", roc: "ROC Kanpur" },
  WB: { name: "West Bengal", roc: "ROC Kolkata" }
};

// Company Category Codes
export const COMPANY_CATEGORY_MAP: Record<string, string> = {
  PTC: "Private Limited Company",
  PLC: "Public Limited Company",
  OPC: "One Person Company (Private Limited)",
  NPL: "Non-Profit Organization (Section 8 Company)",
  FLC: "Foreign Company Registered in India",
  GOI: "Government of India Enterprise",
  GAP: "General Government Company",
  SGC: "State Government Company",
  ULL: "Public Company with Unlimited Liability",
  ULT: "Private Company with Unlimited Liability",
  ULP: "Unlimited Liability Partnership",
  FTC: "Foreign Trust Company",
  BOI: "Body of Individuals Corporate"
};

/**
 * Deterministically parse and validate a 21-character MCA Corporate Identification Number (CIN)
 */
export function parseCin(cinInput: string): ParsedCinResult {
  if (!cinInput || typeof cinInput !== "string") {
    return createInvalidCinResult(cinInput, "CIN input is empty or invalid type.");
  }

  const cin = cinInput.trim().toUpperCase();

  // Pattern: [L/U/F] + 5-digit NIC + 2-letter State + 4-digit Year + 3-character Category + 6-digit RegNo
  const cinRegex = /^([LUF])(\d{5})([A-Z]{2})(\d{4})([A-Z]{3})(\d{6})$/;
  const match = cin.match(cinRegex);

  if (!match) {
    return createInvalidCinResult(
      cin, 
      "Invalid CIN format. Must be exactly 21 characters: [L/U/F][5-digit NIC][2-letter State][4-digit Year][3-letter Category][6-digit RegNo]"
    );
  }

  const [, listingChar, nicCode, stateCode, yearStr, categoryCode, regNumber] = match;

  const isListed = listingChar === "L";
  const listingStatus = listingChar === "L" ? "Listed" : listingChar === "U" ? "Unlisted" : "Foreign";
  const incorporationYear = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  const companyAgeYears = Math.max(0, currentYear - incorporationYear);

  // Industry lookup from 2-digit major division
  const majorDivision = nicCode.slice(0, 2);
  const industryDescription = NIC_DIVISION_MAP[majorDivision] || `Economic Activity Code Division ${majorDivision}`;

  // State & ROC lookup
  const stateInfo = STATE_ROC_MAP[stateCode] || { name: stateCode, roc: `ROC ${stateCode}` };

  // Category lookup
  const categoryName = COMPANY_CATEGORY_MAP[categoryCode] || `${categoryCode} Entity`;
  const isPrivateLimited = categoryCode === "PTC" || categoryCode === "OPC";
  const isPublicLimited = categoryCode === "PLC" || categoryCode === "ULL";
  const isOnePersonCompany = categoryCode === "OPC";
  const isSection8NonProfit = categoryCode === "NPL";

  // Statutory governance parameters based on Companies Act 2013
  const minimumDirectors = isOnePersonCompany ? 1 : isPrivateLimited ? 2 : 3;
  const xbrlFilingMandatory = isListed || isPublicLimited; // Listed or public with capital >= 5 Cr
  const mcaAnnualReturnForm = (isOnePersonCompany || (isPrivateLimited && companyAgeYears > 0)) ? "MGT-7" : "MGT-7";
  const mcaFinancialStatementsForm = xbrlFilingMandatory ? "AOC-4_XBRL" : "AOC-4";

  return {
    isValid: true,
    cin,
    listingStatus,
    isListed,
    nicCode,
    industryDescription,
    stateCode,
    stateName: stateInfo.name,
    rocOffice: stateInfo.roc,
    incorporationYear,
    companyAgeYears,
    categoryCode,
    categoryName,
    isPrivateLimited,
    isPublicLimited,
    isOnePersonCompany,
    isSection8NonProfit,
    registrationNumber: regNumber,
    governanceRequirements: {
      minimumDirectors,
      statutoryAuditMandatory: true, // All Indian companies require statutory audit
      xbrlFilingMandatory,
      annualGeneralMeetingDays: 180,
      mcaAnnualReturnForm,
      mcaFinancialStatementsForm
    }
  };
}

function createInvalidCinResult(cin: string, error: string): ParsedCinResult {
  return {
    isValid: false,
    cin: cin || "",
    listingStatus: "Unknown",
    isListed: false,
    nicCode: "",
    industryDescription: "Unknown",
    stateCode: "",
    stateName: "Unknown",
    rocOffice: "Unknown",
    incorporationYear: 0,
    companyAgeYears: 0,
    categoryCode: "",
    categoryName: "Unknown",
    isPrivateLimited: false,
    isPublicLimited: false,
    isOnePersonCompany: false,
    isSection8NonProfit: false,
    registrationNumber: "",
    governanceRequirements: {
      minimumDirectors: 2,
      statutoryAuditMandatory: true,
      xbrlFilingMandatory: false,
      annualGeneralMeetingDays: 180,
      mcaAnnualReturnForm: "MGT-7",
      mcaFinancialStatementsForm: "AOC-4"
    },
    error
  };
}
