/**
 * ICAI Article Trainee Biometric, Regulation 48 Stipend & Form 108 Training Diary Engine
 * 
 * Statutory Authority:
 * - Chartered Accountants Act, 1949 & Chartered Accountants Regulations, 1988
 * - ICAI Regulation 48: Minimum Monthly Stipend payable to Articled Assistants
 *   - Tier I (Cities > 20 Lakhs): Year 1: ₹4,000 | Year 2: ₹5,000 | Year 3: ₹6,000 (New Scheme: ₹4,000 / ₹5,000)
 *   - Tier II (Cities 4L - 20L): Year 1: ₹3,000 | Year 2: ₹4,000 | Year 3: ₹5,000
 *   - Tier III (Cities < 4L): Year 1: ₹2,000 | Year 2: ₹3,000 | Year 3: ₹4,000
 * - ICAI Regulation 59: Leave Entitlement (Max 1/6th of total actual training served)
 *   - 3-Year Scheme: Max 156 days (1/6th of 1095 days)
 *   - 2-Year Scheme: Max 104 days (1/6th of 730 days) (12 days/year casual + exam leave)
 *   - Excess leaves require mandatory extension under Regulation 59(2) before Form 108 approval.
 * - Form 108: Certificate of Service under Articles with breakdown of practical experience.
 */

export type CityPopulationTier = 'TIER_1_ABOVE_20_LAKHS' | 'TIER_2_4_TO_20_LAKHS' | 'TIER_3_BELOW_4_LAKHS';
export type ArticleshipScheme = 'NEW_SCHEME_2_YEAR' | 'OLD_SCHEME_3_YEAR';

export interface WorkCategoryHours {
  statutoryAudit: number;
  taxAudit44AB: number;
  incomeTaxReturns: number;
  gstComplianceAndAudit: number;
  companyLawAndMca: number;
  bankAudit: number;
  internalAudit: number;
}

export interface ArticleTraineeProfile {
  id: string;
  registrationNumber: string; // e.g. WRO-0612991 / NRO-0598124
  fullName: string;
  articleshipScheme: ArticleshipScheme;
  cityTier: CityPopulationTier;
  commencementDate: string; // YYYY-MM-DD
  stipulatedCompletionDate: string;
  currentYearOfTraining: 1 | 2 | 3;
  principalMemberNo: string;
  principalName: string;
  bankAccountNo: string;
  ifscCode: string;
  monthlyStipendPaid: number;
  totalDaysServed: number;
  totalLeaveTakenDays: number;
  workHoursBreakdown: WorkCategoryHours;
}

export interface StipendComplianceResult {
  mandatedMinimumStipend: number;
  actualPaid: number;
  isCompliant: boolean;
  shortfallAmount: number;
  explanation: string;
}

export interface LeaveEntitlementResult {
  scheme: ArticleshipScheme;
  totalDaysServed: number;
  maxPermissibleLeaveDays: number; // 1/6th rule
  actualLeaveTakenDays: number;
  isExcessLeave: boolean;
  excessLeaveDays: number;
  requiredExtensionDays: number;
  extendedCompletionDate: string;
}

export interface Form108Summary {
  articleId: string;
  fullName: string;
  registrationNumber: string;
  totalHoursLogged: number;
  categoryDistributionPct: Record<keyof WorkCategoryHours, number>;
  leaveCompliance: LeaveEntitlementResult;
  stipendCompliance: StipendComplianceResult;
  form108EligibleForDischarge: boolean;
  dischargeBlockers: string[];
}

export class ArticleTrainingEngine {
  /**
   * Calculates ICAI Regulation 48 Mandated Minimum Stipend
   */
  public static calculateMandatedStipend(
    tier: CityPopulationTier,
    trainingYear: 1 | 2 | 3,
    scheme: ArticleshipScheme
  ): number {
    if (scheme === 'NEW_SCHEME_2_YEAR') {
      if (tier === 'TIER_1_ABOVE_20_LAKHS') {
        return trainingYear === 1 ? 4000 : 5000;
      } else if (tier === 'TIER_2_4_TO_20_LAKHS') {
        return trainingYear === 1 ? 3000 : 4000;
      } else {
        return trainingYear === 1 ? 2000 : 3000;
      }
    } else {
      // 3-Year Scheme
      if (tier === 'TIER_1_ABOVE_20_LAKHS') {
        if (trainingYear === 1) return 4000;
        if (trainingYear === 2) return 5000;
        return 6000;
      } else if (tier === 'TIER_2_4_TO_20_LAKHS') {
        if (trainingYear === 1) return 3000;
        if (trainingYear === 2) return 4000;
        return 5000;
      } else {
        if (trainingYear === 1) return 2000;
        if (trainingYear === 2) return 3000;
        return 4000;
      }
    }
  }

