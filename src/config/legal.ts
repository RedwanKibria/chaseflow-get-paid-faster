/**
 * Details used by the Terms of Service and Privacy Policy pages.
 * Replace every value that starts with "[" before launch. While any placeholder remains,
 * the legal pages show a visible notice so they are not published unfinished by accident.
 */
export const LEGAL = {
  productName: 'ChaseFlow',
  entityName: '[Legal entity name]',
  entityAddress: '[Registered address]',
  supportEmail: '[support email address]',
  privacyEmail: '[privacy contact email address]',
  governingLaw: '[Governing law, for example England and Wales]',
  effectiveDate: '[Effective date]',
  minimumAge: '18',
  planChangeNoticeDays: '30',
  deletedInvoiceRetentionDays: '[number of days]',
  logRetentionMonths: '[number of months]',
  // Change to the reviewer's name and date once a qualified person has reviewed both pages.
  legalReview: '[pending legal review]',
} as const;

export function hasPlaceholders(): boolean {
  return Object.values(LEGAL).some(v => v.startsWith('['));
}
