/**
 * Secretarial Compliance Calendar & AGM / Board Meeting Minute Book Generator
 * 
 * Statutory Authority:
 * - Section 118 of Companies Act, 2013 read with Rule 25 of Companies (Management and Administration) Rules, 2014
 * - Section 173(1): Minimum 4 Board Meetings every year with maximum gap between two meetings not exceeding 120 days
 * - Secretarial Standard 1 (SS-1) on Meetings of the Board of Directors issued by ICSI
 * - Secretarial Standard 2 (SS-2) on General Meetings (AGM / EGM)
 * - Section 134: Approval and signing of Financial Statements & Board's Report
 * - Section 139: Appointment / ratification of Statutory Auditors
 * - Section 188: Approval of Related Party Transactions
 * - Section 135: Corporate Social Responsibility (CSR) Committee approvals
 */

export type MeetingType = 'BOARD_MEETING' | 'ANNUAL_GENERAL_MEETING' | 'EXTRAORDINARY_GENERAL_MEETING' | 'CSR_COMMITTEE_MEETING';

export interface SecretarialResolutionItem {
  resolutionNumber: string;
  resolutionType: 'ORDINARY_RESOLUTION' | 'SPECIAL_RESOLUTION' | 'BOARD_RESOLUTION';
  agendaTitle: string;
  statutorySection: string; // e.g., 'Section 134', 'Section 139', 'Section 188', 'Section 135'
  resolutionDraftText: string;
  votingSummary: {
    votesInFavor: number;
    votesAgainst: number;
    passedUnanimously: boolean;
  };
}

export interface MinuteBookMeetingItem {
  id: string;
  meetingType: MeetingType;
  meetingNumber: string; // e.g. 'BM-04/2026-27' or '6th AGM'
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:MM AM/PM
  venueOrMode: 'REGISTERED_OFFICE' | 'VIDEO_CONFERENCING_OAVM' | 'HYBRID';
  chairmanName: string;
  directorsPresent: {
    din: string;
    name: string;
    mode: 'PHYSICAL' | 'VIDEO_CONFERENCING';
  }[];
  inviteesPresent: string[]; // Statutory Auditor, Secretarial Auditor
  noticeDispatchDate: string;
  isSevenClearDaysNoticeGiven: boolean;
  shorterNoticeConsentObtained: boolean;
  gapFromPreviousMeetingDays?: number; // Must not exceed 120 days for BM u/s 173(1)
  is120DayGapBreached: boolean;
  resolutions: SecretarialResolutionItem[];
  isMinutesSignedByChairman: boolean;
  minutesSigningDate?: string;
  minuteBookEntryUrl?: string;
}

