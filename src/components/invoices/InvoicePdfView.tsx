import React from 'react';
import { 
  Printer, 
  Download, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  Send,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Invoice, BusinessProfile, Subscription } from '../../types';
import { formatPaiseToRupees, paiseToWords } from '../../services/taxEngine';
import { downloadInvoiceAsPdfFile } from '../../services/pdfGenerator';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface InvoicePdfViewProps {
  invoice: Invoice;
  profile: BusinessProfile;
  subscription: Subscription;
  onBack: () => void;
  onIssue?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export const InvoicePdfView: React.FC<InvoicePdfViewProps> = ({
  invoice,
  profile,
  subscription,
  onBack,
  onIssue,
  onRecordPayment,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState<boolean>(false);
  const isPro = subscription.plan === 'pro';
  const isInterState = profile.stateCode !== invoice.placeOfSupplyStateCode;
  const isGst = invoice.type === 'gst_tax_invoice';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    await downloadInvoiceAsPdfFile('invoice-pdf-paper', `${invoice.invoiceNumber}.pdf`);
    setIsDownloadingPdf(false);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${invoice.party.name},\n\nPlease find your invoice *${invoice.invoiceNumber}* for *${formatPaiseToRupees(invoice.grandTotalPaise)}* dated ${invoice.invoiceDate}.\n\nBalance Due: ${formatPaiseToRupees(invoice.balanceDuePaise)}\n\nThank you,\n${profile.tradeName || profile.legalName}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
              <Badge variant={invoice.status === 'paid' ? 'emerald' : invoice.status === 'issued' ? 'teal' : 'slate'}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {invoice.party.name} • {formatPaiseToRupees(invoice.grandTotalPaise)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && onIssue && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onIssue(invoice)}
              leftIcon={<Send className="w-4 h-4" />}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Issue Invoice
            </Button>
          )}

          {invoice.status !== 'draft' && invoice.balanceDuePaise > 0 && onRecordPayment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRecordPayment(invoice)}
              leftIcon={<CreditCard className="w-4 h-4 text-emerald-600" />}
            >
              Record Payment
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isDownloadingPdf}
            leftIcon={<Download className="w-4 h-4 text-teal-600" />}
          >
            Download PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
            leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
          >
            WhatsApp
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Printable Invoice Paper (Matches exact physical A4 invoice format) */}
      <div 
        id="invoice-pdf-paper"
        className="invoice-paper bg-white rounded-xl border border-slate-300 shadow-md p-8 sm:p-10 font-sans text-slate-800 space-y-6"
      >
        
        {/* Header: Business & Document Type */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
          <div className="space-y-1 max-w-md">
            {/* Pro tier Logo or Business Emblem */}
            {isPro && profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Company Logo" className="h-12 w-auto object-contain mb-2" />
            ) : (
              <div className="text-xs font-bold text-teal-700 tracking-wider uppercase mb-1">
                {profile.tradeName ? 'TRADE NAME' : 'SUPPLIER'}
              </div>
            )}
            
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {profile.legalName || profile.tradeName}
            </h1>
            {profile.tradeName && profile.tradeName !== profile.legalName && (
              <div className="text-xs text-slate-600 font-semibold">
                (Operating as: {profile.tradeName})
              </div>
            )}
            <p className="text-xs text-slate-600 leading-relaxed">
              {profile.address}, {profile.city}, {profile.state} - {profile.pincode}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 font-medium pt-1">
              {profile.gstin && (
                <span><strong>GSTIN:</strong> {profile.gstin}</span>
              )}
              <span><strong>State Code:</strong> {profile.stateCode} ({profile.state})</span>
              {profile.phone && <span><strong>Tel:</strong> {profile.phone}</span>}
              {profile.email && <span><strong>Email:</strong> {profile.email}</span>}
            </div>
          </div>

          <div className="text-right space-y-1 shrink-0">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
              {isGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
            </span>
            <div className="text-sm font-black text-slate-900 pt-2">
              Invoice #{invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-600">
              <strong>Invoice Date:</strong> {invoice.invoiceDate}
            </div>
            {invoice.dueDate && (
              <div className="text-xs text-slate-600">
                <strong>Due Date:</strong> {invoice.dueDate}
              </div>
            )}
            <div className="text-xs text-slate-600">
              <strong>Place of Supply:</strong> {invoice.placeOfSupplyState} ({invoice.placeOfSupplyStateCode})
            </div>
            <div className="text-[11px] text-slate-500">
              {isInterState ? 'Inter-state Supply (IGST)' : 'Intra-state Supply (CGST+SGST)'}
            </div>
          </div>
        </div>

        {/* Bill To / Consignee Details */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Billed To (Recipient / Customer)
            </div>
            <div className="font-bold text-sm text-slate-900">
              {invoice.party.name}
            </div>
            {invoice.party.tradeName && (
              <div className="text-slate-600 font-medium">
                {invoice.party.tradeName}
              </div>
            )}
            <div className="text-slate-600 mt-1">
              {invoice.party.address}
            </div>
            <div className="mt-1 font-medium text-slate-700">
              {invoice.party.gstin ? (
                <span><strong>GSTIN:</strong> {invoice.party.gstin}</span>
              ) : (
                <span className="text-slate-500 italic">Unregistered / Consumer</span>
              )}
            </div>
            <div className="text-slate-600">
              <strong>State:</strong> {invoice.party.state} (Code: {invoice.party.stateCode})
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Shipping / Delivery Details
            </div>
            <div className="text-slate-600">
              Same as Billing Address
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-slate-700">
              <span>Reverse Charge Applicable:</span>
              <strong className="text-slate-900">{invoice.isReverseCharge ? 'YES' : 'NO'}</strong>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 border border-slate-800 text-center w-8">#</th>
                <th className="py-2.5 px-3 border border-slate-800">Description of Goods / Services</th>
                <th className="py-2.5 px-3 border border-slate-800 text-center">HSN/SAC</th>
                <th className="py-2.5 px-3 border border-slate-800 text-right">Qty</th>
                <th className="py-2.5 px-3 border border-slate-800 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 border border-slate-800 text-right">Taxable</th>
                {isGst && (
                  <>
                    {!isInterState ? (
                      <>
                        <th className="py-2.5 px-3 border border-slate-800 text-right">CGST</th>
                        <th className="py-2.5 px-3 border border-slate-800 text-right">SGST</th>
                      </>
                    ) : (
                      <th className="py-2.5 px-3 border border-slate-800 text-right">IGST</th>
                    )}
                  </>
                )}
                <th className="py-2.5 px-3 border border-slate-800 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.lines.map((line, idx) => (
                <tr key={line.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-2 px-3 border border-slate-200 text-center text-slate-500 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border border-slate-200">
                    <span className="font-semibold text-slate-900">{line.description}</span>
                    {line.isTaxInclusive && (
                      <span className="text-[10px] text-slate-500 ml-1.5">(Incl. GST)</span>
                    )}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-center font-mono text-slate-600">
                    {line.hsnSac || '-'}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right whitespace-nowrap">
                    {line.quantity} {line.unit}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right whitespace-nowrap">
                    {formatPaiseToRupees(line.unitPricePaise)}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right font-medium whitespace-nowrap">
                    {formatPaiseToRupees(line.taxableValuePaise)}
                  </td>
                  {isGst && (
                    <>
                      {!isInterState ? (
                        <>
                          <td className="py-2 px-3 border border-slate-200 text-right whitespace-nowrap">
                            {formatPaiseToRupees(line.cgstPaise)}
                            <span className="block text-[10px] text-slate-400">({line.taxRate / 2}%)</span>
                          </td>
                          <td className="py-2 px-3 border border-slate-200 text-right whitespace-nowrap">
                            {formatPaiseToRupees(line.sgstPaise)}
                            <span className="block text-[10px] text-slate-400">({line.taxRate / 2}%)</span>
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-3 border border-slate-200 text-right whitespace-nowrap">
                          {formatPaiseToRupees(line.igstPaise)}
                          <span className="block text-[10px] text-slate-400">({line.taxRate}%)</span>
                        </td>
                      )}
                    </>
                  )}
                  <td className="py-2 px-3 border border-slate-200 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatPaiseToRupees(line.totalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lower Section: Bank details, Notes, and Totals */}
        <div className="grid grid-cols-12 gap-6 pt-2">
          
          {/* Bank & Payment Information */}
          <div className="col-span-7 space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bank & Payment Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div><strong>Bank Name:</strong> {profile.bankDetails.bankName}</div>
                <div><strong>Account Holder:</strong> {profile.bankDetails.accountHolderName}</div>
                <div><strong>Account No:</strong> {profile.bankDetails.accountNo}</div>
                <div><strong>IFSC Code:</strong> {profile.bankDetails.ifsc}</div>
                {profile.bankDetails.upiId && (
                  <div className="col-span-2 text-teal-800 font-semibold">
                    <strong>UPI ID for payment:</strong> {profile.bankDetails.upiId}
                  </div>
                )}
              </div>
            </div>

            {/* Terms and conditions */}
            {profile.termsAndConditions && (
              <div className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                <strong className="text-slate-700 block uppercase tracking-wider">Terms & Conditions:</strong>
                {profile.termsAndConditions}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="col-span-5 space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Total Taxable Amount</span>
              <strong className="text-slate-900">{formatPaiseToRupees(invoice.taxableValuePaise)}</strong>
            </div>

            {isGst && (
              <>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between py-1">
                      <span>Central Tax (CGST)</span>
                      <span>{formatPaiseToRupees(invoice.cgstPaise)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>State Tax (SGST)</span>
                      <span>{formatPaiseToRupees(invoice.sgstPaise)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1">
                    <span>Integrated Tax (IGST)</span>
                    <span>{formatPaiseToRupees(invoice.igstPaise)}</span>
                  </div>
                )}
              </>
            )}

            {invoice.roundOffPaise !== 0 && (
              <div className="flex justify-between py-1 text-slate-500">
                <span>Round Off</span>
                <span>{invoice.roundOffPaise > 0 ? '+' : ''}{formatPaiseToRupees(invoice.roundOffPaise)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
              <span>Invoice Total (INR)</span>
              <span className="text-base">{formatPaiseToRupees(invoice.grandTotalPaise)}</span>
            </div>

            {invoice.amountPaidPaise > 0 && (
              <div className="flex justify-between py-1 text-emerald-700 font-semibold">
                <span>Amount Paid</span>
                <span>{formatPaiseToRupees(invoice.amountPaidPaise)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-t border-slate-200 text-slate-900 font-bold">
              <span>Balance Due</span>
              <span className={invoice.balanceDuePaise > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {formatPaiseToRupees(invoice.balanceDuePaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800">
          <strong>Amount in Words:</strong> {paiseToWords(invoice.grandTotalPaise)}
        </div>

        {/* Signature Area */}
        <div className="flex justify-between items-end pt-8 border-t border-slate-200 text-xs">
          <div className="text-slate-500">
            Thank you for doing business with us!
          </div>
          <div className="text-center space-y-8">
            <div className="font-bold text-slate-900">
              For {profile.legalName || profile.tradeName}
            </div>
            <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* BillSetu Footer / Branding (PRD Section 6.6 BRAND-01 & SUB-01) */}
        {!isPro ? (
          <div className="pt-6 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Created with <strong>BillSetu</strong> • A simpler, dependable billing tool for small businesses</span>
          </div>
        ) : (
          <div className="pt-2" />
        )}

      </div>

    </div>
  );
};
