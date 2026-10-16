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
  Copy
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
}) => {
  const t = translations[currentLang];

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'expenses' | 'scans'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered sales invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.party.gstin || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

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
      exportInvoicesToCsv(filteredInvoices);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navRecords} & Search</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Searchable sales ledger, purchases, scans, and audit history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4 text-teal-600" />}
          >
            Export to CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullBackup}
            title="Download full JSON encrypted backup"
            className="text-xs text-slate-600"
          >
            Backup JSON
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by Invoice #, Customer, Supplier, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftAddon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued (Unpaid)</option>
              <option value="paid">Paid</option>
              <option value="needs_review">Needs Review</option>
            </select>
          </div>

        </div>

        {/* Tab Buttons: All, Sales Invoices, Expenses, Scans */}
        <div className="flex items-center gap-2 border-t pt-3 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Activity ({invoices.length + expenses.length + scans.length})
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'sales'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sales Invoices ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'expenses'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Purchases / Expenses ({expenses.length})
          </button>

          <button
            onClick={() => setActiveTab('scans')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'scans'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Scans & Receipts ({scans.length})
          </button>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="p-0 overflow-hidden">
        
        {/* Sales Invoices Table */}
        {(activeTab === 'all' || activeTab === 'sales') && filteredInvoices.length > 0 && (
          <div>
            <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                Sales Invoices ({filteredInvoices.length})
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Click any row to open or print</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                      INV
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{inv.party.name}</span>
                        <Badge variant={inv.status === 'paid' ? 'emerald' : inv.status === 'issued' ? 'teal' : 'slate'}>
                          {inv.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{inv.invoiceNumber}</span>
                        <span>•</span>
                        <span>{inv.invoiceDate}</span>
                        <span>•</span>
                        <span>GSTIN: {inv.party.gstin || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {formatPaiseToRupees(inv.grandTotalPaise)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {inv.balanceDuePaise > 0 ? (
                          <span className="text-rose-600 font-medium">Due: {formatPaiseToRupees(inv.balanceDuePaise)}</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Paid in Full</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectInvoice(inv)}
                        title="View & Print"
                        className="p-2"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </Button>

                      {onCloneInvoice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCloneInvoice(inv)}
                          title="Duplicate Invoice"
                          className="p-2 text-slate-500 hover:text-slate-800"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}

                      {inv.balanceDuePaise > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRecordPayment(inv)}
                          title="Record Payment"
                          className="text-xs px-2.5 py-1"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses Table */}
        {(activeTab === 'all' || activeTab === 'expenses') && filteredExpenses.length > 0 && (
          <div>
            <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-teal-600" />
                Purchases & Expenses ({filteredExpenses.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0">
                      EXP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{exp.vendorName}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          {exp.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Invoice: {exp.invoiceNumber}</span>
                        <span>•</span>
                        <span>{exp.invoiceDate}</span>
                        {exp.vendorGstin && <span>• GSTIN: {exp.vendorGstin}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {formatPaiseToRupees(exp.totalAmountPaise)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Tax: {formatPaiseToRupees(exp.taxPaise)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanned Bills Table */}
        {(activeTab === 'all' || activeTab === 'scans') && filteredScans.length > 0 && (
          <div>
            <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-teal-600" />
                Scanned Invoices & Source Files ({filteredScans.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onSelectScan(scan)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">
                      SCAN
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {scan.extraction.supplier.legalName.value}
                        </span>
                        <Badge variant={scan.status === 'reviewed' ? 'emerald' : 'amber'}>
                          {scan.status === 'reviewed' ? 'Reviewed' : 'Needs Review'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{scan.fileName}</span>
                        <span>•</span>
                        <span>{scan.extraction.invoice.number.value}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {formatPaiseToRupees(scan.extraction.totals.grandTotalPaise.value)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Confidence: {Math.round(scan.extraction.supplier.legalName.confidence * 100)}%
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="p-2">
                      <Eye className="w-4 h-4 text-slate-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </Card>

    </div>
  );
};
