import { NextRequest, NextResponse } from 'next/server';
import { LegacySoftwareMigrator, MigrationSummaryReport } from '@/lib/migration/legacySoftwareMigrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { software, rawContent, fileName } = body;

    if (!software) {
      return NextResponse.json({ error: 'Software source is required' }, { status: 400 });
    }

    let report: MigrationSummaryReport;

    switch (software) {
      case 'WINMAN':
        report = LegacySoftwareMigrator.parseWinmanBackup(rawContent || '', fileName || 'winman_backup.xml');
        break;
      case 'COMPUTAX':
        report = LegacySoftwareMigrator.parseCompuTaxExport(rawContent || '', fileName || 'computax_audit.xlsx');
        break;
      case 'TALLY_PRIME':
        report = LegacySoftwareMigrator.parseTallyPrimeXml(rawContent || '', fileName || 'tally_trial_balance.xml');
        break;
      default:
        report = LegacySoftwareMigrator.parseWinmanBackup(rawContent || '', fileName || 'legacy_backup.json');
        break;
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process legacy migration' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Returns simulated ready-to-test legacy packages
  const defaultReport = LegacySoftwareMigrator.parseWinmanBackup('', 'sample_winman_firm_backup.xml');
  return NextResponse.json({
    success: true,
    availablePresets: ['WINMAN', 'COMPUTAX', 'TALLY_PRIME'],
    sampleReport: defaultReport
  });
}
