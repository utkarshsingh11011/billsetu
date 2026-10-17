import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Languages, 
  Save, 
  RotateCcw, 
  CheckCircle2,
  Check,
  AlertTriangle,
  Play
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { INDIAN_STATES } from '../../constants/states';
import { runTaxEngineTests } from '../../services/taxEngine.test';
import { Language, translations } from '../../services/i18n';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface SettingsViewProps {
  profile: BusinessProfile;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onSaveProfile: (profile: BusinessProfile) => void;
  onResetData: () => void;
  onOpenSetupWizard?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  currentLang,
  onLanguageChange,
  onSaveProfile,
  onResetData,
  onOpenSetupWizard,
}) => {
  const t = translations[currentLang];

  const [legalName, setLegalName] = useState<string>(profile.legalName);
  const [tradeName, setTradeName] = useState<string>(profile.tradeName);
  const [gstin, setGstin] = useState<string>(profile.gstin || '');
  const [isGstRegistered, setIsGstRegistered] = useState<boolean>(profile.isGstRegistered);
  const [phone, setPhone] = useState<string>(profile.phone);
  const [email, setEmail] = useState<string>(profile.email);
  const [address, setAddress] = useState<string>(profile.address);
  const [city, setCity] = useState<string>(profile.city);
  const [stateCode, setStateCode] = useState<string>(profile.stateCode);
  const [pincode, setPincode] = useState<string>(profile.pincode);

  const [invoicePrefix, setInvoicePrefix] = useState<string>(profile.invoicePrefix);
  const [financialYear, setFinancialYear] = useState<string>(profile.financialYear);

  const [bankName, setBankName] = useState<string>(profile.bankDetails.bankName);
  const [accountNo, setAccountNo] = useState<string>(profile.bankDetails.accountNo);
  const [ifsc, setIfsc] = useState<string>(profile.bankDetails.ifsc);
  const [accountHolderName, setAccountHolderName] = useState<string>(profile.bankDetails.accountHolderName);
  const [upiId, setUpiId] = useState<string>(profile.bankDetails.upiId || '');

  const [terms, setTerms] = useState<string>(profile.termsAndConditions);

  const [saveMessage, setSaveMessage] = useState<string>('');
  
  // Tax engine test suite results state (PRD Section 13 QA Gates)
  const [testResults, setTestResults] = useState<{ passed: boolean; results: string[] } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const stateObj = INDIAN_STATES.find(s => s.code === stateCode);
    const updated: BusinessProfile = {
      ...profile,
      legalName,
      tradeName,
      gstin: gstin.trim().toUpperCase(),
      isGstRegistered,
      phone,
      email,
      address,
      city,
      state: stateObj?.name || 'Maharashtra',
      stateCode,
      pincode,
      invoicePrefix,
      financialYear,
      bankDetails: {
        bankName,
        accountNo,
        ifsc,
        accountHolderName,
        upiId: upiId.trim() || undefined,
      },
      termsAndConditions: terms,
    };

    onSaveProfile(updated);
    setSaveMessage('Business profile and invoice settings saved successfully.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleRunTaxEngineVerification = () => {
    const results = runTaxEngineTests();
    setTestResults(results);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navSettings}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your business entity, GST registration, bank details, and compliance settings
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-teal-600" />
          <span className="text-xs text-slate-600 font-medium">Language:</span>
          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as any)}
            className="text-xs font-semibold rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Business Identity Card */}
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900">Business Identity & GST Registration</h3>
            </div>
            {onOpenSetupWizard && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenSetupWizard}
                className="text-xs border-teal-400/60 text-teal-800 bg-teal-50/50 hover:bg-teal-50"
              >
                Launch Onboarding Wizard
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isGstRegistered}
                onChange={(e) => setIsGstRegistered(e.target.checked)}
                className="rounded border-slate-300 text-teal-600"
              />
              <span>Business is GST Registered</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Legal Name (As on PAN/GST)"
              required
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />

            <Input
              label="Trade Name (Brand Name on Invoices)"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />

            <Input
              label="GSTIN (15 Characters)"
              disabled={!isGstRegistered}
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder={isGstRegistered ? "27AABCU9603R1ZM" : "Unregistered"}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered State</label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Registered Business Address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <Input
              label="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />

            <Input
              label="Business Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Business Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </Card>

        {/* Invoice Numbering & Financial Year Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900">Invoice Numbering & Financial Year</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Invoice Number Prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              hint="e.g. INV-2026- will generate INV-2026-101, INV-2026-102"
            />

            <Input
              label="Financial Year"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              placeholder="2026-27"
            />
          </div>
        </Card>

        {/* Bank Details & UPI Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <CreditCard className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900">Bank Account & UPI Details (Printed on Invoices)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank Ltd"
            />

            <Input
              label="Account Holder Name"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="e.g. Apex Tech Solutions"
            />

            <Input
              label="Bank Account Number"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
            />

            <Input
              label="IFSC Code"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
            />

            <div className="sm:col-span-2">
              <Input
                label="UPI ID / VPA (For instant phone scan & pay)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourbusiness@okhdfcbank"
              />
            </div>
          </div>
        </Card>

        {/* Terms and Conditions Card */}
        <Card className="p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Default Terms & Conditions</h3>
          <textarea
            rows={3}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveMessage ? (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {saveMessage}
            </span>
          ) : (
            <span className="text-xs text-slate-500">All data stored safely and locally on your device.</span>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 font-bold"
          >
            Save All Settings
          </Button>
        </div>

      </form>

      {/* Deterministic Tax Engine Verification QA Runner (PRD Section 7 INV-02 & Section 13) */}
      <Card className="p-5 space-y-3 bg-slate-900 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-sm text-white">
                Deterministic GST Tax Engine Verification Suite
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Run automated unit tests for intra-state (CGST+SGST), inter-state (IGST), discounts, MRP inclusive tax and paise-safe rounding.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRunTaxEngineVerification}
            leftIcon={<Play className="w-3.5 h-3.5 text-teal-400" />}
            className="border-slate-700 text-white hover:bg-slate-800 text-xs shrink-0"
          >
            Run Test Suite
          </Button>
        </div>

        {testResults && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-2 font-bold mb-2">
              {testResults.passed ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> All Tax Engine Tests Passed (100% Deterministic)
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Tests Failed
                </span>
              )}
            </div>
            {testResults.results.map((r, idx) => (
              <div key={idx} className={r.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}>
                {r}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Compliance Notice & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-100 rounded-xl text-xs text-slate-600">
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            Digital Personal Data Protection Act (DPDP), 2023 Notice
          </p>
          <p className="text-[11px] text-slate-500">
            BillSetu stores business profiles and document snapshots locally. No customer invoice data is transmitted to AI services for model training.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm('Reset all demo data and restore initial seed records?')) {
              onResetData();
            }
          }}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
          className="border-slate-300 text-rose-700 hover:bg-rose-50 text-xs shrink-0"
        >
          Reset Demo Data
        </Button>
      </div>

    </div>
  );
};
