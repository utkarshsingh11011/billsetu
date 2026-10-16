import React, { useMemo } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Plus, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Party, Invoice, BusinessProfile } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface CustomerStatementModalProps {
  party: Party;
  invoices: Invoice[];
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onCreateInvoiceForParty?: (party: Party) => void;
  onRecordPaymentForInvoice?: (invoice: Invoice) => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  party,
  invoices,
  profile,
  isOpen,
  onClose,
  onCreateInvoiceForParty,
  onRecordPaymentForInvoice,
}) => {
  if (!isOpen) return null;

  // Filter invoices for this party (both issued and paid, excluding draft and cancelled)
  const partyInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.party.id === party.id || (inv.party.gstin && inv.party.gstin === party.gstin))
      .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  }, [invoices, party]);

  const totalInvoicedPaise = useMemo(() => {
    return partyInvoices
      .filter(i => i.status !== 'cancelled')
      .reduce((sum, i) => sum + i.grandTotalPaise, 0);
  }, [partyInvoices]);

  const totalPaidPaise = useMemo(() => {
    return partyInvoices
      .filter(i => i.status !== 'cancelled')
      .reduce((sum, i) => sum + i.amountPaidPaise, 0);
  }, [partyInvoices]);

  const currentOutstandingPaise = totalInvoicedPaise - totalPaidPaise;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Statement of Account*\n` +
      `Customer: ${party.name}\n` +
      `Supplier: ${profile.tradeName || profile.legalName}\n` +
      `Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `Total Billed: ${formatPaiseToRupees(totalInvoicedPaise)}\n` +
      `Total Received: ${formatPaiseToRupees(totalPaidPaise)}\n` +
      `*Current Outstanding Balance: ${formatPaiseToRupees(currentOutstandingPaise)}*\n\n` +
      (profile.bankDetails.upiId ? `Pay via UPI: ${profile.bankDetails.upiId}\n` : '') +
      `Thank you for your business!`
    );
    window.open(`https://wa.me/${(party.phone || '').replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{party.name}</h2>
                <Badge variant={party.type === 'customer' ? 'teal' : 'slate'} size="sm">
                  {party.type.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Customer Ledger & Statement of Account (Khata)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs"
            >
              WhatsApp
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Print
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Party Quick Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">GSTIN</span>
              <span className="font-mono font-bold text-slate-900">
                {party.gstin || 'Unregistered / Consumer'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Phone / Mobile</span>
              <span className="font-medium text-slate-900">{party.phone || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Place of Supply / State</span>
              <span className="font-medium text-slate-900">{party.state} ({party.stateCode})</span>
            </div>
          </div>

          {/* Financial Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-500 text-xs block font-medium">Total Billed</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">
                {formatPaiseToRupees(totalInvoicedPaise)}
              </span>
              <span className="text-[11px] text-slate-400">{partyInvoices.length} invoices issued</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/50">
              <span className="text-emerald-700 text-xs block font-medium">Total Payments Received</span>
              <span className="text-lg font-black text-emerald-800 mt-1 block">
                {formatPaiseToRupees(totalPaidPaise)}
              </span>
              <span className="text-[11px] text-emerald-600">Settled to bank/cash</span>
            </div>

            <div className={`p-4 rounded-xl border ${currentOutstandingPaise > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-slate-50'}`}>
              <span className={`${currentOutstandingPaise > 0 ? 'text-rose-700' : 'text-slate-500'} text-xs block font-medium`}>
                Outstanding Balance Due
              </span>
              <span className={`text-lg font-black mt-1 block ${currentOutstandingPaise > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {formatPaiseToRupees(currentOutstandingPaise)}
              </span>
              <span className="text-[11px] text-slate-500">
                {currentOutstandingPaise > 0 ? 'Payment pending' : 'Zero balance'}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Transaction History ({partyInvoices.length})
              </h3>
              {onCreateInvoiceForParty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onCreateInvoiceForParty(party);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-teal-600" />}
                  className="text-xs"
                >
                  New Bill for this Customer
                </Button>
              )}
            </div>

            {partyInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                No invoices issued to this party yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Invoice Value</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partyInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600">{inv.invoiceDate}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={inv.status === 'paid' ? 'emerald' : inv.status === 'issued' ? 'teal' : inv.status === 'cancelled' ? 'rose' : 'slate'} size="sm">
                            {inv.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                          {formatPaiseToRupees(inv.grandTotalPaise)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                          {formatPaiseToRupees(inv.amountPaidPaise)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {inv.balanceDuePaise > 0 ? (
                            <span className="text-rose-600">{formatPaiseToRupees(inv.balanceDuePaise)}</span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};
