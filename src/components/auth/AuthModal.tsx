import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Key, 
  X,
  Sparkles
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { INDIAN_STATES } from '../../constants/states';
import { lookupGstin } from '../../services/gstinService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteProfile: (profile: Partial<BusinessProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onCompleteProfile,
}) => {
  const [step, setStep] = useState<'auth' | 'otp' | 'setup_type' | 'profile_form'>('auth');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phoneOrEmail, setPhoneOrEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  
  // Setup Path: GST Registered vs Non-GST
  const [isGstRegistered, setIsGstRegistered] = useState<boolean>(true);
  const [businessName, setBusinessName] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [stateCode, setStateCode] = useState<string>('27');
  const [city, setCity] = useState<string>('Mumbai');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupMessage, setLookupMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) return;
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('setup_type');
  };

  const handleGstinAutofill = async () => {
    if (!gstin.trim()) return;
    setIsLookingUp(true);
    setLookupMessage('');
    try {
      const res = await lookupGstin(gstin);
      if (res.data) {
        setBusinessName(res.data.tradeName || res.data.legalName);
        setStateCode(res.data.stateCode);
        setCity(res.data.city);
        setLookupMessage(`Verified: ${res.data.legalName}`);
      } else {
        setLookupMessage(res.formatError || 'GSTIN not found in sandbox. Fill manually.');
      }
    } catch {
      setLookupMessage('Service unavailable. Fill manually.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleFinishSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const stateObj = INDIAN_STATES.find(s => s.code === stateCode);
    onCompleteProfile({
      legalName: businessName || 'My Business',
      tradeName: businessName || 'My Business',
      gstin: isGstRegistered ? gstin.toUpperCase() : '',
      isGstRegistered,
      city,
      state: stateObj?.name || 'Maharashtra',
      stateCode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              B
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {step === 'auth' || step === 'otp' ? 'Secure Account Sign-in' : 'Business Setup Wizard'}
              </h3>
              <p className="text-[11px] text-slate-500">BillSetu Security & DPDP Compliance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Sign-in / Sign-up with Phone or Email (PRD 6.1 AUTH-01) */}
        {step === 'auth' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter your mobile phone number or email to receive a secure instant one-time login passcode.
            </p>

            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 py-1.5 rounded font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  authMethod === 'phone' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-1.5 rounded font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  authMethod === 'email' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email Link
              </button>
            </div>

            <Input
              label={authMethod === 'phone' ? 'Mobile Number' : 'Work Email'}
              required
              placeholder={authMethod === 'phone' ? '+91 98200 12345' : 'you@business.in'}
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
            />

            <Button type="submit" variant="primary" size="md" className="w-full bg-teal-600 hover:bg-teal-700">
              Continue
            </Button>
          </form>
        )}

        {/* Step 2: OTP Entry */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <Key className="w-8 h-8 text-teal-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">Enter 4-Digit Passcode</h4>
              <p className="text-xs text-slate-500">Sent to {phoneOrEmail || 'your phone'}</p>
            </div>

            <input
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="1 2 3 4"
              className="w-full tracking-widest text-center text-xl font-bold font-mono py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <Button type="submit" variant="primary" size="md" className="w-full bg-teal-600 hover:bg-teal-700">
              Verify & Proceed
            </Button>

            <button
              type="button"
              onClick={() => setStep('auth')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
            >
              Change phone/email
            </button>
          </form>
        )}

        {/* Step 3: Choose Setup Path (GST vs Non-GST, PRD Section 6.1) */}
        {step === 'setup_type' && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-slate-900 text-sm">Choose Your Business Setup</h4>
              <p className="text-xs text-slate-500 mt-0.5">Different requirements for GST-registered and unregistered traders</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsGstRegistered(true);
                  setStep('profile_form');
                }}
                className="p-4 rounded-xl border border-teal-500/80 bg-teal-50/50 hover:bg-teal-50 text-left flex items-start gap-3 transition-colors group"
              >
                <Building2 className="w-5 h-5 text-teal-700 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">GST Registered Business</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Issues GST Tax Invoices with CGST/SGST/IGST, HSN codes, and Place of Supply.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGstRegistered(false);
                  setStep('profile_form');
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left flex items-start gap-3 transition-colors group"
              >
                <Building2 className="w-5 h-5 text-slate-600 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">Non-GST / Micro Business / Freelancer</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Issues simplified Bills of Supply without GST tax rates or filing complexities.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Business Profile Form */}
        {step === 'profile_form' && (
          <form onSubmit={handleFinishSetup} className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {isGstRegistered ? 'GST Business Details' : 'Non-GST Profile'}
              </span>
              <Badge variant={isGstRegistered ? 'teal' : 'slate'}>
                {isGstRegistered ? 'GST Registered' : 'Composition/Exempt'}
              </Badge>
            </div>

            {isGstRegistered && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AABCU9603R1ZM"
                    className="w-full uppercase font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGstinAutofill}
                    isLoading={isLookingUp}
                    className="text-xs px-2.5 shrink-0"
                  >
                    Autofill
                  </Button>
                </div>
                {lookupMessage && <p className="text-[11px] text-teal-700 mt-1">{lookupMessage}</p>}
              </div>
            )}

            <Input
              label="Business / Trade Name"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Apex Tech Solutions"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full bg-teal-600 hover:bg-teal-700 font-bold mt-2">
              Save Profile & Start Billing
            </Button>
          </form>
        )}

      </div>
    </div>
  );
};
