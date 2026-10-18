import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Receipt, 
  ScanLine, 
  Eye, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpDown, 
  Copy,
  Sparkles,
  ArrowRight,
  FileCheck2
} from 'lucide-react';
import { Invoice, PurchaseExpense, ScannedDocument } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { exportInvoicesToCsv, exportExpensesToCsv, exportFullBackupJson } from '../../services/exportService';
import { Language, translations } from '../../services/i18n';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface RecordsViewProps {
  invoices: Invoice[];
  expenses: PurchaseExpense[];
  scans: ScannedDocument[];
  currentLang: Language;
  onSelectInvoice: (invoice: Invoice) => void;
  onSelectScan: (scan: ScannedDocument) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCloneInvoice?: (invoice: Invoice) => void;
  onConvertToInvoice?: (quotation: Invoice) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  invoices,
  expenses,
  scans,
  currentLang,
  onSelectInvoice,
  onSelectScan,
  onRecordPayment,
  onCloneInvoice,
  onConvertToInvoice,
}) => {
  const t = translations[currentLang];

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sales' | 'quotes' | 'expenses' | 'vault'>('sales');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered sales invoices (excluding quotations)
  const filteredSalesInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.type !== 'quotation_estimate' && inv.status !== 'draft')
      .filter(inv => {
        const matchesSearch = 
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.party.gstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.tripDetails?.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [invoices, searchQuery, statusFilter]);

  // Filtered quotations / estimates
  const filteredQuotations = useMemo(() => {
    return invoices
      .filter(inv => inv.type === 'quotation_estimate' || inv.status === 'draft')
      .filter(inv => {
        return (
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.party.gstin || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  }, [invoices, searchQuery]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      return (
        exp.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.vendorGstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [expenses, searchQuery]);

  // Filtered scans
  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      const matchesSearch = 
        scan.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.extraction.supplier.legalName.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.extraction.invoice.number.value.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'needs_review' && scan.status === 'needs_review') ||
        (statusFilter === 'reviewed' && scan.status === 'reviewed');

      return matchesSearch && matchesStatus;
    });
  }, [scans, searchQuery, statusFilter]);

  const handleExportCsv = () => {
    if (activeTab === 'expenses') {
      exportExpensesToCsv(filteredExpenses);
    } else {
      exportInvoicesToCsv(filteredSalesInvoices);
    }
  };

  const handleFullBackup = () => {
    exportFullBackupJson({
      exportedAt: new Date().toISOString(),
      invoices,
      expenses,
      scans,
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="emerald">{t.paid}</Badge>;
      case 'issued':
        return <Badge variant="teal">{t.issued}</Badge>;
      case 'partially_paid':
        return <Badge variant="amber">{t.partiallyPaid}</Badge>;
      case 'draft':
        return <Badge variant="slate">{t.draft}</Badge>;
      case 'cancelled':
        return <Badge variant="rose">{t.cancelled}</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight">
            Bills & Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Swipe-style unified document vault for Sales Invoices, Quotations, Expenses & Scans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFullBackup}
            className="text-xs font-semibold"
          >
            Full Cloud Backup
          </Button>
        </div>
      </div>

      {/* Swipe-Style Tabbed Bar & Search */}
      <Card className="p-4 space-y-3 shadow-xs">
        
        {/* Swipe-Style 4 Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Sales Invoices ({filteredSalesInvoices.length})
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'quotes'
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Quotations / Estimates ({filteredQuotations.length})
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Purchases / Expenses ({filteredExpenses.length})
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'vault'
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            Scanned Bills Vault ({filteredScans.length})
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by Invoice #, Vehicle, Client, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftAddon={<Search className="w-4 h-4" />}
            />
          </div>

          {activeTab === 'sales' && (
            <div className="w-full sm:w-44 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="issued">Issued (Unpaid)</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          )}
        </div>

      </Card>

      {/* TAB 1: SALES INVOICES */}
      {activeTab === 'sales' && (
        <Card className="p-0 overflow-hidden shadow-xs">
          {filteredSalesInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No sales invoices found matching your criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSalesInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-black flex items-center justify-center text-xs shrink-0">
                      INV
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy-950 text-sm">{inv.invoiceNumber}</span>
                        {getStatusBadge(inv.status)}
                        {inv.tripDetails?.vehicleNumber && (
                          <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                            {inv.tripDetails.vehicleNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{inv.party.name}</p>
                      <span className="text-[11px] text-slate-400 font-medium">{inv.invoiceDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black text-navy-950 tabular-nums">
                        {formatPaiseToRupees(inv.grandTotalPaise)}
                      </div>
                      {inv.balanceDuePaise > 0 && (
                        <span className="text-[11px] text-rose-600 font-bold block tabular-nums">
                          Due: {formatPaiseToRupees(inv.balanceDuePaise)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {inv.balanceDuePaise > 0 && (
                        <button
                          onClick={() => onRecordPayment(inv)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200"
                        >
                          Collect
                        </button>
                      )}
                      {onCloneInvoice && (
                        <button
                          onClick={() => onCloneInvoice(inv)}
                          title="Duplicate Invoice"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: QUOTATIONS / ESTIMATES (WITH 1-TAP CONVERSION) */}
      {activeTab === 'quotes' && (
        <Card className="p-0 overflow-hidden shadow-xs space-y-0">
          <div className="p-3 bg-amber-50/60 border-b border-amber-200/50 flex items-center justify-between text-xs text-amber-900">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              1-Tap Conversion: Turn any Quotation/Estimate into an Official Tax Invoice
            </span>
          </div>

          {filteredQuotations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No quotations or draft estimates currently open.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQuotations.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black flex items-center justify-center text-xs shrink-0">
                      EST
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy-950 text-sm">{quote.invoiceNumber}</span>
                        <Badge variant="amber">Estimate / Quote</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{quote.party.name}</p>
                      <span className="text-[11px] text-slate-400">Created: {quote.invoiceDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-navy-950 tabular-nums">
                        {formatPaiseToRupees(quote.grandTotalPaise)}
                      </div>
                      <span className="text-[11px] text-slate-400 block">Estimated</span>
                    </div>

                    <button
                      onClick={() => {
                        if (onConvertToInvoice) {
                          onConvertToInvoice(quote);
                        } else {
                          onSelectInvoice(quote);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Convert to Tax Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: PURCHASES / EXPENSES */}
      {activeTab === 'expenses' && (
        <Card className="p-0 overflow-hidden shadow-xs">
          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No purchase expenses recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-4 sm:px-6 flex items-center justify-between gap-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-black flex items-center justify-center text-xs shrink-0">
                      EXP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950 text-sm">{exp.vendorName}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {exp.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">Bill #{exp.invoiceNumber} • {exp.invoiceDate}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600 tabular-nums">
                      -{formatPaiseToRupees(exp.totalAmountPaise)}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-medium">Expense</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: SCANNED BILLS VAULT */}
      {activeTab === 'vault' && (
        <Card className="p-0 overflow-hidden shadow-xs">
          {filteredScans.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No scanned bills in vault. Use Setu Scan to digitize paper bills and duty slips.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onSelectScan(scan)}
                  className="p-4 sm:px-6 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                      <ScanLine className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950 text-sm">
                          {scan.extraction.supplier.legalName.value || scan.fileName}
                        </span>
                        {scan.status === 'needs_review' ? (
                          <Badge variant="rose">Needs Review</Badge>
                        ) : (
                          <Badge variant="emerald">Reviewed & Vaulted</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{scan.fileName} • {new Date(scan.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-navy-950 tabular-nums">
                      {formatPaiseToRupees(scan.extraction.totals.grandTotalPaise.value)}
                    </span>
                    <span className="text-[11px] text-teal-700 font-bold block flex items-center justify-end gap-1">
                      Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

    </div>
  );
};
