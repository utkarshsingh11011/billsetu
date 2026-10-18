import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Printer, 
  Share2, 
  QrCode, 
  CheckCircle2, 
  Car, 
  Phone, 
  MapPin, 
  Clock, 
  Receipt,
  Building2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Invoice, BusinessProfile } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { downloadInvoiceAsPdfFile } from '../../services/pdfGenerator';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface PublicHostedBillPageProps {
  invoice: Invoice;
  profile: BusinessProfile;
  onNavigateHome?: () => void;
}

export const PublicHostedBillPage: React.FC<PublicHostedBillPageProps> = ({
  invoice,
  profile,
  onNavigateHome,
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showQrExpanded, setShowQrExpanded] = useState<boolean>(false);

  const trip = invoice.tripDetails;
  const grandTotalRupees = (invoice.grandTotalPaise / 100).toFixed(2);
  const upiId = profile.bankDetails?.upiId || '';
  const payeeName = profile.tradeName || profile.legalName;

  // Construct NPCI Standard Dynamic UPI Payment URI
  const upiPaymentUri = upiId 
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${grandTotalRupees}&cu=INR&tn=${encodeURIComponent(`BillSetu ${invoice.invoiceNumber}`)}`
    : '';

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadInvoiceAsPdfFile('public-hosted-invoice-paper', `${invoice.invoiceNumber}.pdf`);
    } catch {
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePayViaUpi = () => {
    if (upiPaymentUri) {
      window.location.href = upiPaymentUri;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-6 px-3 sm:px-6 selection:bg-teal-500 selection:text-white">
      
      {/* Top Floating Trust Header */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs font-black text-sm">
            BS
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Verified BillSetu Invoice
            </span>
            <span className="text-[10px] text-slate-500 block">Hosted on billsetu.vercel.app</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-semibold bg-white"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Main Printable / Digital Invoice Sheet */}
      <div 
        id="public-hosted-invoice-paper"
        className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-lg overflow-hidden"
      >
        
        {/* Verification Banner */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-teal-500 text-navy-950">
                {invoice.type === 'gst_tax_invoice' ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
              </span>
              <span className="text-xs font-mono font-bold text-teal-300">
                #{invoice.invoiceNumber}
              </span>
            </div>
            <h1 className="text-xl font-black mt-1 text-white">
              {profile.tradeName || profile.legalName}
            </h1>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              GSTIN: {profile.gstin || 'Unregistered / Non-GST'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Grand Total</span>
            <div className="text-2xl font-black text-emerald-400 tabular-nums">
              {formatPaiseToRupees(invoice.grandTotalPaise)}
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                invoice.status === 'paid' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {invoice.status === 'paid' ? 'PAID IN FULL' : `BALANCE DUE: ${formatPaiseToRupees(invoice.balanceDuePaise)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Billed To / Passenger & Duty Summary */}
        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed To (Client / Passenger)</span>
            <h2 className="text-base font-bold text-navy-950">{invoice.party.name}</h2>
            {invoice.party.gstin && (
              <p className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded inline-block">
                GSTIN: {invoice.party.gstin}
              </p>
            )}
            {invoice.party.phone && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {invoice.party.phone}
              </p>
            )}
            {invoice.party.address && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {invoice.party.address}
              </p>
            )}
          </div>

          <div className="space-y-1 md:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Metadata</span>
            <div className="text-xs text-slate-700">
              <span className="text-slate-400">Date of Issue:</span> <strong>{invoice.invoiceDate}</strong>
            </div>
            {invoice.dueDate && (
              <div className="text-xs text-slate-700">
                <span className="text-slate-400">Due Date:</span> <strong>{invoice.dueDate}</strong>
              </div>
            )}
            <div className="text-xs text-slate-700">
              <span className="text-slate-400">Place of Supply:</span> <strong>{invoice.placeOfSupplyStateCode}</strong>
            </div>
            {invoice.isReverseCharge && (
              <div className="inline-block mt-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                Reverse Charge Applicable (RCM)
              </div>
            )}
          </div>
        </div>

        {/* Taxi & Fleet Specific Duty Slip Section (If applicable) */}
        {trip && (trip.vehicleNumber || trip.routeOrDuty) && (
          <div className="bg-slate-50/80 p-4 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
              <Car className="w-3.5 h-3.5" />
              Duty Slip & Vehicle Details
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Vehicle No</span>
                <span className="font-mono font-bold text-navy-950">{trip.vehicleNumber || '—'}</span>
                <span className="text-[10px] text-slate-500 block">{trip.vehicleCategory}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Driver Name</span>
                <span className="font-bold text-navy-950">{trip.driverName || 'Operator'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Trip / Route</span>
                <span className="font-bold text-navy-950 truncate block" title={trip.routeOrDuty}>{trip.routeOrDuty || 'Point to Point'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Distance Traveled</span>
                <span className="font-mono font-black text-navy-950 tabular-nums">
                  {trip.totalKm ? `${trip.totalKm} KM` : '—'}
                </span>
                {trip.openingKm && trip.closingKm ? (
                  <span className="text-[9px] text-slate-400 block">({trip.openingKm} - {trip.closingKm})</span>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Service / Item Description</th>
                  <th className="py-2.5 text-center">HSN/SAC</th>
                  <th className="py-2.5 text-right">Qty</th>
                  <th className="py-2.5 text-right">Rate</th>
                  <th className="py-2.5 text-right">GST %</th>
                  <th className="py-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-navy-950">{line.description}</td>
                    <td className="py-3 text-center font-mono text-slate-500">{line.hsnSac || '996412'}</td>
                    <td className="py-3 text-right tabular-nums">{line.quantity}</td>
                    <td className="py-3 text-right tabular-nums">{formatPaiseToRupees(line.unitPricePaise)}</td>
                    <td className="py-3 text-right font-bold text-teal-700">{line.taxRate}%</td>
                    <td className="py-3 text-right font-black text-navy-950 tabular-nums">
                      {formatPaiseToRupees(line.totalPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Non-Taxable Pure Agent Reimbursements (Rule 33) */}
          {invoice.totalReimbursementsPaise > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Non-Taxable Reimbursements (Toll, State Permit & Parking - GST Rule 33)
              </span>
              <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Toll, State Permit & Parking (Pure Agent)</span>
                <span className="font-mono font-bold text-navy-950 tabular-nums">
                  {formatPaiseToRupees(invoice.totalReimbursementsPaise)}
                </span>
              </div>
            </div>
          )}

          {/* Totals Breakdown & UPI Payment Block */}
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Left: UPI Dynamic QR Code & 1-Tap Pay */}
            {upiId && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-center space-y-2.5">
                <span className="text-xs font-bold text-navy-950 block">Scan & Pay Instantly via Any UPI App</span>
                <p className="text-[10px] text-slate-500">Google Pay • PhonePe • Paytm • BHIM</p>
                
                {/* Visual dynamic QR placeholder or SVG */}
                <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="w-32 h-32 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-2">
                    <QrCode className="w-16 h-16 text-teal-400 mb-1" />
                    <span className="text-[9px] font-mono text-slate-300 truncate max-w-full">
                      {upiId}
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={handlePayViaUpi}
                  >
                    1-Tap Pay via UPI App (₹{grandTotalRupees})
                  </Button>
                </div>
              </div>
            )}

            {/* Right: Tax Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span className="font-mono font-bold tabular-nums">{formatPaiseToRupees(invoice.subtotalPaise)}</span>
              </div>

              {invoice.cgstPaise > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span className="font-mono font-bold tabular-nums">{formatPaiseToRupees(invoice.cgstPaise)}</span>
                </div>
              )}

              {invoice.sgstPaise > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST):</span>
                  <span className="font-mono font-bold tabular-nums">{formatPaiseToRupees(invoice.sgstPaise)}</span>
                </div>
              )}

              {invoice.igstPaise > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-bold tabular-nums">{formatPaiseToRupees(invoice.igstPaise)}</span>
                </div>
              )}

              {invoice.totalReimbursementsPaise > 0 && (
                <div className="flex justify-between text-teal-700 font-medium">
                  <span>Toll & Parking (Non-Taxable):</span>
                  <span className="font-mono font-bold tabular-nums">{formatPaiseToRupees(invoice.totalReimbursementsPaise)}</span>
                </div>
              )}

              {invoice.roundOffPaise !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Round-off:</span>
                  <span className="font-mono tabular-nums">{formatPaiseToRupees(invoice.roundOffPaise)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-navy-950">
                <span>Grand Total:</span>
                <span className="text-emerald-700 tabular-nums">{formatPaiseToRupees(invoice.grandTotalPaise)}</span>
              </div>
            </div>

          </div>

          {/* Terms and Signatory Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start justify-between gap-4 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Terms & Conditions</span>
              <p className="max-w-md text-[11px] leading-relaxed">
                {profile.termsAndConditions || 'Payment is due within 7 days. All disputes subject to local jurisdiction.'}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="font-bold text-slate-700 block mb-1">For {profile.legalName}</span>
              <div className="h-10 flex items-center sm:justify-end">
                <span className="text-[11px] italic text-slate-400">Authorized Signatory</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <div className="max-w-3xl mx-auto mt-6 text-center text-xs text-slate-400 no-print">
        Powered by <strong className="text-navy-900">BillSetu (बिल सेतु)</strong> • Smart GST Billing & Fleet Accounting Platform
      </div>

    </div>
  );
};
