import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Save, 
  Receipt, 
  Building2, 
  Calendar, 
  Hash, 
  ShieldAlert,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { ScannedDocument, ExtractionResult, PurchaseExpense } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { validateExtractionArithmetic } from '../../services/ocrPipeline';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface DocumentReviewModalProps {
  scan: ScannedDocument;
  onClose: () => void;
  onSaveToBooks: (scan: ScannedDocument, destination: 'purchase_expense' | 'sales_archive' | 'document_archive', expenseRecord?: PurchaseExpense) => void;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  scan,
  onClose,
  onSaveToBooks,
}) => {
  // Working state for extracted fields (allows user to correct any extracted value)
  const [supplierName, setSupplierName] = useState<string>(scan.extraction.supplier.legalName.value);
  const [supplierGstin, setSupplierGstin] = useState<string>(scan.extraction.supplier.gstin.value);
  const [supplierAddress, setSupplierAddress] = useState<string>(scan.extraction.supplier.address.value);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(scan.extraction.invoice.number.value);
  const [invoiceDate, setInvoiceDate] = useState<string>(scan.extraction.invoice.date.value);
  
  const [lines, setLines] = useState(scan.extraction.lines);
  const [grandTotalPaise, setGrandTotalPaise] = useState<number>(scan.extraction.totals.grandTotalPaise.value);

  // Expense categorization & destination record
  const [destination, setDestination] = useState<'purchase_expense' | 'sales_archive' | 'document_archive'>('purchase_expense');
  const [expenseCategory, setExpenseCategory] = useState<PurchaseExpense['category']>('Inventory');
  const [userNotes, setUserNotes] = useState<string>('');

  // Viewer controls
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  // Arithmetic cross-check (PRD Section 6.3)
  const currentExtraction: ExtractionResult = {
    ...scan.extraction,
    supplier: {
      ...scan.extraction.supplier,
      legalName: { ...scan.extraction.supplier.legalName, value: supplierName },
      gstin: { ...scan.extraction.supplier.gstin, value: supplierGstin },
    },
    invoice: {
      ...scan.extraction.invoice,
      number: { ...scan.extraction.invoice.number, value: invoiceNumber },
      date: { ...scan.extraction.invoice.date, value: invoiceDate },
    },
    lines,
    totals: {
      ...scan.extraction.totals,
      grandTotalPaise: { ...scan.extraction.totals.grandTotalPaise, value: grandTotalPaise },
    }
  };

  const arithmeticCheck = validateExtractionArithmetic(currentExtraction);

  // Confidence indicators helper
  const renderConfidenceBadge = (confidence: number, isUncertain?: boolean) => {
    if (isUncertain || confidence < 0.70) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full" title="AI confidence below threshold: Verify carefully">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Check value ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full" title="High confidence extraction">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Verified ({Math.round(confidence * 100)}%)
      </span>
    );
  };

  const handleSave = () => {
    const updatedScan: ScannedDocument = {
      ...scan,
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      reviewNotes: userNotes,
      extraction: currentExtraction,
      destinationRecordType: destination,
    };

    let expenseRecord: PurchaseExpense | undefined;
    if (destination === 'purchase_expense') {
      expenseRecord = {
        id: `exp_${Date.now()}`,
        businessId: 'biz_01',
        vendorName: supplierName,
        vendorGstin: supplierGstin || undefined,
        invoiceNumber,
        invoiceDate,
        category: expenseCategory,
        taxableAmountPaise: arithmeticCheck.computedTaxablePaise,
        taxPaise: arithmeticCheck.computedTaxPaise,
        totalAmountPaise: grandTotalPaise,
        paymentStatus: 'paid',
        sourceDocumentId: scan.id,
        sourceDocumentFileName: scan.fileName,
        notes: userNotes,
        createdAt: new Date().toISOString(),
      };
    }

    onSaveToBooks(updatedScan, destination, expenseRecord);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Scan-to-Books Review</h3>
                <Badge variant="amber" size="sm">Human Control Active</Badge>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {scan.fileName} • Verify extracted details against the original document
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Side-by-Side Review (PRD Section 3 & 6.3) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT: Document Inspector / Original File Viewer (cols 5) */}
          <div className="lg:col-span-5 bg-slate-100 border-r border-slate-200 flex flex-col h-full overflow-hidden">
            
            {/* Viewer toolbar */}
            <div className="p-2 bg-slate-200/80 border-b border-slate-300 flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold text-slate-800">Original Document</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(prev => Math.max(50, prev - 15))}
                  className="p-1 hover:bg-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(prev => Math.min(200, prev + 15))}
                  className="p-1 hover:bg-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1 hover:bg-white rounded ml-2"
                  title="Rotate Document 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Render Area (Simulated high-res scan representation) */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-slate-200/50">
              <div
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="bg-white p-6 rounded-lg shadow-md border border-slate-300 w-full max-w-sm text-[11px] font-mono space-y-3 select-none text-slate-800"
              >
                <div className="text-center border-b pb-2 border-dashed">
                  <div className="font-bold text-sm">{supplierName}</div>
                  <div>GSTIN: {supplierGstin}</div>
                  <div className="text-[10px] text-slate-500">{supplierAddress}</div>
                </div>

                <div className="flex justify-between text-[10px] py-1 border-b border-dashed">
                  <span>BILL NO: {invoiceNumber}</span>
                  <span>DATE: {invoiceDate}</span>
                </div>

                <div className="space-y-1 py-1 border-b border-dashed">
                  {lines.map((l, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[170px]">{l.description} x{l.quantity}</span>
                      <span>{formatPaiseToRupees(l.totalPaise)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-1 space-y-1">
                  <div className="flex justify-between font-bold text-xs">
                    <span>GRAND TOTAL:</span>
                    <span>{formatPaiseToRupees(grandTotalPaise)}</span>
                  </div>
                </div>

                <div className="text-center text-[9px] text-slate-400 pt-3 border-t">
                  * OCR Document Source Attached *
                </div>
              </div>
            </div>

            <div className="p-2 bg-slate-100 border-t border-slate-200 text-center text-[11px] text-slate-500">
              File: {scan.fileName} ({(scan.fileSize / 1024).toFixed(0)} KB) • Original attached to record
            </div>
          </div>

          {/* RIGHT: Extracted Fields Review Form (cols 7) */}
          <div className="lg:col-span-7 p-5 overflow-y-auto space-y-4">
            
            {/* Arithmetic Guardrail Notification (PRD Section 6.3) */}
            {arithmeticCheck.explanation ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-rose-900">Arithmetic Discrepancy Flagged</strong>
                  <span>{arithmeticCheck.explanation}</span>
                  <p className="mt-1 text-rose-700">Please review line item prices or adjust the grand total manually before confirming.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Arithmetic check verified: Computed sum matches extracted total (<strong>{formatPaiseToRupees(grandTotalPaise)}</strong>).
                </span>
              </div>
            )}

            {/* Extracted Supplier Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Supplier / Vendor Details
                </h4>
                {renderConfidenceBadge(
                  scan.extraction.supplier.legalName.confidence, 
                  scan.extraction.supplier.legalName.isUncertain
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full text-xs font-medium rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Supplier GSTIN
                    </label>
                    {renderConfidenceBadge(
                      scan.extraction.supplier.gstin.confidence,
                      scan.extraction.supplier.gstin.isUncertain
                    )}
                  </div>
                  <input
                    type="text"
                    value={supplierGstin}
                    onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono uppercase rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Address
                  </label>
                  <input
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Extracted Bill Number & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Bill / Invoice #
                  </label>
                  {renderConfidenceBadge(scan.extraction.invoice.number.confidence)}
                </div>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Bill Date
                  </label>
                  {renderConfidenceBadge(
                    scan.extraction.invoice.date.confidence,
                    scan.extraction.invoice.date.isUncertain
                  )}
                </div>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Extracted Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Extracted Items ({lines.length})
                </label>
                <span className="text-[11px] text-slate-500">Edit quantities or rates directly</span>
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => {
                          const copy = [...lines];
                          copy[idx] = { ...copy[idx], description: e.target.value };
                          setLines(copy);
                        }}
                        className="w-full font-medium text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-teal-500 pb-0.5"
                      />
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>GST: {line.taxRate}%</span>
                        <span>•</span>
                        <span>Qty: {line.quantity}</span>
                        <span>•</span>
                        <span>Rate: {formatPaiseToRupees(line.unitPricePaise)}</span>
                      </div>
                    </div>

                    <div className="text-right font-bold text-slate-900">
                      {formatPaiseToRupees(line.totalPaise)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Total Check */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 block">Total Amount Extracted</span>
                <span className="text-xl font-bold text-teal-300">
                  {formatPaiseToRupees(grandTotalPaise)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Adjust if needed</span>
                <input
                  type="number"
                  step="0.01"
                  value={(grandTotalPaise / 100).toString()}
                  onChange={(e) => setGrandTotalPaise(Math.round((parseFloat(e.target.value) || 0) * 100))}
                  className="w-28 text-right bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Destination Selection (PRD Section 6.3 SCAN-03) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Destination in Books
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDestination('purchase_expense')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    destination === 'purchase_expense'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-teal-600 mb-1" />
                  <div>Purchase / Expense</div>
                  <span className="text-[10px] text-slate-500 font-normal">Adds to business expense records</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDestination('sales_archive')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    destination === 'sales_archive'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileCheck className="w-4 h-4 text-teal-600 mb-1" />
                  <div>Sales Record</div>
                  <span className="text-[10px] text-slate-500 font-normal">Issued invoice copy archive</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDestination('document_archive')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    destination === 'document_archive'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-teal-600 mb-1" />
                  <div>Document Archive</div>
                  <span className="text-[10px] text-slate-500 font-normal">Retain source only</span>
                </button>
              </div>

              {destination === 'purchase_expense' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expense Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  >
                    <option value="Inventory">Inventory / Resale Goods</option>
                    <option value="Office Supplies">Office & Stationery</option>
                    <option value="Utilities">Electricity & Utilities</option>
                    <option value="Rent">Rent & Facilities</option>
                    <option value="Software">Software & Cloud Services</option>
                    <option value="Travel">Travel & Fuel</option>
                    <option value="Logistics">Logistics & Courier</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Reviewed values will update your records with full audit trail.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Confirm & Save to Books
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
