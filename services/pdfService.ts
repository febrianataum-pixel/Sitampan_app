
import { AppSettings, formatIndoDate } from '../types';

declare var html2pdf: any;

interface PDFColumn {
  header: string;
  dataKey: string;
  align?: 'left' | 'center' | 'right';
  format?: (val: any) => string;
}

export const generateReportPDF = (
  title: string, 
  columns: PDFColumn[], 
  data: any[], 
  settings: AppSettings
) => {
  const downloadDate = formatIndoDate(new Date().toISOString().split('T')[0]);
  const downloadTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const logoHtml = settings.logo 
    ? `<img src="${settings.logo}" style="height:60px; width:auto; object-fit:contain;" />`
    : `<div style="width:60px; height:60px; background:#f1f5f9; border:1px solid #cbd5e1; display:flex; align-items:center; justify-content:center; font-size:8px; color:#94a3b8; font-weight:bold;">NO LOGO</div>`;

  const tableHeaderHtml = columns.map(col => 
    `<th style="border: 1px solid #000; padding: 8px; background: #f8fafc; font-size: 10px; text-transform: uppercase;">${col.header}</th>`
  ).join('');

  const tableBodyHtml = data.map((row, idx) => {
    const cells = columns.map(col => {
      const val = row[col.dataKey];
      const displayVal = col.format ? col.format(val) : val;
      return `<td style="border: 1px solid #000; padding: 6px 8px; font-size: 10px; text-align: ${col.align || 'left'}">${displayVal}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const content = `
    <div style="font-family: Arial, sans-serif; padding: 10px; color: #000;">
      <!-- Header / Kop -->
      <div style="display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
        <div style="margin-right: 20px;">${logoHtml}</div>
        <div style="flex: 1;">
          <h1 style="margin: 0; font-size: 18px; text-transform: uppercase;">${settings.appName}</h1>
          <p style="margin: 2px 0; font-size: 10px; color: #444;">${settings.appSubtitle}</p>
          <p style="margin: 2px 0; font-size: 9px; color: #666;">${settings.warehouseName} | Admin: ${settings.adminName}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 8px; font-weight: bold; text-transform: uppercase; color: #94a3b8;">Laporan Sistem</p>
          <p style="margin: 0; font-size: 9px; font-weight: bold;">${downloadDate}</p>
          <p style="margin: 0; font-size: 8px; color: #666;">Pukul ${downloadTime}</p>
        </div>
      </div>

      <!-- Title -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 14px; text-decoration: underline; text-transform: uppercase;">LAPORAN ${title}</h2>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr>${tableHeaderHtml}</tr>
        </thead>
        <tbody>
          ${tableBodyHtml}
        </tbody>
      </table>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: `Laporan_${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(content).save();
};
