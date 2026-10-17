import React from 'react';
import { 
  ShieldCheck, 
  Crown, 
  Languages, 
  Wifi, 
  Sparkles,
  Building2,
  Search,
  User,
  Smartphone,
  Sliders,
  Compass
} from 'lucide-react';
import { Subscription, BusinessProfile } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Language, translations } from '../../services/i18n';

export interface HeaderProps {
  profile: BusinessProfile;
  subscription: Subscription;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenUpgrade: () => void;
  onNavigate: (view: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenAuth?: () => void;
  onOpenShowcase?: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  subscription,
  currentLang,
  onLanguageChange,
  onOpenUpgrade,
  onNavigate,
  onOpenCommandPalette,
  onOpenAuth,
  onOpenShowcase,
  onOpenAdmin,
}) => {
  const t = translations[currentLang];
  const isPro = subscription.plan === 'pro';

  return (
    <header className="sticky top-0 z-30 bg-[#0C2B62] border-b border-[#17396E] text-white shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <img 
              src="/logo_icon.png" 
              alt="BillSetu Logo" 
              className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-md border border-white/20" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight flex items-baseline">
                  <span className="text-white">Bill</span>
                  <span className="text-[#19B0A0]">Setu</span>
                </span>
                {isPro ? (
                  <Badge variant="teal" size="sm" className="bg-teal-500/20 border-teal-400/40 text-teal-300">
                    <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                    PRO
                  </Badge>
                ) : (
                  <Badge variant="slate" size="sm" className="bg-slate-800/80 border-slate-700 text-slate-300">
                    Free
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300/80 hidden sm:block truncate max-w-xs">
                Smart GST Billing for Every Business
              </p>
            </div>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Spotlight Search Button */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
              title="Search records and actions (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline text-[9px] font-mono bg-slate-900 px-1 py-0.5 rounded text-slate-400 border border-slate-700">Ctrl K</kbd>
            </button>

            {/* Feature Showcase Landing Page Switcher */}
            {onOpenShowcase && (
              <button
                onClick={onOpenShowcase}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/40 text-xs font-semibold transition-colors"
                title="View Feature Showcase Landing Page"
              >
                <Compass className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden sm:inline">Feature Tour</span>
              </button>
            )}

            {/* Admin Console Switcher */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 hover:text-amber-200 border border-slate-700 transition-colors"
                title="Open SaaS Subscription Admin Console"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Sync State Indicator (PRD Section 4 & 7 SYNC-01) */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Synced</span>
            </div>

            {/* Download Android App Button */}
            <a
              href="/billsetu-v1.0.0-debug.apk"
              download="billsetu-v1.0.0-debug.apk"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/40 text-xs font-semibold transition-colors"
              title="Download Android APK (v1.0.0)"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">Android APK</span>
            </a>

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(currentLang === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              title="Toggle language / भाषा बदलें"
            >
              <Languages className="w-3.5 h-3.5 text-teal-400" />
              <span>{currentLang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Upgrade to Pro Button if on Free tier */}
            {!isPro ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenUpgrade}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-200" />}
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-xs font-semibold text-xs h-9 px-3"
              >
                <span className="hidden sm:inline">Upgrade ₹999/yr</span>
                <span className="sm:hidden">Upgrade</span>
              </Button>
            ) : (
              <div 
                onClick={() => onNavigate('brand')} 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 cursor-pointer hover:bg-teal-500/20"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Custom Branding Active</span>
              </div>
            )}

            {/* Business Profile Shortcut */}
            <button
              onClick={() => onNavigate('settings')}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Business Settings & Profile"
            >
              <Building2 className="w-5 h-5 text-slate-300" />
            </button>

            {/* Account / Setup Wizard */}
            <button
              onClick={onOpenAuth}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Account & Setup Wizard (AUTH-01)"
            >
              <User className="w-5 h-5 text-teal-400" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