  /**
   * Evaluates Stipend Compliance
   */
  public static verifyStipendCompliance(article: ArticleTraineeProfile): StipendComplianceResult {
    const mandated = this.calculateMandatedStipend(article.cityTier, article.currentYearOfTraining, article.articleshipScheme);
    const shortfall = Math.max(0, mandated - article.monthlyStipendPaid);
    const isCompliant = article.monthlyStipendPaid >= mandated;

    return {
      mandatedMinimumStipend: mandated,
      actualPaid: article.monthlyStipendPaid,
      isCompliant,
      shortfallAmount: shortfall,
      explanation: isCompliant 
        ? `Stipend ₹${article.monthlyStipendPaid.toLocaleString('en-IN')}/m meets or exceeds ICAI Reg 48 minimum of ₹${mandated.toLocaleString('en-IN')}/m for Year ${article.currentYearOfTraining} (${article.cityTier}).`
        : `Deficit of ₹${shortfall.toLocaleString('en-IN')}/m below ICAI Reg 48 statutory mandate (Paid: ₹${article.monthlyStipendPaid}, Mandated: ₹${mandated}).`
    };
  }

  /**
   * Evaluates ICAI Regulation 59 1/6th Leave Entitlement & Extension
   */
  public static evaluateLeaveEntitlement(article: ArticleTraineeProfile): LeaveEntitlementResult {
    // 1/6th of total days served
    const maxPermissible = Math.floor(article.totalDaysServed / 6);
    const excess = Math.max(0, article.totalLeaveTakenDays - maxPermissible);
    const isExcess = excess > 0;

    const stipulatedDate = new Date(article.stipulatedCompletionDate);
    const extendedDate = new Date(stipulatedDate.getTime() + (excess * 24 * 3600 * 1000));

    return {
      scheme: article.articleshipScheme,
      totalDaysServed: article.totalDaysServed,
      maxPermissibleLeaveDays: maxPermissible,
      actualLeaveTakenDays: article.totalLeaveTakenDays,
      isExcessLeave: isExcess,
      excessLeaveDays: excess,
      requiredExtensionDays: excess,
      extendedCompletionDate: extendedDate.toISOString().slice(0, 10)
    };
  }

  /**
   * Compiles Form 108 Audit Experience & Discharge Packet
   */
  public static compileForm108Summary(article: ArticleTraineeProfile): Form108Summary {
    const stipend = this.verifyStipendCompliance(article);
    const leave = this.evaluateLeaveEntitlement(article);

    const hours = article.workHoursBreakdown;
    const totalHours = Object.values(hours).reduce((sum, h) => sum + h, 0);

    const distPct: Record<keyof WorkCategoryHours, number> = {
      statutoryAudit: totalHours > 0 ? Math.round((hours.statutoryAudit / totalHours) * 100) : 0,
      taxAudit44AB: totalHours > 0 ? Math.round((hours.taxAudit44AB / totalHours) * 100) : 0,
      incomeTaxReturns: totalHours > 0 ? Math.round((hours.incomeTaxReturns / totalHours) * 100) : 0,
      gstComplianceAndAudit: totalHours > 0 ? Math.round((hours.gstComplianceAndAudit / totalHours) * 100) : 0,
      companyLawAndMca: totalHours > 0 ? Math.round((hours.companyLawAndMca) / totalHours * 100) : 0,
      bankAudit: totalHours > 0 ? Math.round((hours.bankAudit / totalHours) * 100) : 0,
      internalAudit: totalHours > 0 ? Math.round((hours.internalAudit / totalHours) * 100) : 0,
    };

    const blockers: string[] = [];
    if (!stipend.isCompliant) {
      blockers.push(`Stipend arrears outstanding under ICAI Regulation 48 (shortfall of ₹${stipend.shortfallAmount}/month).`);
    }
    if (leave.isExcessLeave) {
      blockers.push(`Excess leave of ${leave.excessLeaveDays} days taken beyond 1/6th rule. Form 108 requires extension until ${leave.extendedCompletionDate}.`);
    }
    if (totalHours < 3000 && article.currentYearOfTraining >= 2) {
      blockers.push(`Total logged training hours (${totalHours} hrs) below expected benchmark for practical completion.`);
    }

    return {
      articleId: article.id,
      fullName: article.fullName,
      registrationNumber: article.registrationNumber,
      totalHoursLogged: totalHours,
      categoryDistributionPct: distPct,
      leaveCompliance: leave,
      stipendCompliance: stipend,
      form108EligibleForDischarge: blockers.length === 0,
      dischargeBlockers: blockers
    };
  }
}

