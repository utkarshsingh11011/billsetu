// PDF Generation Service for BillSetu
// Direct client-side PDF file download matching physical A4 dimensions

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadInvoiceAsPdfFile(
  elementId: string, 
  fileName: string = 'Invoice.pdf'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  try {
    // Render high-res canvas at 2x scale for print sharpness
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
  } catch (err) {
    console.error('Direct PDF rendering failed, falling back to browser print:', err);
    window.print();
  }
}