export class MinuteBookGeneratorEngine {
  /**
   * Generates statutory minutes and validates SS-1 120-day maximum gap rule
   */
  public static compileMeetingPack(
    meeting: MinuteBookMeetingItem,
    previousMeetingDateStr?: string
  ): {
    isValidGap: boolean;
    noticeCompliant: boolean;
    compiledMinutesText: string;
  } {
    let gapBreached = false;
    let daysDiff = 0;

    if (previousMeetingDateStr && meeting.meetingType === 'BOARD_MEETING') {
      const prev = new Date(previousMeetingDateStr);
      const curr = new Date(meeting.meetingDate);
      daysDiff = Math.ceil((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      if (daysDiff > 120) {
        gapBreached = true;
      }
    }

    meeting.gapFromPreviousMeetingDays = daysDiff;
    meeting.is120DayGapBreached = gapBreached;

    // Compile formal secretarial text
    const lines: string[] = [];
    lines.push(`MINUTES OF THE PROCEEDINGS OF ${meeting.meetingType.replace(/_/g, ' ')} (${meeting.meetingNumber})`);
    lines.push(`HELD ON ${meeting.meetingDate} AT ${meeting.meetingTime}`);
    lines.push(`MODE / VENUE: ${meeting.venueOrMode}`);
    lines.push(`CHAIRMAN: ${meeting.chairmanName}`);
    lines.push(`\nDIRECTORS PRESENT:`);
    meeting.directorsPresent.forEach(d => {
      lines.push(`- ${d.name} (DIN: ${d.din}) [Attended via ${d.mode}]`);
    });

    lines.push(`\nRESOLUTIONS PASSED:`);
    meeting.resolutions.forEach(r => {
      lines.push(`\nItem ${r.resolutionNumber}: ${r.agendaTitle} (${r.statutorySection})`);
      lines.push(r.resolutionDraftText);
      lines.push(`Status: ${r.votingSummary.passedUnanimously ? 'Passed Unanimously' : 'Passed with Majority'}`);
    });

    return {
      isValidGap: !gapBreached,
      noticeCompliant: meeting.isSevenClearDaysNoticeGiven || meeting.shorterNoticeConsentObtained,
      compiledMinutesText: lines.join('\n')
    };
  }
}

export const SAMPLE_MEETINGS_DATA: MinuteBookMeetingItem[] = [
  {
    id: 'BM-2026-03',
    meetingType: 'BOARD_MEETING',
    meetingNumber: 'BM-03/2026-27',
    meetingDate: '2026-09-05',
    meetingTime: '11:30 AM',
    venueOrMode: 'REGISTERED_OFFICE',
    chairmanName: 'Chetan Pratap Singh',
    directorsPresent: [
      { din: '10807715', name: 'Chetan Pratap Singh', mode: 'PHYSICAL' },
      { din: '09124810', name: 'Priya Narang', mode: 'PHYSICAL' },
      { din: '07192842', name: 'Advisory Consultant', mode: 'VIDEO_CONFERENCING' }
    ],
    inviteesPresent: ['CA Gunjan Jain (Statutory Auditor)'],
    noticeDispatchDate: '2026-08-28',
    isSevenClearDaysNoticeGiven: true,
    shorterNoticeConsentObtained: false,
    gapFromPreviousMeetingDays: 78, // Within 120 days!
    is120DayGapBreached: false,
    resolutions: [
      {
        resolutionNumber: 'RES-BM-03-01',
        resolutionType: 'BOARD_RESOLUTION',
        agendaTitle: 'Approval of Audited Financial Statements for FY 2025-26',
        statutorySection: 'Section 134(5) & Rule 8',
        resolutionDraftText: 'RESOLVED THAT the Balance Sheet as at 31st March 2026, the Statement of Profit and Loss, and Cash Flow Statement along with the Notes forming part thereof, as placed before the Board, be and are hereby approved and signed on behalf of the Board by Mr. Chetan Pratap Singh and Ms. Priya Narang, Directors of the Company.',
        votingSummary: { votesInFavor: 3, votesAgainst: 0, passedUnanimously: true }
      },
      {
        resolutionNumber: 'RES-BM-03-02',
        resolutionType: 'BOARD_RESOLUTION',
        agendaTitle: 'Convening of 6th Annual General Meeting (AGM)',
        statutorySection: 'Section 96 & Section 101',
        resolutionDraftText: 'RESOLVED THAT the 6th Annual General Meeting of the Members of the Company be convened on Wednesday, 30th September 2026 at 03:00 PM at the Registered Office of the Company and that the draft Notice and Explanatory Statement as placed before the Board be approved.',
        votingSummary: { votesInFavor: 3, votesAgainst: 0, passedUnanimously: true }
      }
    ],
    isMinutesSignedByChairman: true,
    minutesSigningDate: '2026-09-12'
  },
  {
    id: 'AGM-2026-01',
    meetingType: 'ANNUAL_GENERAL_MEETING',
    meetingNumber: '6th Annual General Meeting',
    meetingDate: '2026-09-30',
    meetingTime: '03:00 PM',
    venueOrMode: 'REGISTERED_OFFICE',
    chairmanName: 'Chetan Pratap Singh',
    directorsPresent: [
      { din: '10807715', name: 'Chetan Pratap Singh', mode: 'PHYSICAL' },
      { din: '09124810', name: 'Priya Narang', mode: 'PHYSICAL' }
    ],
    inviteesPresent: ['CA Gunjan Jain (Statutory Auditor)'],
    noticeDispatchDate: '2026-09-08',
    isSevenClearDaysNoticeGiven: true,
    shorterNoticeConsentObtained: false,
    is120DayGapBreached: false,
    resolutions: [
      {
        resolutionNumber: 'RES-AGM-01',
        resolutionType: 'ORDINARY_RESOLUTION',
        agendaTitle: 'Adoption of Audited Financial Statements & Auditors Report',
        statutorySection: 'Section 129 & Section 134',
        resolutionDraftText: 'RESOLVED THAT the Audited Financial Statements of the Company for the financial year ended 31st March 2026 together with the Reports of the Board of Directors and the Auditors thereon be and are hereby received, considered, and adopted.',
        votingSummary: { votesInFavor: 100000, votesAgainst: 0, passedUnanimously: true }
      },
      {
        resolutionNumber: 'RES-AGM-02',
        resolutionType: 'ORDINARY_RESOLUTION',
        agendaTitle: 'Re-appointment of Statutory Auditors u/s 139',
        statutorySection: 'Section 139 & Section 142',
        resolutionDraftText: 'RESOLVED THAT M/s Chetan Pratap & Associates, Chartered Accountants (Firm Reg No. 019284C), be and are hereby re-appointed as Statutory Auditors of the Company to hold office from the conclusion of this 6th AGM until the conclusion of the 11th AGM at a remuneration to be determined by the Board.',
        votingSummary: { votesInFavor: 100000, votesAgainst: 0, passedUnanimously: true }
      }
    ],
    isMinutesSignedByChairman: true,
    minutesSigningDate: '2026-10-05'
  }
];
