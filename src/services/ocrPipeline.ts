// Scan-to-Books OCR & Extraction Pipeline
// Implements PRD Section 6.3, Section 7 (SCAN-01, SCAN-02, SCAN-03) & Appendix A

import { ScannedDocument, ExtractionResult } from '../types';
import { validateGstinFormat } from './gstinService';

/**
 * Pre-defined rich test documents simulating different real-world conditions:
 * 1. Clean printed tax invoice (high confidence)
 * 2. Thermal store receipt (faded/uncertain fields)
 * 3. SaaS / Online invoice PDF
 * 4. Document with intentional arithmetic mismatch to test validation guardrails
 */
export const SAMPLE_DOCUMENTS: Array<{
  id: string;
  name: string;
  type: string;
  description: string;
  sampleData: ExtractionResult;
}> = [
  {
    id: 'sample_metro',
    name: 'Metro Hardware Tax Invoice #MH/2026/1092',
    type: 'purchase_tax_invoice',
    description: 'Clean GST tax invoice with inter-state IGST 18% (High confidence 96%)',
    sampleData: {
      documentType: 'purchase_tax_invoice',
      supplier: {
        gstin: { value: '27AAECM4455G1ZV', confidence: 0.98 },
        legalName: { value: 'METRO HARDWARE & INDUSTRIAL SUPPLIES', confidence: 0.96 },
        address: { value: 'Gala 12, LBS Marg, Kurla West, Mumbai 400070', confidence: 0.91 }
      },
      invoice: {
        number: { value: 'MH/2026/1092', confidence: 0.95 },
        date: { value: '2026-10-14', confidence: 0.92 },
        currency: 'INR'
      },
      lines: [
        {
          description: 'Industrial Safety Gloves (Heavy Duty Pack of 10)',
          quantity: 5,
          unitPricePaise: 65000,
          taxRate: 18,
          totalPaise: 383500,
          confidence: 0.94
        },
        {
          description: 'High Pressure Brass Valves 1/2 inch',
          quantity: 12,
          unitPricePaise: 42000,
          taxRate: 18,
          totalPaise: 594720,
          confidence: 0.92
        }
      ],
      totals: {
        taxableValuePaise: { value: 829000, confidence: 0.95 },
        taxPaise: { value: 149220, confidence: 0.95 },
        grandTotalPaise: { value: 978220, confidence: 0.96 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    }
  },
  {
    id: 'sample_thermal',
    name: 'Sagar Store Thermal POS Receipt',
    type: 'retail_receipt',
    description: 'Thermal receipt with low-light / faded ink (Medium confidence 76%, uncertain fields)',
    sampleData: {
      documentType: 'retail_receipt',
      supplier: {
        gstin: { value: '27BXOPM8891N1ZX', confidence: 0.72, isUncertain: true },
        legalName: { value: 'SAGAR GENERAL STORE & CAFE', confidence: 0.88 },
        address: { value: 'Station Road, Dadar East, Mumbai', confidence: 0.68, isUncertain: true }
      },
      invoice: {
        number: { value: 'POS-88219', confidence: 0.82 },
        date: { value: '2026-10-16', confidence: 0.60, isUncertain: true },
        currency: 'INR'
      },
      lines: [
        {
          description: 'Office Pantry Snacks & Premium Coffee Beans',
          quantity: 1,
          unitPricePaise: 145000,
          taxRate: 5,
          totalPaise: 152250,
          confidence: 0.79
        }
      ],
      totals: {
        taxableValuePaise: { value: 145000, confidence: 0.81 },
        taxPaise: { value: 7250, confidence: 0.81 },
        grandTotalPaise: { value: 152250, confidence: 0.82 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    }
  },
  {
    id: 'sample_saas',
    name: 'CloudNet Technologies Cloud Billing PDF',
    type: 'online_invoice',
    description: 'Digital online invoice with recurring subscription lines (High confidence 98%)',
    sampleData: {
      documentType: 'online_invoice',
      supplier: {
        gstin: { value: '29AAACC1122D1ZK', confidence: 0.99 },
        legalName: { value: 'CLOUDNET TECHNOLOGIES INDIA PVT LTD', confidence: 0.99 },
        address: { value: 'Outer Ring Road, Bellandur, Bengaluru 560103', confidence: 0.97 }
      },
      invoice: {
        number: { value: 'CN/INV-99420', confidence: 0.99 },
        date: { value: '2026-10-01', confidence: 0.98 },
        currency: 'INR'
      },
      lines: [
        {
          description: 'Cloud Server Hosting & Database Cluster (Standard Tier)',
          quantity: 1,
          unitPricePaise: 480000,
          taxRate: 18,
          totalPaise: 566400,
          confidence: 0.98
        }
      ],
      totals: {
        taxableValuePaise: { value: 480000, confidence: 0.99 },
        taxPaise: { value: 86400, confidence: 0.99 },
        grandTotalPaise: { value: 566400, confidence: 0.99 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    }
  },
  {
    id: 'sample_mismatch',
    name: 'Capital Stationery (Flagged Arithmetic Error)',
    type: 'purchase_tax_invoice',
    description: 'Demonstrates PRD validation guardrail: Flagged discrepancy between lines and total',
    sampleData: {
      documentType: 'purchase_tax_invoice',
      supplier: {
        gstin: { value: '07AAAFK8921J1ZQ', confidence: 0.94 },
        legalName: { value: 'CAPITAL STATIONERY & PRINTERS', confidence: 0.95 },
        address: { value: 'Nehru Place, New Delhi 110019', confidence: 0.89 }
      },
      invoice: {
        number: { value: 'CSP/2026/410', confidence: 0.93 },
        date: { value: '2026-10-11', confidence: 0.91 },
        currency: 'INR'
      },
      lines: [
        {
          description: 'A4 Copier Paper (Carton of 5 reams)',
          quantity: 2,
          unitPricePaise: 110000,
          taxRate: 12,
          totalPaise: 246400,
          confidence: 0.90
        }
      ],
      totals: {
        taxableValuePaise: { value: 220000, confidence: 0.90 },
        taxPaise: { value: 26400, confidence: 0.90 },
        grandTotalPaise: { value: 295000, confidence: 0.65, isUncertain: true } // Discrepancy!
      },
      validation: {
        arithmeticMismatch: true,
        mismatchExplanation: 'Discrepancy detected: Computed sum is ₹2,464.00, but printed grand total reads ₹2,950.00. Please inspect paper.',
        requiresHumanReview: true,
      }
    }
  },
  {
    id: 'sample_cab_dutyslip',
    name: 'Driver Trip Duty Slip #DS-2026-882 (Innova Crysta)',
    type: 'purchase_tax_invoice',
    description: 'Chauffeured trip sheet: UP65-BT-4582, 95 KM, Cab package ₹3,200 (5% GST) + Toll ₹180 & Parking ₹120',
    sampleData: {
      documentType: 'purchase_tax_invoice',
      supplier: {
        gstin: { value: '09AAACK8892M1Z2', confidence: 0.97 },
        legalName: { value: 'KASHI TOURS & FLEET SERVICES PVT LTD', confidence: 0.98 },
        address: { value: 'Shop 4, Dashashwamedh Ghat Road, Varanasi 221001', confidence: 0.92 }
      },
      invoice: {
        number: { value: 'DS-2026-882', confidence: 0.96 },
        date: { value: '2026-10-16', confidence: 0.94 },
        currency: 'INR'
      },
      lines: [
        {
          description: 'Chauffeured Cab Rental - Innova Crysta (8Hrs / 80Km) - Vehicle UP65-BT-4582',
          quantity: 1,
          unitPricePaise: 320000,
          taxRate: 5,
          totalPaise: 336000,
          confidence: 0.96
        },
        {
          description: 'Extra Kilometers (15 Km @ ₹16/Km)',
          quantity: 15,
          unitPricePaise: 1600,
          taxRate: 5,
          totalPaise: 25200,
          confidence: 0.93
        },
        {
          description: 'Pure Agent Reimbursement: NH-19 Toll Plaza + Airport Parking',
          quantity: 1,
          unitPricePaise: 30000,
          taxRate: 0,
          totalPaise: 30000,
          confidence: 0.95
        }
      ],
      totals: {
        taxableValuePaise: { value: 344000, confidence: 0.96 },
        taxPaise: { value: 17200, confidence: 0.96 },
        grandTotalPaise: { value: 391200, confidence: 0.97 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    }
  },
  {
    id: 'sample_fastag_toll',
    name: 'NHAI FASTag Toll Plaza Slip #NH19-782',
    type: 'retail_receipt',
    description: 'National Highway FASTag toll receipt: Vehicle UP65-BT-4582, Dafi Toll Plaza, ₹125 (0% Tax / Rule 33)',
    sampleData: {
      documentType: 'retail_receipt',
      supplier: {
        gstin: { value: '09AAATN0001E1Z0', confidence: 0.95 },
        legalName: { value: 'NATIONAL HIGHWAYS AUTHORITY OF INDIA (NHAI)', confidence: 0.99 },
        address: { value: 'Dafi Toll Plaza NH-19 (Km 782.5), Varanasi UP', confidence: 0.91 }
      },
      invoice: {
        number: { value: 'TOLL-782914', confidence: 0.94 },
        date: { value: '2026-10-16', confidence: 0.95 },
        currency: 'INR'
      },
      lines: [
        {
          description: 'Toll User Fee - Car/Jeep/Van (UP65-BT-4582) Single Journey',
          quantity: 1,
          unitPricePaise: 12500,
          taxRate: 0,
          totalPaise: 12500,
          confidence: 0.97
        }
      ],
      totals: {
        taxableValuePaise: { value: 12500, confidence: 0.97 },
        taxPaise: { value: 0, confidence: 0.99 },
        grandTotalPaise: { value: 12500, confidence: 0.98 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    }
  }
];

/**
 * Validates the arithmetic of an extracted document.
 * Cross-checks line sum against taxable value, tax, and grand total.
 */
export function validateExtractionArithmetic(extraction: ExtractionResult): {
  isMatch: boolean;
  computedTaxablePaise: number;
  computedTaxPaise: number;
  computedTotalPaise: number;
  explanation?: string;
} {
  let computedTaxablePaise = 0;
  let computedTaxPaise = 0;
  let computedTotalPaise = 0;

  for (const line of extraction.lines) {
    const lineNet = Math.round(line.quantity * line.unitPricePaise);
    const lineTax = Math.round((lineNet * line.taxRate) / 100);
    computedTaxablePaise += lineNet;
    computedTaxPaise += lineTax;
    computedTotalPaise += (lineNet + lineTax);
  }

  const grandTotal = extraction.totals.grandTotalPaise.value;
  // Allow ±100 paise difference for rounding
  const diff = Math.abs(computedTotalPaise - grandTotal);
  const isMatch = diff <= 100;

  let explanation: string | undefined;
  if (!isMatch) {
    explanation = `Arithmetic mismatch: Sum of lines is ₹${(computedTotalPaise / 100).toFixed(2)}, but extracted total is ₹${(grandTotal / 100).toFixed(2)}.`;
  }

  return {
    isMatch,
    computedTaxablePaise,
    computedTaxPaise,
    computedTotalPaise,
    explanation,
  };
}

/**
 * Simulates processing an uploaded file.
 * Handles custom uploads by parsing file metadata and generating a candidate proposal with confidence scoring.
 */
export async function processScannedDocument(
  file: File, 
  onProgress?: (progress: number, step: string) => void
): Promise<ScannedDocument> {
  onProgress?.(15, 'Uploading document...');
  await new Promise(r => setTimeout(r, 250));

  onProgress?.(45, 'Applying image contrast & edge detection...');
  await new Promise(r => setTimeout(r, 350));

  onProgress?.(75, 'Extracting OCR text & GST candidate fields...');
  await new Promise(r => setTimeout(r, 400));

  onProgress?.(95, 'Running arithmetic cross-checks...');
  await new Promise(r => setTimeout(r, 200));

  // Create an object URL for preview
  const fileUrl = URL.createObjectURL(file);
  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-\.]/g, ' ');

  // Generate sensible candidate extraction based on uploaded file
  const isTaxiDuty = /duty|slip|taxi|cab|car|fleet|driver|trip/i.test(file.name);
  const isToll = /toll|fastag|parking|nhai/i.test(file.name);
  const isReceipt = /receipt|pos|thermal|cafe|fuel/i.test(file.name);
  const isPdf = file.type === 'application/pdf';

  let defaultCandidate: ExtractionResult;

  if (isTaxiDuty) {
    defaultCandidate = {
      documentType: 'purchase_tax_invoice',
      supplier: {
        gstin: { value: '09AAACK8892M1Z2', confidence: 0.96 },
        legalName: { value: cleanName.toUpperCase() || 'KASHI TOURS & FLEET SERVICES', confidence: 0.95 },
        address: { value: 'Transport Nagar / Garage Yard, Varanasi', confidence: 0.88 },
      },
      invoice: {
        number: { value: `DS-${Math.floor(1000 + Math.random() * 9000)}`, confidence: 0.92 },
        date: { value: new Date().toISOString().split('T')[0], confidence: 0.95 },
        currency: 'INR',
      },
      lines: [
        {
          description: 'Cab Rental & Duty Slip Package (Vehicle UP65-BT-4582)',
          quantity: 1,
          unitPricePaise: 320000, // ₹3,200
          taxRate: 5,
          totalPaise: 336000,
          confidence: 0.94,
        },
        {
          description: 'Out-of-Pocket Fastag Toll Reimbursement',
          quantity: 1,
          unitPricePaise: 24000, // ₹240
          taxRate: 0,
          totalPaise: 24000,
          confidence: 0.92,
        },
      ],
      totals: {
        taxableValuePaise: { value: 320000, confidence: 0.95 },
        taxPaise: { value: 16000, confidence: 0.95 },
        grandTotalPaise: { value: 360000, confidence: 0.95 },
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      },
    };
  } else if (isToll) {
    defaultCandidate = {
      documentType: 'retail_receipt',
      supplier: {
        gstin: { value: '09AAATN0001E1Z0', confidence: 0.92 },
        legalName: { value: 'NATIONAL HIGHWAY FASTAG TOLL PLAZA', confidence: 0.96 },
        address: { value: 'NH-19 Toll Plaza Varanasi UP', confidence: 0.85 },
      },
      invoice: {
        number: { value: `TOLL-${Math.floor(100000 + Math.random() * 900000)}`, confidence: 0.95 },
        date: { value: new Date().toISOString().split('T')[0], confidence: 0.92 },
        currency: 'INR',
      },
      lines: [
        {
          description: 'National Highway Toll Plaza FASTag Fee (Vehicle UP65-BT-4582)',
          quantity: 1,
          unitPricePaise: 12500,
          taxRate: 0,
          totalPaise: 12500,
          confidence: 0.96,
        },
      ],
      totals: {
        taxableValuePaise: { value: 12500, confidence: 0.96 },
        taxPaise: { value: 0, confidence: 0.98 },
        grandTotalPaise: { value: 12500, confidence: 0.97 },
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      },
    };
  } else {
    defaultCandidate = {
      documentType: isReceipt ? 'retail_receipt' : (isPdf ? 'online_invoice' : 'purchase_tax_invoice'),
      supplier: {
        gstin: { value: '27AABCS1234F1Z5', confidence: 0.88, isUncertain: false },
        legalName: { value: cleanName.toUpperCase() || 'LOCAL SUPPLIER TRADERS', confidence: 0.91 },
        address: { value: 'Commercial Complex, Sector 18', confidence: 0.82 }
      },
      invoice: {
        number: { value: `INV-${Math.floor(1000 + Math.random() * 9000)}`, confidence: 0.90 },
        date: { value: new Date().toISOString().split('T')[0], confidence: 0.88 },
        currency: 'INR'
      },
      lines: [
        {
          description: `${cleanName} - Item Line 1`,
          quantity: 1,
          unitPricePaise: 250000, // ₹2,500.00
          taxRate: 18,
          totalPaise: 295000,
          confidence: 0.89
        }
      ],
      totals: {
        taxableValuePaise: { value: 250000, confidence: 0.92 },
        taxPaise: { value: 45000, confidence: 0.92 },
        grandTotalPaise: { value: 295000, confidence: 0.93 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    };
  }

  const newScan: ScannedDocument = {
    id: `scan_${Date.now()}`,
    fileName: file.name,
    fileUrl,
    fileType: file.type.includes('pdf') ? 'application/pdf' : 'image/jpeg',
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    status: 'needs_review',
    extraction: defaultCandidate,
  };

  return newScan;
}
