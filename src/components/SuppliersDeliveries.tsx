import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../lib/storage';
import { Plus, ChevronDown, ChevronUp, Truck, Building2, Pencil, Trash2, CheckCircle2, XCircle, AlertTriangle, Phone, Mail, Package } from 'lucide-react';
import { format } from 'date-fns';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  productsSupplied: string;
  approved: boolean;
  notes: string;
}

interface DeliveryRecord {
  id: string;
  date: string;
  supplierId: string;
  itemsReceived: string;
  tempRequired: boolean;
  temperature: string;
  tempOk: boolean;
  conditionOk: boolean;
  packagingIntact: boolean;
  useByDateOk: boolean;
  accepted: boolean;
  correctiveAction: string;
  recordedBy: string;
}

const SUPPLIERS_KEY = 'cafe-suppliers';
const DELIVERIES_KEY = 'cafe-deliveries';

function emptySupplier(): Supplier {
  return { id: '', name: '', contactPerson: '', phone: '', email: '', productsSupplied: '', approved: true, notes: '' };
}

function emptyDelivery(recorder: string): DeliveryRecord {
  return {
    id: '', date: format(new Date(), 'yyyy-MM-dd'), supplierId: '', itemsReceived: '',
    tempRequired: false, temperature: '', tempOk: true, conditionOk: true,
    packagingIntact: true, useByDateOk: true, accepted: true, correctiveAction: '', recordedBy: recorder,
  };
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', inputMode }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel';
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        className="glass-input w-full min-h-[44px] px-4 rounded-xl" style={{ color: 'var(--text)' }} />
    </div>
  );
}

function AreaField({ label, value, onChange, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
        className="glass-input w-full min-h-[44px] px-4 py-3 rounded-xl resize-y" style={{ color: 'var(--text)' }} />
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`check-row min-h-[44px] ${checked ? 'checked' : ''}`}>
      <div className="check-box">
        {checked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </div>
      <span className="check-label">{label}</span>
    </button>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm flex items-center gap-2 shrink-0" style={{ color: 'var(--text-muted)' }}>{icon}{label}</span>
      <span className="text-sm font-medium text-right truncate min-w-0" style={{ color: 'var(--text)' }}>{value || '—'}</span>
    </div>
  );
}

