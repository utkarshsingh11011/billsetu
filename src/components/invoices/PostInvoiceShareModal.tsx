import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Share2, 
  Printer, 
  Download, 
  ExternalLink, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  X, 
  Receipt, 
  ChevronRight,
  Sparkles,
  Phone
} from 'lucide-react';
import { Invoice, BusinessProfile, PaymentRecord } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { downloadInvoiceAsPdfFile } from '../../services/pdfGenerator';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface PostInvoiceShareModalProps {
  invoice: Invoice;
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (payment: PaymentRecord) => void;
  onOpenFullPreview: () => void;
}

export const PostInvoiceShareModal: React.FC<PostInvoiceShareModalProps> = ({
  invoice,
  profile,
  isOpen,
  onClose,
  onRecordPayment,
  onOpenFullPreview,
}) => {
  if (!isOpen) return null;

  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('upi');
  const [paidAmountRupees, setPaidAmountRupees] = useState<string>((invoice.grandTotalPaise / 100).toString());
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasRecorded, setHasRecorded] = useState<boolean>(invoice.status === 'paid');

  const hostedUrl = `${window.location.origin}/inv/${invoice.shareableId || invoice.id}`;

  const handleShareWhatsApp = () => {
    const trip = invoice.tripDetails;
    let msg = `*TAX INVOICE / DUTY BILL: ${invoice.invoiceNumber}*\n`;
    msg += `From: *${profile.tradeName || profile.legalName}*\n`;
    msg += `Billed To: ${invoice.party.name}\n`;
    if (trip?.vehicleNumber) {
      msg += `Vehicle: *${trip.vehicleNumber}* (${trip.vehicleCategory})\n`;
    }
    if (trip?.routeOrDuty) {
      msg += `Duty Route: ${trip.routeOrDuty}\n`;
    }
    if (trip?.totalKm) {
      msg += `Total Distance: ${trip.totalKm} KM\n`;
    }
    msg += `------------------------------\n`;
    msg += `*Grand Total: ${formatPaiseToRupees(invoice.grandTotalPaise)}*\n`;
    msg += `Status: *${invoice.status.toUpperCase()}*\n`;
    if (profile.bankDetails?.upiId) {
      msg += `Pay via UPI: *${profile.bankDetails.upiId}*\n`;
    }
    msg += `------------------------------\n`;
    msg += `View & Download Verified Online Bill:\n${hostedUrl}\n\n`;
    msg += `Thank you for traveling with us!`;

    if (window.BillSetuNative?.shareInvoice) {
      window.BillSetuNative.vibrate?.(30);
      window.BillSetuNative.shareInvoice(msg, undefined, `${invoice.invoiceNumber}.pdf`);
      return;
    }

    const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.location.href = targetUrl;
  };

  const handleSavePayment = () => {
    if (paymentStatus === 'unpaid') {
      onClose();
      return;
    }

    const paidPaise = Math.round((parseFloat(paidAmountRupees) || 0) * 100);
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      amountPaise: paidPaise,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
      notes: `Settled during invoice issue (${paymentStatus})`,
    };

    setIsRecording(true);
    onRecordPayment(payment);
    setHasRecorded(true);
    setTimeout(() => {
      setIsRecording(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-navy-950">Invoice Created Successfully!</h3>
              <p className="text-xs text-slate-500 font-mono">#{invoice.invoiceNumber} • {formatPaiseToRupees(invoice.grandTotalPaise)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap WhatsApp Share Banner */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-emerald-950 block">Share Directly with Client</span>
            <p className="text-[11px] text-emerald-700">Sends itemized summary + public link + PDF</p>
          </div>
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp Bill
          </button>
        </div>

        {/* Payment Settlement Recording Toggle (Swipe Style) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">Payment Status</span>
            <span className="text-xs font-mono font-bold text-slate-600">Total: {formatPaiseToRupees(invoice.grandTotalPaise)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus('unpaid')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                paymentStatus === 'unpaid'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Unpaid (Credit)
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('partial')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                paymentStatus === 'partial'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Partial Advance
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('paid')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                paymentStatus === 'paid'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Fully Paid
            </button>
          </div>

          {paymentStatus !== 'unpaid' && (
            <div className="space-y-2 pt-2 border-t border-slate-200/60 animate-in fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Received Amount (₹)</label>
                  <input
                    type="number"
                    value={paidAmountRupees}
                    onChange={(e) => setPaidAmountRupees(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold mt-1 bg-white outline-none focus:ring-1 focus:ring-teal-500 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold mt-1 bg-white outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="upi">UPI (GPay / PhonePe)</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick View & Print Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFullPreview}
            className="flex-1 text-xs font-bold"
          >
            Open A4 / Thermal Preview
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSavePayment}
            className="flex-1 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold"
          >
            {paymentStatus === 'unpaid' ? 'Done & Return' : 'Record & Finish'}
          </Button>
        </div>

      </div>
    </div>
  );
};
