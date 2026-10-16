// Unit & Regression Tests for Deterministic Tax Engine
// Matches requirements in PRD Section 7 (INV-02) & Section 13

import { calculateLineItem, calculateInvoiceTotals, formatPaiseToRupees, paiseToWords } from './taxEngine';
import { InvoiceLine } from '../types';

export function runTaxEngineTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      results.push(`✓ PASS: ${testName}`);
    } else {
      results.push(`✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      allPassed = false;
    }
  }

  // Test 1: Intra-state 18% Tax Exclusive (Maharashtra to Maharashtra)
  // 1 unit @ ₹1,000 = ₹1,000 taxable. 18% GST = ₹180 -> CGST ₹90 (9%), SGST ₹90 (9%), Total ₹1,180
  const line1 = calculateLineItem({
    id: '1',
    description: 'Hardware Equipment',
    hsnSac: '8471',
    quantity: 1,
    unit: 'pcs',
    unitPricePaise: 100000, // ₹1,000.00
    discountPercent: 0,
    discountPaise: 0,
    taxRate: 18,
    isTaxInclusive: false,
  }, {
    supplierStateCode: '27',
    placeOfSupplyStateCode: '27',
    isGstInvoice: true,
  });

  assert(line1.taxableValuePaise === 100000, 'Intra-state Taxable Value', `got ${line1.taxableValuePaise}`);
  assert(line1.cgstPaise === 9000, 'Intra-state CGST 9%', `got ${line1.cgstPaise}`);
  assert(line1.sgstPaise === 9000, 'Intra-state SGST 9%', `got ${line1.sgstPaise}`);
  assert(line1.igstPaise === 0, 'Intra-state IGST must be 0', `got ${line1.igstPaise}`);
  assert(line1.lineTotalPaise === 118000, 'Intra-state Line Total ₹1,180', `got ${line1.lineTotalPaise}`);

  // Test 2: Inter-state 18% Tax Exclusive (Maharashtra 27 to Delhi 07)
  // 1 unit @ ₹1,000 -> IGST 18% = ₹180, CGST 0, SGST 0, Total ₹1,180
  const line2 = calculateLineItem({
    id: '2',
    description: 'Interstate Service',
    hsnSac: '9983',
    quantity: 1,
    unit: 'hrs',
    unitPricePaise: 100000,
    discountPercent: 0,
    discountPaise: 0,
    taxRate: 18,
    isTaxInclusive: false,
  }, {
    supplierStateCode: '27',
    placeOfSupplyStateCode: '07',
    isGstInvoice: true,
  });

  assert(line2.igstPaise === 18000, 'Inter-state IGST 18%', `got ${line2.igstPaise}`);
  assert(line2.cgstPaise === 0 && line2.sgstPaise === 0, 'Inter-state CGST/SGST must be 0');

  // Test 3: Tax Inclusive Pricing (Retail item MRP ₹1,180 incl 18% GST)
  // Taxable = 1180 / 1.18 = 1000. Total tax = 180.
  const line3 = calculateLineItem({
    id: '3',
    description: 'Retail Product (MRP)',
    hsnSac: '3304',
    quantity: 1,
    unit: 'pcs',
    unitPricePaise: 118000, // ₹1,180.00
    discountPercent: 0,
    discountPaise: 0,
    taxRate: 18,
    isTaxInclusive: true,
  }, {
    supplierStateCode: '27',
    placeOfSupplyStateCode: '27',
    isGstInvoice: true,
  });

  assert(line3.taxableValuePaise === 100000, 'Tax Inclusive Taxable Value', `got ${line3.taxableValuePaise}`);
  assert(line3.totalTaxPaise === 18000, 'Tax Inclusive Total Tax', `got ${line3.totalTaxPaise}`);
  assert(line3.lineTotalPaise === 118000, 'Tax Inclusive Line Total matches MRP', `got ${line3.lineTotalPaise}`);

  // Test 4: Discount Handling (10% discount on ₹2,000 = ₹200 off -> ₹1,800 taxable @ 12% GST)
  const line4 = calculateLineItem({
    id: '4',
    description: 'Discounted Goods',
    hsnSac: '6109',
    quantity: 1,
    unit: 'pcs',
    unitPricePaise: 200000, // ₹2,000.00
    discountPercent: 10,
    discountPaise: 0,
    taxRate: 12,
    isTaxInclusive: false,
  }, {
    supplierStateCode: '27',
    placeOfSupplyStateCode: '27',
    isGstInvoice: true,
  });

  assert(line4.taxableValuePaise === 180000, 'Discounted Taxable Value (₹1,800)', `got ${line4.taxableValuePaise}`);
  assert(line4.totalTaxPaise === 21600, '12% Tax on ₹1,800 is ₹216', `got ${line4.totalTaxPaise}`);

  // Test 5: Invoice Totals & Round-Off
  // Suppose line totals come to ₹1,234.60 (123460 paise).
  // Round-off should be +40 paise -> Grand total ₹1,235.00 (123500 paise).
  const mockLines: InvoiceLine[] = [
    {
      id: 'm1',
      description: 'Test Item',
      hsnSac: '9988',
      quantity: 1,
      unit: 'nos',
      unitPricePaise: 104627,
      discountPercent: 0,
      discountPaise: 0,
      taxRate: 18,
      isTaxInclusive: false,
      taxableValuePaise: 104627,
      cgstPaise: 9416,
      sgstPaise: 9417,
      igstPaise: 0,
      totalPaise: 123460,
    }
  ];

  const totals = calculateInvoiceTotals(mockLines, {
    supplierStateCode: '27',
    placeOfSupplyStateCode: '27',
    isGstInvoice: true,
  });

  assert(totals.exactGrandTotalPaise === 123460, 'Exact Grand Total 1234.60', `got ${totals.exactGrandTotalPaise}`);
  assert(totals.roundOffPaise === 40, 'Round-off +40 paise', `got ${totals.roundOffPaise}`);
  assert(totals.grandTotalPaise === 123500, 'Grand Total rounded ₹1,235.00', `got ${totals.grandTotalPaise}`);

  // Test 6: Currency formatting & Words
  const formatted = formatPaiseToRupees(12345678); // ₹1,23,456.78
  assert(formatted === '₹1,23,456.78', 'Indian Currency Format', `got ${formatted}`);

  const words = paiseToWords(125000); // ₹1,250.00
  assert(words === 'One Thousand Two Hundred Fifty Rupees Only', 'Paise to Words', `got "${words}"`);

  return { passed: allPassed, results };
}
