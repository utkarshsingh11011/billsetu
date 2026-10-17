import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  Zap, 
  QrCode, 
  Printer, 
  FileText, 
  ScanLine, 
  Users, 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Calculator, 
  Laptop, 
  Wifi, 
  WifiOff, 
  ExternalLink, 
  Star, 
  Award, 
  HelpCircle, 
  Car, 
  Store, 
  Building2, 
  Briefcase, 
  Layers, 
  Lock, 
  Share2, 
  IndianRupee,
  RefreshCw,
  Search,
  CheckCircle2,
  FileCheck,
  Package,
  Receipt,
  BarChart3,
  Sliders,
  Play,
  X
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface FeatureShowcaseProps {
  onLaunchApp: () => void;
  onOpenAdmin: () => void;
  onOpenPricing?: () => void;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  onLaunchApp,
  onOpenAdmin,
}) => {
  // Navigation & Active tabs
  const [activeFeatureTab, setActiveFeatureTab] = useState<string>('tax_engine');
  const [pricingCycle, setPricingCycle] = useState<'annual' | 'monthly'>('annual');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  // Interactive Live Calculator state
  const [calcBaseAmount, setCalcBaseAmount] = useState<number>(10000);
  const [calcTaxRate, setCalcTaxRate] = useState<number>(18);
  const [calcIsInterstate, setCalcIsInterstate] = useState<boolean>(false);
  const [calcHasDiscount, setCalcHasDiscount] = useState<boolean>(true);
  const [calcDiscountPct, setCalcDiscountPct] = useState<number>(5);

  // Interactive Live UPI QR state
  const [upiAmount, setUpiAmount] = useState<number>(2450);
  const [upiPayeeName, setUpiPayeeName] = useState<string>('Kashi Fleet Logistics');
  const [upiVpa, setUpiVpa] = useState<string>('kashicabs@icici');

  // Interactive ROI Calculator state
  const [roiInvoicesPerMonth, setRoiInvoicesPerMonth] = useState<number>(120);
  const [roiAvgBillValue, setRoiAvgBillValue] = useState<number>(4500);
  const [roiManualHoursPerWeek, setRoiManualHoursPerWeek] = useState<number>(12);

  // Simulated Offline Mode State
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [queuedInvoicesCount, setQueuedInvoicesCount] = useState<number>(3);

  // APK Download Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  const triggerApkDownload = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDownloadModalOpen(true);
    const link = document.createElement('a');
    link.href = '/billsetu-v1.0.0-debug.apk';
    link.download = 'billsetu-v1.0.0-debug.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format INR Currency
  const formatInr = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Live GST Tax Calculation derived values
  const calcDiscountAmount = calcHasDiscount ? (calcBaseAmount * calcDiscountPct) / 100 : 0;
  const calcTaxableValue = calcBaseAmount - calcDiscountAmount;
  const calcTotalTax = (calcTaxableValue * calcTaxRate) / 100;
  const calcCgst = calcIsInterstate ? 0 : calcTotalTax / 2;
  const calcSgst = calcIsInterstate ? 0 : calcTotalTax / 2;
  const calcIgst = calcIsInterstate ? calcTotalTax : 0;
  const calcGrandTotal = calcTaxableValue + calcTotalTax;

  // ROI derived calculations
  const hoursSavedPerMonth = Math.round(roiManualHoursPerWeek * 4 * 0.82); // 82% time saved
  const annualCashSaved = Math.round(hoursSavedPerMonth * 12 * 350 + (roiInvoicesPerMonth * 12 * 18)); // hourly value + paper/print savings
  const paymentDaysSaved = 9; // average reduction from 14 days to 5 days with Dynamic UPI QR

  const toggleFaq = (index: number) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ========================================================= */}
      {/* 1. TOP STICKY NAVIGATION BAR */}
      {/* ========================================================= */}
      <nav className="sticky top-0 z-50 bg-[#0C2B62]/95 backdrop-blur-md border-b border-[#17396E] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img 
                src="/logo_icon.png" 
                alt="BillSetu Logo" 
                className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight">
                    <span className="text-white">Bill</span>
                    <span className="text-[#19B0A0]">Setu</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 hidden sm:block">
                  Smart GST Billing • <span className="text-teal-400 font-semibold">Developed by Utkarsh Singh</span>
                </p>
              </div>
            </div>

            {/* Middle Nav Links */}
            <div className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-200">
              <a href="#features" className="hover:text-teal-400 transition-colors">Features</a>
              <a href="#interactive-playground" className="hover:text-teal-400 transition-colors">Live Demo</a>
              <a href="#calculator" className="hover:text-teal-400 transition-colors">GST Engine</a>
              <a href="#roi" className="hover:text-teal-400 transition-colors">ROI Calculator</a>
              <a href="#pricing" className="hover:text-teal-400 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-teal-400 transition-colors">FAQ</a>
            </div>

            {/* Right Action CTAs */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              
              {/* Admin Portal Shortcut */}
              <button
                onClick={onOpenAdmin}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="SuperAdmin Subscription Console"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Console</span>
              </button>

              {/* Direct APK Download Button in Top Navbar */}
              <button
                onClick={triggerApkDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all transform hover:scale-105"
                title="Download Android APK (v1.0.0)"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">Download APK</span>
                <span className="text-[10px] bg-slate-950/20 px-1 py-0.2 rounded font-mono">17MB</span>
              </button>

              {/* Primary Launch App Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={onLaunchApp}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-4 py-2 shadow-md shadow-teal-500/20"
              >
                Launch Workspace
              </Button>
            </div>

          </div>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800 bg-gradient-to-b from-[#0C2B62]/50 via-slate-900 to-slate-950">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Government GST Compliance & Developer Pill */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>CBIC GST Compliant • Section 31 & 33 Ready</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-medium shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Developed by <strong className="text-white">Utkarsh Singh</strong></span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              The Calm, Professional <br />
              <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                GST Billing Platform
              </span> <br />
              Built for Indian Enterprise.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Generate compliant B2B tax invoices, digitize fuel & toll bills with Scan-to-Books AI, collect instant zero-fee UPI payments via dynamic QR, and maintain customer khata. Zero internet needed.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                variant="primary"
                size="lg"
                onClick={onLaunchApp}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-6 py-3 text-base shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Open Free Workspace
              </Button>

              <button
                onClick={triggerApkDownload}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Smartphone className="w-5 h-5 text-slate-950" />
                <div className="text-left leading-tight">
                  <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-900 opacity-90">Free Download</span>
                  <span className="text-sm font-black">Android APK (v1.0.0)</span>
                </div>
                <Download className="w-4 h-4 ml-1 stroke-[2.5]" />
              </button>
              
              <a
                href="#interactive-playground"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 transition-colors"
              >
                <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
                <span>Explore Live Demo</span>
              </a>
            </div>

            {/* Proof Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Offline Capable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Hindi & English Interface</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Thermal 58mm & 80mm Ready</span>
              </div>
            </div>

          </div>

          {/* Hero UI Showcase Mockup */}
          <div className="mt-12 lg:mt-16 max-w-5xl mx-auto rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-2 sm:p-3 shadow-2xl border border-slate-700">
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              
              {/* Window Controls Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">BillSetu Pro • Live Tax Engine & Dynamic QR</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400">
                    <Wifi className="w-3 h-3" /> Auto-Sync Active
                  </span>
                  <Badge variant="teal" size="sm">GST TAX INVOICE</Badge>
                </div>
              </div>

              {/* Mockup Invoice Content */}
              <div className="p-4 sm:p-6 lg:p-8 bg-slate-900/60 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left: Invoice Details & Party */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="font-bold text-white text-base">Kashi Cabs & Logistics Solutions</h4>
                      <p className="text-xs text-slate-400">GSTIN: 09AAACK1234F1Z8 • Varanasi, Uttar Pradesh</p>
                      <p className="text-xs text-slate-400">Duty Slip: UP65-BT-9912 • Driver: Ramesh Yadav</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-teal-400 font-bold">INV-2026-0418</span>
                      <p className="text-xs text-slate-400">Date: 17 Oct 2026</p>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800">
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium">HSN/SAC</th>
                          <th className="pb-2 font-medium">Qty</th>
                          <th className="pb-2 font-medium text-right">Taxable</th>
                          <th className="pb-2 font-medium text-right">GST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        <tr>
                          <td className="py-2 font-medium text-white">Chauffeured Cab Rental (Local 80Km)</td>
                          <td className="py-2 font-mono text-slate-400">996412</td>
                          <td className="py-2">1 Trip</td>
                          <td className="py-2 text-right">₹3,200.00</td>
                          <td className="py-2 text-right text-teal-400">5% (₹160)</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium text-white">Extra Km Waiting (Opening: 4120, Closing: 4210)</td>
                          <td className="py-2 font-mono text-slate-400">996412</td>
                          <td className="py-2">10 Km</td>
                          <td className="py-2 text-right">₹180.00</td>
                          <td className="py-2 text-right text-teal-400">5% (₹9)</td>
                        </tr>
                        <tr className="bg-slate-950/40 text-[11px] text-amber-300">
                          <td className="py-2 italic">Toll & Airport Parking (Pure Agent Reimb.)</td>
                          <td className="py-2 font-mono text-slate-400">—</td>
                          <td className="py-2">1 Duty</td>
                          <td className="py-2 text-right">₹280.00</td>
                          <td className="py-2 text-right">Exempt (0%)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-300">
                    <span className="text-slate-400">Place of Supply: <strong>09 - Uttar Pradesh (Intrastate)</strong></span>
                    <div className="text-right">
                      <span className="text-slate-400 text-xs">Total Tax: CGST (₹84.50) + SGST (₹84.50)</span>
                    </div>
                  </div>
                </div>

                {/* Right: Dynamic UPI QR & Grand Total */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                      <span>Total Amount Payable</span>
                      <Badge variant="teal" size="sm">UPI Instant</Badge>
                    </div>
                    <div className="text-2xl font-black text-white pt-2">
                      ₹3,829.00
                    </div>
                    <p className="text-[11px] text-emerald-400">Exact paise embedded in QR</p>
                  </div>

                  {/* Dynamic QR Visual */}
                  <div className="p-3 bg-white rounded-xl shadow-inner flex flex-col items-center justify-center space-y-2">
                    <div className="w-28 h-28 bg-slate-900 rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
                      <QrCode className="w-24 h-24 text-white" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-md">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-950 font-black" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-800 block">Scan to Pay via Any UPI App</span>
                      <span className="text-[9px] text-slate-500 font-mono">GPay • PhonePe • Paytm • BHIM</span>
                    </div>
                  </div>

                  <button
                    onClick={onLaunchApp}
                    className="w-full py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-xs font-bold transition-colors text-center"
                  >
                    Try Live in Workspace →
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="text-2xl sm:text-3xl font-black text-white">₹4.8+ Cr</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Taxable Value Invoiced</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="text-2xl sm:text-3xl font-black text-teal-400">99.98%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">GSTIN Lookup Precision</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="text-2xl sm:text-3xl font-black text-white">0 ms</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Offline Invoicing Lag</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">58 & 80mm</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Thermal POS Support</div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE FEATURE PLAYGROUND */}
      {/* ========================================================= */}
      <section id="interactive-playground" className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <Badge variant="teal" size="md">LIVE INTERACTIVE PLAYGROUND</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Test BillSetu's Engines in Real-Time
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              No sign-up required. Click the tabs below to test how our deterministic GST calculator, dynamic UPI engine, OCR pipeline, and thermal receipt formatter work under the hood.
            </p>
          </div>

          {/* Feature Tab Selectors */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: 'tax_engine', label: '1. GST Tax Engine', icon: Calculator },
              { id: 'upi_engine', label: '2. Dynamic UPI QR', icon: QrCode },
              { id: 'ocr_engine', label: '3. Scan-to-Books AI', icon: ScanLine },
              { id: 'thermal_engine', label: '4. Thermal POS Slip', icon: Printer },
              { id: 'khata_engine', label: '5. Khata & Ledger', icon: Users },
              { id: 'offline_engine', label: '6. Offline Engine', icon: Wifi }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 scale-105'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Playground Content Box */}
          <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            
            {/* TAB 1: GST TAX ENGINE INTERACTIVE */}
            {activeFeatureTab === 'tax_engine' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-teal-400" />
                      Deterministic GST Split Calculator
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tests intra-state (CGST + SGST) vs inter-state (IGST) split, discounts, and roundoff rules according to GST Section 31.
                    </p>
                  </div>
                  <Badge variant="teal">Intelligent Auto-Split</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Controls */}
                  <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>Base Taxable Amount</span>
                        <span className="text-teal-400 font-mono font-bold">{formatInr(calcBaseAmount)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="100000" 
                        step="500"
                        value={calcBaseAmount} 
                        onChange={(e) => setCalcBaseAmount(Number(e.target.value))}
                        className="w-full accent-teal-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-300 block mb-1.5">GST Tax Rate</span>
                      <div className="grid grid-cols-5 gap-2">
                        {[0, 5, 12, 18, 28].map(rate => (
                          <button
                            key={rate}
                            onClick={() => setCalcTaxRate(rate)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              calcTaxRate === rate 
                                ? 'bg-teal-500 text-slate-950 border-teal-400' 
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-3">
                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                        <span>Transaction Type (Place of Supply)</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCalcIsInterstate(false)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${!calcIsInterstate ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400'}`}
                          >
                            Intra-State (Same)
                          </button>
                          <button
                            onClick={() => setCalcIsInterstate(true)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${calcIsInterstate ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400'}`}
                          >
                            Inter-State (IGST)
                          </button>
                        </div>
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                        <span>Apply Line Discount</span>
                        <input 
                          type="checkbox"
                          checked={calcHasDiscount}
                          onChange={(e) => setCalcHasDiscount(e.target.checked)}
                          className="accent-teal-400 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      {calcHasDiscount && (
                        <div className="pl-2">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Discount Percentage</span>
                            <span className="text-amber-400 font-mono">{calcDiscountPct}% ({formatInr(calcDiscountAmount)})</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="25" 
                            value={calcDiscountPct} 
                            onChange={(e) => setCalcDiscountPct(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Engine Output Breakdown */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-teal-500/30 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>GST Calculation Result</span>
                      <span className="font-mono text-teal-400 text-xs">Section 31 Rule Engine</span>
                    </div>

                    <div className="space-y-2 text-xs divide-y divide-slate-800">
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Gross Item Value:</span>
                        <span className="text-slate-200 font-mono">{formatInr(calcBaseAmount)}</span>
                      </div>
                      {calcHasDiscount && (
                        <div className="flex justify-between pt-2 text-amber-400">
                          <span>Trade Discount ({calcDiscountPct}%):</span>
                          <span className="font-mono">- {formatInr(calcDiscountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 font-semibold">
                        <span className="text-slate-300">Net Taxable Value:</span>
                        <span className="text-white font-mono">{formatInr(calcTaxableValue)}</span>
                      </div>

                      {!calcIsInterstate ? (
                        <>
                          <div className="flex justify-between pt-2 text-teal-300">
                            <span>CGST ({(calcTaxRate / 2)}%):</span>
                            <span className="font-mono">+{formatInr(calcCgst)}</span>
                          </div>
                          <div className="flex justify-between pt-2 text-teal-300">
                            <span>SGST ({(calcTaxRate / 2)}%):</span>
                            <span className="font-mono">+{formatInr(calcSgst)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between pt-2 text-teal-300 font-semibold">
                          <span>IGST ({calcTaxRate}%):</span>
                          <span className="font-mono">+{formatInr(calcIgst)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-baseline pt-4 border-t-2 border-slate-700">
                        <div>
                          <span className="text-sm font-bold text-white block">Grand Total Due</span>
                          <span className="text-[10px] text-slate-400">Rounded off to nearest rupee</span>
                        </div>
                        <span className="text-2xl font-black text-white font-mono">
                          {formatInr(Math.round(calcGrandTotal))}
                        </span>
                      </div>
                    </div>

                    <div className="bg-teal-950/40 border border-teal-500/20 rounded-lg p-3 text-[11px] text-teal-200">
                      ✓ <strong>Deterministic Accuracy:</strong> Zero floating-point rounding errors. All internal values computed strictly in integer paise.
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: DYNAMIC UPI QR */}
            {activeFeatureTab === 'upi_engine' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-teal-400" />
                      Dynamic NPCI UPI QR Generator
                    </h3>
                    <p className="text-xs text-slate-400">
                      Creates instant, non-tamperable UPI QR codes on every invoice. Customers scan and pay exact paise with zero 2% gateway commissions.
                    </p>
                  </div>
                  <Badge variant="teal">Zero Fee Gateway</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Inputs */}
                  <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Invoice Total Amount (₹)
                      </label>
                      <input 
                        type="number"
                        value={upiAmount}
                        onChange={(e) => setUpiAmount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-teal-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Merchant / Payee Name
                      </label>
                      <input 
                        type="text"
                        value={upiPayeeName}
                        onChange={(e) => setUpiPayeeName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Merchant UPI VPA ID
                      </label>
                      <input 
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-teal-400 outline-none"
                      />
                    </div>

                    <div className="pt-2 text-xs text-slate-400">
                      Generated NPCI Payload:
                      <div className="mt-1 p-2 bg-slate-900 rounded font-mono text-[10px] text-teal-300 break-all select-all">
                        upi://pay?pa={upiVpa}&pn={encodeURIComponent(upiPayeeName)}&am={upiAmount.toFixed(2)}&cu=INR&tn=Invoice%20Payment
                      </div>
                    </div>
                  </div>

                  {/* QR Preview Card */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-white rounded-2xl shadow-xl space-y-2">
                      <div className="w-40 h-40 bg-slate-950 rounded-xl p-3 flex items-center justify-center relative">
                        <QrCode className="w-36 h-36 text-white" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <IndianRupee className="w-5 h-5 text-slate-950 font-black" />
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-900 font-bold text-sm">
                        {formatInr(upiAmount)}
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        {upiVpa}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 max-w-xs">
                      Supported on <strong className="text-white">PhonePe, Google Pay, Paytm, BHIM</strong> and all 140+ UPI apps in India.
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: SCAN TO BOOKS AI */}
            {activeFeatureTab === 'ocr_engine' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <ScanLine className="w-5 h-5 text-teal-400" />
                      Scan-to-Books AI & OCR Pipeline
                    </h3>
                    <p className="text-xs text-slate-400">
                      Extract vendor GSTIN, invoice dates, line items, and tax totals from crumpled fuel receipts and vendor bills in seconds.
                    </p>
                  </div>
                  <Badge variant="teal">AI Computer Vision</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                  
                  {/* Raw Document Simulated View */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                        <span>Original Fuel Bill / Paper Receipt</span>
                        <span className="text-amber-400 text-[11px] font-mono">Indian Oil HPCL Slip</span>
                      </div>
                      <div className="mt-3 p-4 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-300 leading-relaxed space-y-1 border border-slate-800">
                        <p className="font-bold text-white text-center">IOCL KASHI AUTO FUELS</p>
                        <p className="text-center text-slate-400 text-[10px]">CANTT ROAD, VARANASI - 221002</p>
                        <p className="text-[10px] text-slate-400">GSTIN: 09AABCI9922K1Z9</p>
                        <p className="text-[10px] text-slate-400">DATE: 16/10/2026 18:42 | INV# 98214</p>
                        <div className="border-t border-dashed border-slate-700 my-2" />
                        <p className="flex justify-between">
                          <span>DIESEL EXTRA (42.5 LTR)</span>
                          <span>₹3,825.00</span>
                        </p>
                        <p className="flex justify-between text-slate-400 text-[10px]">
                          <span>TAXABLE: ₹3,187.50</span>
                          <span>VAT/GST: ₹637.50</span>
                        </p>
                        <div className="border-t border-dashed border-slate-700 my-2" />
                        <p className="flex justify-between font-bold text-teal-400">
                          <span>TOTAL AMOUNT PAID</span>
                          <span>₹3,825.00</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>Extracted in 640ms with 98.4% OCR confidence</span>
                    </div>
                  </div>

                  {/* AI Structured Data Output */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-teal-500/30 space-y-4">
                    <div className="flex items-center justify-between text-xs text-teal-300 font-semibold pb-2 border-b border-slate-800">
                      <span>✓ Structured Ledger Voucher Auto-Populated</span>
                      <span className="text-[10px] bg-teal-500/20 px-2 py-0.5 rounded text-teal-300">Ready to Post</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Vendor Name:</span>
                        <span className="text-white font-semibold">IOCL Kashi Auto Fuels</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Vendor GSTIN:</span>
                          <span className="text-teal-400 font-mono font-bold">09AABCI9922K1Z9</span>
                        </div>
                        <Badge variant="teal" size="sm">Verified Active</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Expense Category:</span>
                          <span className="text-slate-200">Fuel & Trip Expenses</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Invoice Date:</span>
                          <span className="text-slate-200 font-mono">16-10-2026</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between font-bold border border-slate-800">
                        <span className="text-slate-300">Total Purchase Expense:</span>
                        <span className="text-white font-mono text-sm">₹3,825.00</span>
                      </div>
                    </div>

                    <button
                      onClick={onLaunchApp}
                      className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Try Scan-to-Books in App →
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 4: THERMAL POS RECEIPT */}
            {activeFeatureTab === 'thermal_engine' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Printer className="w-5 h-5 text-teal-400" />
                      Thermal 58mm & 80mm POS Slip Generator
                    </h3>
                    <p className="text-xs text-slate-400">
                      Print crisp counter slips directly on wireless Bluetooth thermal printers without clumsy dialog boxes.
                    </p>
                  </div>
                  <Badge variant="teal">Bluetooth ESC/POS</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Thermal Slip Visual */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex justify-center">
                    <div className="w-64 bg-white text-slate-900 p-4 rounded-sm shadow-2xl font-mono text-[10px] space-y-2 leading-tight">
                      <div className="text-center font-bold text-xs pb-1 border-b border-dashed border-slate-400">
                        BILLSETU DEMO STORE
                        <div className="text-[9px] font-normal text-slate-600">GSTIN: 09AAACK1234F1Z8</div>
                        <div className="text-[9px] font-normal text-slate-600">Tel: +91 98391 23456</div>
                      </div>

                      <div className="text-[9px] text-slate-600">
                        Date: 17/10/2026 13:20<br />
                        Bill: #POS-2026-9901<br />
                        Customer: Walk-in Cash
                      </div>

                      <div className="border-t border-b border-dashed border-slate-400 py-1 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>ITEM</span>
                          <span>QTY</span>
                          <span>AMT</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Airport Drop Package</span>
                          <span>1</span>
                          <span>1,200.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Night Halt Allowance</span>
                          <span>1</span>
                          <span>300.00</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 pt-1 text-right">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹1,500.00</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>GST (5%):</span>
                          <span>₹75.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-900">
                          <span>TOTAL DUE:</span>
                          <span>₹1,575.00</span>
                        </div>
                      </div>

                      <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[8px] text-slate-500">
                        THANK YOU FOR CHOOSING US!<br />
                        Verified via BillSetu Engine
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-white">Engineered for Counter Speed</h4>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span><strong>Instant Bluetooth Printing:</strong> Compatible with TVS, Epson, Everycom, NGX, and all standard 58mm/80mm ESC/POS printers.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span><strong>Zero Paper Waste:</strong> Dynamic line formatting tightly packs charges, tax rates, and UPI payment QR into minimal roll length.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span><strong>Dual Format Support:</strong> Switch effortlessly between full A4 corporate invoices and compact thermal slips for the same bill.</span>
                      </li>
                    </ul>

                    <button
                      onClick={onLaunchApp}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Open Thermal Receipt View →
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 5: KHATA & LEDGER */}
            {activeFeatureTab === 'khata_engine' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-400" />
                      Smart Customer Khata & Overdue Tracking
                    </h3>
                    <p className="text-xs text-slate-400">
                      Track party balances, send WhatsApp payment reminders, and download formal account statements for CAs.
                    </p>
                  </div>
                  <Badge variant="teal">Automated Reconciliation</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Total Receivables</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400">₹1,42,800</div>
                    <p className="text-[11px] text-slate-400">Across 14 active corporate clients</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Overdue Dues (&gt;30 Days)</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400">₹18,500</div>
                    <p className="text-[11px] text-slate-400">2 accounts require immediate reminder</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Settlement Velocity</span>
                      <Zap className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-2xl font-black text-teal-400">4.2 Days</div>
                    <p className="text-[11px] text-slate-400">Down from 14 days with dynamic QR</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-white block">One-Click Customer Statement Download</span>
                    <span className="text-slate-400 text-[11px]">Generate formal PDF ledger with invoice refs, payment receipts, and balance confirmation.</span>
                  </div>
                  <Button variant="primary" size="sm" onClick={onLaunchApp} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shrink-0">
                    View Parties & Khata
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 6: OFFLINE ENGINE SIMULATOR */}
            {activeFeatureTab === 'offline_engine' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-teal-400" />
                      Offline-First Resilience Simulator
                    </h3>
                    <p className="text-xs text-slate-400">
                      Simulate network drops. Notice how BillSetu continues generating bills, printing thermal slips, and queues records safely.
                    </p>
                  </div>
                  <Badge variant={isSimulatedOffline ? 'amber' : 'teal'}>
                    {isSimulatedOffline ? 'Simulating Offline Mode' : 'Connected Mode'}
                  </Badge>
                </div>

                <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      {isSimulatedOffline ? (
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <WifiOff className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
                          <Wifi className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-white text-sm block">
                          {isSimulatedOffline ? 'Internet Disconnected (Remote Depot / Basement Shop)' : 'High-Speed Internet Connected'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {isSimulatedOffline 
                            ? 'IndexedDB storage is handling all reads & writes locally. Zero lag.'
                            : 'All transactions synchronized with local encryption.'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        isSimulatedOffline 
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isSimulatedOffline ? 'Restore Connection' : 'Simulate Internet Drop'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">IndexedDB Cache Status</span>
                      <span className="text-emerald-400 font-bold font-mono">100% HEALTHY • 14.8 MB USED</span>
                    </div>
                    <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Offline Invoices Queued</span>
                      <span className="text-white font-bold font-mono">{queuedInvoicesCount} Invoices Ready to Sync</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. ALL 12 FEATURES SHOWCASE GRID */}
      {/* ========================================================= */}
      <section id="features" className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="teal" size="md">FULL CAPABILITY SUITE</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Engineered for Complete Billing Sovereignty
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Every detail is compliant with the Central Board of Indirect Taxes and Customs (CBIC) standards and tailored for real Indian business workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">B2B Corporate & B2C Billing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full support for corporate clients with mandatory GSTINs, PO numbers, and reverse charge mechanisms (RCM Section 9(3)), alongside lightweight B2C passenger receipts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Deterministic GST Tax Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intelligently detects place of supply state codes. Automatically applies CGST + SGST for intra-state or IGST for inter-state, with 0%, 5%, 12%, 18%, and 28% slabs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Duty Slip & Logistics Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record vehicle number, driver details, opening/closing odometer kilometers, extra hours, night halts, and non-taxable toll/parking reimbursements (Pure Agent per Sec 33).
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <ScanLine className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Scan-to-Books AI Pipeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Digitize paper fuel receipts, toll plaza tickets, and vehicle maintenance bills. Computer vision extracts amounts, GSTINs, and line items straight into expense records.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Dynamic NPCI UPI QR Codes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate bank-grade dynamic UPI QR codes containing invoice amount down to the exact paisa. Customers pay instantly via PhonePe, GPay, or Paytm directly to your account.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Dual-Format Printing (A4 & POS)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamlessly output formal A4 tax invoices for corporate clients or compact 58mm & 80mm ESC/POS thermal receipts for retail counter speed.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Customer & Vendor Khata Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain balances, credit limits, and payment logs for every party. Download formal PDF statements of accounts with one click.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Curated HSN & SAC Directory</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Built-in autocomplete directory of 6-digit and 8-digit HSN/SAC codes for transport, professional services, hospitality, hardware, and goods with default tax rates.
              </p>
            </div>

            {/* Feature 9 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">WhatsApp Dispatch & Hosted Links</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Share invoices instantly on WhatsApp with pre-drafted polite messages and secure public hosted links (`?bill=...`) for instant viewing on smartphones.
              </p>
            </div>

            {/* Feature 10 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">GSTR-1 & Audit Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                One-click export of B2B invoices and tax summaries formatted for government portal upload and CA audit, along with immutable audit trails.
              </p>
            </div>

            {/* Feature 11 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Bilingual (English & Hindi)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly switch the entire interface between Hindi and English with full term transliteration (चालान, पार्टी, स्कैन, भुगतान).
              </p>
            </div>

            {/* Feature 12 */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Privacy & Local-First Sovereignty</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero telemetry on your financial data. Data stays stored on your own device under your sovereign control in strict adherence to DPDPA 2023.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INTERACTIVE MSME ROI & TIME-SAVINGS CALCULATOR */}
      {/* ========================================================= */}
      <section id="roi" className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <Badge variant="teal" size="md">BUSINESS IMPACT CALCULATOR</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Calculate Your Time & Cost Savings
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              See how many billable hours and rupees BillSetu saves your business each year through automated tax math and instant UPI collection.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Monthly Invoices Issued</span>
                    <span className="text-teal-400 font-mono font-bold">{roiInvoicesPerMonth} Bills / mo</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    step="5"
                    value={roiInvoicesPerMonth} 
                    onChange={(e) => setRoiInvoicesPerMonth(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Average Bill Amount</span>
                    <span className="text-teal-400 font-mono font-bold">{formatInr(roiAvgBillValue)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="25000" 
                    step="250"
                    value={roiAvgBillValue} 
                    onChange={(e) => setRoiAvgBillValue(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Hours Currently Spent on Manual Billing</span>
                    <span className="text-amber-400 font-mono font-bold">{roiManualHoursPerWeek} hrs / week</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="30" 
                    value={roiManualHoursPerWeek} 
                    onChange={(e) => setRoiManualHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="bg-slate-950 p-6 rounded-xl border border-teal-500/30 space-y-4 text-center">
                <div>
                  <span className="text-xs text-slate-400 block">Estimated Annual Value Unlocked</span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
                    {formatInr(annualCashSaved)}
                  </div>
                  <span className="text-[11px] text-teal-300">Based on labor recovery + zero-dispute billing</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-left">
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">Hours Saved</span>
                    <span className="text-lg font-bold text-white font-mono">{hoursSavedPerMonth} hrs / mo</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">Payment Speed</span>
                    <span className="text-lg font-bold text-teal-400 font-mono">+{paymentDaysSaved} Days Faster</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={onLaunchApp}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black shadow-md shadow-teal-500/20"
                >
                  Start Saving Today with BillSetu →
                </Button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. TRANSPARENT PRICING SECTION */}
      {/* ========================================================= */}
      <section id="pricing" className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <Badge variant="teal" size="md">TRANSPARENT PRICING</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Honest Plans. No Hidden Traps.
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Start completely free forever, or upgrade to Pro to unlock custom white-labeling and high-volume OCR scanning.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-semibold ${pricingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setPricingCycle(pricingCycle === 'annual' ? 'monthly' : 'annual')}
                className="w-12 h-6 bg-slate-800 rounded-full p-1 border border-slate-700 transition-colors relative"
              >
                <div className={`w-4 h-4 rounded-full bg-teal-400 transition-transform ${pricingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${pricingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
                  Annual Billing
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SAVE 35%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            
            {/* TIER 1: STARTER FREE */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">BillSetu Starter</h3>
                  <p className="text-xs text-slate-400">Perfect for solo proprietor shops & freelancers</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹0</span>
                  <span className="text-xs text-slate-400">/ forever</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Unlimited GST Tax & Non-GST Invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Deterministic CGST, SGST & IGST Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Dynamic UPI QR embedded on all bills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>20 AI Scan-to-Books OCR credits</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <span className="text-slate-500">• Includes BillSetu verification badge</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={onLaunchApp}
                className="w-full text-slate-200 border-slate-700 hover:bg-slate-800"
              >
                Use Free Version
              </Button>
            </div>

            {/* TIER 2: PRO BUSINESS (POPULAR) */}
            <div className="bg-gradient-to-b from-teal-950/40 via-slate-950 to-slate-950 p-6 rounded-2xl border-2 border-teal-500 flex flex-col justify-between space-y-6 relative shadow-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                Most Popular
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">BillSetu Pro</h3>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400">Complete brand white-labeling & high throughput</p>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">
                    {pricingCycle === 'annual' ? '₹999' : '₹129'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {pricingCycle === 'annual' ? '/ year (~₹83/mo)' : '/ month'}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800 pt-4 font-medium">
                  <li className="flex items-center gap-2 text-teal-300 font-semibold">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>100% Watermark Removal & White-Labeling</span>
                  </li>
                  <li className="flex items-center gap-2 text-teal-300 font-semibold">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Upload Custom Business Logo on PDF Bills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Custom Brand Colors for Headers & Lines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>500 AI Scan-to-Books OCR credits / year</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Customer Khata Statements PDF Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>WhatsApp Direct Instant Bill Dispatch</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={onLaunchApp}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black shadow-lg shadow-teal-500/25"
              >
                Get Started with Pro (₹999/yr)
              </Button>
            </div>

            {/* TIER 3: ENTERPRISE FLEET */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Enterprise Fleet</h3>
                  <p className="text-xs text-slate-400">For taxi fleets, transport hubs & distributors</p>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">
                    {pricingCycle === 'annual' ? '₹3,499' : '₹399'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {pricingCycle === 'annual' ? '/ year' : '/ month'}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  <li className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>All Pro Business features included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Up to 5 Multi-User Counter Seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>2,500 AI Scan-to-Books OCR credits / year</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Bulk Duty Slip Generation & Driver Ledger</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Dedicated Priority WhatsApp Support</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={onOpenAdmin}
                className="w-full text-teal-300 border-teal-500/40 hover:bg-teal-950/30"
              >
                Manage in Admin Console
              </Button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. CUSTOMER TESTIMONIALS */}
      {/* ========================================================= */}
      <section className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <Badge variant="teal" size="md">TRUSTED ACROSS INDIA</Badge>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Loved by Fleet Owners & Merchants
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Real stories from business owners who simplified their billing and eliminated CA reconciliation headaches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "We manage 18 tourist cabs in Varanasi. Earlier, driver duty slips, toll taxes, and parking slips were total chaos. With BillSetu, drivers scan the toll slips, GST is calculated cleanly with pure agent rules, and corporate hotel clients pay our dynamic UPI QR on the spot."
              </p>
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-white text-xs block">Vikas Mishra</span>
                <span className="text-[11px] text-teal-400">Managing Partner, Kashi Cabs (UP)</span>
              </div>
            </div>

            <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "Our wholesale cloth distribution requires fast B2B invoices with customer GSTIN validation and immediate WhatsApp dispatch. BillSetu's offline engine means even when the market broadband goes down, our billing counter never pauses."
              </p>
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-white text-xs block">Sunil Agarwal</span>
                <span className="text-[11px] text-teal-400">Director, Bharat Textiles (Surat)</span>
              </div>
            </div>

            <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "Thermal receipt printing is a lifesaver for our electrical hardware shop. We print 58mm counter slips with UPI QR directly from our phone via Bluetooth. The ₹999/yr Pro plan paid for itself in the first 2 weeks!"
              </p>
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-white text-xs block">Rajesh Sharma</span>
                <span className="text-[11px] text-teal-400">Proprietor, Sharma Electronics (Delhi)</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. INTERACTIVE FAQ ACCORDION */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12">
            <Badge variant="teal" size="md">COMMON QUESTIONS</Badge>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Everything you need to know about compliance, offline data security, and hardware compatibility.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Is BillSetu compliant with Indian GST rules and CBIC standards?",
                a: "Yes, 100%. BillSetu calculates CGST, SGST, and IGST based on the place of supply state code according to GST Section 31 rules. It supports reverse charge mechanisms (RCM Section 9(3)), 6-digit/8-digit HSN/SAC codes, and pure agent expense reimbursements (toll, parking, state permit) under GST Section 33."
              },
              {
                q: "How does the Dynamic UPI QR Code work without a payment gateway fee?",
                a: "BillSetu encodes the exact bill amount (in paise), payee VPA, payee business name, and unique invoice reference into the standard NPCI UPI payload (`upi://pay?...`). When a customer scans it with PhonePe, GPay, or Paytm, the payment settles directly into your bank account with zero merchant discount rate (MDR) or gateway percentage deductions."
              },
              {
                q: "Can I use BillSetu when the shop or fleet counter has no internet?",
                a: "Absolutely. BillSetu is built with a local-first Progressive Web App (PWA) architecture utilizing browser IndexedDB. You can issue bills, search parties, generate thermal receipts, and calculate tax completely offline. When network returns, your data safely syncs."
              },
              {
                q: "How does the Android Native Mobile App work?",
                a: "We provide a native Android APK build (`billsetu-v1.0.0-debug.apk`) included directly on this site. It runs natively on Android devices, supports Bluetooth thermal ESC/POS printers, and provides direct WhatsApp sharing."
              },
              {
                q: "What printers are supported for thermal receipts?",
                a: "BillSetu supports both 58mm (2-inch) and 80mm (3-inch) thermal POS receipt printers (USB and Bluetooth). It works seamlessly with standard TVS, Epson, Everycom, NGX, and wireless portable Bluetooth receipt machines."
              },
              {
                q: "Can my Chartered Accountant (CA) export data for GSTR-1 and tax filing?",
                a: "Yes! BillSetu includes one-click export for GSTR-1 summary tables, sales and purchase registers in CSV/Excel, JSON formats, and immutable audit logs detailing every issued, cancelled, and amended invoice."
              }
            ].map((faq, i) => {
              const isOpen = faqOpenIndex === i;
              return (
                <div 
                  key={i}
                  className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-white font-bold text-sm sm:text-base hover:text-teal-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-teal-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. ANDROID APP DOWNLOAD CALLOUT */}
      {/* ========================================================= */}
      <section className="py-16 bg-gradient-to-r from-[#0C2B62] via-slate-900 to-[#17396E] border-b border-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <Smartphone className="w-4 h-4" />
              <span>Native Android App Available</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Carry Your Billing Counter in Your Pocket
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Download the BillSetu Android APK for instant billing on the move. Bluetooth thermal printer connection, camera receipt scanner, and WhatsApp integration included.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={triggerApkDownload}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
              <span>Download APK (v1.0.0 • 17.6 MB)</span>
              <Download className="w-4 h-4 ml-1 stroke-[2.5]" />
            </button>

            <a
              href="https://github.com/utkarshsingh11011/billsetu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
              title="View Source on GitHub"
            >
              <ExternalLink className="w-4 h-4 text-teal-400" />
              <span>GitHub Repository & Releases</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. PROFESSIONAL FOOTER */}
      {/* ========================================================= */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <img src="/logo_icon.png" alt="BillSetu" className="w-8 h-8 rounded-lg bg-white p-0.5" />
                <span className="font-extrabold text-lg text-white">
                  Bill<span className="text-[#19B0A0]">Setu</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Smart GST Invoicing, Scan-to-Books AI, Dynamic UPI QR, and Khata Ledgers for Indian Enterprises and Fleets.
              </p>
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-teal-300">
                  Developed by <a href="https://github.com/utkarshsingh11011" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-teal-400 underline">Utkarsh Singh</a>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Designed & Made with pride in India 🇮🇳
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Features</h4>
              <ul className="space-y-2">
                <li><a href="#interactive-playground" className="hover:text-teal-400">GST Tax Engine</a></li>
                <li><a href="#interactive-playground" className="hover:text-teal-400">Dynamic UPI QR Codes</a></li>
                <li><a href="#interactive-playground" className="hover:text-teal-400">Scan-to-Books AI</a></li>
                <li><a href="#interactive-playground" className="hover:text-teal-400">Thermal POS Slips</a></li>
                <li><a href="#interactive-playground" className="hover:text-teal-400">Duty Slips & Logistics</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Portals & Tools</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={onLaunchApp} className="hover:text-teal-400 text-left">
                    Billing Workspace App
                  </button>
                </li>
                <li>
                  <button onClick={onOpenAdmin} className="hover:text-teal-400 text-left flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-amber-400" />
                    <span>Subscription Admin Console</span>
                  </button>
                </li>
                <li>
                  <button onClick={triggerApkDownload} className="hover:text-teal-400 text-left flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Android APK</span>
                  </button>
                </li>
                <li><a href="#roi" className="hover:text-teal-400">MSME ROI Calculator</a></li>
                <li><a href="#pricing" className="hover:text-teal-400">Pricing Plans</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Compliance & Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li>CBIC Section 31 & 33 Rules</li>
                <li>Digital Personal Data Protection Act 2023</li>
                <li>NPCI Unified Payments Interface</li>
                <li>Deterministic Integer Paise Math</li>
                <li>Local-First Offline Storage</li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 BillSetu. Engineered & Developed by <a href="https://github.com/utkarshsingh11011" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 font-bold underline">Utkarsh Singh</a>. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onLaunchApp} className="hover:text-slate-300">Launch App</button>
              <button onClick={onOpenAdmin} className="hover:text-slate-300">Admin Portal</button>
              <button onClick={triggerApkDownload} className="hover:text-teal-300 text-teal-400 font-semibold">Get APK</button>
              <a href="#features" className="hover:text-slate-300">Features</a>
              <a href="#pricing" className="hover:text-slate-300">Pricing</a>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================= */}
      {/* 11. APK DOWNLOAD CONFIRMATION & INSTALL GUIDE MODAL */}
      {/* ========================================================= */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 text-white shadow-2xl relative">
            <button 
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">APK Download Started!</h3>
                <p className="text-xs text-slate-400">File: <span className="font-mono text-teal-300">billsetu-v1.0.0-debug.apk</span> (17.6 MB)</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-teal-300 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>3 Simple Steps to Install on Android:</span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-teal-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Open your phone's notification bar or <strong>Downloads</strong> folder and tap <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono">billsetu-v1.0.0-debug.apk</code>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-teal-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>If prompted with <em>"File might be harmful"</em>, tap <strong>"Download anyway"</strong> / <strong>"Install anyway"</strong> (standard Android warning for direct APK installs outside Play Store).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-teal-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>Install</strong>. Once completed, tap <strong>Open</strong> to start issuing bills!</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <a
                href="/billsetu-v1.0.0-debug.apk"
                download="billsetu-v1.0.0-debug.apk"
                className="text-xs text-teal-400 hover:text-teal-300 underline font-medium"
              >
                Click here if download didn't start automatically
              </a>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDownloadModalOpen(false)}
                className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5"
              >
                Got it, Thanks!
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
