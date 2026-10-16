import React from 'react';
import { 
  Home, 
  PlusCircle, 
  ScanLine, 
  Archive, 
  Users, 
  Settings 
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

  const items = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'create', label: t.createInvoice, icon: PlusCircle, isHighlight: true },
    { id: 'scan', label: t.scanBill, icon: ScanLine, badgeCount: scansNeedReviewCount },
    { id: 'records', label: t.navRecords, icon: Archive },
    { id: 'parties', label: t.customer, icon: Users },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden px-2 py-1.5 shadow-lg no-print">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isHighlight) {
            return (
              <button
                key={item.id}
                onClick={onOpenCreate}
                className="flex flex-col items-center justify-center -mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full p-2.5 shadow-md active:scale-95 transition-all focus:outline-none"
                aria-label={item.label}
              >
                <PlusCircle className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg relative min-w-[50px] transition-colors ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-500'}`} />
                {item.badgeCount ? item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                    {item.badgeCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-1 truncate max-w-[55px] text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
