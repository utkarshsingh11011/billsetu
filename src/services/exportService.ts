// Export Service for BillSetu
// Supports CSV export for Sales Invoices and Purchase Expenses
// Implements PRD Section 6.7 & Section 7 (DATA-01)

import { Invoice, PurchaseExpense } from '../types';

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
