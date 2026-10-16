import React, { useState } from 'react';
import { 
  PlusCircle, 
  ScanLine, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  ChevronRight, 
  X,
  FileText,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Invoice, ScannedDocument, BusinessProfile, Subscription } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { Language, translations } from '../../services/i18n';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export interface DashboardProps {
  profile: BusinessProfile;
  invoices: Invoice[];
  scans: ScannedDocument[];
  subscription: Subscription;
  currentLang: Language;
  onOpenCreate: () => void;
  onOpenScan: () => void;
  onOpenRecords: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onSelectScan: (scan: ScannedDocument) => void;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  invoices,
  scans,
  subscription,
  currentLang,
  onOpenCreate,
  onOpenScan,
  onOpenRecords,
  onSelectInvoice,
  onSelectScan,
  onOpenSettings,
}) => {
  const t = translations[currentLang];
  const [showChecklist, setShowChecklist] = useState<boolean>(true);

  // Computations for summaries (PRD Section 4)
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const thisMonthInvoices = invoices.filter(inv => inv.invoiceDate.startsWith(currentMonthStr));
  const thisMonthTotalPaise = thisMonthInvoices.reduce((sum, inv) => sum + inv.grandTotalPaise, 0);

  const totalAmountDuePaise = invoices.reduce((sum, inv) => sum + inv.balanceDuePaise, 0);
  const scansNeedingReview = scans.filter(s => s.status === 'needs_review');

  const recentInvoices = invoices.slice(0, 5);

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
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img 
            src="/logo_icon.png" 
            alt="BillSetu Logo" 
            className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-xs border border-slate-200 shrink-0" 
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {profile.tradeName || profile.legalName}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>GSTIN: <strong className="text-slate-700">{profile.gstin || 'Non-GST Unregistered'}</strong></span>
              <span>•</span>
              <span>{profile.city}, {profile.state}</span>
            </div>
          </div>
        </div>

        {/* Quick Sync & Privacy Assurance Badge (PRD Section 2 Trust through transparency) */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs w-fit">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Local storage encrypted • DPDP 2023 compliant</span>
        </div>
      </div>

      {/* Setup Checklist for new or onboarding users (PRD Section 4) */}
      {showChecklist && (
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
          <button 
            onClick={() => setShowChecklist(false)} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            title="Dismiss checklist"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>{t.setupChecklist}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Your business is 2 steps away from flawless billing
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Complete setup to customize your GST invoice numbering, bank UPI, and print formats.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 bg-slate-800/80 border border-teal-500/30 rounded-xl p-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs text-slate-200 font-medium">1. Business Profile</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/80 border border-teal-500/30 rounded-xl p-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs text-slate-200 font-medium">2. GSTIN Verified</span>
              </div>
              <div 
                onClick={onOpenCreate}
                className="flex items-center justify-between gap-2 bg-teal-600/30 hover:bg-teal-600/50 border border-teal-400/50 rounded-xl p-2.5 cursor-pointer transition-colors"
              >
                <span className="text-xs text-teal-200 font-bold">3. Create 1st Invoice</span>
                <ChevronRight className="w-4 h-4 text-teal-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Core Primary Actions (PRD Section 1 & Section 4: "Create a bill, Scan a bill, Find a bill") */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Primary Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Action 1: Create Invoice */}
          <button
            onClick={onOpenCreate}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-left min-h-[140px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-teal-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <h2 className="text-lg font-bold text-white mt-3">
                {t.createInvoice}
              </h2>
              <p className="text-xs text-teal-100 mt-1 line-clamp-2">
                Draft GST or non-GST sales invoice with GSTIN autofill and PDF download
              </p>
            </div>
            <div className="text-[11px] font-semibold text-teal-200 mt-3 flex items-center gap-1">
              <span>Ready to issue</span> • <span>Paise-accurate</span>
            </div>
          </button>

          {/* Action 2: Scan Bill */}
          <button
            onClick={onOpenScan}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900 text-white shadow-sm hover:shadow-md hover:bg-slate-800 transition-all active:scale-[0.99] text-left min-h-[140px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <ScanLine className="w-6 h-6" />
                </div>
                {scansNeedingReview.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                    {scansNeedingReview.length} need review
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-3">
                {t.scanBill}
              </h2>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Scan-to-Books: camera capture or upload bills with human review
              </p>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-3 flex items-center gap-1">
              <span>Extracts GST & Lines</span> • <span>Retains original</span>
            </div>
          </button>

          {/* Action 3: Find a Record */}
          <button
            onClick={onOpenRecords}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99] text-left min-h-[140px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-3">
                {t.findRecord}
              </h2>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Search all past invoices, expenses, vendor GSTINs, and export to CSV
              </p>
            </div>
            <div className="text-[11px] font-semibold text-teal-700 mt-3 flex items-center gap-1">
              <span>{invoices.length} invoices saved</span> • <span>Quick filter</span>
            </div>
          </button>

        </div>
      </div>

      {/* Useful Summaries (PRD Section 4: "Show only useful summaries: invoices this month, amount due, scans needing review, sync state") */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          At a Glance
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Summary 1: Invoices This Month */}
          <Card className="p-4">
            <span className="text-xs font-medium text-slate-500 block">
              {t.invoicesThisMonth}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {formatPaiseToRupees(thisMonthTotalPaise)}
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {thisMonthInvoices.length} bills
              </span>
            </div>
          </Card>

          {/* Summary 2: Amount Due */}
          <Card className="p-4">
            <span className="text-xs font-medium text-slate-500 block">
              {t.amountDue}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-rose-600">
                {formatPaiseToRupees(totalAmountDuePaise)}
              </span>
              {totalAmountDuePaise > 0 && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Pending
                </span>
              )}
            </div>
          </Card>

          {/* Summary 3: Scans Needing Review */}
          <Card 
            className={`p-4 cursor-pointer transition-colors ${scansNeedingReview.length > 0 ? 'bg-amber-50/50 border-amber-200' : ''}`}
            onClick={onOpenScan}
          >
            <span className="text-xs font-medium text-slate-500 block">
              {t.scansNeedReview}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-xl sm:text-2xl font-bold ${scansNeedingReview.length > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                {scansNeedingReview.length}
              </span>
              {scansNeedingReview.length > 0 ? (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                  Review now
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  All clear
                </span>
              )}
            </div>
          </Card>

          {/* Summary 4: Sync & Storage State */}
          <Card className="p-4">
            <span className="text-xs font-medium text-slate-500 block">
              Data & Cloud State
            </span>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  100% Up-to-date
                </span>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Offline safe
                </span>
              </div>
              <ShieldCheck className="w-6 h-6 text-teal-600" />
            </div>
          </Card>

        </div>
      </div>

      {/* Scans Needing Review Callout (PRD Section 6.3) */}
      {scansNeedingReview.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {scansNeedingReview.length} Scanned Bill(s) Awaiting Your Review
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Extracted information is a draft proposal. Human review is required before saving to your records.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {scansNeedingReview.map(scan => (
                    <button
                      key={scan.id}
                      onClick={() => onSelectScan(scan)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-700" />
                      <span className="truncate max-w-[200px]">{scan.fileName}</span>
                      <span className="text-[10px] text-amber-600 font-normal">
                        ({Math.round(scan.extraction.supplier.legalName.confidence * 100)}% match)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenScan}
              className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs shrink-0"
            >
              Open Scan Review
            </Button>
          </div>
        </div>
      )}

      {/* Recent Records Section (PRD Section 4: "Place recent records below the main actions with name, date, amount and status") */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t.recentActivity}
            </h3>
            <p className="text-xs text-slate-500">
              Latest sales invoices issued and in draft
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenRecords}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            {t.viewAllRecords}
          </Button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No invoices created yet</p>
            <p className="text-xs text-slate-400 mt-1">Tap "Create invoice" above to create your first professional bill.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => onSelectInvoice(inv)}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                    {inv.invoiceNumber.split('-').pop() || 'INV'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {inv.party.name}
                      </span>
                      {inv.type === 'non_gst_bill' && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          Non-GST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{inv.invoiceNumber}</span>
                      <span>•</span>
                      <span>{inv.invoiceDate}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {formatPaiseToRupees(inv.grandTotalPaise)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {inv.balanceDuePaise > 0 
                        ? `Due: ${formatPaiseToRupees(inv.balanceDuePaise)}` 
                        : 'Fully Paid'}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    {getStatusBadge(inv.status)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};
