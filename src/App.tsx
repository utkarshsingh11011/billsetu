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

export function App() {
  // Global Application State loaded from storageService
  const [profile, setProfile] = useState<BusinessProfile>(() => storageService.getProfile());
  const [parties, setParties] = useState<Party[]>(() => storageService.getParties());
  const [items, setItems] = useState<Item[]>(() => storageService.getItems());
  const [invoices, setInvoices] = useState<Invoice[]>(() => storageService.getInvoices());
  const [scans, setScans] = useState<ScannedDocument[]>(() => storageService.getScans());
  const [expenses, setExpenses] = useState<PurchaseExpense[]>(() => storageService.getExpenses());
  const [subscription, setSubscription] = useState<Subscription>(() => storageService.getSubscription());
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [previousTab, setPreviousTab] = useState<string>('home');

  // Modal / Detailed View states
  const [activeInvoiceForPreview, setActiveInvoiceForPreview] = useState<Invoice | null>(null);
  const [activeInvoiceForEdit, setActiveInvoiceForEdit] = useState<Invoice | null>(null);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);

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
    setProfile(storageService.getProfile());
    setParties(storageService.getParties());
    setItems(storageService.getItems());
    setInvoices(storageService.getInvoices());
    setScans(storageService.getScans());
    setExpenses(storageService.getExpenses());
    setSubscription(storageService.getSubscription());
    setCurrentTab('home');
  };

  const handleOpenCreateInvoice = () => {
    setActiveInvoiceForEdit(null);
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
            currentLang={language}
            onSaveParty={handleSaveParty}
            onDeleteParty={handleDeleteParty}
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
          />
        ) : currentTab === 'reports' ? (
          /* Reports & GST Summary */
          <ReportsView
            invoices={invoices}
            expenses={expenses}
            scans={scans}
            auditLogs={storageService.getAuditLog()}
            currentLang={language}
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
