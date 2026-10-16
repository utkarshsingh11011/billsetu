import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Sparkles, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Save, 
  Send, 
  ArrowLeft,
  RefreshCw,
  Info,
  BookOpen,
  X
} from 'lucide-react';
import { 
  Invoice, 
  InvoiceLine, 
  Party, 
  Item, 
  BusinessProfile, 
  Subscription 
} from '../../types';
import { INDIAN_STATES, getStateByCode } from '../../constants/states';
import { searchHsnSac, COMMON_HSN_SAC_CODES, HsnSacItem } from '../../constants/hsnCodes';
import { 
  calculateLineItem, 
  calculateInvoiceTotals, 
  formatPaiseToRupees, 
  paiseToWords,
  TaxEngineContext 
} from '../../services/taxEngine';
import { lookupGstin, validateGstinFormat } from '../../services/gstinService';
import { parseNaturalLanguageInvoiceDraft } from '../../services/aiDraftService';
import { Language, translations } from '../../services/i18n';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

export interface InvoiceFormProps {
  profile: BusinessProfile;
  savedParties: Party[];
  savedItems: Item[];
  subscription: Subscription;
  currentLang: Language;
  initialInvoice?: Invoice | null;
  onSaveDraft: (invoice: Invoice) => void;
  onIssueInvoice: (invoice: Invoice) => void;
  onPreview: (invoice: Invoice) => void;
  onCancel: () => void;
  onSaveParty?: (party: Party) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  profile,
  savedParties,
  savedItems,
  subscription,
  currentLang,
  initialInvoice,
  onSaveDraft,
  onIssueInvoice,
  onPreview,
  onCancel,
  onSaveParty,
}) => {
  const t = translations[currentLang];

  // Form State
  const [invoiceType, setInvoiceType] = useState<'gst_tax_invoice' | 'non_gst_bill'>(
    initialInvoice ? initialInvoice.type : (profile.isGstRegistered ? 'gst_tax_invoice' : 'non_gst_bill')
  );

  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice ? initialInvoice.invoiceNumber : `${profile.invoicePrefix}${profile.nextInvoiceSequence}`
  );
  
  const [invoiceDate, setInvoiceDate] = useState<string>(
    initialInvoice ? initialInvoice.invoiceDate : new Date().toISOString().split('T')[0]
  );
  
  const [dueDate, setDueDate] = useState<string>(
    initialInvoice ? initialInvoice.dueDate : new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  // Customer / Party State
  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    initialInvoice ? initialInvoice.party.id : (savedParties[0]?.id || '')
  );
  
  const [partyGstinInput, setPartyGstinInput] = useState<string>(
    initialInvoice ? initialInvoice.party.gstin || '' : (savedParties[0]?.gstin || '')
  );
  
  const [partyName, setPartyName] = useState<string>(
    initialInvoice ? initialInvoice.party.name : (savedParties[0]?.name || '')
  );
  
  const [partyTradeName, setPartyTradeName] = useState<string>(
    initialInvoice ? initialInvoice.party.tradeName || '' : (savedParties[0]?.tradeName || '')
  );
  
  const [partyAddress, setPartyAddress] = useState<string>(
    initialInvoice ? initialInvoice.party.address : (savedParties[0]?.address || '')
  );
  
  const [partyStateCode, setPartyStateCode] = useState<string>(
    initialInvoice ? initialInvoice.party.stateCode : (savedParties[0]?.stateCode || profile.stateCode)
  );

  const [partyLookupStatus, setPartyLookupStatus] = useState<Party['lookupStatus']>(
    initialInvoice ? initialInvoice.party.lookupStatus : (savedParties[0]?.lookupStatus || 'unverified_manual')
  );

  const [isLookingUpGstin, setIsLookingUpGstin] = useState<boolean>(false);
  const [gstinLookupMessage, setGstinLookupMessage] = useState<string>('');

  // Place of supply defaults to customer state
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState<string>(
    initialInvoice ? initialInvoice.placeOfSupplyStateCode : partyStateCode
  );

  // Line items state
  const [lines, setLines] = useState<InvoiceLine[]>(
    initialInvoice?.lines && initialInvoice.lines.length > 0
      ? initialInvoice.lines
      : [
          {
            id: 'line_1',
            description: '',
            hsnSac: '8471',
            quantity: 1,
            unit: 'pcs',
            unitPricePaise: 0,
            discountPercent: 0,
            discountPaise: 0,
            taxRate: 18,
            isTaxInclusive: false,
            taxableValuePaise: 0,
            cgstPaise: 0,
            sgstPaise: 0,
            igstPaise: 0,
            totalPaise: 0,
          }
        ]
  );

  const [notes, setNotes] = useState<string>(initialInvoice?.notes || '');
  const [terms, setTerms] = useState<string>(initialInvoice?.terms || profile.termsAndConditions);

  // Natural Language AI drafting prompt state (PRD 6.5)
  const [showAiDraftModal, setShowAiDraftModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string[]>([]);

  // HSN/SAC Directory picker state
  const [hsnModalLineIndex, setHsnModalLineIndex] = useState<number | null>(null);
  const [hsnSearchQuery, setHsnSearchQuery] = useState<string>('');

  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Context for tax calculation
  const taxContext: TaxEngineContext = {
    supplierStateCode: profile.stateCode,
    placeOfSupplyStateCode: placeOfSupplyCode,
    isGstInvoice: invoiceType === 'gst_tax_invoice',
  };

  const isInterState = profile.stateCode !== placeOfSupplyCode;

  // Whenever party selection changes from dropdown
  const handlePartySelect = (partyId: string) => {
    setSelectedPartyId(partyId);
    const found = savedParties.find(p => p.id === partyId);
    if (found) {
      setPartyName(found.name);
      setPartyTradeName(found.tradeName || '');
      setPartyGstinInput(found.gstin || '');
      setPartyAddress(found.address);
      setPartyStateCode(found.stateCode);
      setPlaceOfSupplyCode(found.stateCode);
      setPartyLookupStatus(found.lookupStatus);
      setGstinLookupMessage('');
    }
  };

  // Perform GSTIN lookup (PRD Section 6.4)
  const handleGstinLookup = async () => {
    if (!partyGstinInput) {
      setErrors(prev => ({ ...prev, gstin: 'Please enter a 15-character GSTIN' }));
      return;
    }

    setIsLookingUpGstin(true);
    setGstinLookupMessage('');
    setErrors(prev => ({ ...prev, gstin: '' }));

    try {
      const response = await lookupGstin(partyGstinInput);

      if (!response.isValidFormat) {
        setErrors(prev => ({ ...prev, gstin: response.formatError || 'Invalid GSTIN format' }));
        setPartyLookupStatus('error');
      } else if (response.data) {
        setPartyName(response.data.legalName);
        setPartyTradeName(response.data.tradeName);
        setPartyAddress(`${response.data.address}, ${response.data.city}`);
        setPartyStateCode(response.data.stateCode);
        setPlaceOfSupplyCode(response.data.stateCode);
        setPartyLookupStatus(response.status);
        setGstinLookupMessage(`${response.message} (Checked ${new Date(response.data.retrievedAt).toLocaleTimeString()})`);
      }
    } catch {
      setPartyLookupStatus('unverified_manual');
      setGstinLookupMessage('Lookup provider unavailable. Entry saved as unverified.');
    } finally {
      setIsLookingUpGstin(false);
    }
  };

  // Recalculate a line when inputs change
  const updateLine = (index: number, updates: Partial<InvoiceLine>) => {
    setLines(prev => {
      const copy = [...prev];
      const current = { ...copy[index], ...updates };
      const calculated = calculateLineItem(current, taxContext);
      copy[index] = {
        ...current,
        ...calculated,
      };
      return copy;
    });
  };

  // Re-run calculation for all lines when place of supply or invoice type changes
  useEffect(() => {
    setLines(prev =>
      prev.map(line => ({
        ...line,
        ...calculateLineItem(line, taxContext),
      }))
    );
  }, [placeOfSupplyCode, invoiceType]);

  const addLine = () => {
    const newLine: InvoiceLine = {
      id: `line_${Date.now()}`,
      description: '',
      hsnSac: '8471',
      quantity: 1,
      unit: 'pcs',
      unitPricePaise: 0,
      discountPercent: 0,
      discountPaise: 0,
      taxRate: invoiceType === 'gst_tax_invoice' ? 18 : 0,
      isTaxInclusive: false,
      taxableValuePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalPaise: 0,
    };
    setLines(prev => [...prev, newLine]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  // Catalog item picker
  const handleSelectCatalogItem = (index: number, itemId: string) => {
    const item = savedItems.find(i => i.id === itemId);
    if (!item) return;
    updateLine(index, {
      description: item.name,
      hsnSac: item.hsnSac,
      unit: item.unit,
      unitPricePaise: item.defaultPricePaise,
      taxRate: invoiceType === 'gst_tax_invoice' ? item.defaultTaxRate : 0,
    });
  };

  // HSN/SAC Directory selection
  const handleSelectHsn = (hsnItem: HsnSacItem) => {
    if (hsnModalLineIndex === null) return;
    const currentLine = lines[hsnModalLineIndex];
    updateLine(hsnModalLineIndex, {
      hsnSac: hsnItem.code,
      taxRate: invoiceType === 'gst_tax_invoice' ? hsnItem.defaultTaxRate : 0,
      unit: hsnItem.unit.toLowerCase(),
      description: currentLine.description.trim() ? currentLine.description : hsnItem.description,
    });
    setHsnModalLineIndex(null);
  };

  // AI draft handler (PRD 6.5)
  const handleApplyAiDraft = () => {
    if (!aiPrompt.trim()) return;

    const result = parseNaturalLanguageInvoiceDraft(aiPrompt, savedParties, taxContext);
    
    if (result.proposal.matchedPartyId) {
      handlePartySelect(result.proposal.matchedPartyId);
    } else if (result.proposal.partyNameQuery) {
      setPartyName(result.proposal.partyNameQuery);
      setPartyLookupStatus('unverified_manual');
    }

    if (result.calculatedLines.length > 0) {
      setLines(result.calculatedLines);
      setShowAiDraftModal(false);
      setAiPrompt('');
      setAiFeedback([]);
    } else {
      setAiFeedback(result.proposal.clarificationsNeeded);
    }
  };

  // Current totals computed by deterministic tax engine
  const totals = calculateInvoiceTotals(lines, taxContext);

  // Build the complete invoice object
  const buildCurrentInvoice = (status: Invoice['status']): Invoice => {
    const partyState = getStateByCode(partyStateCode)?.name || 'Maharashtra';
    const currentParty: Party = {
      id: selectedPartyId || `pty_${Date.now()}`,
      businessId: profile.id,
      type: 'customer',
      name: partyName || 'Unnamed Customer',
      tradeName: partyTradeName,
      gstin: partyGstinInput.trim() || undefined,
      address: partyAddress || 'Unspecified Address',
      city: profile.city,
      state: partyState,
      stateCode: partyStateCode,
      lookupStatus: partyLookupStatus,
      lastCheckedAt: new Date().toISOString(),
      balancePaise: totals.grandTotalPaise,
    };

    const placeOfSupplyName = getStateByCode(placeOfSupplyCode)?.name || partyState;

    return {
      id: initialInvoice ? initialInvoice.id : `inv_${Date.now()}`,
      businessId: profile.id,
      invoiceNumber,
      invoiceDate,
      dueDate,
      type: invoiceType,
      status,
      party: currentParty,
      placeOfSupplyState: placeOfSupplyName,
      placeOfSupplyStateCode: placeOfSupplyCode,
      isReverseCharge: false,
      lines,
      subtotalPaise: totals.subtotalPaise,
      totalDiscountPaise: totals.totalDiscountPaise,
      taxableValuePaise: totals.taxableValuePaise,
      cgstPaise: totals.cgstPaise,
      sgstPaise: totals.sgstPaise,
      igstPaise: totals.igstPaise,
      roundOffPaise: totals.roundOffPaise,
      grandTotalPaise: totals.grandTotalPaise,
      amountPaidPaise: initialInvoice?.amountPaidPaise || 0,
      balanceDuePaise: totals.grandTotalPaise - (initialInvoice?.amountPaidPaise || 0),
      notes,
      terms,
      issuedAt: status === 'issued' ? (initialInvoice?.issuedAt || new Date().toISOString()) : undefined,
      version: (initialInvoice?.version || 0) + 1,
      payments: initialInvoice?.payments || [],
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!partyName.trim()) {
      newErrors.partyName = 'Customer name is required';
    }
    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }
    if (lines.length === 0 || lines.every(l => !l.description.trim())) {
      newErrors.lines = 'At least one line item with description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (status: Invoice['status']) => {
    if (!validateForm()) return;
    const inv = buildCurrentInvoice(status);
    if (status === 'draft') {
      onSaveDraft(inv);
    } else {
      onIssueInvoice(inv);
    }
  };

  const handlePreviewClick = () => {
    if (!validateForm()) return;
    const inv = buildCurrentInvoice('draft');
    onPreview(inv);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="p-2">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {initialInvoice ? `Edit ${initialInvoice.invoiceNumber}` : t.createInvoice}
            </h1>
            <p className="text-xs text-slate-500">
              Deterministic GST calculation • Live printable preview
            </p>
          </div>
        </div>

        {/* Action Buttons: Preview, Save Draft, Issue */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewClick}
            leftIcon={<Eye className="w-4 h-4 text-slate-600" />}
          >
            {t.previewPdf}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            leftIcon={<Save className="w-4 h-4 text-slate-600" />}
          >
            {t.saveDraft}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave('issued')}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {t.issueInvoice}
          </Button>
        </div>
      </div>

      {/* AI Draft Banner (PRD Section 6.5) */}
      <div className="flex items-center justify-between bg-teal-50/70 border border-teal-200 rounded-xl p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-teal-950">
              AI Natural-Language Invoice Draft
            </h4>
            <p className="text-xs text-teal-800">
              Type or paste invoice details in plain words; BillSetu recalculates taxes safely.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAiDraftModal(true)}
          className="border-teal-300 text-teal-800 hover:bg-teal-100 text-xs shrink-0"
        >
          Draft with Words
        </Button>
      </div>

      {/* AI Drafting Modal */}
      {showAiDraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900">AI Invoice Draft Assistant</h3>
              </div>
              <button 
                onClick={() => setShowAiDraftModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-600">
              Describe your bill in plain English or Hindi. For example: <br />
              <em className="text-slate-800 font-medium">"Billed 3 Dell monitors at 15000 with 18% GST and 2 cables at 400 to Sharma Electricals"</em>
            </p>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. 10 hours IT consulting at 2500 and 1 cloud setup fee at 12000 to Apex Tech..."
              rows={4}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            {aiFeedback.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                {aiFeedback.map((fb, idx) => (
                  <p key={idx}>• {fb}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAiDraftModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplyAiDraft}>
                Generate Draft Lines
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HSN/SAC Code Finder Modal */}
      {hsnModalLineIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">HSN & SAC Code Directory</h3>
                  <p className="text-[11px] text-slate-500">Pick a verified GST code to autofill HSN, unit, and standard tax rate</p>
                </div>
              </div>
              <button
                onClick={() => setHsnModalLineIndex(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={hsnSearchQuery}
                  onChange={(e) => setHsnSearchQuery(e.target.value)}
                  placeholder="Search code or keywords (e.g. 8471, software, paper, cement, freight)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 space-y-1">
              {searchHsnSac(hsnSearchQuery).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching HSN/SAC codes found. You can enter any custom 4 to 8 digit code manually.
                </div>
              ) : (
                searchHsnSac(hsnSearchQuery).map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectHsn(item)}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {item.type.toUpperCase()}: {item.code}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{item.category}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                        {item.description}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-1 rounded bg-slate-900 text-white font-bold text-xs">
                        {item.defaultTaxRate}% GST
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1 uppercase">Unit: {item.unit}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setHsnModalLineIndex(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Meta Settings */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          {/* Invoice Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice Type
            </label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="gst_tax_invoice">GST Tax Invoice</option>
              <option value="non_gst_bill">Non-GST Bill of Supply</option>
            </select>
          </div>

          {/* Invoice Number */}
          <Input
            label="Invoice Number"
            required
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            error={errors.invoiceNumber}
          />

          {/* Invoice Date */}
          <Input
            label="Invoice Date"
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />

          {/* Due Date */}
          <Input
            label="Payment Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

        </div>
      </Card>

      {/* Customer & GSTIN Details Section (PRD Section 5 Workflow A & D) */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Customer Details (Billed To)
            </h3>
          </div>

          {/* Saved customer quick pick */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Pick saved:</span>
            <select
              value={selectedPartyId}
              onChange={(e) => handlePartySelect(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Choose existing customer --</option>
              {savedParties.filter(p => p.type === 'customer').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Customer GSTIN with Autofill */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Customer GSTIN (15 Chars)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={15}
                value={partyGstinInput}
                onChange={(e) => setPartyGstinInput(e.target.value.toUpperCase())}
                placeholder="e.g. 07AAACG0563M1ZP"
                className="w-full uppercase font-mono rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleGstinLookup}
                isLoading={isLookingUpGstin}
                title="Lookup customer details from GST portal"
                className="shrink-0 text-xs px-2.5"
              >
                Autofill
              </Button>
            </div>
            {errors.gstin && <p className="text-xs text-rose-600 font-medium">{errors.gstin}</p>}
            {gstinLookupMessage && (
              <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {gstinLookupMessage}
              </p>
            )}
          </div>

          {/* Customer Legal / Business Name */}
          <Input
            label="Customer Name / Business Name"
            required
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            error={errors.partyName}
          />

          {/* Place of Supply (Determines CGST+SGST vs IGST) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Place of Supply
              </label>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isInterState ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
              }`}>
                {isInterState ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'}
              </span>
            </div>
            <select
              value={placeOfSupplyCode}
              onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {INDIAN_STATES.map(s => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Customer Address & Verification Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="sm:col-span-2">
            <Input
              label="Billing Address"
              value={partyAddress}
              onChange={(e) => setPartyAddress(e.target.value)}
              placeholder="Building, Street, Area, Pincode"
            />
          </div>

          <div className="flex items-end pb-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Registry status:</span>
              {partyLookupStatus === 'verified_active' ? (
                <Badge variant="emerald">
                  <CheckCircle2 className="w-3 h-3" /> Active & Verified
                </Badge>
              ) : (
                <Badge variant="slate">
                  Unverified Manual Entry
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items Section (PRD Section 6.2) */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Line Items & Products
            </h3>
            <p className="text-xs text-slate-500">
              Decimal-safe calculations • Inclusive/Exclusive pricing
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addLine}
            leftIcon={<Plus className="w-4 h-4 text-teal-600" />}
            className="text-xs"
          >
            Add Line Item
          </Button>
        </div>

        {errors.lines && (
          <p className="text-xs text-rose-600 font-semibold">{errors.lines}</p>
        )}

        {/* Lines Table */}
        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div 
              key={line.id} 
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>Item Details</span>
                </span>

                {/* Quick Catalog Pick */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Choose catalog item:</span>
                  <select
                    onChange={(e) => handleSelectCatalogItem(idx, e.target.value)}
                    className="text-xs rounded border border-slate-300 bg-white px-2 py-0.5"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Saved Items --</option>
                    {savedItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatPaiseToRupees(item.defaultPricePaise)})
                      </option>
                    ))}
                  </select>
                  
                  {lines.length > 1 && (
                    <button
                      onClick={() => removeLine(idx)}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Line Inputs Grid */}
              <div className="grid grid-cols-12 gap-2.5 items-end">
                {/* Description */}
                <div className="col-span-12 sm:col-span-4">
                  <Input
                    label="Description"
                    placeholder="e.g. Dell 27 Monitor"
                    value={line.description}
                    onChange={(e) => updateLine(idx, { description: e.target.value })}
                  />
                </div>

                {/* HSN/SAC */}
                <div className="col-span-6 sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">HSN/SAC</label>
                    <button
                      type="button"
                      onClick={() => {
                        setHsnModalLineIndex(idx);
                        setHsnSearchQuery('');
                      }}
                      className="text-[10px] text-teal-600 hover:text-teal-800 font-bold flex items-center gap-0.5"
                      title="Search standard Indian GST HSN/SAC codes & tax rates"
                    >
                      <Search className="w-2.5 h-2.5" /> Finder
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="8471"
                    value={line.hsnSac}
                    onChange={(e) => updateLine(idx, { hsnSac: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                {/* Quantity & Unit */}
                <div className="col-span-6 sm:col-span-2 flex gap-1">
                  <div className="w-1/2">
                    <Input
                      label="Qty"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit</label>
                    <select
                      value={line.unit}
                      onChange={(e) => updateLine(idx, { unit: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-1.5 py-2.5 text-xs text-slate-900"
                    >
                      <option value="pcs">pcs</option>
                      <option value="box">box</option>
                      <option value="kg">kg</option>
                      <option value="hrs">hrs</option>
                      <option value="nos">nos</option>
                      <option value="set">set</option>
                    </select>
                  </div>
                </div>

                {/* Unit Price (Rupees) */}
                <div className="col-span-6 sm:col-span-2">
                  <Input
                    label="Rate (₹)"
                    type="number"
                    min={0}
                    step="0.01"
                    value={(line.unitPricePaise / 100).toString()}
                    onChange={(e) => updateLine(idx, { unitPricePaise: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                  />
                </div>

                {/* GST Rate (if GST invoice) */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    GST Rate
                  </label>
                  <select
                    disabled={invoiceType === 'non_gst_bill'}
                    value={line.taxRate}
                    onChange={(e) => updateLine(idx, { taxRate: parseInt(e.target.value, 10) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-900 disabled:bg-slate-100"
                  >
                    <option value={0}>0% (Nil)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              {/* Line Options: Tax Inclusive Checkbox & Line Calculation Breakdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={line.isTaxInclusive}
                      onChange={(e) => updateLine(idx, { isTaxInclusive: e.target.checked })}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Price includes GST (MRP)</span>
                  </label>

                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Discount:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={line.discountPercent || ''}
                      onChange={(e) => updateLine(idx, { discountPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 text-xs"
                    />
                    <span>%</span>
                  </div>
                </div>

                {/* Line Amount Preview */}
                <div className="flex items-center gap-3 font-medium">
                  <span className="text-slate-500">
                    Taxable: <strong className="text-slate-700">{formatPaiseToRupees(line.taxableValuePaise)}</strong>
                  </span>
                  {invoiceType === 'gst_tax_invoice' && (
                    <span className="text-slate-500">
                      Tax: <strong className="text-slate-700">{formatPaiseToRupees(line.cgstPaise + line.sgstPaise + line.igstPaise)}</strong>
                    </span>
                  )}
                  <span className="text-slate-900 font-bold">
                    Total: <strong className="text-teal-700">{formatPaiseToRupees(line.totalPaise)}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tax Breakdown & Invoice Totals (PRD Section 6.2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left: Notes & Bank info */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Notes & Payment Terms
            </h4>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for customer (e.g. Thanks for your business!)"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Terms and conditions..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </Card>

          <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong>Bank Details on Invoice:</strong> {profile.bankDetails.bankName}, A/C: {profile.bankDetails.accountNo}, IFSC: {profile.bankDetails.ifsc}, UPI: {profile.bankDetails.upiId}
            </div>
          </div>
        </div>

        {/* Right: Transparent Deterministic Tax Engine Breakdown */}
        <Card className="p-5 space-y-3 bg-white border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
            Tax Engine Calculation Summary
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Gross)</span>
              <span>{formatPaiseToRupees(totals.subtotalPaise)}</span>
            </div>

            {totals.totalDiscountPaise > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discounts</span>
                <span>-{formatPaiseToRupees(totals.totalDiscountPaise)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-800 font-semibold border-t pt-2">
              <span>Taxable Value</span>
              <span>{formatPaiseToRupees(totals.taxableValuePaise)}</span>
            </div>

            {/* GST Breakdown */}
            {invoiceType === 'gst_tax_invoice' && (
              <div className="bg-slate-50 p-2.5 rounded-lg space-y-1.5 text-xs text-slate-700">
                {isInterState ? (
                  <div className="flex justify-between font-medium">
                    <span>Integrated GST (IGST)</span>
                    <span>{formatPaiseToRupees(totals.igstPaise)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Central GST (CGST)</span>
                      <span>{formatPaiseToRupees(totals.cgstPaise)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>State GST (SGST)</span>
                      <span>{formatPaiseToRupees(totals.sgstPaise)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-semibold border-t border-slate-200 pt-1 text-slate-900">
                  <span>Total Tax</span>
                  <span>{formatPaiseToRupees(totals.totalTaxPaise)}</span>
                </div>
              </div>
            )}

            {totals.roundOffPaise !== 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Round-off</span>
                <span>{totals.roundOffPaise > 0 ? '+' : ''}{formatPaiseToRupees(totals.roundOffPaise)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-900 pt-3">
              <span>Grand Total</span>
              <span className="text-teal-700">{formatPaiseToRupees(totals.grandTotalPaise)}</span>
            </div>

            {/* Amount in words */}
            <div className="bg-teal-50/60 p-2.5 rounded-lg text-xs text-teal-900 italic">
              <strong>Amount in Words:</strong> {paiseToWords(totals.grandTotalPaise)}
            </div>
          </div>

          {/* Bottom Action Area on Mobile & Web */}
          <div className="pt-4 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={handlePreviewClick}
              className="w-full sm:w-1/2"
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Preview PDF
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSave('issued')}
              className="w-full sm:w-1/2 bg-teal-600 hover:bg-teal-700"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Issue Invoice
            </Button>
          </div>
        </Card>

      </div>

    </div>
  );
};
