// Deterministic Indian GST Tax Engine
// Implements PRD Section 6.2, 7 (INV-02) & 8
// Pure, deterministic integer-paise calculations. No floating point drift.

import { InvoiceLine } from '../types';

export interface CalculatedLine {
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  lineTotalPaise: number;
}

export interface InvoiceTotals {
  subtotalPaise: number;
  totalDiscountPaise: number;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  totalReimbursementsPaise: number; // Toll, state permit, parking
  exactGrandTotalPaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
}

export const STANDARD_TRAVEL_GST_RATES = [
  { rate: 0, label: '0% (Exempt)', description: 'Non-GST / Bill of Supply' },
  { rate: 5, label: '5% (Taxi - No ITC)', description: 'Standard SAC 996412 without Input Tax Credit' },
  { rate: 12, label: '12% (Taxi - With ITC)', description: 'Passenger transport with Input Tax Credit' },
  { rate: 18, label: '18% (Rent-a-Cab B2B)', description: 'Corporate vehicle rental / package' },
  { rate: 28, label: '28% (Luxury Coach)', description: 'AC Luxury tourist coach rental' },
];

export interface TaxEngineContext {
  supplierStateCode: string;
  placeOfSupplyStateCode: string;
  isGstInvoice: boolean;
  isReverseCharge?: boolean;
}

/**
 * Calculates a single invoice line item.
 * - Handles tax-exclusive vs. tax-inclusive pricing.
 * - Computes CGST/SGST for intra-state and IGST for inter-state.
 * - Operates entirely in integer paise.
 */
export function calculateLineItem(
  line: Omit<InvoiceLine, 'taxableValuePaise' | 'cgstPaise' | 'sgstPaise' | 'igstPaise' | 'totalPaise'>,
  context: TaxEngineContext
): CalculatedLine {
  const quantity = Math.max(0, line.quantity);
  const unitPricePaise = Math.max(0, Math.round(line.unitPricePaise));
  
  // Gross line amount before discount
  const grossAmountPaise = Math.round(quantity * unitPricePaise);
  
  // Calculate discount in paise
  let discountPaise = 0;
  if (line.discountPercent > 0) {
    discountPaise = Math.round((grossAmountPaise * line.discountPercent) / 100);
  } else if (line.discountPaise > 0) {
    discountPaise = Math.min(grossAmountPaise, Math.round(line.discountPaise));
  }
  
  const netAmountPaise = Math.max(0, grossAmountPaise - discountPaise);
  
  // For non-GST bill, tax rate is 0
  const effectiveTaxRate = context.isGstInvoice ? line.taxRate : 0;
  const isInterState = context.supplierStateCode !== context.placeOfSupplyStateCode;
  
  let taxableValuePaise = 0;
  let totalTaxPaise = 0;
  let lineTotalPaise = 0;
  
  if (effectiveTaxRate === 0) {
    taxableValuePaise = netAmountPaise;
    totalTaxPaise = 0;
    lineTotalPaise = netAmountPaise;
  } else if (line.isTaxInclusive) {
    // If tax inclusive:
    // Taxable = Net / (1 + Rate / 100) = (Net * 10000) / (10000 + Rate * 100)
    const rateBasis = Math.round(effectiveTaxRate * 100); // e.g. 18% -> 1800
    taxableValuePaise = Math.round((netAmountPaise * 10000) / (10000 + rateBasis));
    totalTaxPaise = netAmountPaise - taxableValuePaise;
    lineTotalPaise = netAmountPaise;
  } else {
    // If tax exclusive:
    taxableValuePaise = netAmountPaise;
    totalTaxPaise = Math.round((taxableValuePaise * effectiveTaxRate) / 100);
    lineTotalPaise = taxableValuePaise + totalTaxPaise;
  }
  
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;
  
  if (totalTaxPaise > 0) {
    if (isInterState) {
      igstPaise = totalTaxPaise;
    } else {
      // Split equally between CGST and SGST
      cgstPaise = Math.floor(totalTaxPaise / 2);
      sgstPaise = totalTaxPaise - cgstPaise; // avoids losing odd paise
    }
  }
  
  return {
    taxableValuePaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    lineTotalPaise,
  };
}

/**
 * Calculates totals for the entire invoice.
 * Computes exact sum, calculates round-off to nearest whole Rupee,
 * and returns full transparent summary.
 */
export function calculateInvoiceTotals(
  lines: InvoiceLine[],
  context: TaxEngineContext,
  totalReimbursementsPaise: number = 0
): InvoiceTotals {
  let subtotalPaise = 0;
  let totalDiscountPaise = 0;
  let taxableValuePaise = 0;
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;
  
  lines.forEach(line => {
    const gross = Math.round(line.quantity * line.unitPricePaise);
    subtotalPaise += gross;
    totalDiscountPaise += line.discountPaise || 0;
    taxableValuePaise += line.taxableValuePaise;
    cgstPaise += line.cgstPaise;
    sgstPaise += line.sgstPaise;
    igstPaise += line.igstPaise;
  });
  
  const totalTaxPaise = cgstPaise + sgstPaise + igstPaise;
  const safeReimbursements = Math.max(0, Math.round(totalReimbursementsPaise || 0));
  const exactGrandTotalPaise = taxableValuePaise + totalTaxPaise + safeReimbursements;
  
  // Indian rounding convention: round to nearest integer Rupee (100 paise)
  const remainder = exactGrandTotalPaise % 100;
  let roundOffPaise = 0;
  if (remainder !== 0) {
    if (remainder >= 50) {
      roundOffPaise = 100 - remainder;
    } else {
      roundOffPaise = -remainder;
    }
  }
  
  const grandTotalPaise = exactGrandTotalPaise + roundOffPaise;
  
  return {
    subtotalPaise,
    totalDiscountPaise,
    taxableValuePaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    totalReimbursementsPaise: safeReimbursements,
    exactGrandTotalPaise,
    roundOffPaise,
    grandTotalPaise,
  };
}

/**
 * Formats integer paise to Indian Rupee string (e.g. ₹1,45,200.00).
 */
export function formatPaiseToRupees(paise: number, includeSymbol: boolean = true): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = (absPaise / 100).toFixed(2);
  const parts = rupees.split('.');
  
  // Indian number comma formatting: 12,34,567.89
  let intPart = parts[0];
  const decPart = parts[1];
  
  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  
  const formatted = `${intPart}.${decPart}`;
  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Converts integer paise into Indian currency words representation.
 * e.g. "One Thousand Two Hundred Thirty Four Rupees and Fifty Paise Only"
 */
export function paiseToWords(paise: number): string {
  if (paise === 0) return 'Zero Rupees Only';
  
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const fraction = absPaise % 100;
  
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  
  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }
  
  let crore = Math.floor(rupees / 10000000);
  let lakh = Math.floor((rupees % 10000000) / 100000);
  let thousand = Math.floor((rupees % 100000) / 1000);
  let remainder = rupees % 1000;
  
  let result = '';
  if (crore > 0) result += convertGroup(crore) + ' Crore ';
  if (lakh > 0) result += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) result += convertGroup(thousand) + ' Thousand ';
  if (remainder > 0) result += convertGroup(remainder) + ' ';
  
  result = result.trim() + ' Rupees';
  
  if (fraction > 0) {
    result += ' and ' + convertGroup(fraction) + ' Paise';
  }
  
  return (result + ' Only').trim();
}
