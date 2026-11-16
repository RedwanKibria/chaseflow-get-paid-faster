import LegalDocument, { LegalSection } from '@/components/LegalDocument';
import { LEGAL as L } from '@/config/legal';

const sections: LegalSection[] = [
  { title: 'Who is responsible', paragraphs: [`${L.entityName}, ${L.entityAddress}. Privacy contact: ${L.privacyEmail}.`] },
  { title: 'Our two roles', bullets: [
    `We are the controller of your own account data (name, email, company, logo, usage).`,
    `We are a processor of the data you enter about your clients (client name, email, invoice details). You decide what to enter and are responsible for having a lawful reason to use it.`,
  ] },
  { title: 'What we collect', bullets: ['Account details: name, email, company name, currency, logo.', 'Invoices and the client details you enter.', 'Reminder and email delivery events (sent, failed).', 'Activity and system logs of actions in the app.', 'Feedback survey answers.'] },
  { title: 'Why we use it', bullets: ['To provide the service and send reminders on your instruction.', 'To keep the service secure and prevent abuse.', 'To improve the product.', 'To meet legal obligations.'] },
  { title: 'Who can see your data', paragraphs: ['Only you can see your invoices. Our administrators can access account and invoice data where needed to run, secure and support the service.'] },
  { title: 'Who we share it with', paragraphs: ['We use these providers to run the service: a database, authentication and file storage provider (Supabase), an email delivery provider (Resend), and an app hosting platform (Lovable). [Confirm and list each provider with its location after review.]'] },
  { title: 'Transfers outside the UK or EEA', paragraphs: ['[State where data is stored and the safeguards used if it leaves the UK or EEA.]'] },
  { title: 'How long we keep data', paragraphs: [`Account data is kept while your account is open. Deleted invoices are removed after ${L.deletedInvoiceRetentionDays} days and logs are kept for ${L.logRetentionMonths} months. We keep records of bounced or complained addresses to protect email delivery.`] },
  { title: 'Your rights', paragraphs: [`You can ask to access, correct, delete or export your data, to restrict or object to its use, and to complain to the data protection regulator (in the UK, the Information Commissioner's Office). Contact ${L.privacyEmail}.`] },
  { title: 'Emails sent to your clients', paragraphs: ['Each email identifies you as the sender and replies go to you. People who raise a complaint are added to a list so they are not emailed again.'] },
  { title: 'Security', paragraphs: ['We use access controls, encrypted connections and backups. No system is perfectly secure, and we cannot guarantee absolute security.'] },
  { title: 'Cookies', paragraphs: ['We use only the storage needed to keep you logged in. If we add analytics, we will update this page and ask for consent where required.'] },
  { title: 'Children', paragraphs: [`The service is not intended for anyone under ${L.minimumAge}.`] },
  { title: 'Changes and contact', paragraphs: [`We will tell you about material changes. Questions: ${L.privacyEmail}.`] },
];

export default function PrivacyPage() {
  return <LegalDocument title="Privacy Policy" intro={`Effective ${L.effectiveDate}.`} sections={sections} />;
}
