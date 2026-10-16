import React, { useState, useRef } from 'react';
import { 
  Camera, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Clock, 
  ShieldCheck,
  Receipt,
  ScanLine,
  ArrowRight,
  Layers
} from 'lucide-react';
import { ScannedDocument, ExtractionResult, PurchaseExpense } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { SAMPLE_DOCUMENTS, processScannedDocument } from '../../services/ocrPipeline';
import { Language, translations } from '../../services/i18n';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DocumentReviewModal } from './DocumentReviewModal';

export interface ScanViewProps {
  scans: ScannedDocument[];
  currentLang: Language;
  onSaveScan: (scan: ScannedDocument) => void;
  onSaveExpense: (expense: PurchaseExpense) => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  scans,
  currentLang,
  onSaveScan,
  onSaveExpense,
}) => {
  const t = translations[currentLang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active review modal state
  const [selectedScanForReview, setSelectedScanForReview] = useState<ScannedDocument | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStep, setProcessingStep] = useState<string>('');

  // Camera simulation state
  const [showCameraMode, setShowCameraMode] = useState<boolean>(false);

  // Handle uploading custom file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const processedScan = await processScannedDocument(file, (progress, step) => {
        setProcessingProgress(progress);
        setProcessingStep(step);
      });
      onSaveScan(processedScan);
      setSelectedScanForReview(processedScan);
    } catch {
      alert('Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle loading preloaded sample test document
  const handleLoadSampleDocument = async (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    setIsProcessing(true);
    setProcessingProgress(25);
    setProcessingStep('Loading sample bill and running OCR...');

    await new Promise(r => setTimeout(r, 400));
    setProcessingProgress(70);
    setProcessingStep('Validating supplier GSTIN and arithmetic...');

    await new Promise(r => setTimeout(r, 300));
    setProcessingProgress(100);

    const sampleMap: Record<string, { url: string; fileName: string }> = {
      sample_metro: { url: '/sample-bills/metro_hardware.svg', fileName: 'metro_hardware_tax_invoice.svg' },
      sample_thermal: { url: '/sample-bills/sagar_thermal.svg', fileName: 'sagar_store_thermal_receipt.svg' },
      sample_saas: { url: '/sample-bills/cloudnet_saas.svg', fileName: 'cloudnet_saas_invoice.svg' },
      sample_mismatch: { url: '/sample-bills/capital_stationery.svg', fileName: 'capital_stationery_discrepancy.svg' },
    };

    const target = sampleMap[sample.id] || { url: `/sample-bills/${sample.id}.svg`, fileName: `${sample.id}_invoice.svg` };

    const newScan: ScannedDocument = {
      id: `scan_${Date.now()}_${sample.id}`,
      fileName: target.fileName,
      fileUrl: target.url,
      fileType: 'image/png',
      fileSize: 340000,
      uploadedAt: new Date().toISOString(),
      status: 'needs_review',
      extraction: sample.sampleData,
    };

    setIsProcessing(false);
    setProcessingProgress(0);
    onSaveScan(newScan);
    setSelectedScanForReview(newScan);
  };

  // Handle saving reviewed scan to books
  const handleSaveToBooks = (
    updatedScan: ScannedDocument, 
    destination: 'purchase_expense' | 'sales_archive' | 'document_archive',
    expenseRecord?: PurchaseExpense
  ) => {
    onSaveScan(updatedScan);
    if (expenseRecord) {
      onSaveExpense(expenseRecord);
    }
    setSelectedScanForReview(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{t.scanBill} (Scan-to-Books)</h1>
            <Badge variant="teal">AI-Assisted OCR</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn paper bills, thermal receipts and PDF invoices into verified records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<UploadCloud className="w-4 h-4 text-teal-600" />}
          >
            {t.upload}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCameraMode(true)}
            leftIcon={<Camera className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {t.openCamera}
          </Button>
        </div>
      </div>

      {/* Camera Capture Viewfinder Modal Simulation */}
      {showCameraMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-white px-2">
            <span className="text-xs font-semibold tracking-wider text-teal-400">CAMERA CAPTURE MODE</span>
            <button 
              onClick={() => setShowCameraMode(false)}
              className="px-3 py-1 bg-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          {/* Viewfinder frame */}
          <div className="relative flex-1 my-4 flex items-center justify-center">
            <div className="relative border-2 border-dashed border-teal-400/80 rounded-2xl w-full max-w-sm h-96 flex flex-col items-center justify-center bg-slate-900/60 p-4 text-center">
              <ScanLine className="w-12 h-12 text-teal-400 animate-pulse mb-3" />
              <p className="text-sm font-bold text-white">Align bill inside the frame</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Ensure good lighting, avoid glare, and keep all four corners visible.
              </p>
              
              <div className="absolute top-2 left-2 text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded">
                Edge detection active
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => {
                setShowCameraMode(false);
                handleLoadSampleDocument(SAMPLE_DOCUMENTS[0]);
              }}
              className="w-16 h-16 rounded-full bg-white border-4 border-teal-500 shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-teal-600" />
            </button>
            <span className="text-xs text-slate-400">Tap to capture document</span>
          </div>
        </div>
      )}

      {/* Processing Banner (PRD Section 4: "Never leave the user wondering whether the app is stuck") */}
      {isProcessing && (
        <Card className="p-6 bg-slate-900 text-white border-teal-500/50 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
              <span className="font-semibold text-white">{processingStep}</span>
            </div>
            <span className="font-mono font-bold text-teal-400">{processingProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-teal-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Processing layout analysis, extracting candidate supplier details, and verifying totals.
          </p>
        </Card>
      )}

      {/* 1-Click Interactive Test Bills (Section 13 QA Plan & Demonstration) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ready-to-Test Sample Bills (Instant OCR Trial)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Click any sample below to experience Scan-to-Books and human review:
            </p>
          </div>
          <Badge variant="teal">4 Scenarios Ready</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleLoadSampleDocument(doc)}
              className="p-4 bg-white border border-slate-200 hover:border-teal-500 hover:shadow-sm rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Receipt className="w-4 h-4" />
                  </div>
                  {doc.id === 'sample_mismatch' ? (
                    <Badge variant="rose">Mismatch Alert</Badge>
                  ) : doc.id === 'sample_thermal' ? (
                    <Badge variant="amber">Faded Ink</Badge>
                  ) : (
                    <Badge variant="emerald">High Confidence</Badge>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {doc.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {doc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
                <span>Test this bill</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scanned Documents Ledger / History */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Scanned Documents Repository ({scans.length})
            </h3>
            <p className="text-xs text-slate-500">
              Every scan retains its original file attachment linked to the ledger record
            </p>
          </div>
        </div>

        {scans.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <ScanLine className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No documents scanned yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload a bill or click one of the sample bills above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {scans.map((scan) => {
              const isNeedsReview = scan.status === 'needs_review';
              return (
                <div
                  key={scan.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {scan.extraction.supplier.legalName.value}
                        </span>
                        {scan.extraction.validation.arithmeticMismatch && (
                          <Badge variant="rose">Mismatch</Badge>
                        )}
                        {isNeedsReview ? (
                          <Badge variant="amber">Needs Review</Badge>
                        ) : (
                          <Badge variant="emerald">Reviewed & Saved</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Invoice: <strong>{scan.extraction.invoice.number.value}</strong></span>
                        <span>•</span>
                        <span>{scan.extraction.invoice.date.value}</span>
                        <span>•</span>
                        <span>GSTIN: {scan.extraction.supplier.gstin.value}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {formatPaiseToRupees(scan.extraction.totals.grandTotalPaise.value)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Confidence: {Math.round(scan.extraction.supplier.legalName.confidence * 100)}%
                      </div>
                    </div>

                    <Button
                      variant={isNeedsReview ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedScanForReview(scan)}
                      className={isNeedsReview ? 'bg-amber-600 hover:bg-amber-700 text-white text-xs' : 'text-xs'}
                    >
                      {isNeedsReview ? 'Review Now' : 'View Record'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Side-by-side Review Modal */}
      {selectedScanForReview && (
        <DocumentReviewModal
          scan={selectedScanForReview}
          onClose={() => setSelectedScanForReview(null)}
          onSaveToBooks={handleSaveToBooks}
        />
      )}

    </div>
  );
};
