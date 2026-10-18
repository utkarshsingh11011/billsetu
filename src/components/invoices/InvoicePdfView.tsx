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
  CreditCard,
  Ban,
  Copy,
  Car,
  Navigation,
  Gauge,
  Receipt,
  QrCode
} from 'lucide-react';
import { Invoice, BusinessProfile, Subscription } from '../../types';
import { formatPaiseToRupees, paiseToWords } from '../../services/taxEngine';
import { downloadInvoiceAsPdfFile } from '../../services/pdfGenerator';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ThermalReceiptView } from './ThermalReceiptView';
import { CancelInvoiceModal } from './CancelInvoiceModal';
import { UpiQrCode } from '../common/UpiQrCode';

export interface InvoicePdfViewProps {
  invoice: Invoice;
  profile: BusinessProfile;
  subscription: Subscription;
  onBack: () => void;
  onIssue?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onCancelInvoice?: (invoice: Invoice, reason: string) => void;
  onClone?: (invoice: Invoice) => void;
}

export const InvoicePdfView: React.FC<InvoicePdfViewProps> = ({
  invoice,
  profile,
  subscription,
  onBack,
  onIssue,
  onRecordPayment,
  onCancelInvoice,
  onClone,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState<boolean>(false);
  const [printFormat, setPrintFormat] = React.useState<'a4' | 'thermal'>('a4');
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState<boolean>(false);
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

  const isPro = subscription.plan === 'pro';
  const isInterState = profile.stateCode !== invoice.placeOfSupplyStateCode;
  const isGst = invoice.type === 'gst_tax_invoice';

  const hostedUrl = `${window.location.origin}?bill=${invoice.shareableId || invoice.id}`;

  const handlePrint = () => {
    if (window.BillSetuNative?.printInvoice) {
      window.BillSetuNative.printInvoice(invoice.invoiceNumber || 'BillSetu_Invoice');
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    const elementId = printFormat === 'thermal' ? 'thermal-receipt-paper' : 'invoice-pdf-paper';
    await downloadInvoiceAsPdfFile(elementId, `${invoice.invoiceNumber}.pdf`);
    setIsDownloadingPdf(false);
  };

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
    msg += `Balance Due: *${formatPaiseToRupees(invoice.balanceDuePaise)}*\n`;
    if (profile.bankDetails?.upiId) {
      msg += `Pay via UPI: *${profile.bankDetails.upiId}*\n`;
    }
    msg += `------------------------------\n`;
    msg += `View & Download Bill Online:\n${hostedUrl}\n\n`;
    msg += `Thank you for traveling with us!`;

    // Native Android sharing with share intent
    if (window.BillSetuNative?.shareInvoice) {
      window.BillSetuNative.vibrate?.(30);
      window.BillSetuNative.shareInvoice(msg, undefined, `${invoice.invoiceNumber}.pdf`);
      return;
    }

    // Web fallback - direct navigation avoids popup blockers
    const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.location.href = targetUrl;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(hostedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
              <Badge variant={invoice.status === 'paid' ? 'emerald' : invoice.status === 'issued' ? 'teal' : invoice.status === 'cancelled' ? 'rose' : 'slate'}>
                {invoice.status.toUpperCase()}
              </Badge>
              {invoice.tripDetails?.vehicleNumber && (
                <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  {invoice.tripDetails.vehicleNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {invoice.party.name} • {formatPaiseToRupees(invoice.grandTotalPaise)}
            </p>
          </div>
        </div>

        {/* Format Selector: A4 vs 80mm Thermal POS */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
          <button
            onClick={() => setPrintFormat('a4')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              printFormat === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A4 Standard Invoice
          </button>
          <button
            onClick={() => setPrintFormat('thermal')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              printFormat === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            80mm Thermal Receipt
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'issued' && onRecordPayment && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRecordPayment(invoice)}
              leftIcon={<CreditCard className="w-4 h-4 text-emerald-600" />}
              className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
            >
              Record Payment
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={<Copy className="w-4 h-4 text-slate-600" />}
            className="bg-white border-slate-300 text-xs"
          >
            {copiedLink ? 'Copied Link!' : 'Copy Bill URL'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareWhatsApp}
            leftIcon={<Send className="w-4 h-4 text-emerald-600" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            WhatsApp Bill
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-white border-slate-300"
          >
            {isDownloadingPdf ? 'Generating...' : 'PDF'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="bg-[#0C2B62] text-white font-bold hover:bg-[#17396E]"
          >
            Print
          </Button>
        </div>
      </div>

      {/* Render either Thermal Slip or A4 Paper */}
      {printFormat === 'thermal' ? (
        <ThermalReceiptView invoice={invoice} profile={profile} subscription={subscription} />
      ) : (
        <div 
          id="invoice-pdf-paper"
          className="invoice-paper bg-white rounded-xl border border-slate-300 shadow-md p-8 sm:p-10 font-sans text-slate-800 space-y-6"
        >
        
        {/* Header: Business & Document Type */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
          <div className="space-y-1 max-w-md">
            {/* Logo */}
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Company Logo" className="h-12 w-auto object-contain mb-2" />
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <img src="/logo_icon.png" alt="BillSetu" className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-xs font-bold text-[#0C2B62] tracking-wider uppercase">
                  {profile.tradeName || 'FLEET OPERATOR'}
                </span>
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
            <span className="inline-block px-3 py-1 bg-[#0C2B62] text-white font-bold text-xs uppercase tracking-wider rounded">
              {isGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
            </span>
            <div className="text-sm font-black text-slate-900 pt-2 font-mono">
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
              Billed To ({invoice.billingType === 'b2b_corporate' ? 'Corporate Client' : 'Passenger / Individual'})
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
              {invoice.party.address || 'Address provided on duty slip'}
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
              Compliance & Dispatch Details
            </div>
            <div className="space-y-1 text-slate-600">
              <div><strong>Passenger / Rep:</strong> {invoice.party.contactPerson || invoice.party.name}</div>
              <div><strong>Phone:</strong> {invoice.party.phone || '--'}</div>
              <div><strong>Service Category:</strong> Passenger Transport by Road (SAC 9964)</div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-slate-700">
              <span>Tax Payable under Reverse Charge (RCM):</span>
              <strong className={invoice.isReverseCharge ? 'text-amber-700' : 'text-slate-900'}>
                {invoice.isReverseCharge ? 'YES (Section 9(3))' : 'NO'}
              </strong>
            </div>
          </div>
        </div>

        {/* Specialized Taxi & Trip Duty Slip Log (Enterprise Feature) */}
        {invoice.tripDetails && invoice.tripDetails.vehicleNumber && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-bold text-slate-900">
              <div className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#19B0A0]" />
                <span className="uppercase tracking-wider text-[11px]">Vehicle Duty Slip & Route Record</span>
              </div>
              <span className="font-mono text-xs bg-white px-2 py-0.5 border border-slate-300 rounded font-bold">
                {invoice.tripDetails.vehicleNumber} ({invoice.tripDetails.vehicleCategory})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">DRIVER NAME</span>
                <strong>{invoice.tripDetails.driverName || 'Designated Fleet Chauffeur'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DUTY PERIOD</span>
                <strong>{invoice.tripDetails.tripStartDate}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ODOMETER LOG</span>
                <span>
                  {invoice.tripDetails.openingKm ?? '--'} to {invoice.tripDetails.closingKm ?? '--'} KM
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL RUN</span>
                <strong className="text-slate-900 font-mono">
                  {invoice.tripDetails.totalKm ? `${invoice.tripDetails.totalKm} KM` : '--'}
                </strong>
              </div>
            </div>

            {invoice.tripDetails.routeOrDuty && (
              <div className="pt-1 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Duty Route / Itinerary: </span>
                {invoice.tripDetails.routeOrDuty}
              </div>
            )}
          </div>
        )}

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#0C2B62] text-white font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 border border-slate-800 text-center w-8">#</th>
                <th className="py-2.5 px-3 border border-slate-800">Description of Service</th>
                <th className="py-2.5 px-3 border border-slate-800 text-center">SAC Code</th>
                <th className="py-2.5 px-3 border border-slate-800 text-right">Qty</th>
                <th className="py-2.5 px-3 border border-slate-800 text-right">Rate</th>
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
                    {line.hsnSac || '996412'}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                    {line.quantity} {line.unit}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                    {formatPaiseToRupees(line.unitPricePaise, false)}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right font-mono font-semibold">
                    {formatPaiseToRupees(line.taxableValuePaise, false)}
                  </td>
                  {isGst && (
                    <>
                      {!isInterState ? (
                        <>
                          <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                            <div>{formatPaiseToRupees(line.cgstPaise, false)}</div>
                            <span className="text-[9px] text-slate-400">({line.taxRate / 2}%)</span>
                          </td>
                          <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                            <div>{formatPaiseToRupees(line.sgstPaise, false)}</div>
                            <span className="text-[9px] text-slate-400">({line.taxRate / 2}%)</span>
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                          <div>{formatPaiseToRupees(line.igstPaise, false)}</div>
                          <span className="text-[9px] text-slate-400">({line.taxRate}%)</span>
                        </td>
                      )}
                    </>
                  )}
                  <td className="py-2 px-3 border border-slate-200 text-right font-mono font-bold text-slate-900">
                    {formatPaiseToRupees(line.totalPaise, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pure Agent Non-Taxable Reimbursements Breakdown */}
        {invoice.totalReimbursementsPaise > 0 && invoice.tripDetails && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-teal-950 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#19B0A0]" />
                <span>Pure Agent Out-of-Pocket Reimbursements (Non-Taxable as per Rule 33):</span>
              </span>
              <div className="flex gap-4 text-teal-800 text-[11px] mt-1">
                {invoice.tripDetails.tollTaxPaise > 0 && (
                  <span>Toll Tax: <strong>{formatPaiseToRupees(invoice.tripDetails.tollTaxPaise)}</strong></span>
                )}
                {invoice.tripDetails.statePermitPaise > 0 && (
                  <span>State Permit: <strong>{formatPaiseToRupees(invoice.tripDetails.statePermitPaise)}</strong></span>
                )}
                {invoice.tripDetails.parkingChargesPaise > 0 && (
                  <span>Parking: <strong>{formatPaiseToRupees(invoice.tripDetails.parkingChargesPaise)}</strong></span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-teal-700 block">Total Reimbursement</span>
              <span className="font-mono font-bold text-sm text-teal-950">
                {formatPaiseToRupees(invoice.totalReimbursementsPaise)}
              </span>
            </div>
          </div>
        )}

        {/* Calculations & Bank / QR Layout */}
        <div className="grid grid-cols-2 gap-6 pt-2">
          
          {/* Left: Bank Details & Dynamic UPI QR */}
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#0C2B62]" />
                <span>Bank Transfer Details</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-slate-600">
                <span>Bank Name:</span>
                <strong className="text-slate-900">{profile.bankDetails.bankName || 'Not configured'}</strong>
                <span>A/C Number:</span>
                <strong className="text-slate-900 font-mono">{profile.bankDetails.accountNo || 'Not configured'}</strong>
                <span>IFSC Code:</span>
                <strong className="text-slate-900 font-mono">{profile.bankDetails.ifsc || 'Not configured'}</strong>
                <span>Beneficiary:</span>
                <strong className="text-slate-900">{profile.bankDetails.accountHolderName || profile.tradeName}</strong>
              </div>
            </div>

            {/* Dynamic NPCI UPI QR */}
            {profile.bankDetails?.upiId && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-4">
                <UpiQrCode 
                  upiId={profile.bankDetails.upiId}
                  payeeName={profile.tradeName || profile.legalName}
                  amountPaise={invoice.balanceDuePaise}
                  transactionNote={`Bill-${invoice.invoiceNumber}`}
                  size={90}
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-[#19B0A0]" />
                    <span>Instant UPI Payment</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Scan with any UPI app. Exact payable amount of <strong>{formatPaiseToRupees(invoice.balanceDuePaise)}</strong> auto-fills.
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">GPay</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold border border-purple-200">PhonePe</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[9px] font-bold border border-sky-200">Paytm</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 text-[9px] font-bold border border-orange-200">BHIM</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-600 pt-0.5">
                    UPI ID: <strong>{profile.bankDetails.upiId}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Tax Summary Table */}
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Taxable Value:</span>
              <span className="font-mono font-semibold">{formatPaiseToRupees(invoice.taxableValuePaise)}</span>
            </div>

            {isGst && (
              <>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Total CGST:</span>
                      <span className="font-mono">{formatPaiseToRupees(invoice.cgstPaise)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Total SGST:</span>
                      <span className="font-mono">{formatPaiseToRupees(invoice.sgstPaise)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Total IGST:</span>
                    <span className="font-mono">{formatPaiseToRupees(invoice.igstPaise)}</span>
                  </div>
                )}
              </>
            )}

            {invoice.totalReimbursementsPaise > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-teal-800 font-medium">
                <span>Toll & Parking Reimbursements:</span>
                <span className="font-mono font-bold">{formatPaiseToRupees(invoice.totalReimbursementsPaise)}</span>
              </div>
            )}

            {invoice.roundOffPaise !== 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                <span>Round-off:</span>
                <span className="font-mono">{invoice.roundOffPaise > 0 ? `+${invoice.roundOffPaise}p` : `${invoice.roundOffPaise}p`}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black text-slate-900">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-base">{formatPaiseToRupees(invoice.grandTotalPaise)}</span>
            </div>

            <div className="flex justify-between py-1 font-bold text-emerald-700">
              <span>Amount Paid:</span>
              <span className="font-mono">{formatPaiseToRupees(invoice.amountPaidPaise)}</span>
            </div>

            <div className="flex justify-between py-1 font-black text-[#0C2B62] text-sm bg-slate-50 px-2 rounded">
              <span>Balance Due:</span>
              <span className="font-mono">{formatPaiseToRupees(invoice.balanceDuePaise)}</span>
            </div>
          </div>

        </div>

        {/* Amount in Words */}
        <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800">
          <strong>Amount in Words:</strong> {paiseToWords(invoice.grandTotalPaise)}
        </div>

        {/* Reverse Charge Legal Notice if Applicable */}
        {invoice.isReverseCharge && (
          <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 leading-tight">
            <strong>Reverse Charge Notification:</strong> Tax is payable by the recipient of service under Reverse Charge Mechanism (RCM) under Section 9(3) of CGST Act 2017.
          </div>
        )}

        {/* Terms & Signature */}
        <div className="flex justify-between items-end pt-6 border-t border-slate-200 text-xs">
          <div className="max-w-md space-y-1">
            <span className="font-bold text-slate-700 block text-[11px]">TERMS & CONDITIONS:</span>
            <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
              {invoice.terms || profile.termsAndConditions}
            </p>
          </div>

          <div className="text-center space-y-2 shrink-0">
            {profile.signatureUrl ? (
              <img src={profile.signatureUrl} alt="Signature" className="h-12 w-auto mx-auto object-contain" />
            ) : (
              <div className="h-12" />
            )}
            <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-800">
              For {profile.tradeName || profile.legalName}
            </div>
            <div className="text-[10px] text-slate-500">
              {profile.authorizedSignatoryName || 'Authorized Signatory'}
            </div>
          </div>
        </div>

        {/* Footer / Branding */}
        {!isPro ? (
          <div className="pt-4 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <img src="/logo_icon.png" alt="BillSetu" className="w-3.5 h-3.5 rounded object-contain" />
            <span>Powered by <strong>BillSetu</strong> • Smart GST Billing for Indian Taxi & Fleet Businesses</span>
          </div>
        ) : (
          <div className="pt-2" />
        )}

      </div>
      )}

      {/* Cancel Invoice Modal */}
      <CancelInvoiceModal
        invoice={invoice}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={onCancelInvoice || (() => {})}
      />

    </div>
  );
};
