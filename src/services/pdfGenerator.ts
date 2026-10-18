// PDF Generation Service for BillSetu
// Direct client-side PDF file download matching physical A4 dimensions
// Supports Android Native Bridge for background file saving and printing

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

declare global {
  interface Window {
    BillSetuNative?: {
      isNativeApp?: () => boolean;
      getAppVersion?: () => string;
      savePdfToDownloads?: (base64Data: string, fileName: string) => void;
      printInvoice?: (jobTitle?: string) => void;
      shareInvoice?: (shareText: string, base64Pdf?: string, fileName?: string) => void;
      openUpiPay?: (upiUrl: string) => void;
      vibrate?: (ms: number) => void;
      showToast?: (msg: string) => void;
    };
  }
}

export async function downloadInvoiceAsPdfFile(
  elementId: string, 
  fileName: string = 'Invoice.pdf'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    if (window.BillSetuNative?.printInvoice) {
      window.BillSetuNative.printInvoice(fileName);
    } else {
      window.print();
    }
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

    // If running in Android native app, save directly to Downloads via native bridge
    if (window.BillSetuNative?.savePdfToDownloads) {
      const dataUri = pdf.output('datauristring');
      window.BillSetuNative.savePdfToDownloads(dataUri, fileName);
      window.BillSetuNative.vibrate?.(40);
    } else {
      pdf.save(fileName);
    }
  } catch (err) {
    console.error('Direct PDF rendering failed, falling back to print:', err);
    if (window.BillSetuNative?.printInvoice) {
      window.BillSetuNative.printInvoice(fileName);
    } else {
      window.print();
    }
  }
}
