import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { 
  BusinessProfile, 
  Party, 
  Item, 
  Invoice, 
  ScannedDocument, 
  PurchaseExpense, 
  Subscription,
  PaymentRecord
} from './types';
import { Language } from './services/i18n';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { Dashboard } from './components/home/Dashboard';
import { InvoiceForm } from './components/invoices/InvoiceForm';
import { InvoicePdfView } from './components/invoices/InvoicePdfView';
import { PaymentModal } from './components/invoices/PaymentModal';
import { ScanView } from './components/scan/ScanView';
import { RecordsView } from './components/records/RecordsView';
import { PartiesView } from './components/parties/PartiesView';
import { ItemsView } from './components/items/ItemsView';
import { SubscriptionView } from './components/subscription/SubscriptionView';
import { SettingsView } from './components/settings/SettingsView';
import { ReportsView } from './components/reports/ReportsView';
import { CommandPalette } from './components/common/CommandPalette';
import { AuthModal } from './components/auth/AuthModal';
import { CompanySetupWizard } from './components/onboarding/CompanySetupWizard';
import { FeatureShowcase } from './components/showcase/FeatureShowcase';
import { AdminSubscriptionDashboard } from './components/admin/AdminSubscriptionDashboard';
import { authService } from './services/authService';
import { User, AuthSession } from './types';

