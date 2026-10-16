// Export Service for BillSetu
// Supports CSV export for Sales Invoices and Purchase Expenses
// Implements PRD Section 6.7 & Section 7 (DATA-01)

import { Invoice, PurchaseExpense, BusinessProfile } from '../types';

export function exportInvoicesToCsv(invoices: Invoice[]): void {
  const headers = [
    'Invoice Number',
    'Date',
    'Due Date',
    'Customer Name',
    'Customer GSTIN',
    'Place of Supply',
    'Status',
    'Taxable Value (INR)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'Total Tax (INR)',
    'Grand Total (INR)',
    'Amount Paid (INR)',
    'Balance Due (INR)',
  ];

  const rows = invoices.map(inv => [
    `"${inv.invoiceNumber}"`,
    `"${inv.invoiceDate}"`,
    `"${inv.dueDate}"`,
    `"${inv.party.name.replace(/"/g, '""')}"`,
    `"${inv.party.gstin || 'Unregistered'}"`,
    `"${inv.placeOfSupplyState} (${inv.placeOfSupplyStateCode})"`,
    `"${inv.status.toUpperCase()}"`,
    (inv.taxableValuePaise / 100).toFixed(2),
    (inv.cgstPaise / 100).toFixed(2),
    (inv.sgstPaise / 100).toFixed(2),
    (inv.igstPaise / 100).toFixed(2),
    ((inv.cgstPaise + inv.sgstPaise + inv.igstPaise) / 100).toFixed(2),
    (inv.grandTotalPaise / 100).toFixed(2),
    (inv.amountPaidPaise / 100).toFixed(2),
    (inv.balanceDuePaise / 100).toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `BillSetu_Sales_Invoices_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportExpensesToCsv(expenses: PurchaseExpense[]): void {
  const headers = [
    'Expense ID',
    'Invoice Number',
    'Date',
    'Vendor Name',
    'Vendor GSTIN',
    'Category',
    'Taxable Value (INR)',
    'Tax (INR)',
    'Total Amount (INR)',
    'Payment Status',
    'Notes',
  ];

  const rows = expenses.map(exp => [
    `"${exp.id}"`,
    `"${exp.invoiceNumber}"`,
    `"${exp.invoiceDate}"`,
    `"${exp.vendorName.replace(/"/g, '""')}"`,
    `"${exp.vendorGstin || 'N/A'}"`,
    `"${exp.category}"`,
    (exp.taxableAmountPaise / 100).toFixed(2),
    (exp.taxPaise / 100).toFixed(2),
    (exp.totalAmountPaise / 100).toFixed(2),
    `"${exp.paymentStatus.toUpperCase()}"`,
    `"${(exp.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `BillSetu_Purchases_Expenses_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportFullBackupJson(data: Record<string, unknown>): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadBlob(jsonContent, `BillSetu_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

/**
 * Generates an official GSTR-1 Offline Tool compatible JSON file
 * Containing b2b (registered), b2cs (unregistered), hsn, and doc_issue summaries.
 */
export function exportGstr1Json(invoices: Invoice[], profile: BusinessProfile): void {
  const activeInvoices = invoices.filter(inv => inv.status !== 'cancelled' && inv.status !== 'draft');
  const b2bInvoices = activeInvoices.filter(inv => inv.party.gstin && inv.party.gstin.trim().length === 15);
  const b2cInvoices = activeInvoices.filter(inv => !inv.party.gstin || inv.party.gstin.trim().length < 15);

  // Group B2B by customer GSTIN (ctin)
  const b2bMap: Record<string, any[]> = {};
  b2bInvoices.forEach(inv => {
    const ctin = inv.party.gstin!.toUpperCase();
    if (!b2bMap[ctin]) {
      b2bMap[ctin] = [];
    }

    const items = inv.lines.map((line, idx) => ({
      num: idx + 1,
      itm_det: {
        txval: +(line.taxableValuePaise / 100).toFixed(2),
        rt: line.taxRate,
        iamt: +(line.igstPaise / 100).toFixed(2),
        camt: +(line.cgstPaise / 100).toFixed(2),
        samt: +(line.sgstPaise / 100).toFixed(2),
        csamt: 0.00
      }
    }));

    b2bMap[ctin].push({
      inum: inv.invoiceNumber,
      idt: inv.invoiceDate.split('-').reverse().join('-'), // DD-MM-YYYY
      val: +(inv.grandTotalPaise / 100).toFixed(2),
      pos: inv.placeOfSupplyStateCode,
      rchrg: inv.isReverseCharge ? 'Y' : 'N',
      inv_typ: 'R',
      itms: items
    });
  });

  const b2b = Object.keys(b2bMap).map(ctin => ({
    ctin,
    inv: b2bMap[ctin]
  }));

  // Group B2C Small by rate and place of supply
  const b2csMap: Record<string, { sply_ty: string; pos: string; rt: number; txval: number; camt: number; samt: number; iamt: number }> = {};
  b2cInvoices.forEach(inv => {
    const isInterState = inv.placeOfSupplyStateCode !== profile.stateCode;
    inv.lines.forEach(line => {
      const key = `${inv.placeOfSupplyStateCode}_${line.taxRate}`;
      if (!b2csMap[key]) {
        b2csMap[key] = {
          sply_ty: isInterState ? 'INTER' : 'INTRA',
          pos: inv.placeOfSupplyStateCode,
          rt: line.taxRate,
          txval: 0,
          camt: 0,
          samt: 0,
          iamt: 0
        };
      }
      b2csMap[key].txval += line.taxableValuePaise / 100;
      b2csMap[key].camt += line.cgstPaise / 100;
      b2csMap[key].samt += line.sgstPaise / 100;
      b2csMap[key].iamt += line.igstPaise / 100;
    });
  });

  const b2cs = Object.values(b2csMap).map(item => ({
    sply_ty: item.sply_ty,
    pos: item.pos,
    typ: 'OE',
    rt: item.rt,
    txval: +item.txval.toFixed(2),
    camt: +item.camt.toFixed(2),
    samt: +item.samt.toFixed(2),
    iamt: +item.iamt.toFixed(2),
    csamt: 0.00
  }));

  // HSN summary
  const hsnMap: Record<string, { desc: string; uqc: string; qty: number; val: number; txval: number; iamt: number; camt: number; samt: number }> = {};
  activeInvoices.forEach(inv => {
    inv.lines.forEach(line => {
      const code = line.hsnSac || '9999';
      if (!hsnMap[code]) {
        hsnMap[code] = {
          desc: line.description,
          uqc: line.unit || 'NOS',
          qty: 0,
          val: 0,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0
        };
      }
      hsnMap[code].qty += line.quantity;
      hsnMap[code].val += line.totalPaise / 100;
      hsnMap[code].txval += line.taxableValuePaise / 100;
      hsnMap[code].iamt += line.igstPaise / 100;
      hsnMap[code].camt += line.cgstPaise / 100;
      hsnMap[code].samt += line.sgstPaise / 100;
    });
  });

  const hsnData = Object.keys(hsnMap).map((code, idx) => ({
    num: idx + 1,
    hsn_sc: code,
    desc: hsnMap[code].desc.slice(0, 30),
    uqc: hsnMap[code].uqc,
    qty: hsnMap[code].qty,
    val: +hsnMap[code].val.toFixed(2),
    txval: +hsnMap[code].txval.toFixed(2),
    iamt: +hsnMap[code].iamt.toFixed(2),
    camt: +hsnMap[code].camt.toFixed(2),
    samt: +hsnMap[code].samt.toFixed(2),
    csamt: 0.00
  }));

  // Docs summary
  const sortedInvoices = [...invoices].sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
  const docIssue = {
    doc_det: [
      {
        doc_num: 1,
        doc_typ: 'Invoices for outward supply',
        docs: [
          {
            num: 1,
            from: sortedInvoices[0]?.invoiceNumber || 'INV-001',
            to: sortedInvoices[sortedInvoices.length - 1]?.invoiceNumber || 'INV-001',
            totnum: invoices.length,
            canc: invoices.filter(i => i.status === 'cancelled').length,
            net_issue: activeInvoices.length
          }
        ]
      }
    ]
  };

  const periodMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const periodYear = new Date().getFullYear().toString();
  const fp = `${periodMonth}${periodYear}`;

  const gstr1Payload = {
    gstin: profile.gstin || '27AAPCA1234F1Z5',
    fp,
    version: 'GST_GSTR1_V1.1',
    hash: 'offline_tool_compatible',
    b2b,
    b2cs,
    hsn: { data: hsnData },
    doc_issue: docIssue
  };

  const jsonContent = JSON.stringify(gstr1Payload, null, 2);
  downloadBlob(
    jsonContent,
    `GSTR1_${profile.gstin || 'UNREGISTERED'}_${fp}.json`,
    'application/json'
  );
}

function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
