/**
 * Brains & Taxes — Section 17(5) Blocked Credit & GSTR-3B Table 4 Classification Engine
 * 
 * Statutory Authority:
 * - Section 17(5)(a) to (h) of Central Goods and Services Tax Act, 2017
 * - CBIC Circular No. 170/02/2022-GST: Mandatory reporting of ineligible ITC in Table 4(B)(1)
 * - Section 16(4) of CGST Act, 2017: Statutory time limit for claiming ITC
 */

export type Section17_5Category =
  | "MOTOR_VEHICLE_17_5_A"
  | "VEHICLE_SERVICING_INSURANCE_17_5_AB"
  | "FOOD_BEVERAGE_CATERING_17_5_B_I"
  | "CLUB_FITNESS_MEMBERSHIP_17_5_B_II"
  | "EMPLOYEE_VACATION_TRAVEL_17_5_B_III"
  | "WORKS_CONTRACT_IMMOVABLE_17_5_C"
  | "CONSTRUCTION_OWN_ACCOUNT_17_5_D"
  | "GIFTS_SAMPLES_LOST_17_5_H";

export interface ItcClassificationResult {
  isBlocked: boolean;
  statutoryCategory?: Section17_5Category;
  legalSubSection?: string;
  categoryTitle?: string;
  reason: string;
  gstr3bReportingTable: "4(A)(5)" | "4(B)(1)" | "4(B)(2)" | "4(D)(1)";
  auditRecommendation: string;
}

