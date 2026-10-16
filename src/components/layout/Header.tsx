import React from 'react';
import { 
  ShieldCheck, 
  Crown, 
  Languages, 
  Wifi, 
  Sparkles,
  Building2,
  Search,
  User
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
}) => {
  const t = translations[currentLang];
  const isPro = subscription.plan === 'pro';

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold shadow-inner">
              <span className="text-xl tracking-tight font-black text-teal-400">B</span>
              <span className="text-xs font-bold text-teal-200">₹</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  {t.brandName}
                </span>
                {isPro ? (
                  <Badge variant="teal" size="sm" className="bg-teal-500/20 border-teal-400/40 text-teal-300">
                    <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                    PRO
                  </Badge>
                ) : (
                  <Badge variant="slate" size="sm" className="bg-slate-800 border-slate-700 text-slate-300">
                    Free
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
                {profile.tradeName || profile.legalName}
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

            {/* Sync State Indicator (PRD Section 4 & 7 SYNC-01) */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Synced</span>
            </div>

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
