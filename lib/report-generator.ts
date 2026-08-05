/**
 * Report generation customization options, metadata formatting, and option validation utilities.
 */

export interface ReportThemeOptions {
  title: string;
  themeColor: string;
  includeSummary: boolean;
  includeDetails: boolean;
}

/**
 * Formats metadata and configuration parameters for carbon footprint reports.
 */
export function formatReportMetadata(options: ReportThemeOptions) {
  return {
    generatedAt: new Date().toISOString(),
    title: options.title || 'Carbon Emission Intelligence Report',
    primaryColor: options.themeColor || '#1e3a5f',
    sections: {
      summary: options.includeSummary,
      details: options.includeDetails,
    },
  };
}

/**
 * Validates report customization options against title length and hex color format rules.
 */
export function validateReportOptions(options: Partial<ReportThemeOptions>): boolean {
  if (options.title && options.title.length > 100) return false;
  if (options.themeColor && !/^#[0-9A-F]{6}$/i.test(options.themeColor)) return false;
  return true;
}