export class ItcClassifier {
  /**
   * Classifies an invoice line or voucher against statutory Section 17(5) rules
   */
  public static classify(params: {
    hsnOrSacCode?: string;
    itemDescription?: string;
    vendorTradeName?: string;
    isCapitalGoodsPlantMachinery?: boolean;
    isWorksContractSubcontracting?: boolean;
    isCommercialPassengerCarrier?: boolean;
  }): ItcClassificationResult {
    const hsn = (params.hsnOrSacCode || "").trim().replace(/[^0-9]/g, "");
    const desc = `${params.itemDescription || ""} ${params.vendorTradeName || ""}`.toLowerCase();

    // 1. Works Contract for Immovable Property: Section 17(5)(c)
    // Exception: If taxpayer is in same line of business (subcontracting) or it is for Plant & Machinery
    if (hsn.startsWith("9954") || desc.includes("works contract") || desc.includes("civil construction") || desc.includes("building renovation")) {
      if (params.isCapitalGoodsPlantMachinery) {
        return {
          isBlocked: false,
          gstr3bReportingTable: "4(A)(5)",
          reason: "Works contract used specifically for Plant & Machinery is ELIGIBLE under Explanation to Section 17(5)(c).",
          auditRecommendation: "Claim in Table 4(A)(5). Retain plant & machinery asset register workpaper."
        };
      }
      if (params.isWorksContractSubcontracting) {
        return {
          isBlocked: false,
          gstr3bReportingTable: "4(A)(5)",
          reason: "Works contract received as an input service for further supply of works contract is ELIGIBLE under Section 17(5)(c) proviso.",
          auditRecommendation: "Claim in Table 4(A)(5). Link to outward works contract project code."
        };
      }
      return {
        isBlocked: true,
        statutoryCategory: "WORKS_CONTRACT_IMMOVABLE_17_5_C",
        legalSubSection: "Section 17(5)(c) of CGST Act, 2017",
        categoryTitle: "Works Contract for Immovable Property",
        reason: "Works contract services supplied for construction of an immovable property (other than plant and machinery).",
        gstr3bReportingTable: "4(B)(1)",
        auditRecommendation: "Mandatory reversal: Route to GSTR-3B Table 4(B)(1). Add to cost of capital work-in-progress (CWIP)."
      };
    }

    // 2. Construction of Immovable Property on Own Account: Section 17(5)(d)
    if (
      (hsn.startsWith("2523") && (desc.includes("cement") || desc.includes("concrete"))) ||
      (hsn.startsWith("7214") && (desc.includes("tmt") || desc.includes("steel bar") || desc.includes("sariya"))) ||
      (hsn.startsWith("6810") && desc.includes("brick")) ||
      (hsn.startsWith("6907") && desc.includes("tile")) ||
      desc.includes("office building construction") ||
      desc.includes("factory shed civil construction")
    ) {
      if (!params.isCapitalGoodsPlantMachinery) {
        return {
          isBlocked: true,
          statutoryCategory: "CONSTRUCTION_OWN_ACCOUNT_17_5_D",
          legalSubSection: "Section 17(5)(d) of CGST Act, 2017",
          categoryTitle: "Goods / Services for Immovable Property Construction",
          reason: "Goods or services received by a taxable person for construction of an immovable property on own account.",
          gstr3bReportingTable: "4(B)(1)",
          auditRecommendation: "Ineligible ITC. Route to Table 4(B)(1) as per CBIC Circular 170. Capitalize in balance sheet with GST."
        };
      }
    }

    // 3. Motor Vehicles for Transportation of Persons: Section 17(5)(a)
    if (
      hsn.startsWith("8702") ||
      hsn.startsWith("8703") ||
      hsn.startsWith("8711") ||
      desc.includes("passenger car") ||
      desc.includes("sedan") ||
      desc.includes("suv") ||
      desc.includes("luxury car") ||
      desc.includes("motor vehicle purchase")
    ) {
      if (params.isCommercialPassengerCarrier) {
        return {
          isBlocked: false,
          gstr3bReportingTable: "4(A)(5)",
          reason: "Motor vehicle used for transportation of passengers or driving school is ELIGIBLE under Section 17(5)(a)(B).",
          auditRecommendation: "Claim in Table 4(A)(5). Verify RTO commercial permit."
        };
      }
      return {
        isBlocked: true,
        statutoryCategory: "MOTOR_VEHICLE_17_5_A",
        legalSubSection: "Section 17(5)(a) of CGST Act, 2017",
        categoryTitle: "Passenger Motor Vehicle (<13 Seating Capacity)",
        reason: "Motor vehicle for transportation of persons having approved seating capacity not exceeding 13 persons (including driver).",
        gstr3bReportingTable: "4(B)(1)",
        auditRecommendation: "Strictly ineligible. Disclose under Table 4(B)(1) of GSTR-3B."
      };
    }

    // 4. Vehicle Servicing, Repair & General Insurance: Section 17(5)(ab)
    if (
      hsn.startsWith("997134") ||
      hsn.startsWith("998714") ||
      hsn.startsWith("998729") ||
      desc.includes("car insurance") ||
      desc.includes("vehicle insurance") ||
      desc.includes("motor insurance") ||
      desc.includes("car servicing") ||
      desc.includes("vehicle repair")
    ) {
      if (params.isCommercialPassengerCarrier) {
        return {
          isBlocked: false,
          gstr3bReportingTable: "4(A)(5)",
          reason: "Insurance/maintenance for commercial passenger carrier vehicle is ELIGIBLE.",
          auditRecommendation: "Claim in Table 4(A)(5)."
        };
      }
      return {
        isBlocked: true,
        statutoryCategory: "VEHICLE_SERVICING_INSURANCE_17_5_AB",
        legalSubSection: "Section 17(5)(ab) of CGST Act, 2017",
        categoryTitle: "Motor Vehicle Insurance & Servicing",
        reason: "General insurance, servicing, repair and maintenance of motor vehicles referred to in Section 17(5)(a).",
        gstr3bReportingTable: "4(B)(1)",
        auditRecommendation: "Ineligible ITC. Route to GSTR-3B Table 4(B)(1). Claim income tax depreciation / expense on total gross."
      };
    }

    // 5. Food, Beverages, Outdoor Catering, Beauty Treatment: Section 17(5)(b)(i)
    if (
      hsn.startsWith("9963") ||
      desc.includes("food") ||
      desc.includes("beverage") ||
      desc.includes("restaurant") ||
      desc.includes("catering") ||
      desc.includes("buffet") ||
      desc.includes("hotel meal") ||
      desc.includes("corporate dinner") ||
      desc.includes("sweet box") ||
      desc.includes("diwali snacks")
    ) {
      return {
        isBlocked: true,
        statutoryCategory: "FOOD_BEVERAGE_CATERING_17_5_B_I",
        legalSubSection: "Section 17(5)(b)(i) of CGST Act, 2017",
        categoryTitle: "Food, Beverages & Outdoor Catering",
        reason: "Supply of food and beverages, outdoor catering, beauty treatment, health services, cosmetic/plastic surgery.",
        gstr3bReportingTable: "4(B)(1)",
        auditRecommendation: "Blocked credit. Disclose in Table 4(B)(1). Expensed to profit & loss account."
      };
    }

    // 6. Club Membership, Health & Fitness Centre: Section 17(5)(b)(ii)
    if (
      hsn.startsWith("9996") ||
      desc.includes("gym membership") ||
      desc.includes("club membership") ||
      desc.includes("country club") ||
      desc.includes("health club")
    ) {
      return {
        isBlocked: true,
        statutoryCategory: "CLUB_FITNESS_MEMBERSHIP_17_5_B_II",
        legalSubSection: "Section 17(5)(b)(ii) of CGST Act, 2017",
        categoryTitle: "Club & Fitness Centre Membership",
        reason: "Membership of a club, health and fitness centre.",
        gstr3bReportingTable: "4(B)(1)",
        auditRecommendation: "Ineligible credit. Route to Table 4(B)(1)."
      };
    }

    // 7. Travel Benefits to Employees on Vacation: Section 17(5)(b)(iii)
    if (
      desc.includes("leave travel concession") ||
      desc.includes("leave travel allowance") ||
      desc.includes("employee vacation") ||
      desc.includes("holiday package")
    ) {
      return {
        isBlocked: true,
        statutoryCategory: "EMPLOYEE_VACATION_TRAVEL_17_5_B_III",
        legalSubSection: "Section 17(5)(b)(iii) of CGST Act, 2017",
        categoryTitle: "Employee Vacation Travel Benefits",
        reason: "Travel benefits extended to employees on vacation such as leave or home travel concession.",
        gstr3bReportingTable: "4(B)(1)",
        auditRecommendation: "Blocked credit. Route to Table 4(B)(1)."
      };
    }

    // 8. Gifts, Free Samples, Stolen, Lost or Written Off: Section 17(5)(h)
    if (
      desc.includes("free sample") ||
      desc.includes("gift hamper") ||
      desc.includes("diwali gift") ||
      desc.includes("corporate gift") ||
      desc.includes("written off inventory") ||
      desc.includes("lost goods")
    ) {
      return {
        isBlocked: true,
        statutoryCategory: "GIFTS_SAMPLES_LOST_17_5_H",
        legalSubSection: "Section 17(5)(h) of CGST Act, 2017",
        categoryTitle: "Gifts, Free Samples & Written Off Goods",
        reason: "Goods lost, stolen, destroyed, written off or disposed of by way of gift or free samples.",
        gstr3bReportingTable: "4(B)(1)",
        auditRecommendation: "Mandatory ITC reversal under Section 17(5)(h). Route to Table 4(B)(1)."
      };
    }

    // Default: Eligible
    return {
      isBlocked: false,
      gstr3bReportingTable: "4(A)(5)",
      reason: "Goods or services used or intended to be used in the course or furtherance of business.",
      auditRecommendation: "Claim in Table 4(A)(5) All Other ITC."
    };
  }
}
