import React, { useState } from 'react';
import { 
  Package, 
  Car, 
  FileSpreadsheet, 
  Settings, 
  Crown, 
  ChevronRight, 
  Plus, 
  MapPin, 
  ArrowUpRight, 
  ShieldCheck, 
  Download,
  Smartphone,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Item, BusinessProfile, Subscription, Invoice } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { exportGstr1Json, exportInvoicesToCsv } from '../../services/exportService';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface FleetAndMoreViewProps {
  items: Item[];
  profile: BusinessProfile;
  subscription: Subscription;
  invoices: Invoice[];
  onSaveItem: (item: Item) => void;
  onNavigateToReports: () => void;
  onNavigateToSettings: () => void;
  onNavigateToBrand: () => void;
  onOpenCreateInvoice: () => void;
}

export const FleetAndMoreView: React.FC<FleetAndMoreViewProps> = ({
  items,
  profile,
  subscription,
  invoices,
  onSaveItem,
  onNavigateToReports,
  onNavigateToSettings,
  onNavigateToBrand,
  onOpenCreateInvoice,
}) => {
  const [activeSection, setActiveSection] = useState<'packages' | 'vehicles' | 'reports'>('packages');

  // Quick state for adding a vehicle or package
  const [showAddPackageModal, setShowAddPackageModal] = useState<boolean>(false);
  const [pkgName, setPkgName] = useState<string>('');
  const [pkgSac, setPkgSac] = useState<string>('996412');
  const [pkgPriceRupees, setPkgPriceRupees] = useState<string>('');
  const [pkgTaxRate, setPkgTaxRate] = useState<number>(5);

  // Default Taxi presets if catalog is empty
  const taxiPackages = items.filter(i => i.hsnSac.startsWith('9964') || i.hsnSac.startsWith('9966') || i.name.toLowerCase().includes('km') || i.name.toLowerCase().includes('trip') || i.name.toLowerCase().includes('transfer'));
  const otherItems = items.filter(i => !taxiPackages.includes(i));

  // Extract saved vehicles from invoices
  const savedVehicles = Array.from(new Set(
    invoices
      .map(inv => inv.tripDetails?.vehicleNumber)
      .filter((v): v is string => !!v && v.trim().length > 3)
  ));

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;

    const pricePaise = Math.round((parseFloat(pkgPriceRupees) || 0) * 100);
    const newItem: Item = {
      id: `itm_${Date.now()}`,
      businessId: 'biz_01',
      name: pkgName.trim(),
      hsnSac: pkgSac.trim(),
      unit: 'trips',
      defaultTaxRate: pkgTaxRate,
      defaultPricePaise: pricePaise,
      description: 'Standard travel & taxi package'
    };

    onSaveItem(newItem);
    setPkgName('');
    setPkgPriceRupees('');
    setShowAddPackageModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Fleet Management & Operations
              </span>
              <span className="text-xs text-slate-300">
                {profile.tradeName || profile.legalName}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1 text-white">
              Fleet, Packages & Tax Reports
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Configure standard cab routes, vehicle duty presets, GSTR-1 summaries, and company settings.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
              onClick={onNavigateToSettings}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Settings
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs"
              onClick={() => setShowAddPackageModal(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + Add Package
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Packages | Vehicles | GST Reports | Settings Shortcut */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('packages')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSection === 'packages'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          Service Packages ({taxiPackages.length + otherItems.length})
        </button>

        <button
          onClick={() => setActiveSection('vehicles')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSection === 'vehicles'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Car className="w-4 h-4" />
          Fleet Vehicles ({savedVehicles.length})
        </button>

        <button
          onClick={() => setActiveSection('reports')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSection === 'reports'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          GST & Tax Reports
        </button>

        <button
          onClick={onNavigateToBrand}
          className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5"
        >
          <Crown className="w-3.5 h-3.5" />
          Pro Plan & Branding
        </button>
      </div>

      {/* SECTION 1: PACKAGES & TARIFFS */}
      {activeSection === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-950">Pre-Configured Taxi & Cab Tariffs</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold"
              onClick={() => setShowAddPackageModal(true)}
            >
              + New Custom Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Standard Taxi Presets */}
            {[
              { name: 'Airport Transfer (Point-to-Point)', sac: '996412', rate: '5%', desc: 'Standard airport pickup/drop with toll pure agent' },
              { name: 'Local 8 Hours / 80 Kilometers', sac: '996412', rate: '5%', desc: 'City darshan / local corporate package' },
              { name: 'Outstation Round Trip (Per KM)', sac: '996412', rate: '5%', desc: 'Min 250 KM/day with night driver halt' },
              { name: 'Corporate Cab Monthly Retainer', sac: '996601', rate: '18%', desc: 'Rental of road vehicles with operator (With ITC)' },
              { name: 'Railway Station Drop / Pick', sac: '996412', rate: '5%', desc: 'Fixed local station transfer' },
              { name: 'Luxury Bus / Tempo Traveller Outstation', sac: '996412', rate: '5%', desc: '12-26 Seater Group Tourism Package' },
            ].map((preset, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                      SAC {preset.sac}
                    </span>
                    <Badge variant="teal">{preset.rate} GST</Badge>
                  </div>
                  <h3 className="font-bold text-navy-950 text-sm mt-2">{preset.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{preset.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Standard Taxi Slab</span>
                  <button
                    onClick={onOpenCreateInvoice}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    Use in Bill <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Custom Saved Items */}
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-navy-700 bg-slate-100 px-2 py-0.5 rounded">
                      SAC {item.hsnSac}
                    </span>
                    <Badge variant="emerald">{item.defaultTaxRate}% GST</Badge>
                  </div>
                  <h3 className="font-bold text-navy-950 text-sm mt-2">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.description || 'Custom service item'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-navy-950 tabular-nums">
                    {formatPaiseToRupees(item.defaultPricePaise)}
                  </span>
                  <button
                    onClick={onOpenCreateInvoice}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    Select <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: FLEET VEHICLES */}
      {activeSection === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-950">Active Fleet Vehicles</h2>
              <p className="text-xs text-slate-500">Vehicles actively used on duty slips and tax invoices</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-bold"
              onClick={onOpenCreateInvoice}
            >
              + Create Bill with Vehicle
            </Button>
          </div>

          {savedVehicles.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <Car className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Vehicles Logged Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vehicles entered during invoice generation (e.g. UP65-XX-1234) automatically save here for quick auto-complete.
              </p>
              <Button size="sm" onClick={onOpenCreateInvoice}>
                Create First Cab Invoice
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {savedVehicles.map((vehicleNo, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-navy-950">{vehicleNo}</span>
                      <p className="text-[11px] text-slate-500">Commercial Cab / Fleet</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: GST & TAX REPORTS */}
      {activeSection === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-950">Official GST Compliance Reports</h2>
              <p className="text-xs text-slate-500">Government-ready GSTR-1, GSTR-3B summaries, and CA spreadsheets</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToReports}
              className="text-xs font-bold"
            >
              Open Full Reports Hub <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-950 text-sm">GSTR-1 JSON Export</span>
                <Badge variant="teal">Official Govt Schema</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Standard B2B, B2C, SAC 9964 summary table formatted for direct upload to GST Portal (gst.gov.in).
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold"
                onClick={() => exportGstr1Json(invoices, profile)}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download GSTR-1 JSON
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-950 text-sm">Sales Register (Excel/CSV)</span>
                <Badge variant="emerald">Chartered Accountant Ready</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Itemized invoice register with Party GSTIN, Taxable Base, CGST, SGST, IGST, and Rule 33 Toll breakdown.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold"
                onClick={() => exportInvoicesToCsv(invoices)}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export Sales CSV
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-950 text-sm">Fleet Audit Trail</span>
                <Badge variant="slate">Immutable Log</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Time-stamped history of all issued, cancelled, and payment-recorded invoices for audit defense.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold"
                onClick={onNavigateToReports}
              >
                View Audit Trail
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Service Package */}
      {showAddPackageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-black text-lg text-navy-950">Add Fleet Service Package</h3>
            
            <form onSubmit={handleAddPackage} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Package Name / Route</label>
                <input
                  type="text"
                  placeholder="e.g. Airport to Kashi Vishwanath Darshan"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium mt-1 focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">SAC Code</label>
                  <select
                    value={pkgSac}
                    onChange={(e) => setPkgSac(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium mt-1 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="996412">996412 (Taxi Services)</option>
                    <option value="996601">996601 (Cab Rental with Driver)</option>
                    <option value="998311">998311 (General Services)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">GST Rate (%)</label>
                  <select
                    value={pkgTaxRate}
                    onChange={(e) => setPkgTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium mt-1 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value={0}>0% (Non-GST / Exempt)</option>
                    <option value={5}>5% (Passenger Transport without ITC)</option>
                    <option value={12}>12% (Transport with ITC)</option>
                    <option value={18}>18% (Commercial Rental / B2B)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Default Rate (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={pkgPriceRupees}
                  onChange={(e) => setPkgPriceRupees(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium mt-1 focus:ring-2 focus:ring-teal-500 outline-none tabular-nums"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPackageModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Package
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
