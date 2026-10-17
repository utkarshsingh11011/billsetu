import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Save, 
  Send, 
  ArrowLeft, 
  Car, 
  Navigation, 
  Gauge, 
  DollarSign, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react';
import { 
  Invoice, 
  InvoiceLine, 
  Party, 
  Item, 
  BusinessProfile, 
  Subscription,
  TripDutySlip,
  BillingType,
  TaxMode
} from '../../types';
import { INDIAN_STATES, getStateByCode } from '../../constants/states';
import { searchHsnSac, COMMON_HSN_SAC_CODES, HsnSacItem } from '../../constants/hsnCodes';
import { 
  calculateLineItem, 
  calculateInvoiceTotals, 
  formatPaiseToRupees, 
  paiseToWords,
  STANDARD_TRAVEL_GST_RATES,
  TaxEngineContext 
} from '../../services/taxEngine';
import { lookupGstin, validateGstinFormat } from '../../services/gstinService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

export interface InvoiceFormProps {
  profile: BusinessProfile;
  savedParties: Party[];
  savedItems: Item[];
  subscription: Subscription;
  currentLang: string;
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
  initialInvoice,
  onSaveDraft,
  onIssueInvoice,
  onPreview,
  onCancel,
  onSaveParty,
}) => {
  // Billing Type & Basic Details
  const [billingType, setBillingType] = useState<BillingType>(
    initialInvoice?.billingType || 'b2b_corporate'
  );
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
    initialInvoice ? initialInvoice.dueDate : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  // Customer / Party Details
  const [partyName, setPartyName] = useState<string>(initialInvoice?.party?.name || '');
  const [partyTradeName, setPartyTradeName] = useState<string>(initialInvoice?.party?.tradeName || '');
  const [partyGstin, setPartyGstin] = useState<string>(initialInvoice?.party?.gstin || '');
  const [contactPerson, setContactPerson] = useState<string>(initialInvoice?.party?.contactPerson || '');
  const [partyPhone, setPartyPhone] = useState<string>(initialInvoice?.party?.phone || '');
  const [partyEmail, setPartyEmail] = useState<string>(initialInvoice?.party?.email || '');
  const [partyAddress, setPartyAddress] = useState<string>(initialInvoice?.party?.address || '');
  const [partyCity, setPartyCity] = useState<string>(initialInvoice?.party?.city || profile.city || '');
  const [partyStateCode, setPartyStateCode] = useState<string>(initialInvoice?.party?.stateCode || profile.stateCode || '09');
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState<string>(
    initialInvoice?.placeOfSupplyStateCode || profile.stateCode || '09'
  );
  const [isLookingUpGstin, setIsLookingUpGstin] = useState<boolean>(false);
  const [gstinLookupFeedback, setGstinLookupFeedback] = useState<string | null>(null);

  // Taxi & Trip Duty Slip Details
  const [showDutySlipDetails, setShowDutySlipDetails] = useState<boolean>(true);
  const [vehicleNumber, setVehicleNumber] = useState<string>(initialInvoice?.tripDetails?.vehicleNumber || '');
  const [vehicleCategory, setVehicleCategory] = useState<TripDutySlip['vehicleCategory']>(
    initialInvoice?.tripDetails?.vehicleCategory || 'SUV / Innova'
  );
  const [driverName, setDriverName] = useState<string>(initialInvoice?.tripDetails?.driverName || '');
  const [driverPhone, setDriverPhone] = useState<string>(initialInvoice?.tripDetails?.driverPhone || '');
  const [routeOrDuty, setRouteOrDuty] = useState<string>(
    initialInvoice?.tripDetails?.routeOrDuty || 'Varanasi Airport to Hotel / Kashi Darshan (8Hr/80Km)'
  );
  const [tripStartDate, setTripStartDate] = useState<string>(
    initialInvoice?.tripDetails?.tripStartDate || `${new Date().toISOString().split('T')[0]} 08:00 AM`
  );
  const [tripEndDate, setTripEndDate] = useState<string>(
    initialInvoice?.tripDetails?.tripEndDate || `${new Date().toISOString().split('T')[0]} 06:30 PM`
  );
  const [openingKm, setOpeningKm] = useState<number | undefined>(initialInvoice?.tripDetails?.openingKm);
  const [closingKm, setClosingKm] = useState<number | undefined>(initialInvoice?.tripDetails?.closingKm);
  const [extraHours, setExtraHours] = useState<number | undefined>(initialInvoice?.tripDetails?.extraHours);
  const [extraHourRateRupees, setExtraHourRateRupees] = useState<number>(
    initialInvoice?.tripDetails?.extraHourRatePaise ? initialInvoice.tripDetails.extraHourRatePaise / 100 : 200
  );
  const [nightHaltRupees, setNightHaltRupees] = useState<number>(
    initialInvoice?.tripDetails?.nightHaltChargesPaise ? initialInvoice.tripDetails.nightHaltChargesPaise / 100 : 0
  );

  // Pure Agent Non-Taxable Reimbursements
  const [tollTaxRupees, setTollTaxRupees] = useState<number>(
    initialInvoice?.tripDetails?.tollTaxPaise ? initialInvoice.tripDetails.tollTaxPaise / 100 : 0
  );
  const [statePermitRupees, setStatePermitRupees] = useState<number>(
    initialInvoice?.tripDetails?.statePermitPaise ? initialInvoice.tripDetails.statePermitPaise / 100 : 0
  );
  const [parkingChargesRupees, setParkingChargesRupees] = useState<number>(
    initialInvoice?.tripDetails?.parkingChargesPaise ? initialInvoice.tripDetails.parkingChargesPaise / 100 : 0
  );
  const [taxReimbursements, setTaxReimbursements] = useState<boolean>(
    initialInvoice?.tripDetails?.taxReimbursements || false
  );

  // Tax Controls
  const [isReverseCharge, setIsReverseCharge] = useState<boolean>(initialInvoice?.isReverseCharge || false);
  const [globalTaxMode, setGlobalTaxMode] = useState<TaxMode>(initialInvoice?.taxMode || 'exclusive');

  // Line Items
  const defaultLine: InvoiceLine = {
    id: `line_${Date.now()}`,
    description: 'Innova Crysta AC Cab Rental - 8 Hours / 80 Km Package',
    hsnSac: '996412',
    quantity: 1,
    unit: 'days',
    unitPricePaise: 320000, // ₹3,200.00
    discountPercent: 0,
    discountPaise: 0,
    taxRate: 5,
    isTaxInclusive: false,
    taxableValuePaise: 320000,
    cgstPaise: 8000,
    sgstPaise: 8000,
    igstPaise: 0,
    totalPaise: 336000,
  };

  const [lines, setLines] = useState<InvoiceLine[]>(
    initialInvoice?.lines?.length ? initialInvoice.lines : [defaultLine]
  );
  const [notes, setNotes] = useState<string>(initialInvoice?.notes || '');
  const [terms, setTerms] = useState<string>(initialInvoice?.terms || profile.termsAndConditions);

  // HSN Picker drawer state
  const [isHsnPickerOpen, setIsHsnPickerOpen] = useState<boolean>(false);
  const [activeLineIndexForHsn, setActiveLineIndexForHsn] = useState<number>(0);
  const [hsnSearchTerm, setHsnSearchTerm] = useState<string>('');

  // Total KM computation
  const totalKm = (openingKm !== undefined && closingKm !== undefined && closingKm >= openingKm)
    ? closingKm - openingKm
    : undefined;

  // Total Reimbursements in Paise
  const totalReimbursementsPaise = Math.round(
    ((tollTaxRupees || 0) + (statePermitRupees || 0) + (parkingChargesRupees || 0)) * 100
  );

  // Recalculate line items whenever context changes
  const taxContext: TaxEngineContext = {
    supplierStateCode: profile.stateCode || '09',
    placeOfSupplyStateCode,
    isGstInvoice: invoiceType === 'gst_tax_invoice',
    isReverseCharge,
  };

  const calculatedLines = lines.map(line => {
    const calc = calculateLineItem(line, taxContext);
    return {
      ...line,
      ...calc,
    };
  });

  const totals = calculateInvoiceTotals(calculatedLines, taxContext, totalReimbursementsPaise);

  // Handle GSTIN Lookup for B2B Client
  const handleClientGstinLookup = async () => {
    const code = partyGstin.trim().toUpperCase();
    if (!code) return;

    const validation = validateGstinFormat(code);
    if (!validation.isValidFormat) {
      setGstinLookupFeedback(validation.formatError || 'Invalid 15-digit GSTIN');
      return;
    }

    if (validation.stateInfo) {
      setPartyStateCode(validation.stateInfo.code);
      setPlaceOfSupplyStateCode(validation.stateInfo.code);
    }

    setIsLookingUpGstin(true);
    setGstinLookupFeedback(null);

    try {
      const res = await lookupGstin(code);
      if (res.status === 'verified_active' && res.data) {
        setPartyName(res.data.legalName);
        setPartyTradeName(res.data.tradeName || res.data.legalName);
        setPartyAddress(res.data.address);
        setPartyCity(res.data.city);
        setPartyStateCode(res.data.stateCode);
        setPlaceOfSupplyStateCode(res.data.stateCode);
        setGstinLookupFeedback(`Verified: ${res.data.legalName} (${res.data.state})`);
      } else {
        setGstinLookupFeedback('Format verified. Please confirm company name and address.');
      }
    } catch {
      setGstinLookupFeedback('Live check unavailable. Please enter details manually.');
    } finally {
      setIsLookingUpGstin(false);
    }
  };

  // Quick Preset Handlers
  const applyTaxiPreset = (presetType: 'airport' | 'airport_transfer' | 'local_8_80' | 'outstation' | 'b2b_monthly') => {
    if (presetType === 'airport' || presetType === 'airport_transfer') {
      setRouteOrDuty('Airport Transfer (Pickup / Drop)');
      setLines([
        {
          id: `line_${Date.now()}`,
          description: 'Airport Transfer Package (Sedan AC - One Way)',
          hsnSac: '996411',
          quantity: 1,
          unit: 'trips',
          unitPricePaise: 120000,
          discountPercent: 0,
          discountPaise: 0,
          taxRate: 5,
          isTaxInclusive: false,
          taxableValuePaise: 120000,
          cgstPaise: 3000,
          sgstPaise: 3000,
          igstPaise: 0,
          totalPaise: 126000,
        }
      ]);
    } else if (presetType === 'local_8_80') {
      setRouteOrDuty('City Sightseeing & Temple Tour (8 Hours / 80 Km)');
      setLines([
        {
          id: `line_${Date.now()}`,
          description: 'Local 8 Hours / 80 Km Package (Innova AC)',
          hsnSac: '996412',
          quantity: 1,
          unit: 'days',
          unitPricePaise: 300000,
          discountPercent: 0,
          discountPaise: 0,
          taxRate: 5,
          isTaxInclusive: false,
          taxableValuePaise: 300000,
          cgstPaise: 7500,
          sgstPaise: 7500,
          igstPaise: 0,
          totalPaise: 315000,
        }
      ]);
    } else if (presetType === 'outstation') {
      setRouteOrDuty('Outstation Round Trip (Min. 250 Km/Day)');
      setLines([
        {
          id: `line_${Date.now()}`,
          description: 'Outstation Travel Rate (Per Kilometer)',
          hsnSac: '996421',
          quantity: 320,
          unit: 'km',
          unitPricePaise: 1500, // ₹15/km
          discountPercent: 0,
          discountPaise: 0,
          taxRate: 5,
          isTaxInclusive: false,
          taxableValuePaise: 480000,
          cgstPaise: 12000,
          sgstPaise: 12000,
          igstPaise: 0,
          totalPaise: 504000,
        }
      ]);
      setNightHaltRupees(300);
    } else if (presetType === 'b2b_monthly') {
      setRouteOrDuty('Dedicated Monthly Executive Cab Rental');
      setLines([
        {
          id: `line_${Date.now()}`,
          description: 'Monthly Corporate Cab Contract (With Driver & Maintenance)',
          hsnSac: '996601',
          quantity: 1,
          unit: 'months',
          unitPricePaise: 5500000, // ₹55,000
          discountPercent: 0,
          discountPaise: 0,
          taxRate: 18,
          isTaxInclusive: false,
          taxableValuePaise: 5500000,
          cgstPaise: 495000,
          sgstPaise: 495000,
          igstPaise: 0,
          totalPaise: 6490000,
        }
      ]);
    }
  };
  const applyPreset = applyTaxiPreset;

  // Line manipulation
  const updateLine = (idx: number, patch: Partial<InvoiceLine>) => {
    const copy = [...lines];
    copy[idx] = { ...copy[idx], ...patch };
    setLines(copy);
  };

  const addEmptyLine = () => {
    setLines([
      ...lines,
      {
        id: `line_${Date.now()}`,
        description: 'Taxi Service / Extra Kilometers',
        hsnSac: '996412',
        quantity: 1,
        unit: 'km',
        unitPricePaise: 1600,
        discountPercent: 0,
        discountPaise: 0,
        taxRate: 5,
        isTaxInclusive: globalTaxMode === 'inclusive',
        taxableValuePaise: 1600,
        cgstPaise: 40,
        sgstPaise: 40,
        igstPaise: 0,
        totalPaise: 1680,
      }
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  // Assemble the invoice entity
  const assembleInvoiceEntity = (status: Invoice['status']): Invoice => {
    const selectedState = INDIAN_STATES.find(s => s.code === placeOfSupplyStateCode);
    
    const partyObj: Party = {
      id: initialInvoice?.party?.id || `pty_${Date.now()}`,
      businessId: profile.id,
      type: 'customer',
      category: billingType === 'b2b_corporate' ? 'corporate_client' : 'individual_passenger',
      name: partyName.trim() || (billingType === 'b2b_corporate' ? 'Corporate Client' : 'Passenger Walk-in'),
      tradeName: partyTradeName.trim(),
      gstin: billingType === 'b2b_corporate' ? partyGstin.trim().toUpperCase() : '',
      contactPerson: contactPerson.trim(),
      phone: partyPhone.trim(),
      email: partyEmail.trim(),
      address: partyAddress.trim(),
      city: partyCity.trim(),
      state: selectedState?.name || 'Uttar Pradesh',
      stateCode: placeOfSupplyStateCode,
      lookupStatus: partyGstin.length === 15 ? 'verified_active' : 'unverified_manual',
      balancePaise: 0,
    };

    const tripDetails: TripDutySlip = {
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleCategory,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      routeOrDuty: routeOrDuty.trim(),
      tripStartDate,
      tripEndDate,
      openingKm,
      closingKm,
      totalKm,
      extraHours,
      extraHourRatePaise: Math.round((extraHourRateRupees || 0) * 100),
      nightHaltChargesPaise: Math.round((nightHaltRupees || 0) * 100),
      tollTaxPaise: Math.round((tollTaxRupees || 0) * 100),
      statePermitPaise: Math.round((statePermitRupees || 0) * 100),
      parkingChargesPaise: Math.round((parkingChargesRupees || 0) * 100),
      taxReimbursements,
      totalReimbursementsPaise,
    };

    return {
      id: initialInvoice?.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: profile.id,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      type: invoiceType,
      billingType,
      status,
      party: partyObj,
      placeOfSupplyState: selectedState?.name || 'Uttar Pradesh',
      placeOfSupplyStateCode,
      isReverseCharge,
      taxMode: globalTaxMode,
      tripDetails,
      lines: calculatedLines,
      subtotalPaise: totals.subtotalPaise,
      totalDiscountPaise: totals.totalDiscountPaise,
      taxableValuePaise: totals.taxableValuePaise,
      cgstPaise: totals.cgstPaise,
      sgstPaise: totals.sgstPaise,
      igstPaise: totals.igstPaise,
      totalReimbursementsPaise,
      roundOffPaise: totals.roundOffPaise,
      grandTotalPaise: totals.grandTotalPaise,
      amountPaidPaise: initialInvoice?.amountPaidPaise || 0,
      balanceDuePaise: totals.grandTotalPaise - (initialInvoice?.amountPaidPaise || 0),
      notes: notes.trim(),
      terms: terms.trim(),
      issuedAt: status === 'issued' ? (initialInvoice?.issuedAt || new Date().toISOString()) : undefined,
      version: (initialInvoice?.version || 0) + 1,
      payments: initialInvoice?.payments || [],
      shareableId: initialInvoice?.shareableId || `bill_${Date.now().toString(36)}`,
    };
  };

  const handlePreviewClick = () => {
    const inv = assembleInvoiceEntity('draft');
    onPreview(inv);
  };

  const handleDraftClick = () => {
    const inv = assembleInvoiceEntity('draft');
    onSaveDraft(inv);
  };

  const handleIssueClick = () => {
    if (!partyName.trim()) {
      alert('Please enter client or passenger name.');
      return;
    }
    const inv = assembleInvoiceEntity('issued');
    onIssueInvoice(inv);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            leftIcon={<ArrowLeft className="w-4 h-4 text-slate-600" />}
            className="text-slate-600 hover:text-slate-900"
          >
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{initialInvoice ? 'Edit Duty Slip / Invoice' : 'Create Taxi & Fleet Invoice'}</span>
              <Badge variant="teal" size="sm" className="bg-[#19B0A0]/20 text-[#0E8478] border border-[#19B0A0]/40 font-semibold">
                SAC 9964
              </Badge>
            </h1>
            <p className="text-xs text-slate-500">
              Generate an official GST tax invoice or passenger receipt in under 20 seconds.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDraftClick}
            leftIcon={<Save className="w-4 h-4 text-slate-600" />}
            className="bg-white border-slate-300 text-slate-700 font-medium"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePreviewClick}
            leftIcon={<Eye className="w-4 h-4 text-[#0C2B62]" />}
            className="bg-slate-100 border-slate-300 text-[#0C2B62] font-semibold"
          >
            Preview A4
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleIssueClick}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-[#19B0A0] hover:bg-[#0E8478] text-white font-bold shadow-xs px-4"
          >
            Issue & Share Bill
          </Button>
        </div>
      </div>

      {/* Quick Travel Duty Presets Bar */}
      <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-[#19B0A0]" />
          <span>Quick Taxi Duty Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyTaxiPreset('airport')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>✈️ Airport Drop</span>
          </button>
          <button
            type="button"
            onClick={() => applyTaxiPreset('local_8_80')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>⏱️ 8Hr / 80Km Tour</span>
          </button>
          <button
            type="button"
            onClick={() => applyTaxiPreset('outstation')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>🛣️ Outstation (Per KM)</span>
          </button>
          <button
            type="button"
            onClick={() => applyTaxiPreset('b2b_monthly')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>🏢 Corporate Monthly</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT TWO COLUMNS: FORM CONTROLS */}
        <div className="lg:col-span-2 space-y-6">

          {/* ⚡ Quick 1-Click Trip Presets Bar */}
          <div className="bg-gradient-to-r from-[#0C2B62] to-[#17396E] rounded-2xl p-4 text-white shadow-sm border border-[#1d437e]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#19B0A0]" />
                <span>Quick Trip Presets (1-Click Package Auto-Fill)</span>
              </div>
              <span className="text-[11px] text-slate-300 hidden sm:inline">Tap to auto-fill trip rates & SAC codes</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => applyPreset('airport_transfer')}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all active:scale-[0.98] flex items-center gap-2.5 group cursor-pointer"
              >
                <span className="text-xl">🛫</span>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#19B0A0] transition-colors leading-tight">Airport Transfer</div>
                  <div className="text-[10px] text-teal-200/90 font-mono mt-0.5">₹1,200 • SAC 996411</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('local_8_80')}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all active:scale-[0.98] flex items-center gap-2.5 group cursor-pointer"
              >
                <span className="text-xl">🛕</span>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#19B0A0] transition-colors leading-tight">Local 8Hr / 80Km</div>
                  <div className="text-[10px] text-teal-200/90 font-mono mt-0.5">₹3,000 • SAC 996412</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('outstation')}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all active:scale-[0.98] flex items-center gap-2.5 group cursor-pointer"
              >
                <span className="text-xl">🚗</span>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#19B0A0] transition-colors leading-tight">Outstation Tour</div>
                  <div className="text-[10px] text-teal-200/90 font-mono mt-0.5">₹15/Km • SAC 996421</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('b2b_monthly')}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all active:scale-[0.98] flex items-center gap-2.5 group cursor-pointer"
              >
                <span className="text-xl">💼</span>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#19B0A0] transition-colors leading-tight">Corporate Monthly</div>
                  <div className="text-[10px] text-teal-200/90 font-mono mt-0.5">₹55,000 • SAC 996601</div>
                </div>
              </button>
            </div>
          </div>

          {/* 1. INVOICE META & BILLING TYPE */}
          <Card className="p-5 border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              {/* B2B vs B2C Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setBillingType('b2b_corporate')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    billingType === 'b2b_corporate' 
                      ? 'bg-[#0C2B62] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Corporate B2B Client
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingType('b2c_passenger');
                    setPartyGstin('');
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    billingType === 'b2c_passenger' 
                      ? 'bg-[#0C2B62] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Individual Passenger (B2C)
                </button>
              </div>

              {/* Invoice Type */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Document:</span>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as any)}
                  className="px-2.5 py-1 rounded-md border border-slate-300 font-semibold text-slate-800 bg-white"
                >
                  <option value="gst_tax_invoice">GST Tax Invoice</option>
                  <option value="non_gst_bill">Non-GST Bill of Supply</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Invoice Number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="font-mono font-bold text-slate-800"
                required
              />
              <Input
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
              <Input
                label="Payment Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </Card>

          {/* 2. CUSTOMER / CORPORATE CLIENT DETAILS */}
          <Card className="p-5 border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#0C2B62]" />
                <span>{billingType === 'b2b_corporate' ? 'Corporate Client / Company Details' : 'Passenger / Guest Details'}</span>
              </h3>
              {savedParties.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Saved:</span>
                  <select
                    onChange={(e) => {
                      const p = savedParties.find(sp => sp.id === e.target.value);
                      if (p) {
                        setPartyName(p.name);
                        setPartyTradeName(p.tradeName || '');
                        setPartyGstin(p.gstin || '');
                        setPartyPhone(p.phone || '');
                        setPartyEmail(p.email || '');
                        setPartyAddress(p.address || '');
                        setPartyCity(p.city || '');
                        setPartyStateCode(p.stateCode || '09');
                        setPlaceOfSupplyStateCode(p.stateCode || '09');
                      }
                    }}
                    className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="">Select saved party...</option>
                    {savedParties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.gstin ? `(${p.gstin})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {billingType === 'b2b_corporate' && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      label="Client 15-Digit GSTIN (Auto-Fill Name & Address)"
                      placeholder="e.g. 09AABCV4920K1ZX"
                      value={partyGstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setPartyGstin(val);
                        if (val.length === 15) {
                          handleClientGstinLookup();
                        }
                      }}
                      className="font-mono uppercase text-xs tracking-wider bg-white"
                    />
                  </div>
                  <div className="sm:self-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleClientGstinLookup}
                      disabled={isLookingUpGstin || partyGstin.length !== 15}
                      className="h-10 bg-white border border-slate-300 font-semibold"
                    >
                      {isLookingUpGstin ? 'Verifying...' : 'Auto-Fetch'}
                    </Button>
                  </div>
                </div>

                {gstinLookupFeedback && (
                  <p className="text-xs text-[#0E8478] font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{gstinLookupFeedback}</span>
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={billingType === 'b2b_corporate' ? 'Company Name / Recipient Legal Name' : 'Passenger / Booked By Name'}
                placeholder="e.g. Varanasi Textiles & Exports or Arvind Gupta"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
              />
              <Input
                label="Passenger / Contact Phone (For WhatsApp dispatch)"
                placeholder="e.g. +91 98391 99887"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Billing Address / Hotel / Office Location"
                  placeholder="e.g. Plot 18, Industrial Area, Shivpur, Varanasi"
                  value={partyAddress}
                  onChange={(e) => setPartyAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Place of Supply (State)</label>
                <select
                  value={placeOfSupplyStateCode}
                  onChange={(e) => setPlaceOfSupplyStateCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#19B0A0]"
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name} {s.code === profile.stateCode ? '(Intra-State: CGST+SGST)' : '(Inter-State: IGST)'}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Email Address (Optional)"
                placeholder="e.g. travel@client.in"
                value={partyEmail}
                onChange={(e) => setPartyEmail(e.target.value)}
              />
            </div>
          </Card>

          {/* 3. TAXI & TRAVEL DUTY SLIP DETAILS (CORE VALUE-ADD) */}
          <Card className="p-5 border-slate-200 space-y-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowDutySlipDetails(!showDutySlipDetails)}
            >
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-[#19B0A0]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Taxi & Travel Duty Slip Details
                </h3>
                <Badge variant="teal" size="sm" className="bg-[#19B0A0]/10 text-[#0E8478] font-mono text-[10px]">
                  Vehicle & Meter
                </Badge>
              </div>
              <button type="button" className="text-slate-400 hover:text-slate-600">
                {showDutySlipDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {showDutySlipDetails && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="Vehicle Registration Number"
                      placeholder="e.g. UP65-BT-4582"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="font-mono uppercase font-bold text-sm tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Category</label>
                    <select
                      value={vehicleCategory}
                      onChange={(e) => setVehicleCategory(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                    >
                      <option value="Sedan">Sedan (Dzire / Etios / Aura)</option>
                      <option value="SUV / Innova">SUV (Innova / Ertiga / Carens)</option>
                      <option value="Innova Crysta">Premium SUV (Innova Crysta)</option>
                      <option value="Tempo Traveller">Tempo Traveller (12/17/26 Seater)</option>
                      <option value="Luxury Coach">Luxury Coach / Bus</option>
                      <option value="Hatchback">Hatchback (WagonR / Swift)</option>
                      <option value="Other">Other Commercial Vehicle</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      label="Driver Name & Contact"
                      placeholder="e.g. Suraj Pandey (9450011223)"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Pickup & Drop Route / Duty Description"
                      placeholder="e.g. Varanasi Airport to Cantt Hotel / Kashi Darshan Local (8Hr/80Km)"
                      value={routeOrDuty}
                      onChange={(e) => setRouteOrDuty(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Duty Period (Start - End Time)"
                      placeholder="e.g. 08:00 AM - 06:30 PM"
                      value={tripStartDate}
                      onChange={(e) => setTripStartDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* KM Meter Calculation Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-800">
                    <Gauge className="w-4 h-4 text-[#0C2B62]" />
                    <span>Odometer & Distance Log (Garage-to-Garage)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                      label="Opening KM"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 42100"
                      value={openingKm !== undefined ? openingKm : ''}
                      onChange={(e) => setOpeningKm(e.target.value ? Number(e.target.value) : undefined)}
                      className="font-mono text-xs"
                    />
                    <Input
                      label="Closing KM"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 42195"
                      value={closingKm !== undefined ? closingKm : ''}
                      onChange={(e) => setClosingKm(e.target.value ? Number(e.target.value) : undefined)}
                      className="font-mono text-xs"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Duty KM</label>
                      <div className="h-10 px-3 bg-white border border-slate-300 rounded-lg flex items-center font-mono font-bold text-sm text-[#0C2B62]">
                        {totalKm !== undefined ? `${totalKm} KM` : '--'}
                      </div>
                    </div>
                    <Input
                      label="Night Allowance (₹)"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 300"
                      value={nightHaltRupees || ''}
                      onChange={(e) => setNightHaltRupees(Number(e.target.value))}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Visual Odometer Gauge Indicator */}
                  {(openingKm || closingKm) && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Meter Run:</span>
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {openingKm ? `${openingKm.toLocaleString()} KM` : 'Opening --'}
                        </span>
                        <span className="text-[#19B0A0] font-bold">──▶</span>
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {closingKm ? `${closingKm.toLocaleString()} KM` : 'Closing --'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">Distance Recorded:</span>
                        <span className="font-mono font-extrabold text-xs text-[#0C2B62] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                          {totalKm !== undefined ? `${totalKm.toLocaleString()} KM` : '0 KM'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pure Agent Non-Taxable Reimbursements (GST Rule 33) */}
                <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                      <Receipt className="w-4 h-4 text-[#19B0A0]" />
                      <span>Non-Taxable Out-of-Pocket Reimbursements (Pure Agent)</span>
                    </div>
                    <label className="flex items-center gap-2 text-[11px] text-teal-900 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={taxReimbursements}
                        onChange={(e) => setTaxReimbursements(e.target.checked)}
                        className="rounded text-[#19B0A0] focus:ring-[#19B0A0]"
                      />
                      <span>Apply GST on reimbursements (Composite package)</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-teal-800 mb-3">
                    As per Indian GST rules, pure reimbursements like actual Toll and Parking are added to the invoice total <strong>without GST</strong>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Toll Tax (₹)"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 180"
                      value={tollTaxRupees || ''}
                      onChange={(e) => setTollTaxRupees(Number(e.target.value))}
                      className="bg-white font-mono text-xs"
                    />
                    <Input
                      label="State / Border Permit (₹)"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 0"
                      value={statePermitRupees || ''}
                      onChange={(e) => setStatePermitRupees(Number(e.target.value))}
                      className="bg-white font-mono text-xs"
                    />
                    <Input
                      label="Parking Charges (₹)"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 120"
                      value={parkingChargesRupees || ''}
                      onChange={(e) => setParkingChargesRupees(Number(e.target.value))}
                      className="bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="mt-2 text-right">
                    <span className="text-xs font-bold text-teal-950">
                      Total Reimbursements: {formatPaiseToRupees(totalReimbursementsPaise)}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </Card>

          {/* 4. LINE ITEMS & SERVICE CATALOG */}
          <Card className="p-5 border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0C2B62]" />
                <h3 className="text-sm font-bold text-slate-900">Line Items & Travel Services</h3>
              </div>

              {/* Tax Mode Toggles */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Pricing Mode:</span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalTaxMode('exclusive');
                      setLines(lines.map(l => ({ ...l, isTaxInclusive: false })));
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      globalTaxMode === 'exclusive' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Tax Exclusive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalTaxMode('inclusive');
                      setLines(lines.map(l => ({ ...l, isTaxInclusive: true })));
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      globalTaxMode === 'inclusive' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Tax Inclusive
                  </button>
                </div>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              {calculatedLines.map((line, idx) => (
                <div key={line.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <Input
                          label="Description of Service / Cab Package"
                          value={line.description}
                          onChange={(e) => updateLine(idx, { description: e.target.value })}
                          placeholder="e.g. Innova AC 8Hr/80Km Package or Extra KM Rate"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">SAC Code</label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLineIndexForHsn(idx);
                              setIsHsnPickerOpen(true);
                            }}
                            className="text-[10px] text-[#19B0A0] hover:underline font-semibold"
                          >
                            Browse SAC
                          </button>
                        </div>
                        <Input
                          value={line.hsnSac}
                          onChange={(e) => updateLine(idx, { hsnSac: e.target.value })}
                          placeholder="996412"
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length <= 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-2 mt-5 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end pt-1">
                    <div>
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                      <select
                        value={line.unit}
                        onChange={(e) => updateLine(idx, { unit: e.target.value })}
                        className="w-full h-10 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="days">days</option>
                        <option value="km">km</option>
                        <option value="hrs">hrs</option>
                        <option value="trips">trips</option>
                        <option value="nos">nos</option>
                      </select>
                    </div>
                    <div>
                      <Input
                        label="Rate (₹)"
                        type="number"
                        value={line.unitPricePaise / 100}
                        onChange={(e) => updateLine(idx, { unitPricePaise: Math.round(Number(e.target.value) * 100) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate</label>
                      <select
                        value={line.taxRate}
                        onChange={(e) => updateLine(idx, { taxRate: Number(e.target.value) })}
                        className="w-full h-10 px-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
                      >
                        {STANDARD_TRAVEL_GST_RATES.map(r => (
                          <option key={r.rate} value={r.rate}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 text-right">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">Line Total</span>
                      <div className="text-sm font-extrabold text-slate-900 font-mono">
                        {formatPaiseToRupees(line.totalPaise)}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        (Tax: {formatPaiseToRupees(line.cgstPaise + line.sgstPaise + line.igstPaise)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addEmptyLine}
              leftIcon={<Plus className="w-4 h-4 text-slate-600" />}
              className="bg-white border-dashed border-slate-300 w-full font-semibold text-slate-700"
            >
              Add Another Service / Charge Row
            </Button>
          </Card>

          {/* 5. NOTES & TERMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Special Trip Notes / Passenger Remarks</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. VIP guest arrival at Terminal 1. Driver in uniform with placard."
                className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#19B0A0]"
              />
            </Card>

            <Card className="p-4 border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Terms & Conditions</label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#19B0A0]"
              />
            </Card>
          </div>

        </div>

        {/* RIGHT COLUMN: TAX COMPUTATION & GRAND TOTAL PANEL */}
        <div className="space-y-6">

          {/* Sticky Summary Card */}
          <div className="sticky top-20 space-y-4">
            
            <Card className="p-5 border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Tax & Invoice Summary</span>
                <Badge variant={invoiceType === 'gst_tax_invoice' ? 'teal' : 'slate'} size="sm">
                  {invoiceType === 'gst_tax_invoice' ? 'GST Invoice' : 'Bill of Supply'}
                </Badge>
              </h3>

              {/* RCM Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">Reverse Charge (RCM)</span>
                  <input
                    type="checkbox"
                    checked={isReverseCharge}
                    onChange={(e) => setIsReverseCharge(e.target.checked)}
                    className="rounded text-[#19B0A0] focus:ring-[#19B0A0]"
                  />
                </label>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Section 9(3) of CGST Act: Tax is payable by corporate recipient if un-registered rent-a-cab operator.
                </p>
              </div>

              {/* Arithmetic Breakdown */}
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Gross Services Subtotal:</span>
                  <span className="font-mono font-medium text-slate-900">{formatPaiseToRupees(totals.subtotalPaise)}</span>
                </div>

                <div className="flex justify-between py-1 text-slate-600">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-bold text-slate-900">{formatPaiseToRupees(totals.taxableValuePaise)}</span>
                </div>

                {/* Taxes */}
                {invoiceType === 'gst_tax_invoice' && (
                  <div className="py-1 space-y-1 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Tax Breakdown ({placeOfSupplyStateCode === profile.stateCode ? 'Intra-State' : 'Inter-State IGST'})
                    </div>
                    {placeOfSupplyStateCode === profile.stateCode ? (
                      <>
                        <div className="flex justify-between text-slate-700">
                          <span>Central GST (CGST):</span>
                          <span className="font-mono">{formatPaiseToRupees(totals.cgstPaise)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>State GST (SGST):</span>
                          <span className="font-mono">{formatPaiseToRupees(totals.sgstPaise)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-slate-700">
                        <span>Integrated GST (IGST):</span>
                        <span className="font-mono">{formatPaiseToRupees(totals.igstPaise)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total GST:</span>
                      <span className="font-mono text-[#0E8478]">{formatPaiseToRupees(totals.totalTaxPaise)}</span>
                    </div>
                  </div>
                )}

                {/* Pure Agent Reimbursements */}
                {totalReimbursementsPaise > 0 && (
                  <div className="flex justify-between py-1 text-teal-800 font-medium">
                    <span>Toll & Parking (Non-taxable):</span>
                    <span className="font-mono font-bold">{formatPaiseToRupees(totalReimbursementsPaise)}</span>
                  </div>
                )}

                {totals.roundOffPaise !== 0 && (
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Round-off:</span>
                    <span className="font-mono">{totals.roundOffPaise > 0 ? `+${totals.roundOffPaise}p` : `${totals.roundOffPaise}p`}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between items-baseline pt-3 text-base">
                  <span className="font-bold text-slate-900">Grand Total:</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#0C2B62] font-mono">
                      {formatPaiseToRupees(totals.grandTotalPaise)}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Includes all taxes & duty charges
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-700 leading-tight">
                  <span className="font-semibold text-slate-800">In Words: </span>
                  {paiseToWords(totals.grandTotalPaise)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleIssueClick}
                  leftIcon={<Send className="w-4 h-4" />}
                  className="w-full bg-[#19B0A0] hover:bg-[#0E8478] text-white font-bold h-11 shadow-md"
                >
                  Issue & Share Bill
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePreviewClick}
                    leftIcon={<Eye className="w-4 h-4" />}
                    className="w-full bg-white border border-slate-300 font-semibold text-xs"
                  >
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDraftClick}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="w-full bg-white border border-slate-300 font-semibold text-xs"
                  >
                    Save Draft
                  </Button>
                </div>
              </div>

            </Card>

            {/* Quick Fleet Assurance */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#19B0A0] shrink-0" />
              <span>Compliant with Indian Motor Vehicles Act & GST Valuation Rules 2017.</span>
            </div>

          </div>

        </div>

      </div>

      {/* HSN / SAC SEARCH MODAL DRAWER */}
      {isHsnPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[80vh]">
            <div className="p-4 bg-[#0C2B62] text-white flex items-center justify-between border-b border-[#17396E]">
              <div>
                <h3 className="font-bold text-sm">Select Service SAC Code</h3>
                <p className="text-xs text-slate-300">Choose official Indian GST SAC code for passenger & travel services</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsHsnPickerOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-200">
              <Input
                placeholder="Search by code (e.g. 9964) or keyword (e.g. taxi, rental, outstation)..."
                value={hsnSearchTerm}
                onChange={(e) => setHsnSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="text-xs"
                autoFocus
              />
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
              {searchHsnSac(hsnSearchTerm).map((item) => (
                <div
                  key={item.code}
                  onClick={() => {
                    updateLine(activeLineIndexForHsn, {
                      hsnSac: item.code,
                      description: item.description,
                      taxRate: item.defaultTaxRate,
                    });
                    setIsHsnPickerOpen(false);
                  }}
                  className="py-2.5 px-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0C2B62] bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{item.description}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{item.category}</span>
                  </div>
                  <Badge variant="teal" size="sm">
                    {item.defaultTaxRate}% GST
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
