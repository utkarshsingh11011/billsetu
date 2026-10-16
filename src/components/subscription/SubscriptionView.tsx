import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  Sparkles, 
  Upload, 
  ShieldCheck, 
  Palette, 
  FileCheck, 
  X,
  CreditCard,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subscription, BusinessProfile } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface SubscriptionViewProps {
  profile: BusinessProfile;
  subscription: Subscription;
  onUpgrade: () => void;
  onDowngrade: () => void;
  onUpdateProfile: (profile: BusinessProfile) => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  profile,
  subscription,
  onUpgrade,
  onDowngrade,
  onUpdateProfile,
}) => {
  const isPro = subscription.plan === 'pro';

  // Branding customization state (unlocked on Pro)
  const [logoUrl, setLogoUrl] = useState<string>(profile.logoUrl || '');
  const [brandColor, setBrandColor] = useState<string>(profile.brandColor || '#0d9488');
  const [isSavingBranding, setIsSavingBranding] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const handleSimulatePayment = () => {
    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // fallback if canvas not available
    }

    onUpgrade();
  };

  const handleSaveBranding = () => {
    setIsSavingBranding(true);
    const updated: BusinessProfile = {
      ...profile,
      logoUrl: logoUrl.trim() || undefined,
      brandColor,
    };
    onUpdateProfile(updated);
    setTimeout(() => {
      setIsSavingBranding(false);
      setSaveMessage('Brand settings updated! Live on all newly printed invoices.');
      setTimeout(() => setSaveMessage(''), 4000);
    }, 300);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800">
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Plans & Brand Customization</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Keep your bills calm and professional. Upgrade to remove the BillSetu footer and present your own brand.
        </p>
      </div>

      {/* Plan Comparison Grid (PRD Section 6.6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* FREE PLAN */}
        <Card className={`p-6 flex flex-col justify-between ${!isPro ? 'ring-2 ring-slate-900' : ''}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">BillSetu Starter</h3>
                <p className="text-xs text-slate-500">For freelancers and micro-businesses</p>
              </div>
              {!isPro && <Badge variant="navy">Current Plan</Badge>}
            </div>

            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-3xl font-black text-slate-900">₹0</span>
              <span className="text-xs text-slate-500">/ forever</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Unlimited GST & Non-GST sales invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Deterministic GST Tax Engine & HSN support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>GSTIN profile verification & autofill</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Scan-to-Books starter allowance (20 scans)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-4 text-center font-bold text-slate-400">•</span>
                <span>Includes transparent <em>"Created with BillSetu"</em> footer</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {isPro ? (
              <Button
                variant="outline"
                size="md"
                onClick={onDowngrade}
                className="w-full text-xs text-slate-600"
              >
                Switch to Free Plan
              </Button>
            ) : (
              <div className="text-center text-xs text-slate-500 font-medium py-2">
                Your current active plan
              </div>
            )}
          </div>
        </Card>

        {/* PRO PLAN */}
        <Card className={`p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-teal-50/50 to-white ${isPro ? 'ring-2 ring-teal-600 shadow-md' : 'border-teal-300'}`}>
          <div className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Most Popular
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-bold text-slate-900">BillSetu Pro</h3>
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-xs text-slate-600">Full brand ownership and enhanced capacity</p>
              </div>
              {isPro && <Badge variant="teal">Active Plan</Badge>}
            </div>

            <div className="flex items-baseline gap-1.5 pt-2">
              <span className="text-3xl font-black text-slate-900">₹999</span>
              <span className="text-xs text-slate-600 font-medium">/ year (~₹83.25/month)</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 pt-3 border-t">
              <div className="flex items-center gap-2 font-semibold text-teal-900">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Remove BillSetu watermark footer completely</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-teal-900">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Upload custom business logo on PDF invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Custom brand accent colors for headers and borders</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>High scan allowance: 500 bills/year Scan-to-Books</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Priority CSV spreadsheet and JSON backup exports</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {!isPro ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleSimulatePayment}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-200" />}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
              >
                Upgrade to Pro (₹999/year)
              </Button>
            ) : (
              <div className="p-2.5 bg-teal-100/70 border border-teal-200 rounded-lg text-center text-xs text-teal-900 font-bold">
                ✓ Pro Entitlements Active (Renews {subscription.renewalDate})
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Pro Branding Controls (Unlocked when Pro is active, PRD Section 5 Workflow E & 6.6) */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Brand Identity & Logo Setup
              </h3>
              <p className="text-xs text-slate-500">
                {isPro 
                  ? 'Your custom logo and accent color will appear on all printed and shared PDF invoices.'
                  : 'Upgrade to Pro to unlock custom logo upload and brand color customization.'}
              </p>
            </div>
          </div>

          {!isPro && (
            <Badge variant="amber">
              Pro Feature
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Logo URL Input & File Picker */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Business Logo Image URL
            </label>
            <input
              type="text"
              disabled={!isPro}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder={isPro ? "https://example.com/logo.png" : "Upgrade to Pro to add logo"}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs disabled:bg-slate-50 disabled:text-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              Tip: Paste a PNG/SVG image link with transparent background for crisp printing.
            </p>

            {/* Quick Demo Logo Buttons */}
            {isPro && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500">Sample logos:</span>
                <button
                  type="button"
                  onClick={() => setLogoUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px]"
                >
                  Tech Minimal
                </button>
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-600"
                >
                  Clear Logo
                </button>
              </div>
            )}
          </div>

          {/* Logo Live Preview */}
          <div className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 min-h-[120px]">
            {logoUrl ? (
              <div className="text-center space-y-1">
                <img src={logoUrl} alt="Logo Preview" className="h-14 max-w-full object-contain mx-auto" />
                <span className="text-[10px] text-emerald-600 font-semibold block">Logo Preview Active</span>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                <Upload className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <span>No logo configured</span>
              </div>
            )}
          </div>

        </div>

        {/* Save Branding Action */}
        {isPro && (
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {saveMessage ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> {saveMessage}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Settings take effect immediately.</span>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveBranding}
              isLoading={isSavingBranding}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Save Brand Changes
            </Button>
          </div>
        )}
      </Card>

      {/* Disclosures and Fair-Use Terms (PRD Section 6.6 & 16) */}
      <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Billing Transparency & Fair-Use Policy</span>
        </div>
        <p>
          • <strong>Annual Price:</strong> ₹999/year includes all core Pro capabilities. Cancel anytime before your renewal date without penalty.
        </p>
        <p>
          • <strong>No Silent Retractions:</strong> Invoices issued during your Pro subscription remain free of the BillSetu watermark forever, even if your plan expires later.
        </p>
        <p>
          • <strong>Privacy & Security:</strong> Your documents are processed in accordance with the Digital Personal Data Protection Act, 2023. We do not use customer invoices to train third-party models.
        </p>
      </div>

    </div>
  );
};
