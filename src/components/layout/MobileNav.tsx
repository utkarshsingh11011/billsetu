import React from 'react';
import { 
  Home, 
  Plus, 
  FileText, 
  Users, 
  Grid,
  Car
} from 'lucide-react';
import { Language, translations } from '../../services/i18n';

export interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentLang: Language;
  onOpenCreate: () => void;
  scansNeedReviewCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  currentLang,
  onOpenCreate,
  scansNeedReviewCount = 0,
}) => {
  const t = translations[currentLang];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 md:hidden px-3 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] no-print"
    >
      <div className="flex items-center justify-between max-w-lg mx-auto relative">
        
        {/* Tab 1: Home / Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
            currentTab === 'home' 
              ? 'text-navy-900 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'text-teal-600 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[11px] font-semibold mt-1 tracking-tight">Home</span>
        </button>

        {/* Tab 2: Bills & Documents (Sales, Quotes, Expenses, Vault) */}
        <button
          type="button"
          onClick={() => onSelectTab('records')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl relative transition-all duration-150 active:scale-95 ${
            currentTab === 'records' || currentTab === 'bills' 
              ? 'text-navy-900 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${currentTab === 'records' || currentTab === 'bills' ? 'text-teal-600 stroke-[2.5]' : 'text-slate-500'}`} />
            {scansNeedReviewCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                {scansNeedReviewCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold mt-1 tracking-tight">Bills & Docs</span>
        </button>

        {/* Elevated Center Floating Action Button (+ Create Bill) */}
        <div className="relative -mt-6">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex flex-col items-center justify-center w-13 h-13 bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 hover:from-teal-800 hover:to-emerald-600 text-white rounded-full shadow-[0_8px_20px_rgba(20,184,166,0.35)] active:scale-90 transition-transform focus:outline-none ring-4 ring-white"
            aria-label="Create Invoice"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="block text-[10px] font-black text-center text-teal-800 tracking-tight mt-0.5">+ Bill</span>
        </div>

        {/* Tab 3: Parties (Customers & Vendors Ledger) */}
        <button
          type="button"
          onClick={() => onSelectTab('parties')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
            currentTab === 'parties' 
              ? 'text-navy-900 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className={`w-5 h-5 ${currentTab === 'parties' ? 'text-teal-600 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[11px] font-semibold mt-1 tracking-tight">Parties</span>
        </button>

        {/* Tab 4: Fleet & More (Packages, Vehicles, Reports, Settings) */}
        <button
          type="button"
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
            currentTab === 'more' || currentTab === 'items' || currentTab === 'reports' || currentTab === 'settings' 
              ? 'text-navy-900 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid className={`w-5 h-5 ${currentTab === 'more' || currentTab === 'items' || currentTab === 'reports' || currentTab === 'settings' ? 'text-teal-600 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[11px] font-semibold mt-1 tracking-tight">Fleet & More</span>
        </button>

      </div>
    </nav>
  );
};
