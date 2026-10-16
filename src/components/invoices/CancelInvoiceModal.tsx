import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Invoice } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { Button } from '../common/Button';

export interface CancelInvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (invoice: Invoice, reason: string) => void;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState<string>('Customer returned goods');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = notes.trim() ? `${reason}: ${notes.trim()}` : reason;
    const updated: Invoice = {
      ...invoice,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: finalReason,
      notes: invoice.notes ? `${invoice.notes}\n[VOID/CANCELLED]: ${finalReason}` : `[VOID/CANCELLED]: ${finalReason}`,
      balanceDuePaise: 0,
    };
    onConfirmCancel(updated, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">Cancel / Void Invoice</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
          <div className="font-bold text-rose-950">
            Cancelling {invoice.invoiceNumber} ({formatPaiseToRupees(invoice.grandTotalPaise)})
          </div>
          <p>
            Per Indian GST compliance, issued invoices are immutable snapshots. Voiding an invoice will retain its audit trail and mark its tax liability as nullified.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reason for Cancellation
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
          >
            <option value="Customer returned goods">Customer returned goods / Full refund</option>
            <option value="Error in billing address / details">Error in recipient name or address</option>
            <option value="Order cancelled / Not fulfilled">Order cancelled / Not fulfilled</option>
            <option value="Duplicate invoice created in error">Duplicate invoice created in error</option>
            <option value="Mutual commercial cancellation">Mutual commercial cancellation</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Additional Audit Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Returned damaged items on Oct 16"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Keep Invoice
          </Button>
          <Button type="submit" variant="danger" size="sm" className="font-bold">
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </div>
  );
};
