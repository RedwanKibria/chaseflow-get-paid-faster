/** Builds the file a user downloads from Settings > Your data. Pure, so it can be tested. */
export interface DataExportInput {
  profile: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
  activityLogs: Record<string, unknown>[];
  exportedAt?: Date;
}

// Fields that only matter to the system and say nothing useful about the user's own data.
const HIDDEN_PROFILE_FIELDS = ['plan'];

export function buildDataExport({ profile, invoices, activityLogs, exportedAt = new Date() }: DataExportInput) {
  const cleanProfile = profile
    ? Object.fromEntries(Object.entries(profile).filter(([k]) => !HIDDEN_PROFILE_FIELDS.includes(k)))
    : null;
  return {
    exported_at: exportedAt.toISOString(),
    note: 'A copy of the data ChaseFlow holds about your account. Invoice PDFs and logo images are not included in this file.',
    profile: cleanProfile,
    invoice_count: invoices.length,
    invoices,
    activity_log_count: activityLogs.length,
    activity_logs: activityLogs,
  };
}
