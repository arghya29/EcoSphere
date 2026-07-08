import { validateReportOptions, formatReportMetadata } from '@/lib/report-generator';

describe('Reports Custom Export Settings', () => {
  it('validates theme colors correctly', () => {
    expect(validateReportOptions({ themeColor: '#1e3a5f' })).toBe(true);
    expect(validateReportOptions({ themeColor: 'invalid-hex' })).toBe(false);
  });

  it('validates title length constraints', () => {
    expect(validateReportOptions({ title: 'A'.repeat(120) })).toBe(false);
    expect(validateReportOptions({ title: 'A'.repeat(50) })).toBe(true);
  });

  it('correctly maps metadata settings', () => {
    const options = {
      title: 'Quarterly Audit',
      themeColor: '#2f6f4f',
      includeSummary: true,
      includeDetails: false,
    };
    const metadata = formatReportMetadata(options);
    expect(metadata.title).toBe('Quarterly Audit');
    expect(metadata.primaryColor).toBe('#2f6f4f');
    expect(metadata.sections.details).toBe(false);
  });
});
