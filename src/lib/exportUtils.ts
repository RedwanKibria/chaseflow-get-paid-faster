/**
 * Export utility for CSV and Excel downloads
 */

export function downloadCsv(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

export function downloadExcel(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);

  // Build a simple XLSX using XML spreadsheet format (compatible with Excel)
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

  // Header row
  xml += '<Row>\n';
  headers.forEach(h => {
    xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';

  // Data rows
  data.forEach(row => {
    xml += '<Row>\n';
    headers.forEach(h => {
      const val = row[h];
      if (val === null || val === undefined) {
        xml += '<Cell ss:StyleID="default"><Data ss:Type="String"></Data></Cell>\n';
      } else if (typeof val === 'number') {
        xml += `<Cell ss:StyleID="default"><Data ss:Type="Number">${val}</Data></Cell>\n`;
      } else if (typeof val === 'boolean') {
        xml += `<Cell ss:StyleID="default"><Data ss:Type="String">${val ? 'Yes' : 'No'}</Data></Cell>\n`;
      } else {
        xml += `<Cell ss:StyleID="default"><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>\n`;
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
