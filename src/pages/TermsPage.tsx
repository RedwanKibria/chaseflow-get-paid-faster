import LegalDocument, { LegalSection } from '@/components/LegalDocument';
import { LEGAL as L } from '@/config/legal';

const sections: LegalSection[] = [
  { title: 'Who we are', paragraphs: [`${L.productName} is provided by ${L.entityName}, ${L.entityAddress}. You can contact us at ${L.supportEmail}.`] },
  { title: 'The service', paragraphs: [`${L.productName} lets you create invoices and send automatic payment reminders by email. ${L.productName} does not collect, hold or process payments between you and your clients.`] },
  { title: 'Free launch period', paragraphs: [`The service is currently free. We may introduce paid plans or change features. We will give you at least ${L.planChangeNoticeDays} days' notice of any charge, and you can export your data at any time.`] },
  { title: 'Your account', paragraphs: [`You must be at least ${L.minimumAge} and give accurate information. You are responsible for keeping your login secure and for activity on your account.`] },
  { title: 'Acceptable use', bullets: ['Only email people you have a genuine business relationship with about a real invoice.', 'Do not send spam, harassment, fraud, misleading or illegal content.', 'Do not try to access other users\' data or disrupt the service.', 'We may limit sending or suspend an account that causes complaints, bounces or abuse.'] },
  { title: 'Your content and responsibilities', paragraphs: ['You own your invoices and data. You are responsible for the accuracy of your invoices, for tax and VAT, and for having a lawful reason to email your clients.'] },
  { title: 'Email delivery', paragraphs: ['We try to send emails on schedule, but we do not guarantee delivery, timing, or that a client will pay.'] },
  { title: 'No professional advice', paragraphs: [`${L.productName} is not accounting, tax or legal advice.`] },
  { title: 'Availability and changes', paragraphs: ['During the free launch the service is provided "as is". We may change or stop features, and will give reasonable notice where we can.'] },
  { title: 'Limits on our liability', paragraphs: ['Nothing in these terms limits liability that cannot lawfully be limited. [Further liability wording to be added after legal review.]'] },
  { title: 'Ending your use', paragraphs: ['You can stop using the service and ask us to delete your account at any time. We may suspend accounts that break these terms.'] },
  { title: 'Governing law', paragraphs: [`These terms are governed by the law of ${L.governingLaw}.`] },
  { title: 'Changes to these terms', paragraphs: [`We will tell you about material changes by email or in the app. Questions: ${L.supportEmail}.`] },
];

export default function TermsPage() {
  return <LegalDocument title="Terms of Service" intro={`Effective ${L.effectiveDate}.`} sections={sections} />;
}
