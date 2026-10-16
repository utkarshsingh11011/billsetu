import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ScanLine, 
  Receipt, 
  Users, 
  Package, 
  Archive, 
  Sparkles, 
  Settings,
  Plus,
  BarChart3
} from 'lucide-react';
import { Language, translations } from '../../services/i18n';

export interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentLang: Language;
  onOpenCreate: () => void;
  scansNeedReviewCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentLang,
  onOpenCreate,
  scansNeedReviewCount = 0,
}) => {
  const t = translations[currentLang];

  const navItems = [
    { id: 'home', label: t.navHome, icon: LayoutDashboard },
    { id: 'invoices', label: t.navSales, icon: FileText },
    { id: 'scan', label: t.navScan, icon: ScanLine, badgeCount: scansNeedReviewCount },
    { id: 'expenses', label: t.navExpenses, icon: Receipt },
    { id: 'parties', label: t.navParties, icon: Users },
    { id: 'items', label: t.navItems, icon: Package },
    { id: 'records', label: t.navRecords, icon: Archive },
    { id: 'reports', label: 'Reports & GST', icon: BarChart3 },
    { id: 'brand', label: t.navBrandSub, icon: Sparkles },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 hidden md:block no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13">
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-1 lg:space-x-2 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badgeCount ? item.badgeCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Quick Create Button */}
          <div className="pl-4 shrink-0">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.createInvoice}</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
