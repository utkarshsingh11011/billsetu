import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  PlusCircle, 
  ScanLine, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { Invoice, Party, Item, ScannedDocument } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  parties: Party[];
  items: Item[];
  scans: ScannedDocument[];
  onNavigate: (tab: string) => void;
  onSelectInvoice: (inv: Invoice) => void;
  onOpenCreate: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  invoices,
  parties,
  items,
  onNavigate,
  onSelectInvoice,
  onOpenCreate,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search matches
  const matchedInvoices = cleanQuery 
    ? invoices.filter(i => 
        i.invoiceNumber.toLowerCase().includes(cleanQuery) || 
        i.party.name.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : [];

  const matchedParties = cleanQuery
    ? parties.filter(p => 
        p.name.toLowerCase().includes(cleanQuery) || 
        (p.gstin || '').toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const matchedItems = cleanQuery
    ? items.filter(i => 
        i.name.toLowerCase().includes(cleanQuery) || 
        i.hsnSac.includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const quickActions = [
    { label: 'Create Sales Invoice', action: () => { onClose(); onOpenCreate(); }, icon: PlusCircle },
    { label: 'Scan a Bill (Scan-to-Books)', action: () => { onClose(); onNavigate('scan'); }, icon: ScanLine },
    { label: 'Financial Reports & GST ITC', action: () => { onClose(); onNavigate('reports'); }, icon: BarChart3 },
    { label: 'Brand & Pro Plan Settings', action: () => { onClose(); onNavigate('brand'); }, icon: Sparkles },
    { label: 'Business Profile & Bank Details', action: () => { onClose(); onNavigate('settings'); }, icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        
        {/* Search input header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices, customers, items, or actions (Ctrl+K)..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3 divide-y divide-slate-100 text-xs">
          
          {/* Quick Actions (when query is empty or matches) */}
          {(!cleanQuery || 'create scan report invoice'.includes(cleanQuery)) && (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1 block">
                Quick Actions
              </span>
              <div className="space-y-0.5">
                {quickActions.map((qa, idx) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={idx}
                      onClick={qa.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 text-slate-800 font-medium transition-colors text-left group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-teal-600" />
                        <span>{qa.label}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Invoices */}
          {matchedInvoices.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1 block">
                Invoices ({matchedInvoices.length})
              </span>
              <div className="space-y-0.5">
                {matchedInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      onClose();
                      onSelectInvoice(inv);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="font-semibold">{inv.party.name}</span>
                        <span className="text-[11px] text-slate-400 block">{inv.invoiceNumber} • {inv.invoiceDate}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatPaiseToRupees(inv.grandTotalPaise)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Parties */}
          {matchedParties.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1 block">
                Customers & Suppliers ({matchedParties.length})
              </span>
              <div className="space-y-0.5">
                {matchedParties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onNavigate('parties');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-[11px] text-slate-400 block">{p.city}, {p.state} {p.gstin ? `• ${p.gstin}` : ''}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold uppercase">{p.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Catalog Items */}
          {matchedItems.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1 block">
                Items ({matchedItems.length})
              </span>
              <div className="space-y-0.5">
                {matchedItems.map((itm) => (
                  <button
                    key={itm.id}
                    onClick={() => {
                      onClose();
                      onNavigate('items');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="font-semibold">{itm.name}</span>
                        <span className="text-[11px] text-slate-400 block">HSN: {itm.hsnSac} • {itm.defaultTaxRate}% GST</span>
                      </div>
                    </div>
                    <span className="font-bold text-teal-700">{formatPaiseToRupees(itm.defaultPricePaise)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press <strong>ESC</strong> to close</span>
          <span>Tip: Press <strong>Ctrl + K</strong> anytime</span>
        </div>

      </div>
    </div>
  );
};
