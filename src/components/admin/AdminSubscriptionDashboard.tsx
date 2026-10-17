import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Crown, 
  Sparkles, 
  TrendingUp, 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Edit3, 
  MoreVertical, 
  ExternalLink, 
  ShieldCheck, 
  DollarSign, 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowLeft,
  X,
  FileText,
  Sliders,
  Percent,
  Check,
  Building2,
  Mail,
  Phone,
  Zap,
  Tag,
  Activity,
  Award,
  Layers,
  Send,
  Eye
} from 'lucide-react';
import { 
  AdminTenant, 
  AdminPromoCoupon, 
  AdminSubscriptionTransaction, 
  AdminPricingTier, 
  AdminPlanTierId, 
  AdminSubscriptionStatus 
} from '../../types';
import { storageService } from '../../services/storageService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

export interface AdminSubscriptionDashboardProps {
  onBackToApp: () => void;
  onViewShowcase: () => void;
}

export const AdminSubscriptionDashboard: React.FC<AdminSubscriptionDashboardProps> = ({
  onBackToApp,
  onViewShowcase,
}) => {
  // Navigation Tabs inside Admin
  const [activeAdminTab, setActiveAdminTab] = useState<'tenants' | 'plans' | 'coupons' | 'transactions' | 'analytics'>('tenants');

  // Tenant state loaded from storageService
  const [tenants, setTenants] = useState<AdminTenant[]>(() => storageService.getAdminTenants());
  const [pricingTiers, setPricingTiers] = useState<AdminPricingTier[]>(() => storageService.getAdminPricingTiers());
  const [promoCodes, setPromoCodes] = useState<AdminPromoCoupon[]>(() => storageService.getAdminPromoCodes());
  const [transactions, setTransactions] = useState<AdminSubscriptionTransaction[]>(() => storageService.getAdminTransactions());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [editingTenant, setEditingTenant] = useState<AdminTenant | null>(null);
  const [isNewCouponModalOpen, setIsNewCouponModalOpen] = useState<boolean>(false);
  const [editingTier, setEditingTier] = useState<AdminPricingTier | null>(null);
  const [selectedInvoiceTxn, setSelectedInvoiceTxn] = useState<AdminSubscriptionTransaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form states for new coupon
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'flat'>('percent');
  const [newCouponValue, setNewCouponValue] = useState<number>(20);
  const [newCouponMaxRedemptions, setNewCouponMaxRedemptions] = useState<number>(100);
  const [newCouponExpiry, setNewCouponExpiry] = useState<string>('2026-12-31');
  const [newCouponDesc, setNewCouponDesc] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Format Currency
  const formatInr = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(paise / 100);
  };

  // High-level KPI Computations
  const kpiData = useMemo(() => {
    const totalTenants = tenants.length;
    const paidTenants = tenants.filter(t => t.plan !== 'starter_free' && t.status === 'active').length;
    
    // Total MRR in paise
    const totalMrrPaise = tenants.reduce((acc, t) => {
      if (t.status === 'active' || t.status === 'grace_period') {
        return acc + t.mrrPaise;
      }
      return acc;
    }, 0);

    const totalArrPaise = totalMrrPaise * 12;

    const totalScansUsed = tenants.reduce((acc, t) => acc + t.scanQuotaUsed, 0);
    const totalScansLimit = tenants.reduce((acc, t) => acc + t.scanQuotaLimit, 0);

    const churnCount = tenants.filter(t => t.status === 'cancelled' || t.status === 'past_due').length;
    const churnRate = totalTenants > 0 ? ((churnCount / totalTenants) * 100).toFixed(1) : '0.0';

    return {
      totalTenants,
      paidTenants,
      totalMrrPaise,
      totalArrPaise,
      totalScansUsed,
      totalScansLimit,
      churnRate
    };
  }, [tenants]);

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = 
        t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.gstin.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan = filterPlan === 'all' || t.plan === filterPlan;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [tenants, searchQuery, filterPlan, filterStatus]);

  // Handle Tenant Edit Save
  const handleSaveTenant = (updated: AdminTenant) => {
    storageService.saveAdminTenant(updated);
    setTenants(storageService.getAdminTenants());
    setEditingTenant(null);
    showToast(`Updated subscription terms for ${updated.businessName}`);
  };

  // Quick Action: Extend subscription by 30 days
  const handleQuickExtend30Days = (t: AdminTenant) => {
    const current = new Date(t.renewalDate || Date.now());
    current.setDate(current.getDate() + 30);
    const updated: AdminTenant = {
      ...t,
      renewalDate: current.toISOString().split('T')[0],
      status: 'active'
    };
    storageService.saveAdminTenant(updated);
    setTenants(storageService.getAdminTenants());
    showToast(`Extended ${t.businessName} subscription by +30 days (New date: ${updated.renewalDate})`);
  };

  // Quick Action: Grant +100 OCR scans
  const handleGrantBonusScans = (t: AdminTenant) => {
    const updated: AdminTenant = {
      ...t,
      scanQuotaLimit: t.scanQuotaLimit + 100
    };
    storageService.saveAdminTenant(updated);
    setTenants(storageService.getAdminTenants());
    showToast(`Granted +100 bonus OCR scans to ${t.businessName}`);
  };

  // Quick Action: Toggle Status
  const handleToggleTenantStatus = (t: AdminTenant, newStatus: AdminSubscriptionStatus) => {
    const updated: AdminTenant = {
      ...t,
      status: newStatus
    };
    storageService.saveAdminTenant(updated);
    setTenants(storageService.getAdminTenants());
    showToast(`Status changed to "${newStatus}" for ${t.businessName}`);
  };

  // Handle Create Coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const coupon: AdminPromoCoupon = {
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: newCouponType === 'percent' ? Number(newCouponValue) : Number(newCouponValue) * 100, // paise if flat
      maxRedemptions: Number(newCouponMaxRedemptions),
      timesRedeemed: 0,
      expiresAt: newCouponExpiry,
      isActive: true,
      description: newCouponDesc || `${newCouponCode.toUpperCase()} promo code`,
      applicablePlan: 'all'
    };

    storageService.saveAdminPromoCode(coupon);
    setPromoCodes(storageService.getAdminPromoCodes());
    setIsNewCouponModalOpen(false);
    setNewCouponCode('');
    setNewCouponDesc('');
    showToast(`Coupon ${coupon.code} created successfully!`);
  };

  // Handle Toggle Coupon Status
  const handleToggleCouponActive = (c: AdminPromoCoupon) => {
    const updated: AdminPromoCoupon = {
      ...c,
      isActive: !c.isActive
    };
    storageService.saveAdminPromoCode(updated);
    setPromoCodes(storageService.getAdminPromoCodes());
    showToast(`Coupon ${c.code} is now ${updated.isActive ? 'Active' : 'Deactivated'}`);
  };

  // Handle Delete Coupon
  const handleDeleteCoupon = (code: string) => {
    storageService.deleteAdminPromoCode(code);
    setPromoCodes(storageService.getAdminPromoCodes());
    showToast(`Coupon ${code} removed.`);
  };

  // Handle Pricing Tier Save
  const handleSaveTier = (tier: AdminPricingTier) => {
    storageService.saveAdminPricingTier(tier);
    setPricingTiers(storageService.getAdminPricingTiers());
    setEditingTier(null);
    showToast(`Updated pricing config for ${tier.name}`);
  };

  // Export Tenants CSV
  const handleExportTenantsCsv = () => {
    const headers = ['Business Name', 'Owner', 'Email', 'Phone', 'GSTIN', 'State', 'Plan', 'Status', 'MRR (₹)', 'Renewal Date', 'Invoices', 'Scans Used', 'Scans Limit'];
    const rows = tenants.map(t => [
      `"${t.businessName}"`,
      `"${t.ownerName}"`,
      t.ownerEmail,
      t.ownerPhone,
      t.gstin,
      `"${t.state}"`,
      t.plan,
      t.status,
      (t.mrrPaise / 100).toFixed(2),
      t.renewalDate,
      t.invoicesGenerated,
      t.scanQuotaUsed,
      t.scanQuotaLimit
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `billsetu_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported subscribers CSV successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-teal-300 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP HEADER & PORTAL SWITCHER */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-[#0C2B62] border-b border-[#17396E] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Portal Identity */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo_icon.png" 
                alt="BillSetu Logo" 
                className="w-9 h-9 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight flex items-baseline">
                    <span className="text-white">Bill</span>
                    <span className="text-[#19B0A0]">Setu</span>
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs">
                    SuperAdmin
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 hidden sm:block">
                  SaaS Subscription & Tenant Management Console
                </p>
              </div>
            </div>

            {/* Top Switcher Actions */}
            <div className="flex items-center gap-2.5">
              
              <button
                onClick={onViewShowcase}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="View the public marketing & features landing page"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Feature Showcase</span>
              </button>

              <button
                onClick={handleExportTenantsCsv}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export CSV</span>
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={onBackToApp}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
              >
                Billing Workspace
              </Button>

            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* ========================================================= */}
        {/* 2. EXECUTIVE METRICS & KPI STRIP */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* MRR */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Monthly Recurring (MRR)</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14.2%
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {formatInr(kpiData.totalMrrPaise)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">ARR: {formatInr(kpiData.totalArrPaise)}</p>
          </div>

          {/* Active Paid Tenants */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Paid Tenants</span>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-teal-400 font-mono">
              {kpiData.paidTenants}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">of {kpiData.totalTenants} total businesses</p>
          </div>

          {/* Average Revenue per Account (ARPU) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Blended ARPU</span>
              <DollarSign className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {kpiData.paidTenants > 0 ? formatInr(Math.round(kpiData.totalMrrPaise / kpiData.paidTenants)) : '₹0'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Per paid tenant / month</p>
          </div>

          {/* OCR Engine Load */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>OCR Scans Consumed</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {kpiData.totalScansUsed.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">of {kpiData.totalScansLimit.toLocaleString()} quota pool</p>
          </div>

          {/* Net Churn Rate */}
          <div className="col-span-2 md:col-span-1 p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Monthly Churn</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {kpiData.churnRate}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Benchmark: &lt; 2.5% healthy</p>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 3. ADMIN TABS NAVIGATION */}
        {/* ========================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {[
              { id: 'tenants', label: 'Subscribers & Tenants', count: tenants.length, icon: Users },
              { id: 'plans', label: 'Pricing & Plans', count: pricingTiers.length, icon: Layers },
              { id: 'coupons', label: 'Promo Coupons', count: promoCodes.length, icon: Tag },
              { id: 'transactions', label: 'Revenue Ledger', count: transactions.length, icon: CreditCard },
              { id: 'analytics', label: 'Growth Cohorts', icon: Activity },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeAdminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-slate-950 text-teal-400 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeAdminTab === 'coupons' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewCouponModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
            >
              Create Promo Code
            </Button>
          )}

        </div>

        {/* ========================================================= */}
        {/* 4. TAB 1: SUBSCRIBERS & TENANTS TABLE */}
        {/* ========================================================= */}
        {activeAdminTab === 'tenants' && (
          <div className="space-y-4">
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search business, owner, GSTIN, city, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:border-teal-500 outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="starter_free">Starter Free</option>
                  <option value="pro_annual">Pro Business</option>
                  <option value="enterprise_fleet">Enterprise Fleet</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:border-teal-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="grace_period">Grace Period</option>
                  <option value="past_due">Past Due</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

            </div>

            {/* Tenants Data Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Business & Owner</th>
                      <th className="py-3 px-3">GSTIN / State</th>
                      <th className="py-3 px-3">Plan Tier</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">MRR Value</th>
                      <th className="py-3 px-3">Renewal Date</th>
                      <th className="py-3 px-3">Usage / Scans</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No tenants matched your search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map(t => {
                        const scanUsagePct = Math.min(100, Math.round((t.scanQuotaUsed / t.scanQuotaLimit) * 100));
                        return (
                          <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                            
                            {/* Business & Owner */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-white text-xs">{t.businessName}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{t.ownerName}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-500">{t.ownerPhone}</span>
                              </div>
                            </td>

                            {/* GSTIN & State */}
                            <td className="py-3 px-3">
                              <div className="font-mono text-teal-300 font-semibold text-[11px]">{t.gstin}</div>
                              <div className="text-[11px] text-slate-400">{t.state}</div>
                            </td>

                            {/* Plan Tier Badge */}
                            <td className="py-3 px-3">
                              {t.plan === 'enterprise_fleet' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                  <ShieldCheck className="w-3 h-3" /> Enterprise
                                </span>
                              ) : t.plan === 'pro_annual' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                                  <Crown className="w-3 h-3 text-amber-400" /> Pro Annual
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                                  Free Starter
                                </span>
                              )}
                              <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
                                {t.billingCycle}
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-3">
                              {t.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                                </span>
                              ) : t.status === 'trial' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                  Trial
                                </span>
                              ) : t.status === 'grace_period' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                  Grace Period
                                </span>
                              ) : t.status === 'past_due' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                  Past Due
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                  Cancelled
                                </span>
                              )}
                            </td>

                            {/* MRR */}
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-white">
                                {formatInr(t.mrrPaise)}
                              </span>
                              <span className="text-[10px] text-slate-500 block">/ mo</span>
                            </td>

                            {/* Renewal Date */}
                            <td className="py-3 px-3">
                              <div className="font-mono text-slate-300 text-[11px]">{t.renewalDate}</div>
                              <button
                                onClick={() => handleQuickExtend30Days(t)}
                                className="text-[10px] text-teal-400 hover:text-teal-300 hover:underline block mt-0.5"
                              >
                                +30 Days
                              </button>
                            </td>

                            {/* Usage Progress */}
                            <td className="py-3 px-3 min-w-[130px]">
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>{t.invoicesGenerated} bills</span>
                                <span className="font-mono">{t.scanQuotaUsed}/{t.scanQuotaLimit} scans</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${scanUsagePct > 80 ? 'bg-amber-400' : 'bg-teal-400'}`}
                                  style={{ width: `${scanUsagePct}%` }}
                                />
                              </div>
                            </td>

                            {/* Actions Button */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingTenant(t)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Edit Subscription Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                                </button>
                                
                                <button
                                  onClick={() => handleGrantBonusScans(t)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] font-bold"
                                  title="Add +100 OCR Scans"
                                >
                                  +100
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 5. TAB 2: PRICING TIERS CONFIGURATION */}
        {/* ========================================================= */}
        {activeAdminTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Configured Pricing Tiers</h3>
                <p className="text-xs text-slate-400">Manage plan pricing, OCR quotas, and customer feature entitlements.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingTiers.map(tier => (
                <div key={tier.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base">{tier.name}</h4>
                      {tier.badge && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{tier.tagline}</p>

                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">{formatInr(tier.annualPricePaise)}</span>
                        <span className="text-xs text-slate-400">/ year</span>
                      </div>
                      <span className="text-xs text-slate-500">Monthly: {formatInr(tier.monthlyPricePaise)}/mo</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <div className="font-semibold text-teal-300 text-[11px]">Includes:</div>
                      {tier.features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTier(tier)}
                      className="w-full text-xs text-teal-300 border-slate-700 hover:bg-slate-800"
                    >
                      Edit Tier Pricing & Entitlements
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. TAB 3: PROMO COUPONS */}
        {/* ========================================================= */}
        {activeAdminTab === 'coupons' && (
          <div className="space-y-4">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Redemptions</th>
                    <th className="py-3 px-3">Expires On</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-4 text-right">Toggle / Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {promoCodes.map(c => (
                    <tr key={c.code} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-300 text-sm">
                        {c.code}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `${formatInr(c.discountValue)} FLAT OFF`}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-300">{c.timesRedeemed} / {c.maxRedemptions}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {c.expiresAt}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                        {c.description}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleCouponActive(c)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white"
                          >
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. TAB 4: REVENUE & TRANSACTIONS */}
        {/* ========================================================= */}
        {activeAdminTab === 'transactions' && (
          <div className="space-y-4">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-3">Subscriber Business</th>
                    <th className="py-3 px-3">Plan / Cycle</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Gateway</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">SaaS Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-teal-400 font-bold">
                        {txn.id}
                        <div className="text-[10px] text-slate-500 font-normal">{txn.gatewayTxnId}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{txn.tenantName}</div>
                        <div className="text-[10px] text-slate-500">{txn.ownerEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {txn.planName}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {formatInr(txn.amountPaise)}
                      </td>
                      <td className="py-3 px-3 uppercase font-mono text-[10px] text-slate-400">
                        {txn.gateway}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {txn.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          txn.status === 'succeeded' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceTxn(txn)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{txn.invoiceNumber}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8. TAB 5: GROWTH & COHORT ANALYTICS */}
        {/* ========================================================= */}
        {activeAdminTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Revenue by Plan Tier */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-base">MRR Distribution by Plan</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Enterprise Fleet (₹3,499/yr)</span>
                    <span className="font-mono text-teal-400 font-bold">58% (₹1,07,010 / mo)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full w-[58%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Pro Business (₹999/yr)</span>
                    <span className="font-mono text-teal-400 font-bold">42% (₹77,490 / mo)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full w-[42%]" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                Enterprise fleet tier contributes majority of MRR with highest average customer lifetime value (LTV: ₹18,400+).
              </div>
            </div>

            {/* Retention & Funnel */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-base">Subscriber Conversion Funnel</h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg flex justify-between items-center">
                  <span className="text-slate-300">Registered Businesses</span>
                  <span className="font-mono font-bold text-white">1,240 Businesses (100%)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg flex justify-between items-center">
                  <span className="text-slate-300">Generated &gt; 5 Invoices</span>
                  <span className="font-mono font-bold text-white">812 Businesses (65.4%)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg flex justify-between items-center">
                  <span className="text-slate-300">Upgraded to Paid (Pro/Fleet)</span>
                  <span className="font-mono font-bold text-teal-400">148 Paid (11.9% Conversion)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg flex justify-between items-center">
                  <span className="text-slate-300">Annual Renewal Rate</span>
                  <span className="font-mono font-bold text-emerald-400">92.6% Retention</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 9. EDIT TENANT SUBSCRIPTION MODAL */}
      {/* ========================================================= */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 text-slate-200 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Manage Subscription: {editingTenant.businessName}
                </h3>
                <p className="text-xs text-slate-400">GSTIN: {editingTenant.gstin} • {editingTenant.state}</p>
              </div>
              <button onClick={() => setEditingTenant(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Plan & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subscription Plan</label>
                  <select
                    value={editingTenant.plan}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan: e.target.value as AdminPlanTierId })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="starter_free">Starter Free (₹0)</option>
                    <option value="pro_annual">Pro Business (₹999/yr)</option>
                    <option value="enterprise_fleet">Enterprise Fleet (₹3,499/yr)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editingTenant.status}
                    onChange={(e) => setEditingTenant({ ...editingTenant, status: e.target.value as AdminSubscriptionStatus })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="grace_period">Grace Period</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Renewal Date & Quota */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Renewal Expiry Date</label>
                  <input
                    type="date"
                    value={editingTenant.renewalDate}
                    onChange={(e) => setEditingTenant({ ...editingTenant, renewalDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">OCR Scan Limit Quota</label>
                  <input
                    type="number"
                    value={editingTenant.scanQuotaLimit}
                    onChange={(e) => setEditingTenant({ ...editingTenant, scanQuotaLimit: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Feature Flags */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-white block">Feature Entitlements</span>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Custom Branding & Watermark Removal</span>
                  <input
                    type="checkbox"
                    checked={editingTenant.customBranding}
                    onChange={(e) => setEditingTenant({ ...editingTenant, customBranding: e.target.checked })}
                    className="accent-teal-400 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span>Direct WhatsApp Bill Sharing</span>
                  <input
                    type="checkbox"
                    checked={editingTenant.whatsappEnabled}
                    onChange={(e) => setEditingTenant({ ...editingTenant, whatsappEnabled: e.target.checked })}
                    className="accent-teal-400 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span>Developer API & Webhook Access</span>
                  <input
                    type="checkbox"
                    checked={editingTenant.apiAccess}
                    onChange={(e) => setEditingTenant({ ...editingTenant, apiAccess: e.target.checked })}
                    className="accent-teal-400 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Admin CRM Notes</label>
                <textarea
                  rows={2}
                  value={editingTenant.notes || ''}
                  onChange={(e) => setEditingTenant({ ...editingTenant, notes: e.target.value })}
                  placeholder="Special SLA notes, payment promises, or key contact info..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setEditingTenant(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveTenant(editingTenant)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
              >
                Save Subscription Terms
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. CREATE PROMO COUPON MODAL */}
      {/* ========================================================= */}
      {isNewCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCoupon} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Create Promotional Coupon</h3>
              <button type="button" onClick={() => setIsNewCouponModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE50"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Rupees (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={newCouponMaxRedemptions}
                    onChange={(e) => setNewCouponMaxRedemptions(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newCouponExpiry}
                    onChange={(e) => setNewCouponExpiry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description / Campaign Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali promotional 50% discount"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCouponModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold">
                Activate Coupon
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. SAAS SUBSCRIPTION TAX INVOICE PREVIEW MODAL */}
      {/* ========================================================= */}
      {selectedInvoiceTxn && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <img src="/logo_icon.png" alt="BillSetu" className="w-8 h-8 rounded-lg" />
                <span className="font-extrabold text-slate-900 text-base">BillSetu Technologies Private Limited</span>
              </div>
              <button onClick={() => setSelectedInvoiceTxn(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 font-sans">
              <div className="flex justify-between border-b pb-2">
                <div>
                  <span className="font-bold text-slate-800 block">TAX INVOICE FOR SOFTWARE SUBSCRIPTION</span>
                  <span className="text-[11px] text-slate-500 font-mono">Invoice #{selectedInvoiceTxn.invoiceNumber}</span>
                  <span className="text-[11px] text-slate-500 block">SAC: 998434 (Software as a Service)</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Date: {selectedInvoiceTxn.timestamp}</span>
                  <Badge variant="teal" size="sm">PAID</Badge>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block">Billed To:</span>
                <span className="font-bold text-slate-900">{selectedInvoiceTxn.tenantName}</span>
                <span className="text-[11px] text-slate-500 block">{selectedInvoiceTxn.ownerEmail}</span>
              </div>

              <table className="w-full text-xs border">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Taxable</th>
                    <th className="p-2 text-right">GST (18%)</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2">{selectedInvoiceTxn.planName}</td>
                    <td className="p-2 text-right">{formatInr(Math.round(selectedInvoiceTxn.amountPaise / 1.18))}</td>
                    <td className="p-2 text-right">{formatInr(Math.round(selectedInvoiceTxn.amountPaise - (selectedInvoiceTxn.amountPaise / 1.18)))}</td>
                    <td className="p-2 text-right font-bold">{formatInr(selectedInvoiceTxn.amountPaise)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-[11px] text-slate-500 pt-2 border-t">
                Payment Gateway: <strong>{selectedInvoiceTxn.gateway.toUpperCase()}</strong> (Txn Ref: {selectedInvoiceTxn.gatewayTxnId})
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoiceTxn(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. EDIT PRICING TIER MODAL */}
      {/* ========================================================= */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit Tier: {editingTier.name}</h3>
              <button onClick={() => setEditingTier(null)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={editingTier.tagline}
                  onChange={(e) => setEditingTier({ ...editingTier, tagline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Annual Price (₹)</label>
                  <input
                    type="number"
                    value={editingTier.annualPricePaise / 100}
                    onChange={(e) => setEditingTier({ ...editingTier, annualPricePaise: Number(e.target.value) * 100 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={editingTier.monthlyPricePaise / 100}
                    onChange={(e) => setEditingTier({ ...editingTier, monthlyPricePaise: Number(e.target.value) * 100 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Annual Scan Limit</label>
                <input
                  type="number"
                  value={editingTier.scanLimit}
                  onChange={(e) => setEditingTier({ ...editingTier, scanLimit: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Badge Callout (optional)</label>
                <input
                  type="text"
                  value={editingTier.badge || ''}
                  onChange={(e) => setEditingTier({ ...editingTier, badge: e.target.value })}
                  placeholder="e.g. Most Popular"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setEditingTier(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveTier(editingTier)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
              >
                Save Tier Changes
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
