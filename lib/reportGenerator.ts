import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


export interface ReportConfig {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
  generatedBy?: string;
}

const getLogoBase64 = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = '/logo.png';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

export const generatePDFReport = async (config: ReportConfig) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logoBase64 = await getLogoBase64();

  // Add Company Logo Header
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
    } catch {
      /* fallback if image fails */
    }
  }

  // Company Information Header
  const startX = logoBase64 ? 38 : 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 27, 75); // Indigo 950
  doc.text('PJSOFONIC ERP SOLUTIONS', startX, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Enterprise Resource Planning Portal | Official Audit Report', startX, 23);
  doc.text(`Corporate Tower • Support: info@pjsofonic.com`, startX, 28);

  // Line Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.line(14, 34, 196, 34);

  // Report Meta Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(config.title.toUpperCase(), 14, 43);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  const dateStr = new Date().toLocaleString();
  const metaText = `Generated On: ${dateStr}   |   Exported By: ${config.generatedBy || 'Administrator'}`;
  doc.text(metaText, 14, 49);

  // Data Table
  autoTable(doc, {
    startY: 54,
    head: [config.headers],
    body: config.rows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer Page Numbering
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pageCount} — Confidential • PJSOFONIC ERP`,
      105,
      287,
      { align: 'center' }
    );
  }

  doc.save(`${config.fileName}.pdf`);
};

export const generateExcelReport = (config: ReportConfig) => {
  const dateStr = new Date().toLocaleString();
  const sheetData: (string | number)[][] = [
    ['PJSOFONIC ERP SOLUTIONS'],
    ['Enterprise Resource Planning Portal | Official Audit Report'],
    [`Report Title: ${config.title}`],
    [`Generated On: ${dateStr}`, `Exported By: ${config.generatedBy || 'Administrator'}`],
    [], // Blank spacing row
    config.headers,
    ...config.rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto column widths
  const colWidths = config.headers.map((h, i) => {
    let maxLen = h.length;
    config.rows.forEach((r) => {
      const cellVal = String(r[i] ?? '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.max(maxLen + 4, 15) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.title.substring(0, 30));

  XLSX.writeFile(wb, `${config.fileName}.xlsx`);
};