export const SAMPLE_ARTICLES: ArticleTraineeProfile[] = [
  {
    id: 'ART-01',
    registrationNumber: 'WRO-0612991',
    fullName: 'Rohit Sharma',
    articleshipScheme: 'NEW_SCHEME_2_YEAR',
    cityTier: 'TIER_1_ABOVE_20_LAKHS',
    commencementDate: '2025-04-01',
    stipulatedCompletionDate: '2027-03-31',
    currentYearOfTraining: 2,
    principalMemberNo: '049210',
    principalName: 'CA Rajesh Mehta',
    bankAccountNo: '50100239102914',
    ifscCode: 'HDFC0000123',
    monthlyStipendPaid: 5000,
    totalDaysServed: 580,
    totalLeaveTakenDays: 62, // 1/6th of 580 is 96 days -> Compliant
    workHoursBreakdown: {
      statutoryAudit: 1100,
      taxAudit44AB: 650,
      incomeTaxReturns: 480,
      gstComplianceAndAudit: 520,
      companyLawAndMca: 210,
      bankAudit: 160,
      internalAudit: 180
    }
  },
  {
    id: 'ART-02',
    registrationNumber: 'WRO-0628410',
    fullName: 'Pooja Kulkarni',
    articleshipScheme: 'NEW_SCHEME_2_YEAR',
    cityTier: 'TIER_1_ABOVE_20_LAKHS',
    commencementDate: '2025-08-01',
    stipulatedCompletionDate: '2027-07-31',
    currentYearOfTraining: 2,
    principalMemberNo: '049210',
    principalName: 'CA Rajesh Mehta',
    bankAccountNo: '91823901928301',
    ifscCode: 'SBIN0001234',
    monthlyStipendPaid: 5500,
    totalDaysServed: 460,
    totalLeaveTakenDays: 95, // 1/6th of 460 is 76 days -> Excess 19 days!
    workHoursBreakdown: {
      statutoryAudit: 750,
      taxAudit44AB: 520,
      incomeTaxReturns: 390,
      gstComplianceAndAudit: 410,
      companyLawAndMca: 150,
      bankAudit: 80,
      internalAudit: 100
    }
  },
  {
    id: 'ART-03',
    registrationNumber: 'WRO-0649102',
    fullName: 'Amit Patel',
    articleshipScheme: 'NEW_SCHEME_2_YEAR',
    cityTier: 'TIER_1_ABOVE_20_LAKHS',
    commencementDate: '2026-03-01',
    stipulatedCompletionDate: '2028-02-29',
    currentYearOfTraining: 1,
    principalMemberNo: '049210',
    principalName: 'CA Rajesh Mehta',
    bankAccountNo: '10293847561029',
    ifscCode: 'ICIC0000099',
    monthlyStipendPaid: 4500,
    totalDaysServed: 260,
    totalLeaveTakenDays: 14,
    workHoursBreakdown: {
      statutoryAudit: 380,
      taxAudit44AB: 290,
      incomeTaxReturns: 340,
      gstComplianceAndAudit: 310,
      companyLawAndMca: 90,
      bankAudit: 0,
      internalAudit: 70
    }
  }
];
