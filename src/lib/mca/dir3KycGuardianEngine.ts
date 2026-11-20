/**
 * Director KYC (DIR-3 KYC & Web KYC) Expiry Guardian & DIN Sentinel
 * 
 * Statutory Authority:
 * - Rule 12A of Companies (Appointment and Qualification of Directors) Rules, 2014
 * - Mandatory annual filing by 30th September for every individual holding DIN as on 31st March
 * - Penalties: DIN deactivated with status "Deactivated due to non-filing of DIR-3 KYC"
 * - Reactivation fee: Mandatory ₹5,000 per DIN under Section 403 / Rule 12A
 * - DIR-3 KYC (eForm with DSC) vs DIR-3 KYC Web (OTP based on registered mobile & email)
 */

export interface DirectorKycItem {
  din: string; // 8 digits
  directorName: string;
  pan: string;
  mobile: string;
  email: string;
  kycMode: 'WEB_KYC_OTP' | 'EFORM_DIR3_KYC_DSC'; // Web KYC if no change; eForm if change in email/mobile/address
  hasDemographicChanges: boolean;
  kycFilingDeadline: string; // Always 30th September
  kycStatus: 'COMPLIANT_ACTIVE' | 'DUE_FOR_RENEWAL' | 'DEACTIVATED_NON_FILING';
  daysUntilExpiry: number;
  lateFeeExposureInr: number; // ₹5,000 if past 30th Sep
  isDeactivated: boolean;
  crossDirectorshipCompanies: {
    cin: string;
    companyName: string;
    isListed: boolean;
  }[];
  otpMagicLinkSent: boolean;
  otpMagicLinkUrl?: string;
  lastKycFiledDate?: string;
}

export class Dir3KycGuardianEngine {
  /**
   * Evaluates DIN database for 30th September KYC deadline and deactivation exposure
   */
  public static evaluateDirectorKyc(
    directors: DirectorKycItem[],
    asOfDateStr: string = '2026-11-20'
  ): {
    totalDirectors: number;
    activeCompliantCount: number;
    dueForRenewalCount: number;
    deactivatedCount: number;
    totalLateFeePenaltyExposure: number;
  } {
    const asOf = new Date(asOfDateStr);
    let active = 0;
    let due = 0;
    let deact = 0;
    let feeSum = 0;

    directors.forEach(d => {
      const deadline = new Date(d.kycFilingDeadline);
      const diffDays = Math.ceil((deadline.getTime() - asOf.getTime()) / (1000 * 3600 * 24));
      d.daysUntilExpiry = diffDays;

      if (asOf > deadline && d.kycStatus !== 'COMPLIANT_ACTIVE') {
        d.kycStatus = 'DEACTIVATED_NON_FILING';
        d.isDeactivated = true;
        d.lateFeeExposureInr = 5000;
        deact++;
        feeSum += 5000;
      } else if (d.kycStatus === 'COMPLIANT_ACTIVE') {
        d.isDeactivated = false;
        d.lateFeeExposureInr = 0;
        active++;
      } else {
        d.kycStatus = 'DUE_FOR_RENEWAL';
        d.isDeactivated = false;
        d.lateFeeExposureInr = 0;
        due++;
      }

      // Generate 1-click magic link for Web KYC OTP authentication
      d.otpMagicLinkUrl = `https://mca.gov.in/content/mca/global/en/fop-portal/dir3-web-kyc-verify.html?din=${d.din}&ref=CA-FIRM`;
    });

    return {
      totalDirectors: directors.length,
      activeCompliantCount: active,
      dueForRenewalCount: due,
      deactivatedCount: deact,
      totalLateFeePenaltyExposure: feeSum
    };
  }
}

export const SAMPLE_DIRECTOR_KYC_DATA: DirectorKycItem[] = [
  {
    din: '08910241',
    directorName: 'Rahul Vikram Sharma',
    pan: 'BNZPA4912K',
    mobile: '+91 98260 11921',
    email: 'rahul.sharma@pratwi.com',
    kycMode: 'WEB_KYC_OTP',
    hasDemographicChanges: false,
    kycFilingDeadline: '2026-09-30',
    kycStatus: 'COMPLIANT_ACTIVE',
    daysUntilExpiry: 0,
    lateFeeExposureInr: 0,
    isDeactivated: false,
    crossDirectorshipCompanies: [
      { cin: 'U72200MP2020PTC051234', companyName: 'Pratwi Solutions Private Limited', isListed: false },
      { cin: 'U29100MP2018PTC049210', companyName: 'Apex Machinery Distributors Pvt Ltd', isListed: false }
    ],
    otpMagicLinkSent: true,
    lastKycFiledDate: '2026-08-14'
  },
  {
    din: '07192842',
    directorName: 'Dr. Anand Kumar Verma',
    pan: 'AVKPV9182M',
    mobile: '+91 98201 44102',
    email: 'anand.verma@diagnostics.in',
    kycMode: 'EFORM_DIR3_KYC_DSC', // Address changed -> eForm with DSC required!
    hasDemographicChanges: true,
    kycFilingDeadline: '2026-09-30',
    kycStatus: 'DEACTIVATED_NON_FILING', // Past 30th Sep deadline!
    daysUntilExpiry: -51,
    lateFeeExposureInr: 5000,
    isDeactivated: true,
    crossDirectorshipCompanies: [
      { cin: 'U85110MH2016PTC081294', companyName: 'Narmada Healthcare Diagnostics Pvt Ltd', isListed: false }
    ],
    otpMagicLinkSent: true,
    lastKycFiledDate: '2025-09-20'
  },
  {
    din: '09124810',
    directorName: 'Priya Narang',
    pan: 'CPZPS1829L',
    mobile: '+91 98260 88210',
    email: 'priya.narang@pratwi.com',
    kycMode: 'WEB_KYC_OTP',
    hasDemographicChanges: false,
    kycFilingDeadline: '2026-09-30',
    kycStatus: 'COMPLIANT_ACTIVE',
    daysUntilExpiry: 0,
    lateFeeExposureInr: 0,
    isDeactivated: false,
    crossDirectorshipCompanies: [
      { cin: 'U72200MP2020PTC051234', companyName: 'Pratwi Solutions Private Limited', isListed: false }
    ],
    otpMagicLinkSent: true,
    lastKycFiledDate: '2026-09-10'
  }
];