export function App() {
  // Top-level Application View Mode: 'showcase' (Landing Page) | 'app' (Billing Workspace) | 'admin' (Subscription Dashboard)
  const [appMode, setAppMode] = useState<'showcase' | 'app' | 'admin'>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) return 'admin';
      if (hash.includes('showcase')) return 'showcase';
      if (hash.includes('app')) return 'app';

      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode') || params.get('view');
      if (mode === 'admin') return 'admin';
      if (mode === 'showcase') return 'showcase';
      if (mode === 'app') return 'app';

      // If opening a shared hosted bill, go direct to app workspace
      if (params.get('bill') || params.get('invoice')) return 'app';

      const saved = localStorage.getItem('billsetu_app_mode');
      if (saved === 'app' || saved === 'admin' || saved === 'showcase') {
        return saved as any;
      }
    } catch {
      // ignore
    }
    return 'showcase';
  });

  // Listen to browser hash changes (e.g. Back/Forward button, direct URL bookmarks)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) setAppMode('admin');
      else if (hash.includes('showcase')) setAppMode('showcase');
      else if (hash.includes('app')) setAppMode('app');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToMode = (mode: 'showcase' | 'app' | 'admin') => {
    setAppMode(mode);
    localStorage.setItem('billsetu_app_mode', mode);
    window.location.hash = `#${mode}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Application State loaded from storageService
  const [profile, setProfile] = useState<BusinessProfile>(() => storageService.getProfile());
  const [parties, setParties] = useState<Party[]>(() => storageService.getParties());
  const [items, setItems] = useState<Item[]>(() => storageService.getItems());
  const [invoices, setInvoices] = useState<Invoice[]>(() => storageService.getInvoices());
  const [scans, setScans] = useState<ScannedDocument[]>(() => storageService.getScans());
  const [expenses, setExpenses] = useState<PurchaseExpense[]>(() => storageService.getExpenses());
  const [subscription, setSubscription] = useState<Subscription>(() => storageService.getSubscription());
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());

  // User authentication & tenant state
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [showManualSetupWizard, setShowManualSetupWizard] = useState<boolean>(false);

  const refreshTenantData = () => {
    setProfile(storageService.getProfile());
    setParties(storageService.getParties());
    setItems(storageService.getItems());
    setInvoices(storageService.getInvoices());
    setScans(storageService.getScans());
    setExpenses(storageService.getExpenses());
    setSubscription(storageService.getSubscription());
  };

  // Check URL query parameters for hosted/shared invoice link (e.g. ?bill=kcs_duty_101 or ?invoice=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedBillId = params.get('bill') || params.get('invoice');
      if (sharedBillId) {
        const found = storageService.getInvoiceById(sharedBillId);
        if (found) {
          setActiveInvoiceForPreview(found);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [previousTab, setPreviousTab] = useState<string>('home');

  // Modal / Detailed View states
  const [activeInvoiceForPreview, setActiveInvoiceForPreview] = useState<Invoice | null>(null);
  const [activeInvoiceForEdit, setActiveInvoiceForEdit] = useState<Invoice | null>(null);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync state helpers
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    storageService.setLanguage(lang);
  };

  const handleUpdateProfile = (newProfile: BusinessProfile) => {
    setProfile(newProfile);
    storageService.saveProfile(newProfile);
  };

  const handleSaveParty = (party: Party) => {
    const saved = storageService.saveParty(party);
    setParties(storageService.getParties());
    return saved;
  };

  const handleDeleteParty = (id: string) => {
    storageService.deleteParty(id);
    setParties(storageService.getParties());
  };

  const handleSaveItem = (item: Item) => {
    storageService.saveItem(item);
    setItems(storageService.getItems());
  };

  const handleSaveInvoiceDraft = (inv: Invoice) => {
    const saved = storageService.saveInvoice(inv);
    setInvoices(storageService.getInvoices());
    setActiveInvoiceForEdit(null);
    setCurrentTab('invoices');
  };

  const handleIssueInvoice = (inv: Invoice) => {
    const updated: Invoice = {
      ...inv,
      status: 'issued',
      issuedAt: new Date().toISOString(),
    };
    storageService.saveInvoice(updated);
    setInvoices(storageService.getInvoices());
    setActiveInvoiceForEdit(null);
    setActiveInvoiceForPreview(updated);
  };

  const handleCancelInvoice = (inv: Invoice, reason: string) => {
    storageService.saveInvoice(inv);
    setInvoices(storageService.getInvoices());
    storageService.addAudit('invoice', 'cancel', `Invoice ${inv.invoiceNumber} cancelled/voided: "${reason}"`);
    setActiveInvoiceForPreview(inv);
  };

  const handleRecordPayment = (inv: Invoice, payment: PaymentRecord) => {
    storageService.saveInvoice(inv);
    setInvoices(storageService.getInvoices());
    storageService.addAudit('payment', 'record', `Payment of ₹${(payment.amountPaise / 100).toFixed(2)} recorded for ${inv.invoiceNumber}`);
    
    // Update party balance if applicable
    const party = parties.find(p => p.id === inv.party.id);
    if (party) {
      party.balancePaise = Math.max(0, party.balancePaise - payment.amountPaise);
      storageService.saveParty(party);
      setParties(storageService.getParties());
    }

    if (activeInvoiceForPreview?.id === inv.id) {
      setActiveInvoiceForPreview(inv);
    }
  };

  const handleSaveScan = (scan: ScannedDocument) => {
    storageService.saveScan(scan);
    setScans(storageService.getScans());
  };

  const handleSaveExpense = (expense: PurchaseExpense) => {
    storageService.saveExpense(expense);
    setExpenses(storageService.getExpenses());
  };

  const handleUpgradeToPro = () => {
    const sub = storageService.upgradeToPro();
    setSubscription(sub);
  };

  const handleDowngradeToFree = () => {
    const sub = storageService.downgradeToFree();
    setSubscription(sub);
  };

  const handleResetData = () => {
    storageService.resetAllData();
    refreshTenantData();
    setCurrentTab('home');
  };

  const handleOpenCreateInvoice = () => {
    setActiveInvoiceForEdit(null);
    setActiveInvoiceForPreview(null);
    setPreviousTab(currentTab);
    setCurrentTab('create');
  };

  const handleCloneInvoice = (inv: Invoice) => {
    const freshInvoice: Invoice = {
      ...inv,
      id: '', // new draft
      invoiceNumber: `${profile.invoicePrefix}${profile.nextInvoiceSequence}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      issuedAt: undefined,
      cancelledAt: undefined,
      cancellationReason: undefined,
      payments: [],
      amountPaidPaise: 0,
      balanceDuePaise: inv.grandTotalPaise,
    };
    setActiveInvoiceForPreview(null);
    setActiveInvoiceForEdit(freshInvoice);
    setPreviousTab(currentTab);
    setCurrentTab('create');
  };

  const handleCreateInvoiceForParty = (party: Party) => {
    setActiveInvoiceForEdit({
      id: '',
      businessId: profile.id,
      invoiceNumber: `${profile.invoicePrefix}${profile.nextInvoiceSequence}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      type: profile.isGstRegistered ? 'gst_tax_invoice' : 'non_gst_bill',
      status: 'draft',
      party,
      placeOfSupplyState: party.state,
      placeOfSupplyStateCode: party.stateCode,
      billingType: party.category === 'corporate_client' ? 'b2b_corporate' : 'b2c_passenger',
      taxMode: 'exclusive',
      isReverseCharge: false,
      lines: [],
      subtotalPaise: 0,
      totalDiscountPaise: 0,
      taxableValuePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      roundOffPaise: 0,
      totalReimbursementsPaise: 0,
      grandTotalPaise: 0,
      amountPaidPaise: 0,
      balanceDuePaise: 0,
      version: 1,
      payments: [],
      shareableId: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
    setActiveInvoiceForPreview(null);
    setPreviousTab(currentTab);
    setCurrentTab('create');
  };

  const handleSelectInvoiceForView = (inv: Invoice) => {
    setActiveInvoiceForPreview(inv);
  };

  const handleSelectScanForReview = (scan: ScannedDocument) => {
    setCurrentTab('scan');
  };

  const scansNeedReviewCount = scans.filter(s => s.status === 'needs_review').length;

  // Render Feature Showcase Landing Page
  if (appMode === 'showcase') {
    return (
      <FeatureShowcase
        onLaunchApp={() => navigateToMode('app')}
        onOpenAdmin={() => navigateToMode('admin')}
      />
    );
  }

  // Render Admin Subscription Management Portal
  if (appMode === 'admin') {
    return (
      <AdminSubscriptionDashboard
        onBackToApp={() => navigateToMode('app')}
        onViewShowcase={() => navigateToMode('showcase')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased pb-20 md:pb-10">
      
      {/* Top Header */}
      <Header
        profile={profile}
        subscription={subscription}
        currentLang={language}
        onLanguageChange={handleLanguageChange}
        onOpenUpgrade={() => setCurrentTab('brand')}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenShowcase={() => navigateToMode('showcase')}
        onOpenAdmin={() => navigateToMode('admin')}
      />

      {/* Desktop Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveInvoiceForPreview(null);
          setActiveInvoiceForEdit(null);
          setCurrentTab(tab);
        }}
        currentLang={language}
        onOpenCreate={handleOpenCreateInvoice}
        scansNeedReviewCount={scansNeedReviewCount}
      />

      {/* Main View Area */}
      <main className="flex-1">
        
        {/* Full Printable Invoice PDF Preview */}
        {activeInvoiceForPreview ? (
          <InvoicePdfView
            invoice={activeInvoiceForPreview}
            profile={profile}
            subscription={subscription}
            onBack={() => setActiveInvoiceForPreview(null)}
            onIssue={(inv) => handleIssueInvoice(inv)}
            onRecordPayment={(inv) => setActiveInvoiceForPayment(inv)}
            onCancelInvoice={handleCancelInvoice}
            onClone={handleCloneInvoice}
          />
        ) : currentTab === 'create' ? (
          /* Create or Edit Invoice Screen */
          <InvoiceForm
            profile={profile}
            savedParties={parties}
            savedItems={items}
            subscription={subscription}
            currentLang={language}
            initialInvoice={activeInvoiceForEdit}
            onSaveDraft={handleSaveInvoiceDraft}
            onIssueInvoice={handleIssueInvoice}
            onPreview={(inv) => setActiveInvoiceForPreview(inv)}
            onCancel={() => setCurrentTab(previousTab || 'home')}
            onSaveParty={handleSaveParty}
          />
        ) : currentTab === 'home' ? (
          /* Home Dashboard */
          <Dashboard
            profile={profile}
            invoices={invoices}
            scans={scans}
            subscription={subscription}
            currentLang={language}
            onOpenCreate={handleOpenCreateInvoice}
            onOpenScan={() => setCurrentTab('scan')}
            onOpenRecords={() => setCurrentTab('records')}
            onSelectInvoice={handleSelectInvoiceForView}
            onSelectScan={handleSelectScanForReview}
            onOpenSettings={() => setCurrentTab('settings')}
            onLoadSampleData={() => {
              storageService.seedSampleTaxiData();
              refreshTenantData();
            }}
          />
        ) : currentTab === 'invoices' ? (
          /* Sales Invoices List / Records */
          <RecordsView
            invoices={invoices}
            expenses={expenses}
            scans={scans}
            currentLang={language}
            onSelectInvoice={handleSelectInvoiceForView}
            onSelectScan={handleSelectScanForReview}
            onRecordPayment={(inv) => setActiveInvoiceForPayment(inv)}
          />
        ) : currentTab === 'scan' ? (
          /* Scan-to-Books Screen */
          <ScanView
            scans={scans}
            currentLang={language}
            onSaveScan={handleSaveScan}
            onSaveExpense={handleSaveExpense}
          />
        ) : currentTab === 'expenses' ? (
          /* Purchases / Expenses */
          <RecordsView
            invoices={invoices}
            expenses={expenses}
            scans={scans}
            currentLang={language}
            onSelectInvoice={handleSelectInvoiceForView}
            onSelectScan={handleSelectScanForReview}
            onRecordPayment={(inv) => setActiveInvoiceForPayment(inv)}
          />
        ) : currentTab === 'parties' ? (
          /* Customers & Suppliers */
          <PartiesView
            parties={parties}
            invoices={invoices}
            profile={profile}
            currentLang={language}
            onSaveParty={handleSaveParty}
            onDeleteParty={handleDeleteParty}
            onCreateInvoiceForParty={handleCreateInvoiceForParty}
          />
        ) : currentTab === 'items' ? (
          /* Catalog Items */
          <ItemsView
            items={items}
            currentLang={language}
            onSaveItem={handleSaveItem}
          />
        ) : currentTab === 'records' ? (
          /* Unified Records & Search */
          <RecordsView
            invoices={invoices}
            expenses={expenses}
            scans={scans}
            currentLang={language}
            onSelectInvoice={handleSelectInvoiceForView}
            onSelectScan={handleSelectScanForReview}
            onRecordPayment={(inv) => setActiveInvoiceForPayment(inv)}
            onCloneInvoice={handleCloneInvoice}
          />
        ) : currentTab === 'reports' ? (
          /* Reports & GST Summary */
          <ReportsView
            invoices={invoices}
            expenses={expenses}
            scans={scans}
            auditLogs={storageService.getAuditLog()}
            currentLang={language}
            profile={profile}
          />
        ) : currentTab === 'brand' ? (
          /* Pro Plan & Branding */
          <SubscriptionView
            profile={profile}
            subscription={subscription}
            onUpgrade={handleUpgradeToPro}
            onDowngrade={handleDowngradeToFree}
            onUpdateProfile={handleUpdateProfile}
          />
        ) : currentTab === 'settings' ? (
          /* Settings */
          <SettingsView
            profile={profile}
            currentLang={language}
            onLanguageChange={handleLanguageChange}
            onSaveProfile={handleUpdateProfile}
            onResetData={handleResetData}
            onOpenSetupWizard={() => setShowManualSetupWizard(true)}
          />
        ) : null}

      </main>

      {/* Record Payment Modal */}
      {activeInvoiceForPayment && (
        <PaymentModal
          invoice={activeInvoiceForPayment}
          onClose={() => setActiveInvoiceForPayment(null)}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {/* Global Spotlight Search Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        invoices={invoices}
        parties={parties}
        items={items}
        scans={scans}
        onNavigate={(tab) => {
          setActiveInvoiceForPreview(null);
          setActiveInvoiceForEdit(null);
          setCurrentTab(tab);
        }}
        onSelectInvoice={(inv) => {
          setActiveInvoiceForPreview(inv);
        }}
        onOpenCreate={handleOpenCreateInvoice}
      />

      {/* Auth Modal (PRD Section 6.1 AUTH-01) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user, session) => {
          setCurrentUser(user);
          refreshTenantData();
          setIsAuthModalOpen(false);
        }}
      />

      {/* Mandatory Company Setup Wizard for First-Time Setup / Incomplete Profile */}
      {(!profile.isConfigured || showManualSetupWizard) && (
        <CompanySetupWizard
          currentProfile={profile}
          onComplete={(updated) => {
            handleUpdateProfile(updated);
            authService.markOnboardingComplete();
            setShowManualSetupWizard(false);
          }}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveInvoiceForPreview(null);
          setActiveInvoiceForEdit(null);
          setCurrentTab(tab);
        }}
        currentLang={language}
        onOpenCreate={handleOpenCreateInvoice}
        scansNeedReviewCount={scansNeedReviewCount}
      />

    </div>
  );
}

export default App;
