import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../lib/storage';
import {
  Plus, Trash2, Pencil, ChevronDown, ChevronUp, AlertTriangle,
  UtensilsCrossed, Grid3X3, Package, FileDown, Check, ShieldAlert,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const ALLERGENS = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish',
  'Shellfish', 'Sesame', 'Sulphites', 'Lupin', 'Celery', 'Mustard', 'Molluscs',
];

interface MenuItem {
  id: string;
  name: string;
  category: string;
  allergens: string[];
  notes: string;
}

interface OutsourcedProduct {
  id: string;
  name: string;
  supplier: string;
  ingredients: string;
  allergens: string[];
  mayContain: string[];
  specSheetAvailable: boolean;
  notes: string;
  lastUpdated: string;
}

type Tab = 'menu' | 'matrix' | 'outsourced';

const MENU_KEY = 'cafe-menu-items';
const OUTSOURCED_KEY = 'cafe-outsourced-products';

function emptyMenuItem(): MenuItem {
  return { id: '', name: '', category: '', allergens: [], notes: '' };
}

function emptyOutsourcedProduct(): OutsourcedProduct {
  return {
    id: '', name: '', supplier: '', ingredients: '', allergens: [],
    mayContain: [], specSheetAvailable: false, notes: '',
    lastUpdated: format(new Date(), 'yyyy-MM-dd'),
  };
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
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

function AllergenBadge({ name, variant = 'contains' }: { name: string; variant?: 'contains' | 'may-contain' }) {
  const isMay = variant === 'may-contain';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={isMay
        ? { border: '1.5px dashed var(--gold)', color: 'var(--gold)', background: 'rgba(234,179,8,0.08)' }
        : { background: 'rgba(239,68,68,0.12)', color: '#dc2626' }
      }
    >
      {name}
    </span>
  );
}