export default function SuppliersDeliveries({ recorder }: { recorder: string }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'deliveries'>('suppliers');
  const [showSheet, setShowSheet] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<Supplier>(emptySupplier());
  const [deliveryForm, setDeliveryForm] = useState<DeliveryRecord>(emptyDelivery(recorder));

  useEffect(() => {
    setSuppliers(load<Supplier[]>(SUPPLIERS_KEY, []));
    setDeliveries(load<DeliveryRecord[]>(DELIVERIES_KEY, []));
  }, []);

  const persistSuppliers = useCallback((s: Supplier[]) => { setSuppliers(s); save(SUPPLIERS_KEY, s); }, []);
  const persistDeliveries = useCallback((d: DeliveryRecord[]) => { setDeliveries(d); save(DELIVERIES_KEY, d); }, []);

  const openAddSupplier = () => { setEditingSupplier(null); setSupplierForm(emptySupplier()); setShowSheet(true); };
  const openEditSupplier = (s: Supplier) => { setEditingSupplier(s); setSupplierForm({ ...s }); setShowSheet(true); };
  const openAddDelivery = () => { setDeliveryForm(emptyDelivery(recorder)); setShowSheet(true); };

  const saveSupplier = () => {
    if (!supplierForm.name.trim()) return;
    if (editingSupplier) {
      persistSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...supplierForm, id: editingSupplier.id } : s));
    } else {
      persistSuppliers([...suppliers, { ...supplierForm, id: crypto.randomUUID() }]);
    }
    setShowSheet(false);
  };

  const deleteSupplier = (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    persistSuppliers(suppliers.filter(s => s.id !== id));
    setShowSheet(false);
  };

  const saveDelivery = () => {
    if (!deliveryForm.supplierId || !deliveryForm.itemsReceived.trim()) return;
    persistDeliveries([{ ...deliveryForm, id: crypto.randomUUID(), recordedBy: recorder }, ...deliveries]);
    setShowSheet(false);
  };

  const deleteDelivery = (id: string) => {
    if (!confirm('Delete this delivery record?')) return;
    persistDeliveries(deliveries.filter(d => d.id !== id));
  };

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-4 content-area px-4 p-4 pb-24 min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      <div className="section-header flex items-center gap-2">
        <Truck className="w-5 h-5" style={{ color: 'var(--navy)' }} />
        Suppliers & Deliveries
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setActiveTab('suppliers')}
          className={`flex-1 min-h-[44px] px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-outline'}`}>
          <Building2 size={16} /> Suppliers
        </button>
        <button type="button" onClick={() => setActiveTab('deliveries')}
          className={`flex-1 min-h-[44px] px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'deliveries' ? 'btn-primary' : 'btn-outline'}`}>
          <Package size={16} /> Deliveries
        </button>
      </div>

      {activeTab === 'suppliers' && (
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            MPI requires an approved supplier list with contact details. Keep this up to date.
          </p>
          {suppliers.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm" style={{ color: 'var(--text)' }}>
              <Building2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No suppliers added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Tap + to add your first supplier</p>
            </div>
          ) : (
            suppliers.map(s => {
              const isExpanded = expandedId === s.id;
              return (
                <div key={s.id} className="card rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.approved ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)' }}>
                          {s.approved ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.productsSupplied || 'No products listed'}</p>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <DetailRow label="Contact" value={s.contactPerson} icon={<Building2 size={13} />} />
                      <DetailRow label="Phone" value={s.phone} icon={<Phone size={13} />} />
                      <DetailRow label="Email" value={s.email} icon={<Mail size={13} />} />
                      <DetailRow label="Products" value={s.productsSupplied} icon={<Package size={13} />} />
                      <DetailRow label="Status" value={s.approved ? 'Approved' : 'Pending Approval'} icon={s.approved ? <CheckCircle2 size={13} className="text-green-500" /> : <AlertTriangle size={13} className="text-amber-500" />} />
                      {s.notes && <DetailRow label="Notes" value={s.notes} />}
                      <div className="flex gap-2 mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => openEditSupplier(s)} className="flex-1 min-h-[44px] px-4 rounded-xl btn-outline flex items-center justify-center gap-2 text-sm font-medium">
                          <Pencil size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => deleteSupplier(s.id)} className="min-h-[44px] px-4 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-medium">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'deliveries' && (
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            MPI requires you to check deliveries are safe, undamaged, at correct temperature, and not past use-by date.
          </p>
          {deliveries.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm" style={{ color: 'var(--text)' }}>
              <Truck size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No delivery records yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Tap + to record a delivery</p>
            </div>
          ) : (
            deliveries.map(d => {
              const isExpanded = expandedId === d.id;
              const allOk = d.conditionOk && d.packagingIntact && d.useByDateOk && (!d.tempRequired || d.tempOk);
              return (
                <div key={d.id} className="card rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: d.accepted ? (allOk ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)') : 'rgba(239,68,68,0.15)' }}>
                          {d.accepted ? (allOk ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-amber-500" />) : <XCircle size={16} className="text-red-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{getSupplierName(d.supplierId)}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {format(new Date(d.date), 'EEE dd MMM yyyy')}
                            {d.tempRequired && d.temperature && <span> · {d.temperature}°C</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${d.accepted ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {d.accepted ? 'Accepted' : 'Rejected'}
                      </span>
                      {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <DetailRow label="Items" value={d.itemsReceived} icon={<Package size={13} />} />
                      <DetailRow label="Condition OK" value={d.conditionOk ? '✓ Good' : '✗ Damaged'} />
                      <DetailRow label="Packaging Intact" value={d.packagingIntact ? '✓ Yes' : '✗ No'} />
                      <DetailRow label="Use-By Date OK" value={d.useByDateOk ? '✓ Yes' : '✗ Expired/Missing'} />
                      {d.tempRequired && (
                        <>
                          <DetailRow label="Temp Check" value={d.temperature ? `${d.temperature}°C` : 'Not recorded'} />
                          <DetailRow label="Temp Acceptable" value={d.tempOk ? '✓ Yes' : '✗ No'} />
                        </>
                      )}
                      {d.correctiveAction && <DetailRow label="Corrective Action" value={d.correctiveAction} />}
                      <DetailRow label="Recorded By" value={d.recordedBy} />
                      <div className="flex justify-end mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => deleteDelivery(d.id)} className="min-h-[44px] px-4 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-medium">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <button type="button" onClick={activeTab === 'suppliers' ? openAddSupplier : openAddDelivery}
        className="fab" aria-label={activeTab === 'suppliers' ? 'Add supplier' : 'Record delivery'}>
        <Plus className="w-7 h-7" />
      </button>

      {showSheet && activeTab === 'suppliers' && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} aria-hidden />
          <div className="sheet p-6">
            <div className="sheet-handle" />
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h3>
            <div className="space-y-3">
              <InputField label="Supplier Name *" value={supplierForm.name} onChange={v => setSupplierForm({ ...supplierForm, name: v })} placeholder="e.g. Bidfood, Gilmours" />
              <InputField label="Contact Person" value={supplierForm.contactPerson} onChange={v => setSupplierForm({ ...supplierForm, contactPerson: v })} placeholder="Primary contact name" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField label="Phone" value={supplierForm.phone} onChange={v => setSupplierForm({ ...supplierForm, phone: v })} type="tel" placeholder="Phone number" inputMode="tel" />
                <InputField label="Email" value={supplierForm.email} onChange={v => setSupplierForm({ ...supplierForm, email: v })} type="email" placeholder="Email address" inputMode="email" />
              </div>
              <AreaField label="Products Supplied" value={supplierForm.productsSupplied} onChange={v => setSupplierForm({ ...supplierForm, productsSupplied: v })} placeholder="e.g. Dairy, meat, produce..." />
              <AreaField label="Notes" value={supplierForm.notes} onChange={v => setSupplierForm({ ...supplierForm, notes: v })} placeholder="Any special requirements or notes" />
              <CheckItem label="Approved Supplier" checked={supplierForm.approved} onChange={v => setSupplierForm({ ...supplierForm, approved: v })} />
            </div>
            <div className="flex gap-2 justify-end mt-6">
              {editingSupplier && (
                <button type="button" onClick={() => deleteSupplier(editingSupplier.id)} className="min-h-[44px] px-4 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium">
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button type="button" onClick={() => setShowSheet(false)} className="btn-outline min-h-[44px] px-4 rounded-xl text-sm">Cancel</button>
              <button type="button" onClick={saveSupplier} className="btn-primary min-h-[44px] px-4 rounded-xl text-sm">{editingSupplier ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </>
      )}

      {showSheet && activeTab === 'deliveries' && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} aria-hidden />
          <div className="sheet p-6">
            <div className="sheet-handle" />
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Record Delivery</h3>
            <div className="space-y-3">
              <InputField label="Date" value={deliveryForm.date} onChange={v => setDeliveryForm({ ...deliveryForm, date: v })} type="date" />
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Supplier *</label>
                <select value={deliveryForm.supplierId} onChange={e => setDeliveryForm({ ...deliveryForm, supplierId: e.target.value })}
                  className="glass-input w-full min-h-[44px] px-4 rounded-xl" style={{ color: 'var(--text)' }}>
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {suppliers.length === 0 && (
                  <p className="text-xs mt-1 text-amber-500">Add a supplier first in the Suppliers tab</p>
                )}
              </div>
              <AreaField label="Items Received *" value={deliveryForm.itemsReceived} onChange={v => setDeliveryForm({ ...deliveryForm, itemsReceived: v })} placeholder="List items received..." />

              <div className="card rounded-xl p-3 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--navy)' }}>MPI Receiving Checks</p>
                <CheckItem label="Condition OK (not damaged)" checked={deliveryForm.conditionOk} onChange={v => setDeliveryForm({ ...deliveryForm, conditionOk: v })} />
                <CheckItem label="Packaging intact" checked={deliveryForm.packagingIntact} onChange={v => setDeliveryForm({ ...deliveryForm, packagingIntact: v })} />
                <CheckItem label="Use-by date acceptable" checked={deliveryForm.useByDateOk} onChange={v => setDeliveryForm({ ...deliveryForm, useByDateOk: v })} />
              </div>

              <div className="card rounded-xl p-3 space-y-3">
                <CheckItem label="Temperature check required (chilled/frozen)" checked={deliveryForm.tempRequired} onChange={v => setDeliveryForm({ ...deliveryForm, tempRequired: v })} />
                {deliveryForm.tempRequired && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField label="Temperature (°C)" value={deliveryForm.temperature} onChange={v => setDeliveryForm({ ...deliveryForm, temperature: v })} type="number" placeholder="e.g. 3.5" inputMode="decimal" />
                    <div className="flex items-end">
                      <CheckItem label="Temperature acceptable" checked={deliveryForm.tempOk} onChange={v => setDeliveryForm({ ...deliveryForm, tempOk: v })} />
                    </div>
                  </div>
                )}
              </div>

              <CheckItem label="Delivery ACCEPTED" checked={deliveryForm.accepted} onChange={v => setDeliveryForm({ ...deliveryForm, accepted: v })} />

              {(!deliveryForm.conditionOk || !deliveryForm.packagingIntact || !deliveryForm.useByDateOk || !deliveryForm.accepted || (deliveryForm.tempRequired && !deliveryForm.tempOk)) && (
                <AreaField label="Corrective Action Taken" value={deliveryForm.correctiveAction}
                  onChange={v => setDeliveryForm({ ...deliveryForm, correctiveAction: v })}
                  placeholder="e.g. Returned to supplier, adjusted storage, discarded..." />
              )}
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button type="button" onClick={() => setShowSheet(false)} className="btn-outline min-h-[44px] px-4 rounded-xl text-sm">Cancel</button>
              <button type="button" onClick={saveDelivery} disabled={!deliveryForm.supplierId || !deliveryForm.itemsReceived.trim()}
                className="btn-primary min-h-[44px] px-4 rounded-xl text-sm disabled:opacity-40">Save Record</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
