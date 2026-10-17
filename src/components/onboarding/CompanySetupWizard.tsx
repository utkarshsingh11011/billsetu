import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon,
  AlertCircle,
  FileCheck,
  QrCode
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { lookupGstin, validateGstinFormat } from '../../services/gstinService';
import { INDIAN_STATES } from '../../constants/states';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';

export interface CompanySetupWizardProps {
  currentProfile: BusinessProfile;
  onComplete: (updatedProfile: BusinessProfile) => void;
}

export const CompanySetupWizard: React.FC<CompanySetupWizardProps> = ({
  currentProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [isGstRegistered, setIsGstRegistered] = useState<boolean>(currentProfile.isGstRegistered);
  const [gstinInput, setGstinInput] = useState<string>(currentProfile.gstin || '');
  const [legalName, setLegalName] = useState<string>(currentProfile.legalName || '');
  const [tradeName, setTradeName] = useState<string>(currentProfile.tradeName || '');
  const [address, setAddress] = useState<string>(currentProfile.address || '');
  const [city, setCity] = useState<string>(currentProfile.city || '');
  const [state, setState] = useState<string>(currentProfile.state || 'Uttar Pradesh');
  const [stateCode, setStateCode] = useState<string>(currentProfile.stateCode || '09');
  const [pincode, setPincode] = useState<string>(currentProfile.pincode || '');
  const [phone, setPhone] = useState<string>(currentProfile.phone || '');
  const [email, setEmail] = useState<string>(currentProfile.email || '');

  // Step 2: Branding & Signatory
  const [logoUrl, setLogoUrl] = useState<string>(currentProfile.logoUrl || '');
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState<string>(currentProfile.authorizedSignatoryName || '');
  const [signatureUrl, setSignatureUrl] = useState<string>(currentProfile.signatureUrl || '');
  const [invoicePrefix, setInvoicePrefix] = useState<string>(currentProfile.invoicePrefix || 'TAXI/26-27/');

  // Step 3: Banking & UPI
  const [bankName, setBankName] = useState<string>(currentProfile.bankDetails.bankName || '');
  const [accountNo, setAccountNo] = useState<string>(currentProfile.bankDetails.accountNo || '');
  const [ifsc, setIfsc] = useState<string>(currentProfile.bankDetails.ifsc || '');
  const [branch, setBranch] = useState<string>(currentProfile.bankDetails.branch || '');
  const [accountHolderName, setAccountHolderName] = useState<string>(currentProfile.bankDetails.accountHolderName || '');
  const [upiId, setUpiId] = useState<string>(currentProfile.bankDetails.upiId || '');
  const [termsAndConditions, setTermsAndConditions] = useState<string>(currentProfile.termsAndConditions);

  // Validation & Loading
  const [isLookingUpGstin, setIsLookingUpGstin] = useState<boolean>(false);
  const [gstinMessage, setGstinMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Auto-lookup GSTIN
  const handleGstinLookup = async (overrideGstin?: string) => {
    const code = (overrideGstin || gstinInput).trim().toUpperCase();
    if (!code) return;

    const validation = validateGstinFormat(code);
    if (!validation.isValidFormat) {
      setGstinMessage({ type: 'error', text: validation.formatError || 'Invalid 15-digit GSTIN pattern' });
      return;
    }

    if (validation.stateInfo) {
      setState(validation.stateInfo.name);
      setStateCode(validation.stateInfo.code);
    }

    setIsLookingUpGstin(true);
    setGstinMessage(null);

    try {
      const res = await lookupGstin(code);
      if (res.status === 'verified_active' && res.data) {
        setLegalName(res.data.legalName);
        setTradeName(res.data.tradeName || res.data.legalName);
        setAddress(res.data.address);
        setCity(res.data.city);
        setState(res.data.state);
        setStateCode(res.data.stateCode);
        setPincode(res.data.pincode);
        if (!accountHolderName) {
          setAccountHolderName(res.data.tradeName || res.data.legalName);
        }
        setGstinMessage({ 
          type: 'success', 
          text: `Verified Active Taxpayer: ${res.data.legalName} (${res.data.state})` 
        });
      } else {
        setGstinMessage({ 
          type: 'info', 
          text: 'Valid format. Taxpayer details not in public cache—you may edit manually below.' 
        });
      }
    } catch {
      setGstinMessage({ 
        type: 'info', 
        text: 'Valid format. Network unavailable for live verification—please confirm details.' 
      });
    } finally {
      setIsLookingUpGstin(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setLogoUrl(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSignatureUrl(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStateChange = (code: string) => {
    setStateCode(code);
    const s = INDIAN_STATES.find(st => st.code === code);
    if (s) setState(s.name);
  };

  const handleFinish = () => {
    if (!legalName.trim() && !tradeName.trim()) {
      alert('Please enter your business or legal trade name.');
      setStep(1);
      return;
    }

    const updated: BusinessProfile = {
      ...currentProfile,
      isConfigured: true,
      businessCategory: 'taxi_fleet',
      legalName: legalName.trim().toUpperCase() || tradeName.trim().toUpperCase(),
      tradeName: tradeName.trim() || legalName.trim(),
      gstin: isGstRegistered ? gstinInput.trim().toUpperCase() : '',
      isGstRegistered,
      pan: isGstRegistered && gstinInput.length >= 12 ? gstinInput.substring(2, 12) : currentProfile.pan,
      address: address.trim(),
      city: city.trim(),
      state,
      stateCode,
      pincode: pincode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      logoUrl,
      invoicePrefix: invoicePrefix.trim() || 'TAXI/26-27/',
      authorizedSignatoryName: authorizedSignatoryName.trim() || 'Authorized Signatory',
      signatureUrl,
      bankDetails: {
        bankName: bankName.trim(),
        accountNo: accountNo.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        branch: branch.trim(),
        accountHolderName: accountHolderName.trim() || tradeName.trim() || legalName.trim(),
        upiId: upiId.trim(),
      },
      termsAndConditions,
    };

    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header Bar */}
        <div className="bg-[#0C2B62] px-6 py-5 text-white flex items-center justify-between border-b border-[#17396E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
              <img src="/logo_icon.png" alt="BillSetu" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Company Setup Wizard</span>
                <Badge variant="teal" size="sm" className="bg-[#19B0A0]/20 text-[#19B0A0] border border-[#19B0A0]/40">
                  Mandatory
                </Badge>
              </h2>
              <p className="text-xs text-slate-300">
                Configure your real fleet profile once to generate compliant GST & Travel bills.
              </p>
            </div>
          </div>
          
          {/* Step Badges */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-semibold ${step === 1 ? 'bg-[#19B0A0] text-white' : 'bg-slate-800 text-slate-400'}`}>1. GST & Identity</span>
            <span className={`px-2.5 py-1 rounded-full font-semibold ${step === 2 ? 'bg-[#19B0A0] text-white' : 'bg-slate-800 text-slate-400'}`}>2. Branding</span>
            <span className={`px-2.5 py-1 rounded-full font-semibold ${step === 3 ? 'bg-[#19B0A0] text-white' : 'bg-slate-800 text-slate-400'}`}>3. Bank & UPI</span>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div 
            className="bg-[#19B0A0] h-1.5 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

          {/* STEP 1: GST & BUSINESS IDENTITY */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 1: Business Identity & Tax Registration</h3>
                  <p className="text-xs text-slate-500">Enter your 15-digit GSTIN for instant legal verification and state detection.</p>
                </div>
                {/* GST Toggle */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsGstRegistered(true)}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${isGstRegistered ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'}`}
                  >
                    GST Registered
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGstRegistered(false);
                      setGstinInput('');
                      setGstinMessage(null);
                    }}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${!isGstRegistered ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'}`}
                  >
                    Non-GST / Unregistered
                  </button>
                </div>
              </div>

              {isGstRegistered ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        label="15-Digit GSTIN"
                        placeholder="e.g. 09AAACK8892M1Z2"
                        value={gstinInput}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setGstinInput(val);
                          if (val.length === 15) {
                            handleGstinLookup(val);
                          }
                        }}
                        className="font-mono uppercase text-sm tracking-wider"
                      />
                    </div>
                    <div className="sm:self-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleGstinLookup()}
                        disabled={isLookingUpGstin || gstinInput.length !== 15}
                        className="w-full sm:w-auto h-10 bg-white border border-slate-300 font-semibold"
                        leftIcon={isLookingUpGstin ? undefined : <Sparkles className="w-4 h-4 text-[#19B0A0]" />}
                      >
                        {isLookingUpGstin ? 'Verifying...' : 'Auto-Fetch Details'}
                      </Button>
                    </div>
                  </div>

                  {gstinMessage && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      gstinMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      gstinMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                      'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}>
                      {gstinMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{gstinMessage.text}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You are generating <strong>Bills of Supply</strong> (0% GST for turnover under ₹20 Lakhs). You can add a GSTIN anytime later.</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Trade Name (Visible on Invoices)"
                  placeholder="e.g. Kashi Cabs & Car Rental"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  required
                />
                <Input
                  label="Legal Business Name (as per PAN/GST)"
                  placeholder="e.g. KASHI TOURS & FLEET SERVICES PVT LTD"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Registered Office Address"
                    placeholder="e.g. Shop 4, Dashashwamedh Ghat Road, Godowlia"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="City"
                  placeholder="e.g. Varanasi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State & State Code</label>
                  <select
                    value={stateCode}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#19B0A0]"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="PIN Code"
                  placeholder="e.g. 221001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
                <Input
                  label="Dispatch Phone / WhatsApp"
                  placeholder="e.g. +91 98390 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: BRANDING & SIGNATORY */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">Step 2: Fleet Branding & Authorized Signatory</h3>
                <p className="text-xs text-slate-500">Your logo and signature will be crisply rendered on all generated A4 and WhatsApp invoices.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Company / Fleet Logo</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-[#19B0A0] transition-colors bg-slate-50 flex flex-col items-center justify-center min-h-[160px]">
                    {logoUrl ? (
                      <div className="relative group">
                        <img src={logoUrl} alt="Logo Preview" className="h-20 max-w-full object-contain mx-auto rounded" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="mt-2 text-xs text-rose-600 hover:underline block"
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-600 font-medium">Click to upload logo (PNG/JPG)</p>
                        <p className="text-[10px] text-slate-400 mt-1">Recommended size: 400x120px</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Signature Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Authorized Signatory Signature</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-[#19B0A0] transition-colors bg-slate-50 flex flex-col items-center justify-center min-h-[160px]">
                    {signatureUrl ? (
                      <div>
                        <img src={signatureUrl} alt="Signature Preview" className="h-16 max-w-full object-contain mx-auto rounded" />
                        <button
                          type="button"
                          onClick={() => setSignatureUrl('')}
                          className="mt-2 text-xs text-rose-600 hover:underline block"
                        >
                          Remove Signature
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-600 font-medium">Upload signature photo or stamp</p>
                        <p className="text-[10px] text-slate-400 mt-1">Appears at the bottom right of the invoice</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Authorized Signatory Name"
                    placeholder="e.g. Rajesh K. Sharma"
                    value={authorizedSignatoryName}
                    onChange={(e) => setAuthorizedSignatoryName(e.target.value)}
                  />
                  <Input
                    label="Custom Invoice Prefix"
                    placeholder="e.g. TAXI/26-27/ or BCV/26-27/"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BANKING, UPI & TERMS */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">Step 3: Bank Details & Dynamic UPI QR Code</h3>
                <p className="text-xs text-slate-500">Entering your UPI ID automatically generates an NPCI payment QR on every bill so passengers can pay in seconds.</p>
              </div>

              {/* UPI Highlight Card */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-teal-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-[#19B0A0]" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-teal-900">Dynamic UPI Payment QR Code</h4>
                  <p className="text-[11px] text-teal-700 mt-0.5">When a bill is generated, scanning this QR code in GPay, PhonePe, or Paytm automatically enters the exact payable amount.</p>
                </div>
                <div className="w-full sm:w-64">
                  <Input
                    label="Primary Business UPI ID"
                    placeholder="e.g. kashicabs@sbi or fleet@icici"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Bank Account Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bank Name"
                  placeholder="e.g. State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
                <Input
                  label="Bank Account Number"
                  placeholder="e.g. 39482019482"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                />
                <Input
                  label="IFSC Code"
                  placeholder="e.g. SBIN0000211"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="uppercase font-mono"
                />
                <Input
                  label="Account Holder / Beneficiary Name"
                  placeholder="e.g. Kashi Tours & Fleet Services"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />
              </div>

              {/* Standard Terms */}
              <div className="space-y-1 pt-2">
                <label className="block text-xs font-semibold text-slate-700">Default Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-[#19B0A0]"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="bg-white border-slate-300 text-slate-700"
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  if (step === 1 && !legalName.trim() && !tradeName.trim()) {
                    alert('Please enter your business or trade name before continuing.');
                    return;
                  }
                  setStep((s) => (s + 1) as 1 | 2 | 3);
                }}
                className="bg-[#0C2B62] hover:bg-[#17396E] text-white font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Step {step + 1}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleFinish}
                className="bg-[#19B0A0] hover:bg-[#0E8478] text-white font-bold px-6 shadow-md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Setup & Launch Dashboard
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