export default function AllergenRegister({ recorder: _recorder }: { recorder: string }) {
  void _recorder;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [outsourced, setOutsourced] = useState<OutsourcedProduct[]>([]);
  const [tab, setTab] = useState<Tab>('menu');
  const [showSheet, setShowSheet] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<MenuItem>(emptyMenuItem());

  const [editingProduct, setEditingProduct] = useState<OutsourcedProduct | null>(null);
  const [productForm, setProductForm] = useState<OutsourcedProduct>(emptyOutsourcedProduct());

  useEffect(() => {
    setMenuItems(load<MenuItem[]>(MENU_KEY, []));
    setOutsourced(load<OutsourcedProduct[]>(OUTSOURCED_KEY, []));
  }, []);

  const persistMenu = useCallback((items: MenuItem[]) => { setMenuItems(items); save(MENU_KEY, items); }, []);
  const persistOutsourced = useCallback((items: OutsourcedProduct[]) => { setOutsourced(items); save(OUTSOURCED_KEY, items); }, []);

  const toggleAllergen = (list: string[], allergen: string) =>
    list.includes(allergen) ? list.filter(a => a !== allergen) : [...list, allergen];

  /* ── Menu Items CRUD ── */
  const openAddMenu = () => { setEditingMenuItem(null); setMenuForm(emptyMenuItem()); setShowSheet(true); };
  const openEditMenu = (item: MenuItem) => { setEditingMenuItem(item); setMenuForm({ ...item }); setShowSheet(true); };

  const saveMenuItem = () => {
    if (!menuForm.name.trim()) return;
    if (editingMenuItem) {
      persistMenu(menuItems.map(m => m.id === editingMenuItem.id ? { ...menuForm, id: editingMenuItem.id } : m));
    } else {
      persistMenu([...menuItems, { ...menuForm, id: crypto.randomUUID() }]);
    }
    setShowSheet(false);
  };

  const deleteMenuItem = (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    persistMenu(menuItems.filter(m => m.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  /* ── Outsourced Products CRUD ── */
  const openAddProduct = () => { setEditingProduct(null); setProductForm(emptyOutsourcedProduct()); setShowSheet(true); };
  const openEditProduct = (p: OutsourcedProduct) => { setEditingProduct(p); setProductForm({ ...p }); setShowSheet(true); };

  const saveProduct = () => {
    if (!productForm.name.trim()) return;
    const entry = { ...productForm, lastUpdated: format(new Date(), 'yyyy-MM-dd') };
    if (editingProduct) {
      persistOutsourced(outsourced.map(p => p.id === editingProduct.id ? { ...entry, id: editingProduct.id } : p));
    } else {
      persistOutsourced([...outsourced, { ...entry, id: crypto.randomUUID() }]);
    }
    setShowSheet(false);
  };

  const deleteProduct = (id: string) => {
    if (!confirm('Delete this product?')) return;
    persistOutsourced(outsourced.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  /* ── PDF Export ── */
  const exportOutsourcedPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Outsourced Products — Allergen Register', 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [['Product', 'Supplier', 'Ingredients', 'Allergens', 'May Contain', 'Spec Sheet', 'Last Updated', 'Notes']],
      body: outsourced.map(p => [
        p.name,
        p.supplier,
        p.ingredients,
        p.allergens.join(', ') || '—',
        p.mayContain.join(', ') || '—',
        p.specSheetAvailable ? 'Yes' : 'No',
        p.lastUpdated,
        p.notes || '—',
      ]),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42] },
      columnStyles: { 2: { cellWidth: 50 } },
    });
    doc.save(`outsourced-allergens-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  /* ── FAB handler ── */
  const handleFab = () => {
    if (tab === 'menu') openAddMenu();
    else if (tab === 'outsourced') openAddProduct();
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'menu', label: 'Menu Items', icon: <UtensilsCrossed size={16} /> },
    { key: 'matrix', label: 'Matrix', icon: <Grid3X3 size={16} /> },
    { key: 'outsourced', label: 'Outsourced', icon: <Package size={16} /> },
  ];

  const categories = [...new Set(menuItems.map(m => m.category).filter(Boolean))];

  return (
    <div className="space-y-4 content-area px-4 p-4 pb-24 min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      <div className="section-header flex items-center gap-2">
        <ShieldAlert className="w-5 h-5" style={{ color: 'var(--navy)' }} />
        Allergen Register
      </div>

      {/* ── Tab bar ── */}
      <div className="card rounded-2xl p-1.5 flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowSheet(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'shadow-md' : ''}`}
            style={tab === t.key ? { background: 'var(--navy)', color: 'var(--btn-primary-text)' } : { color: 'var(--text-muted)' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ MENU ITEMS TAB ═══════════════════ */}
      {tab === 'menu' && (
        <div className="space-y-3">
          {menuItems.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm">
              <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No menu items yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Tap + to add your first menu item</p>
            </div>
          ) : (
            menuItems.map(item => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} className="card rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: item.allergens.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.15)' }}>
                          {item.allergens.length > 0
                            ? <AlertTriangle size={16} className="text-red-500" />
                            : <Check size={16} className="text-green-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {item.category || 'Uncategorised'} · {item.allergens.length} allergen{item.allergens.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {item.allergens.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.allergens.map(a => <AllergenBadge key={a} name={a} />)}
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-green-600">No allergens identified</p>
                      )}
                      {item.notes && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="font-medium">Notes:</span> {item.notes}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => openEditMenu(item)}
                          className="flex-1 min-h-[44px] px-4 rounded-xl btn-outline flex items-center justify-center gap-2 text-sm font-medium">
                          <Pencil size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => deleteMenuItem(item.id)}
                          className="min-h-[44px] px-4 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-medium">
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

      {/* ═══════════════════ ALLERGEN MATRIX TAB ═══════════════════ */}
      {tab === 'matrix' && (
        <div className="space-y-3">
          {menuItems.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm">
              <Grid3X3 size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No menu items to display</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Add menu items first in the Menu Items tab</p>
            </div>
          ) : (
            <div className="card rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: 'var(--navy)' }}>
                      <th className="text-left px-3 py-2 sticky left-0 z-10 font-semibold"
                        style={{ background: 'var(--navy)', color: 'var(--btn-primary-text)', minWidth: 140 }}>
                        Menu Item
                      </th>
                      {ALLERGENS.map(a => (
                        <th key={a} className="px-1.5 py-2 text-center font-semibold" style={{ color: 'var(--btn-primary-text)', writingMode: 'vertical-rl', minWidth: 32 }}>
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(categories.length > 0 ? categories : ['']).map(cat => {
                      const items = cat ? menuItems.filter(m => m.category === cat) : menuItems.filter(m => !m.category);
                      if (items.length === 0) return null;
                      return [
                        cat && (
                          <tr key={`cat-${cat}`}>
                            <td colSpan={ALLERGENS.length + 1} className="px-3 py-2 text-xs font-bold uppercase tracking-wider"
                              style={{ background: 'var(--bg-alt)', color: 'var(--navy)' }}>
                              {cat}
                            </td>
                          </tr>
                        ),
                        ...items.map((item, idx) => (
                          <tr key={item.id} style={{ background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-alt)' }}>
                            <td className="px-3 py-2 font-medium sticky left-0 z-10 truncate"
                              style={{ color: 'var(--text)', background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-alt)', maxWidth: 180 }}>
                              {item.name}
                            </td>
                            {ALLERGENS.map(a => (
                              <td key={a} className="text-center px-1.5 py-2">
                                {item.allergens.includes(a) && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold" style={{ background: '#dc2626' }}>
                                    ✓
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        )),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ OUTSOURCED PRODUCTS TAB ═══════════════════ */}
      {tab === 'outsourced' && (
        <div className="space-y-3">
          {outsourced.length > 0 && (
            <button type="button" onClick={exportOutsourcedPDF}
              className="btn-outline min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 w-full justify-center">
              <FileDown size={16} /> Export PDF
            </button>
          )}

          {outsourced.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm">
              <Package size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No outsourced products yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Tap + to add your first outsourced product</p>
            </div>
          ) : (
            outsourced.map(p => {
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className="card rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: p.specSheetAvailable ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)' }}>
                          {p.specSheetAvailable
                            ? <Check size={16} className="text-green-500" />
                            : <AlertTriangle size={16} className="text-amber-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {p.supplier || 'No supplier'} · Updated {p.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {p.ingredients && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Ingredients</p>
                          <p className="text-xs" style={{ color: 'var(--text)' }}>{p.ingredients}</p>
                        </div>
                      )}

                      {p.allergens.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Contains</p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.allergens.map(a => <AllergenBadge key={a} name={a} />)}
                          </div>
                        </div>
                      )}

                      {p.mayContain.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>May Contain</p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.mayContain.map(a => <AllergenBadge key={a} name={a} variant="may-contain" />)}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-semibold">Spec Sheet:</span>
                        <span className={p.specSheetAvailable ? 'text-green-600 font-medium' : 'text-amber-500 font-medium'}>
                          {p.specSheetAvailable ? 'Available' : 'Not available'}
                        </span>
                      </div>

                      {p.notes && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="font-medium">Notes:</span> {p.notes}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => openEditProduct(p)}
                          className="flex-1 min-h-[44px] px-4 rounded-xl btn-outline flex items-center justify-center gap-2 text-sm font-medium">
                          <Pencil size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => deleteProduct(p.id)}
                          className="min-h-[44px] px-4 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-medium">
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

      {/* ── FAB (hidden on matrix tab) ── */}
      {tab !== 'matrix' && (
        <button type="button" onClick={handleFab} className="fab" aria-label="Add new">
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* ═══════════════════ MENU ITEM SHEET ═══════════════════ */}
      {showSheet && tab === 'menu' && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} aria-hidden />
          <div className="sheet p-6">
            <div className="sheet-handle" />
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            <div className="space-y-3">
              <InputField label="Item Name *" value={menuForm.name}
                onChange={v => setMenuForm({ ...menuForm, name: v })} placeholder="e.g. Eggs Benedict" />
              <InputField label="Category" value={menuForm.category}
                onChange={v => setMenuForm({ ...menuForm, category: v })} placeholder="e.g. Breakfast, Mains, Desserts" />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Allergens</label>
                <div className="grid grid-cols-2 gap-1">
                  {ALLERGENS.map(a => (
                    <CheckItem key={a} label={a} checked={menuForm.allergens.includes(a)}
                      onChange={() => setMenuForm({ ...menuForm, allergens: toggleAllergen(menuForm.allergens, a) })} />
                  ))}
                </div>
              </div>

              <AreaField label="Notes" value={menuForm.notes}
                onChange={v => setMenuForm({ ...menuForm, notes: v })} placeholder="Any special preparation notes..." />
            </div>

            <div className="flex gap-2 justify-end mt-6">
              {editingMenuItem && (
                <button type="button" onClick={() => { deleteMenuItem(editingMenuItem.id); setShowSheet(false); }}
                  className="min-h-[44px] px-4 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium">
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button type="button" onClick={() => setShowSheet(false)} className="btn-outline min-h-[44px] px-4 rounded-xl text-sm">Cancel</button>
              <button type="button" onClick={saveMenuItem} className="btn-primary min-h-[44px] px-4 rounded-xl text-sm">
                {editingMenuItem ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ OUTSOURCED PRODUCT SHEET ═══════════════════ */}
      {showSheet && tab === 'outsourced' && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} aria-hidden />
          <div className="sheet p-6">
            <div className="sheet-handle" />
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              {editingProduct ? 'Edit Outsourced Product' : 'Add Outsourced Product'}
            </h3>
            <div className="space-y-3">
              <InputField label="Product Name *" value={productForm.name}
                onChange={v => setProductForm({ ...productForm, name: v })} placeholder="e.g. Sourdough Bread" />
              <InputField label="Supplier" value={productForm.supplier}
                onChange={v => setProductForm({ ...productForm, supplier: v })} placeholder="e.g. Local Bakery Ltd" />
              <AreaField label="Ingredients" value={productForm.ingredients}
                onChange={v => setProductForm({ ...productForm, ingredients: v })} placeholder="Full ingredients list from label..." />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Contains (Allergens)</label>
                <div className="grid grid-cols-2 gap-1">
                  {ALLERGENS.map(a => (
                    <CheckItem key={a} label={a} checked={productForm.allergens.includes(a)}
                      onChange={() => setProductForm({ ...productForm, allergens: toggleAllergen(productForm.allergens, a) })} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>May Contain (Traces)</label>
                <div className="grid grid-cols-2 gap-1">
                  {ALLERGENS.map(a => (
                    <CheckItem key={a} label={a} checked={productForm.mayContain.includes(a)}
                      onChange={() => setProductForm({ ...productForm, mayContain: toggleAllergen(productForm.mayContain, a) })} />
                  ))}
                </div>
              </div>

              <CheckItem label="Spec sheet available" checked={productForm.specSheetAvailable}
                onChange={v => setProductForm({ ...productForm, specSheetAvailable: v })} />

              <AreaField label="Notes" value={productForm.notes}
                onChange={v => setProductForm({ ...productForm, notes: v })} placeholder="Any additional notes..." />
            </div>

            <div className="flex gap-2 justify-end mt-6">
              {editingProduct && (
                <button type="button" onClick={() => { deleteProduct(editingProduct.id); setShowSheet(false); }}
                  className="min-h-[44px] px-4 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium">
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button type="button" onClick={() => setShowSheet(false)} className="btn-outline min-h-[44px] px-4 rounded-xl text-sm">Cancel</button>
              <button type="button" onClick={saveProduct} className="btn-primary min-h-[44px] px-4 rounded-xl text-sm">
                {editingProduct ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
