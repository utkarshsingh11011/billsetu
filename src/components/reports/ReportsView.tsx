import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Receipt, 
  FileText, 
  Download, 
  ShieldCheck, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar
} from 'lucide-react';
import { Invoice, PurchaseExpense, ScannedDocument, AuditEvent, BusinessProfile } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { exportInvoicesToCsv, exportExpensesToCsv, exportGstr1Json } from '../../services/exportService';
import { Language, translations } from '../../services/i18n';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export interface ReportsViewProps {
  invoices: Invoice[];
  expenses: PurchaseExpense[];
  scans: ScannedDocument[];
  auditLogs: AuditEvent[];
  currentLang: Language;
  profile: BusinessProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  expenses,
  scans,
  auditLogs,
  currentLang,
  profile,
}) => {
  const t = translations[currentLang];
  const [reportTab, setReportTab] = useState<'gst' | 'sales' | 'expenses' | 'telemetry'>('gst');

  // Outward tax liability from issued and paid sales invoices
  const validInvoices = invoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft');
  const totalTaxableSalesPaise = validInvoices.reduce((sum, i) => sum + i.taxableValuePaise, 0);
  const totalCgstSalesPaise = validInvoices.reduce((sum, i) => sum + i.cgstPaise, 0);
  const totalSgstSalesPaise = validInvoices.reduce((sum, i) => sum + i.sgstPaise, 0);
  const totalIgstSalesPaise = validInvoices.reduce((sum, i) => sum + i.igstPaise, 0);
  const totalOutwardTaxPaise = totalCgstSalesPaise + totalSgstSalesPaise + totalIgstSalesPaise;
  const totalSalesRevenuePaise = validInvoices.reduce((sum, i) => sum + i.grandTotalPaise, 0);

  // Inward tax & Input Tax Credit (ITC) from reviewed purchases & expenses
  const totalTaxablePurchasesPaise = expenses.reduce((sum, e) => sum + e.taxableAmountPaise, 0);
  const totalItcTaxPaise = expenses.reduce((sum, e) => sum + e.taxPaise, 0);
  const totalPurchasesAmountPaise = expenses.reduce((sum, e) => sum + e.totalAmountPaise, 0);

  // Net GST Liability = Outward Tax - Inward ITC
  const netGstLiabilityPaise = totalOutwardTaxPaise - totalItcTaxPaise;

  // Expenses grouped by category
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.totalAmountPaise;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Financial Reports & GST Summary</h1>
            <Badge variant="teal">GSTR-1 & ITC Helper</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent tax summaries, Input Tax Credit (ITC) reconciliation, and audit logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => exportGstr1Json(invoices, profile)}
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 font-semibold"
            title="Download GST Portal Offline Tool compatible JSON format (B2B, B2CS, HSN, Docs)"
          >
            Download GSTR-1 JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportInvoicesToCsv(invoices)}
            leftIcon={<Download className="w-4 h-4 text-teal-600" />}
          >
            Sales CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportExpensesToCsv(expenses)}
            leftIcon={<Download className="w-4 h-4 text-teal-600" />}
          >
            ITC Purchases CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2 text-xs">
        <button
          onClick={() => setReportTab('gst')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors ${
            reportTab === 'gst' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          GST Tax Liability & ITC
        </button>
        <button
          onClick={() => setReportTab('sales')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors ${
            reportTab === 'sales' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Sales & Collections
        </button>
        <button
          onClick={() => setReportTab('expenses')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors ${
            reportTab === 'expenses' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Purchases by Category
        </button>
        <button
          onClick={() => setReportTab('telemetry')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors ${
            reportTab === 'telemetry' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Audit & Event Logs
        </button>
      </div>

      {/* GST Tab */}
      {reportTab === 'gst' && (
        <div className="space-y-6">
          
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <Card className="p-5 bg-gradient-to-br from-white to-slate-50 border-teal-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Outward Tax (Collected on Sales)
              </span>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {formatPaiseToRupees(totalOutwardTaxPaise)}
              </div>
              <p className="text-[11px] text-teal-700 mt-1">
                From {validInvoices.length} issued sales invoices
              </p>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-white to-slate-50 border-amber-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Inward Tax (ITC Eligible on Bills)
              </span>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {formatPaiseToRupees(totalItcTaxPaise)}
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                From {expenses.length} verified purchases
              </p>
            </Card>

            <Card className="p-5 bg-slate-900 text-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Net GST Payable / (Credit Balance)
              </span>
              <div className={`mt-2 text-2xl font-black ${netGstLiabilityPaise >= 0 ? 'text-teal-300' : 'text-emerald-400'}`}>
                {formatPaiseToRupees(netGstLiabilityPaise)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {netGstLiabilityPaise >= 0 ? 'Net tax due to GST portal' : 'Excess ITC credit carried forward'}
              </p>
            </Card>

          </div>

          {/* Detailed Tax Breakdown Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 sm:px-6 bg-slate-100/70 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">GST Component-wise Breakdown</h3>
              <p className="text-xs text-slate-500">CGST, SGST and IGST totals matching Indian GSTR-3B tax return format</p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Tax Component</th>
                      <th className="py-2.5 px-3 text-right">Taxable Turnover (INR)</th>
                      <th className="py-2.5 px-3 text-right">Outward Tax (INR)</th>
                      <th className="py-2.5 px-3 text-right">Inward ITC (INR)</th>
                      <th className="py-2.5 px-3 text-right">Net Liability (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Central Tax (CGST)</td>
                      <td className="py-2.5 px-3 text-right">{formatPaiseToRupees(totalTaxableSalesPaise)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatPaiseToRupees(totalCgstSalesPaise)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatPaiseToRupees(Math.floor(totalItcTaxPaise / 2))}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatPaiseToRupees(totalCgstSalesPaise - Math.floor(totalItcTaxPaise / 2))}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">State Tax (SGST)</td>
                      <td className="py-2.5 px-3 text-right">{formatPaiseToRupees(totalTaxableSalesPaise)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatPaiseToRupees(totalSgstSalesPaise)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatPaiseToRupees(Math.ceil(totalItcTaxPaise / 2))}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatPaiseToRupees(totalSgstSalesPaise - Math.ceil(totalItcTaxPaise / 2))}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Integrated Tax (IGST)</td>
                      <td className="py-2.5 px-3 text-right">{formatPaiseToRupees(totalTaxableSalesPaise)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatPaiseToRupees(totalIgstSalesPaise)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">₹0.00</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatPaiseToRupees(totalIgstSalesPaise)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                      <td className="py-3 px-3 text-slate-900">TOTAL GST</td>
                      <td className="py-3 px-3 text-right text-slate-900">{formatPaiseToRupees(totalTaxableSalesPaise)}</td>
                      <td className="py-3 px-3 text-right text-teal-700">{formatPaiseToRupees(totalOutwardTaxPaise)}</td>
                      <td className="py-3 px-3 text-right text-amber-700">{formatPaiseToRupees(totalItcTaxPaise)}</td>
                      <td className="py-3 px-3 text-right text-base text-slate-900">{formatPaiseToRupees(netGstLiabilityPaise)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

        </div>
      )}

      {/* Sales Tab */}
      {reportTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Sales Revenue</span>
              <div className="mt-2 text-2xl font-bold text-slate-900">{formatPaiseToRupees(totalSalesRevenuePaise)}</div>
              <p className="text-xs text-slate-500 mt-1">Across all issued sales invoices</p>
            </Card>
            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Tax Collected</span>
              <div className="mt-2 text-2xl font-bold text-teal-700">{formatPaiseToRupees(totalOutwardTaxPaise)}</div>
              <p className="text-xs text-slate-500 mt-1">Effective tax rate: {totalTaxableSalesPaise > 0 ? ((totalOutwardTaxPaise / totalTaxableSalesPaise) * 100).toFixed(1) : 0}%</p>
            </Card>
          </div>

          <Card className="p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Sales Invoices by Customer</h3>
            <div className="space-y-2">
              {validInvoices.map(inv => (
                <div key={inv.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{inv.party.name}</span>
                    <span className="text-slate-500 block text-[11px]">{inv.invoiceNumber} • {inv.invoiceDate}</span>
                  </div>
                  <div className="text-right font-bold text-slate-900">
                    {formatPaiseToRupees(inv.grandTotalPaise)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Expenses Tab */}
      {reportTab === 'expenses' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Purchases & Expenses by Category</h3>
              <p className="text-xs text-slate-500">Total recorded expenses: {formatPaiseToRupees(totalPurchasesAmountPaise)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(expensesByCategory).map(([cat, amountPaise]) => (
              <div key={cat} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase">{cat}</span>
                <div className="mt-1 text-lg font-bold text-slate-900">{formatPaiseToRupees(amountPaise)}</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (amountPaise / totalPurchasesAmountPaise) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Telemetry & Audit Logs Tab (PRD Section 12) */}
      {reportTab === 'telemetry' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 sm:px-6 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product Analytics & Telemetry Log</h3>
              <p className="text-xs text-slate-500">Audit trail of critical user actions (PRD Section 12)</p>
            </div>
            <Badge variant="teal">{auditLogs.length} Events Logged</Badge>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No events recorded yet.</div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-3.5 sm:px-6 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                      {log.entity}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">{log.action.toUpperCase()}</span>
                      <span className="text-slate-600 block text-[11px] mt-0.5">{log.details}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

    </div>
  );
};
