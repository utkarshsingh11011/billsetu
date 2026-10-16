import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';
import { Invoice, PaymentRecord } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onRecordPayment: (invoice: Invoice, payment: PaymentRecord) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  onClose,
  onRecordPayment,
}) => {
  const [amountRupees, setAmountRupees] = useState<string>(
    (invoice.balanceDuePaise / 100).toFixed(2)
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [method, setMethod] = useState<PaymentRecord['method']>('upi');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paidPaise = Math.round((parseFloat(amountRupees) || 0) * 100);
    if (paidPaise <= 0) return;

    const payment: PaymentRecord = {
      id: `pmt_${Date.now()}`,
      amountPaise: paidPaise,
      date: paymentDate,
      method,
      referenceNo: referenceNo.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const newAmountPaid = invoice.amountPaidPaise + paidPaise;
    const newBalanceDue = Math.max(0, invoice.grandTotalPaise - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? 'paid' : 'partially_paid';

    const updatedInvoice: Invoice = {
      ...invoice,
      amountPaidPaise: newAmountPaid,
      balanceDuePaise: newBalanceDue,
      status: newStatus,
      payments: [...(invoice.payments || []), payment],
    };

    onRecordPayment(updatedInvoice, payment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900">Record Payment</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Invoice:</span>
            <strong className="text-slate-900">{invoice.invoiceNumber}</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Customer:</span>
            <span className="text-slate-900">{invoice.party.name}</span>
          </div>
          <div className="flex justify-between text-slate-600 border-t pt-1">
            <span>Remaining Balance Due:</span>
            <strong className="text-rose-600">{formatPaiseToRupees(invoice.balanceDuePaise)}</strong>
          </div>
        </div>

        <Input
          label="Amount Received (₹)"
          type="number"
          step="0.01"
          required
          value={amountRupees}
          onChange={(e) => setAmountRupees(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              <option value="upi">UPI / QR Code</option>
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <Input
            label="Payment Date"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <Input
          label="Transaction / UPI Reference #"
          value={referenceNo}
          onChange={(e) => setReferenceNo(e.target.value)}
          placeholder="e.g. UPI Ref 329048102394"
        />

        <Input
          label="Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Received via GPay from customer"
        />

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700 font-bold">
            Record Payment
          </Button>
        </div>
      </form>
    </div>
  );
};
