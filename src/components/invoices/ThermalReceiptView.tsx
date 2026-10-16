import React from 'react';
import { Invoice, BusinessProfile, Subscription } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { UpiQrCode } from '../common/UpiQrCode';
import { ShieldCheck } from 'lucide-react';

export interface ThermalReceiptViewProps {
  invoice: Invoice;
  profile: BusinessProfile;
  subscription: Subscription;
}

export const ThermalReceiptView: React.FC<ThermalReceiptViewProps> = ({
  invoice,
  profile,
  subscription,
}) => {
  const isPro = subscription.plan === 'pro';
  const isInterState = profile.stateCode !== invoice.placeOfSupplyStateCode;
  const isGst = invoice.type === 'gst_tax_invoice';

  return (
    <div 
      id="thermal-receipt-paper"
      className="invoice-paper bg-white mx-auto max-w-[320px] p-4 font-mono text-[11px] text-slate-900 border border-slate-300 rounded-lg shadow-sm space-y-3 leading-tight"
    >
      {/* Store Header */}
      <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-2.5">
        {isPro && profile.logoUrl && (
          <img src={profile.logoUrl} alt="Logo" className="h-8 max-w-full mx-auto object-contain mb-1" />
        )}
        <div className="font-bold text-sm uppercase">{profile.tradeName || profile.legalName}</div>
        <div className="text-[10px] text-slate-600">{profile.address}, {profile.city}</div>
        {profile.gstin && (
          <div className="text-[10px] font-bold">GSTIN: {profile.gstin}</div>
        )}
        {profile.phone && (
          <div className="text-[10px]">TEL: {profile.phone}</div>
        )}
        <div className="text-[9px] font-bold text-slate-700 uppercase mt-1">
          *** {isGst ? 'RETAIL TAX INVOICE' : 'BILL OF SUPPLY'} ***
        </div>
      </div>

      {/* Bill Meta */}
      <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-400 pb-2">
        <div className="flex justify-between">
          <span>BILL NO: <strong>{invoice.invoiceNumber}</strong></span>
          <span>DATE: {invoice.invoiceDate}</span>
        </div>
        <div className="flex justify-between">
          <span>CLIENT: {invoice.party.name}</span>
          <span>{invoice.party.gstin ? `GST: ${invoice.party.gstin.substring(0, 8)}...` : 'UNREG'}</span>
        </div>
        <div>POS: {invoice.placeOfSupplyState} ({invoice.placeOfSupplyStateCode})</div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2">
        <div className="flex justify-between font-bold border-b border-slate-300 pb-1 text-[10px]">
          <span className="w-1/2">ITEM</span>
          <span className="w-1/6 text-right">QTY</span>
          <span className="w-1/6 text-right">RATE</span>
          <span className="w-1/6 text-right">AMT</span>
        </div>

        {invoice.lines.map((line, idx) => (
          <div key={idx} className="flex justify-between text-[10px]">
            <span className="w-1/2 truncate font-medium">{line.description}</span>
            <span className="w-1/6 text-right">{line.quantity}</span>
            <span className="w-1/6 text-right">{(line.unitPricePaise / 100).toFixed(0)}</span>
            <span className="w-1/6 text-right font-bold">{(line.totalPaise / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Totals Breakdown */}
      <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{formatPaiseToRupees(invoice.subtotalPaise)}</span>
        </div>

        {invoice.totalDiscountPaise > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>DISCOUNT:</span>
            <span>-{formatPaiseToRupees(invoice.totalDiscountPaise)}</span>
          </div>
        )}

        {isGst && (
          <>
            {!isInterState ? (
              <>
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>{formatPaiseToRupees(invoice.cgstPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>{formatPaiseToRupees(invoice.sgstPaise)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>IGST:</span>
                <span>{formatPaiseToRupees(invoice.igstPaise)}</span>
              </div>
            )}
          </>
        )}

        {invoice.roundOffPaise !== 0 && (
          <div className="flex justify-between text-slate-500">
            <span>ROUND OFF:</span>
            <span>{invoice.roundOffPaise > 0 ? '+' : ''}{formatPaiseToRupees(invoice.roundOffPaise)}</span>
          </div>
        )}

        <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-900">
          <span>NET PAYABLE:</span>
          <span className="text-sm">{formatPaiseToRupees(invoice.grandTotalPaise)}</span>
        </div>

        {invoice.amountPaidPaise > 0 && (
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>PAID:</span>
            <span>{formatPaiseToRupees(invoice.amountPaidPaise)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold pt-0.5">
          <span>BALANCE DUE:</span>
          <span>{formatPaiseToRupees(invoice.balanceDuePaise)}</span>
        </div>
      </div>

      {/* Instant Dynamic UPI QR Code for Counter Payment */}
      {profile.bankDetails.upiId && invoice.balanceDuePaise > 0 && (
        <div className="py-2 text-center flex flex-col items-center justify-center border-b border-dashed border-slate-400 pb-2.5">
          <UpiQrCode
            upiId={profile.bankDetails.upiId}
            payeeName={profile.tradeName || profile.legalName}
            amountRupees={invoice.balanceDuePaise / 100}
            invoiceNumber={invoice.invoiceNumber}
            size={100}
          />
        </div>
      )}

      {/* Receipt Footer */}
      <div className="text-center text-[9px] text-slate-500 space-y-0.5 pt-1">
        <div>THANK YOU! VISIT AGAIN</div>
        <div>Goods once sold will not be taken back</div>
        {!isPro && (
          <div className="pt-2 text-[8px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>BillSetu • Small Business Invoicing</span>
          </div>
        )}
      </div>

    </div>
  );
};
