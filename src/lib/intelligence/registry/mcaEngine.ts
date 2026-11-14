/**
 * Brains & Taxes — MCA21 Corporate Identification Number (CIN) & Master Data Engine
 * Mathematically deconstructs and validates Indian CINs and LLPINs:
 * - Listing status (U/L)
 * - 5-digit NIC Economic Activity Code
 * - 2-letter State Code
 * - 4-digit Incorporation Year
 * - 3-letter Company Category (PTC, PLC, OPC, NPL, etc.)
 * - 6-digit ROC Registration Number
 */

import { getStateByCode, getRocForState } from "../panIndiaDirectory";
import { CompanyType } from "../types";

export interface CinParsedMetadata {
  isValid: boolean;
  cin: string;
  isListed: boolean;
  nicCode: string;
  stateCode: string;
  stateName: string;
  rocJurisdictions: string[];
  incorporationYear: number;
  categoryCode: string;
  companyType: CompanyType;
  registrationNumber: string;
  error?: string;
}

export function parseCinStrict(rawCin: string): CinParsedMetadata {
  if (!rawCin || typeof rawCin !== "string") {
    return {
      isValid: false,
      cin: "",
      isListed: false,
      nicCode: "",
      stateCode: "",
      stateName: "",
      rocJurisdictions: [],
      incorporationYear: 0,
      categoryCode: "",
      companyType: "PVT_LTD",
      registrationNumber: "",
      error: "CIN is empty or missing",
    };
  }

  const cin = rawCin.trim().toUpperCase();

  // CIN must be exactly 21 characters:
  // e.g. U74110MP2017PTC043716
  const cinRegex = /^([UL])([0-9]{5})([A-Z]{2})([0-9]{4})([A-Z]{3})([0-9]{6})$/;
  const match = cin.match(cinRegex);

  if (!match) {
    return {
      isValid: false,
      cin,
      isListed: false,
      nicCode: "",
      stateCode: "",
      stateName: "",
      rocJurisdictions: [],
      incorporationYear: 0,
      categoryCode: "",
      companyType: "PVT_LTD",
      registrationNumber: "",
      error: "Invalid CIN schema. Expected 21 characters: [U/L][5-digit NIC][2-state][4-year][3-category][6-regNo]",
    };
  }

  const [, listingFlag, nicCode, stateCode, yearStr, categoryCode, regNo] = match;
  const isListed = listingFlag === "L";
  const incorporationYear = parseInt(yearStr, 10);

  const stateMeta = getStateByCode(stateCode);
  const stateName = stateMeta ? stateMeta.name : stateCode;
  const rocJurisdictions = stateMeta ? stateMeta.rocJurisdictions : getRocForState(stateCode);

  let companyType: CompanyType = "PVT_LTD";
  if (categoryCode === "PTC") companyType = "PVT_LTD";
  else if (categoryCode === "PLC") companyType = "PUBLIC_LTD";
  else if (categoryCode === "OPC") companyType = "OPC";
  else if (categoryCode === "LLP") companyType = "LLP";

  return {
    isValid: true,
    cin,
    isListed,
    nicCode,
    stateCode,
    stateName,
    rocJurisdictions,
    incorporationYear,
    categoryCode,
    companyType,
    registrationNumber: regNo,
  };
}

/**
 * Calculates days elapsed between an incorporation date and a target date (defaulting to today).
 */
export function getDaysSinceIncorporation(incorporationDateIso: string, referenceDate: Date = new Date()): number {
  const incDate = new Date(incorporationDateIso);
  if (isNaN(incDate.getTime())) return 9999;
  const diffMs = referenceDate.getTime() - incDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
