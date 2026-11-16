/**
 * Export utility for CSV and spreadsheet downloads
 */
import { toast } from 'sonner';

/**
 * Spreadsheet programs run a cell as a formula when it starts with = + - or @.
 * Text typed by clients and users ends up in exports, so such text is prefixed
 * with a single quote to keep it as plain text. Real numbers are left alone.
 */
export function sanitizeCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return String(val);
  const str = String(val);
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

export function buildCsv(data: Record<string, unknown>[]): string {
  const headers = Object.keys(data[0]);
  const quote = (str: string) =>
    str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  return [
    headers.map(h => quote(h)).join(','),
    ...data.map(row => headers.map(h => quote(sanitizeCell(row[h]))).join(',')),
  ].join('\n');
}

export function downloadCsv(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    toast.info('No data to export');
    return;
  }
  // Byte order mark so Excel reads accents and symbols correctly.
  const blob = new Blob(['﻿' + buildCsv(data)], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Writes an "XML Spreadsheet 2003" file with an .xls extension. Excel opens it,
 * but may show a one-time warning that the format and extension differ.
 */
export function downloadExcel(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    toast.info('No data to export');
    return;
  }
  const headers = Object.keys(data[0]);

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let xml = '<?xml version="1.0"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles>\n';
  xml += '<Style ss:ID="header"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#D5E8F0" ss:Pattern="Solid"/></Style>\n';
  xml += '<Style ss:ID="default"><Font ss:Size="10"/></Style>\n';
  xml += '</Styles>\n';
  xml += '<Worksheet ss:Name="Report">\n';
  xml += '<Table>\n';

  xml += '<Row>\n';
  headers.forEach(h => {
    xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';

  data.forEach(row => {
    xml += '<Row>\n';
    headers.forEach(h => {
      const val = row[h];
      if (val === null || val === undefined) {
        xml += '<Cell ss:StyleID="default"><Data ss:Type="String"></Data></Cell>\n';
      } else if (typeof val === 'number' && Number.isFinite(val)) {
        xml += `<Cell ss:StyleID="default"><Data ss:Type="Number">${val}</Data></Cell>\n`;
      } else if (typeof val === 'boolean') {
        xml += `<Cell ss:StyleID="default"><Data ss:Type="String">${val ? 'Yes' : 'No'}</Data></Cell>\n`;
      } else {
        xml += `<Cell ss:StyleID="default"><Data ss:Type="String">${escapeXml(sanitizeCell(val))}</Data></Cell>\n`;
      }
    });
    xml += '</Row>\n';
  });

  xml += '</Table>\n</Worksheet>\n</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, `${filename}.xls`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
