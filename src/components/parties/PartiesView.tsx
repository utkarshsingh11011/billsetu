import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import { Party, Invoice, BusinessProfile } from '../../types';
import { INDIAN_STATES, getStateByCode } from '../../constants/states';
import { lookupGstin } from '../../services/gstinService';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { Language, translations } from '../../services/i18n';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { CustomerStatementModal } from './CustomerStatementModal';

export interface PartiesViewProps {
  parties: Party[];
  invoices: Invoice[];
  profile: BusinessProfile;
  currentLang: Language;
  onSaveParty: (party: Party) => void;
  onDeleteParty: (id: string) => void;
  onCreateInvoiceForParty?: (party: Party) => void;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  parties,
  invoices,
  profile,
  currentLang,
  onSaveParty,
  onDeleteParty,
  onCreateInvoiceForParty,
}) => {
  const t = translations[currentLang];

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  
  // Statement modal state
  const [selectedPartyForStatement, setSelectedPartyForStatement] = useState<Party | null>(null);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<Party['type']>('customer');
  const [formGstin, setFormGstin] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formTradeName, setFormTradeName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('');
  const [formStateCode, setFormStateCode] = useState<string>('27');
  const [formPincode, setFormPincode] = useState<string>('');
  const [lookupStatus, setLookupStatus] = useState<Party['lookupStatus']>('unverified_manual');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupMessage, setLookupMessage] = useState<string>('');

  const openAddModal = (type: Party['type'] = 'customer') => {
    setEditingPartyId(null);
    setFormType(type);
    setFormGstin('');
    setFormName('');
    setFormTradeName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormCity('');
    setFormStateCode('27');
    setFormPincode('');
    setLookupStatus('unverified_manual');
    setLookupMessage('');
    setShowModal(true);
  };

  const openEditModal = (p: Party) => {
    setEditingPartyId(p.id);
    setFormType(p.type);
    setFormGstin(p.gstin || '');
    setFormName(p.name);
    setFormTradeName(p.tradeName || '');
    setFormPhone(p.phone || '');
    setFormEmail(p.email || '');
    setFormAddress(p.address);
    setFormCity(p.city);
    setFormStateCode(p.stateCode);
    setFormPincode(p.pincode || '');
    setLookupStatus(p.lookupStatus);
    setLookupMessage('');
    setShowModal(true);
  };

  const handleGstinLookup = async () => {
    if (!formGstin) return;
    setIsLookingUp(true);
    setLookupMessage('');

    try {
      const res = await lookupGstin(formGstin);
      if (res.data) {
        setFormName(res.data.legalName);
        setFormTradeName(res.data.tradeName);
        setFormAddress(res.data.address);
        setFormCity(res.data.city);
        setFormStateCode(res.data.stateCode);
        setFormPincode(res.data.pincode);
        setLookupStatus(res.status);
        setLookupMessage(`Verified via ${res.data.source}`);
      } else {
        setLookupMessage(res.formatError || 'GSTIN not found. You can enter details manually.');
      }
    } catch {
      setLookupMessage('Lookup service unavailable. Enter details manually.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const state = getStateByCode(formStateCode)?.name || 'Maharashtra';
    const newParty: Party = {
      id: editingPartyId || `pty_${Date.now()}`,
      businessId: 'biz_01',
      type: formType,
      category: formType === 'supplier' ? 'vendor' : (formGstin.trim() ? 'corporate_client' : 'individual_passenger'),
      name: formName.trim(),
      tradeName: formTradeName.trim() || undefined,
      gstin: formGstin.trim() || undefined,
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      address: formAddress.trim(),
      city: formCity.trim() || 'Mumbai',
      state,
      stateCode: formStateCode,
      pincode: formPincode.trim() || undefined,
      lookupStatus,
      lastCheckedAt: new Date().toISOString(),
      balancePaise: editingPartyId ? (parties.find(p => p.id === editingPartyId)?.balancePaise || 0) : 0,
    };

    onSaveParty(newParty);
    setShowModal(false);
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tradeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.gstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = partyTypeFilter === 'all' || p.type === partyTypeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navParties}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of customers and vendors with GSTIN verification status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddModal('supplier')}
            leftIcon={<Plus className="w-4 h-4 text-teal-600" />}
          >
            Add Supplier
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openAddModal('customer')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search party by name, trade name, GSTIN, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setPartyTypeFilter('all')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${
              partyTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'
            }`}
          >
            All ({parties.length})
          </button>
          <button
            onClick={() => setPartyTypeFilter('customer')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${
              partyTypeFilter === 'customer' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setPartyTypeFilter('supplier')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${
              partyTypeFilter === 'supplier' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'
            }`}
          >
            Suppliers
          </button>
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map((p) => (
          <Card key={p.id} className="p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                    {p.tradeName && <p className="text-[11px] text-slate-500 line-clamp-1">{p.tradeName}</p>}
                  </div>
                </div>

                <Badge variant={p.type === 'customer' ? 'teal' : 'slate'} size="sm">
                  {p.type.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span>GSTIN:</span>
                  {p.gstin ? (
                    <span className="font-mono font-semibold text-slate-900">{p.gstin}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unregistered</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>State:</span>
                  <span>{p.state} ({p.stateCode})</span>
                </div>

                {p.phone && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-500 line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{p.address || `${p.city}, ${p.state}`}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Outstanding</span>
                <span className={`text-xs font-bold ${p.balancePaise > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatPaiseToRupees(p.balancePaise)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPartyForStatement(p)}
                  className="text-xs px-2.5 py-1"
                  title="View Statement of Account & Ledger (Khata)"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600 mr-1" />
                  Statement
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEditModal(p)} className="text-xs px-2.5">
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Party Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">
                {editingPartyId ? 'Edit Party' : `Add New ${formType === 'customer' ? 'Customer' : 'Supplier'}`}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormType('customer')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                  formType === 'customer' ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-white text-slate-600'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setFormType('supplier')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                  formType === 'supplier' ? 'bg-teal-50 border-teal-500 text-teal-900' : 'bg-white text-slate-600'
                }`}
              >
                Supplier / Vendor
              </button>
            </div>

            {/* GSTIN with autofill */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN (Optional for Unregistered)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={15}
                  value={formGstin}
                  onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABCU9603R1ZM"
                  className="w-full uppercase font-mono rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGstinLookup}
                  isLoading={isLookingUp}
                  className="shrink-0 text-xs px-2.5"
                >
                  Autofill
                </Button>
              </div>
              {lookupMessage && <p className="text-[11px] text-teal-700 mt-1">{lookupMessage}</p>}
            </div>

            {/* Name & Trade Name */}
            <Input
              label="Legal Name / Business Name"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Acme Enterprises Pvt Ltd"
            />

            <Input
              label="Trade Name (Optional)"
              value={formTradeName}
              onChange={(e) => setFormTradeName(e.target.value)}
              placeholder="e.g. Acme Store"
            />

            {/* State & City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <select
                  value={formStateCode}
                  onChange={(e) => setFormStateCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <Input
                label="City"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </div>

            <Input
              label="Address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Shop/Office number, Street, Area"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91..."
              />
              <Input
                label="Email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="accounts@..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700">
                Save Party
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Statement / Khata Modal */}
      {selectedPartyForStatement && (
        <CustomerStatementModal
          party={selectedPartyForStatement}
          invoices={invoices}
          profile={profile}
          isOpen={!!selectedPartyForStatement}
          onClose={() => setSelectedPartyForStatement(null)}
          onCreateInvoiceForParty={onCreateInvoiceForParty}
        />
      )}

    </div>
  );
};
