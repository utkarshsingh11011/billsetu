import React, { useState } from 'react';
import { Package, Plus, Search, Trash2, Edit, X } from 'lucide-react';
import { Item } from '../../types';
import { formatPaiseToRupees } from '../../services/taxEngine';
import { Language, translations } from '../../services/i18n';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface ItemsViewProps {
  items: Item[];
  currentLang: Language;
  onSaveItem: (item: Item) => void;
}

export const ItemsView: React.FC<ItemsViewProps> = ({
  items,
  currentLang,
  onSaveItem,
}) => {
  const t = translations[currentLang];
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [hsnSac, setHsnSac] = useState<string>('');
  const [unit, setUnit] = useState<Item['unit']>('pcs');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(18);
  const [priceRupees, setPriceRupees] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const openAddModal = () => {
    setEditingItemId(null);
    setName('');
    setHsnSac('8471');
    setUnit('pcs');
    setDefaultTaxRate(18);
    setPriceRupees('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItemId(item.id);
    setName(item.name);
    setHsnSac(item.hsnSac);
    setUnit(item.unit);
    setDefaultTaxRate(item.defaultTaxRate);
    setPriceRupees((item.defaultPricePaise / 100).toString());
    setDescription(item.description || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const pricePaise = Math.round((parseFloat(priceRupees) || 0) * 100);

    const saved: Item = {
      id: editingItemId || `itm_${Date.now()}`,
      businessId: 'biz_01',
      name: name.trim(),
      hsnSac: hsnSac.trim() || '9983',
      unit,
      defaultTaxRate,
      defaultPricePaise: pricePaise,
      description: description.trim() || undefined,
    };

    onSaveItem(saved);
    setShowModal(false);
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.hsnSac.includes(searchQuery) ||
    (i.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navItems}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your goods and services catalog with default HSN codes and GST rates
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-teal-600 hover:bg-teal-700"
        >
          Add Item / Service
        </Button>
      </div>

      <div className="w-full max-w-md">
        <Input
          placeholder="Search items by name, HSN/SAC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftAddon={<Search className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-4 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                </div>
                <Badge variant="teal">{item.defaultTaxRate}% GST</Badge>
              </div>

              {item.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span>HSN/SAC: <strong className="font-mono text-slate-800">{item.hsnSac}</strong></span>
                <span>Unit: <strong>{item.unit}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Default Rate</span>
                <span className="text-sm font-bold text-teal-700">
                  {formatPaiseToRupees(item.defaultPricePaise)}
                </span>
              </div>

              <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} className="text-xs px-2.5">
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">
                {editingItemId ? 'Edit Item' : 'Add New Item / Service'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Input
              label="Item / Service Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Mouse"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="HSN / SAC Code"
                value={hsnSac}
                onChange={(e) => setHsnSac(e.target.value)}
                placeholder="e.g. 8471"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                >
                  <option value="pcs">pcs</option>
                  <option value="box">box</option>
                  <option value="kg">kg</option>
                  <option value="hrs">hrs</option>
                  <option value="nos">nos</option>
                  <option value="set">set</option>
                  <option value="pkts">pkts</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Default Price (₹)"
                type="number"
                step="0.01"
                required
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                placeholder="0.00"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default GST %</label>
                <select
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            <Input
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief specifications..."
            />

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700">
                Save Item
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
