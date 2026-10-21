import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '@/types';
import { invoiceLogoData } from './branding';

export async function generateInvoicePdf(invoice: Invoice, currencySymbol: string = '£') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;
  if (invoice.logo_url) {
    const logo = await invoiceLogoData(invoice.logo_url);
    const props = doc.getImageProperties(logo);
    const width = Math.min(40, 18 * props.width / props.height);
    doc.addImage(logo, 'PNG', margin, y, width, width * props.height / props.width);
    y += 24;
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, y + 2, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(invoice.your_company_name || 'ChaseFlow', margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.text(invoice.invoice_code, margin, y);
  doc.setTextColor(100, 100, 100);
  doc.text(`Type: ${invoice.invoice_type === 'hourly' ? 'Hourly' : 'Regular'}`, pageWidth - margin, y, { align: 'right' });
  y += 4;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setTextColor(130, 130, 130);
  doc.setFontSize(8);
  doc.text('BILL TO', margin, y);
  doc.text('DETAILS', pageWidth / 2 + 10, y);
  y += 5;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.client_name, margin, y);
  doc.setFont('helvetica', 'normal');

  const detailX = pageWidth / 2 + 10;
  const detailValX = detailX + 35;
  doc.setFontSize(9);
  doc.text('Invoice Date:', detailX, y);
  doc.text(invoice.invoice_date, detailValX, y);
  y += 5;

  doc.setTextColor(100, 100, 100);
  doc.text(invoice.client_company, margin, y);
  doc.setTextColor(40, 40, 40);
  doc.text('Due Date:', detailX, y);
  doc.text(invoice.due_date, detailValX, y);
  y += 5;

  doc.setTextColor(100, 100, 100);
  doc.text(invoice.client_email, margin, y);
  if (invoice.invoice_reference) {
    doc.setTextColor(40, 40, 40);
    doc.text('Reference:', detailX, y);
    doc.text(invoice.invoice_reference, detailValX, y);
  }
  y += 10;

  const isHourly = invoice.invoice_type === 'hourly';
  const head = [
    ['#', 'Description', isHourly ? 'Hours' : 'Qty', isHourly ? `Rate (${currencySymbol})` : `Price (${currencySymbol})`, `Total (${currencySymbol})`],
  ];

  const body = invoice.items.map((item, idx) => [
    String(idx + 1),
    item.description || '—',
    String(isHourly ? item.hours : item.quantity),
    (isHourly ? item.hourly_rate : item.unit_amount).toLocaleString(),
    item.item_total.toLocaleString(),
  ]);

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [245, 245, 245], textColor: [80, 80, 80], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { halign: 'right', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    theme: 'grid',
    styles: { lineColor: [230, 230, 230], lineWidth: 0.3 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  const totalsX = pageWidth - margin;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', totalsX - 40, y);
  doc.setTextColor(40, 40, 40);
  doc.text(`${currencySymbol}${invoice.subtotal_amount.toLocaleString()}`, totalsX, y, { align: 'right' });
  y += 6;

  if (invoice.vat_percent > 0) {
    doc.setTextColor(100, 100, 100);
    doc.text(`VAT (${invoice.vat_percent}%):`, totalsX - 40, y);
    doc.setTextColor(40, 40, 40);
    doc.text(`${currencySymbol}${invoice.vat_amount.toLocaleString()}`, totalsX, y, { align: 'right' });
    y += 6;
  }

  if (invoice.tax_percent > 0) {
    doc.setTextColor(100, 100, 100);
    doc.text(`TAX (${invoice.tax_percent}%):`, totalsX - 40, y);
    doc.setTextColor(40, 40, 40);
    doc.text(`${currencySymbol}${invoice.tax_amount.toLocaleString()}`, totalsX, y, { align: 'right' });
    y += 6;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX - 50, y, totalsX, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(`${currencySymbol}${invoice.total_amount.toLocaleString()}`, totalsX, y, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Total:', totalsX - 50, y);

  y += 16;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Payment Terms: Please pay within the due date specified above.', margin, y);
  y += 4;
  doc.text('Thank you for your business!', margin, y);

  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    doc.setFontSize(48);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(
      invoice.status === 'paid' ? 200 : 220,
      invoice.status === 'paid' ? 230 : 200,
      invoice.status === 'paid' ? 200 : 200,
    );
    doc.text(invoice.status.toUpperCase(), pageWidth / 2, 140, { align: 'center', angle: 35 });
  }

  const filename = `${invoice.invoice_code || 'invoice'}.pdf`;
  doc.save(filename);
}
