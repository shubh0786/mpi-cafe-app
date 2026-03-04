import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';
import { Flame, CalendarDays, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Clock, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface CookingAttempt {
  date: string;
  finalTemp: string;
  timeMinutes: string;
  recorder: string;
  notes: string;
}

interface CookingMethod {
  id: string;
  dishName: string;
  method: string;
  attempts: CookingAttempt[];
  provenDate: string;
}

interface WeeklyCookingCheck {
  id: string;
  dishId: string;
  date: string;
  temperature: string;
  recorder: string;
  notes: string;
}

type Tab = 'prove' | 'weekly';

const METHODS_KEY = 'cafe-cooking-methods';
const CHECKS_KEY = 'cafe-weekly-cooking-checks';

function InputField({ label, value, onChange, type = 'text', placeholder = '', inputMode }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        inputMode={inputMode} className="glass-input w-full min-h-[44px] px-4 rounded-xl" style={{ color: 'var(--text)' }} />
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

function ProgressDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-3 h-3 rounded-full transition-all"
          style={{ background: i < count ? 'var(--navy)' : 'var(--border)' }} />
      ))}
      <span className="text-xs font-semibold ml-1" style={{ color: count >= 3 ? 'var(--navy)' : 'var(--text-muted)' }}>
        {count}/3
      </span>
    </div>
  );
}

export default function CookingValidation({ recorder }: { recorder: string }) {
  const [tab, setTab] = useState<Tab>('prove');
  const [methods, setMethods] = useState<CookingMethod[]>([]);
  const [checks, setChecks] = useState<WeeklyCookingCheck[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState<'addDish' | 'recordAttempt' | 'addCheck'>('addDish');
  const [targetDishId, setTargetDishId] = useState('');

  const [dishForm, setDishForm] = useState({ dishName: '', method: '' });
  const [attemptForm, setAttemptForm] = useState({ date: '', finalTemp: '', timeMinutes: '', recorder: '', notes: '' });
  const [checkForm, setCheckForm] = useState({ dishId: '', date: '', temperature: '', recorder: '', notes: '' });

  useEffect(() => {
    setMethods(load<CookingMethod[]>(METHODS_KEY, []));
    setChecks(load<WeeklyCookingCheck[]>(CHECKS_KEY, []));
  }, []);

  const persistMethods = (m: CookingMethod[]) => { setMethods(m); save(METHODS_KEY, m); };
  const persistChecks = (c: WeeklyCookingCheck[]) => { setChecks(c); save(CHECKS_KEY, c); };

  const provenMethods = methods.filter(m => m.attempts.length >= 3);

  const openAddDish = () => {
    setDishForm({ dishName: '', method: '' });
    setSheetMode('addDish');
    setShowSheet(true);
  };

  const openRecordAttempt = (dishId: string) => {
    setTargetDishId(dishId);
    setAttemptForm({ date: format(new Date(), 'yyyy-MM-dd'), finalTemp: '', timeMinutes: '', recorder, notes: '' });
    setSheetMode('recordAttempt');
    setShowSheet(true);
  };

  const openAddCheck = () => {
    setCheckForm({ dishId: provenMethods[0]?.id || '', date: format(new Date(), 'yyyy-MM-dd'), temperature: '', recorder, notes: '' });
    setSheetMode('addCheck');
    setShowSheet(true);
  };

  const addDish = () => {
    if (!dishForm.dishName.trim()) return;
    const entry: CookingMethod = { id: crypto.randomUUID(), dishName: dishForm.dishName, method: dishForm.method, attempts: [], provenDate: '' };
    persistMethods([entry, ...methods]);
    setShowSheet(false);
  };

  const deleteDish = (id: string) => {
    persistMethods(methods.filter(m => m.id !== id));
    setExpandedId(null);
  };

  const saveAttempt = () => {
    if (!attemptForm.finalTemp.trim()) return;
    const updated = methods.map(m => {
      if (m.id !== targetDishId) return m;
      const newAttempts = [...m.attempts, { ...attemptForm }];
      const provenDate = newAttempts.length >= 3 && !m.provenDate ? format(new Date(), 'yyyy-MM-dd') : m.provenDate;
      return { ...m, attempts: newAttempts, provenDate };
    });
    persistMethods(updated);
    setShowSheet(false);
  };

  const addCheck = () => {
    if (!checkForm.dishId || !checkForm.temperature.trim()) return;
    const entry: WeeklyCookingCheck = { id: crypto.randomUUID(), ...checkForm };
    persistChecks([entry, ...checks]);
    setShowSheet(false);
  };

  const deleteCheck = (id: string) => {
    persistChecks(checks.filter(c => c.id !== id));
  };

  const getDishName = (id: string) => methods.find(m => m.id === id)?.dishName || 'Unknown';

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Cooking Process Validation', 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 24);

    if (methods.length > 0) {
      doc.setFontSize(12);
      doc.text('Proven Methods', 14, 34);
      autoTable(doc, {
        startY: 38,
        head: [['Dish', 'Method', 'Attempts', 'Status', 'Proven Date']],
        body: methods.map(m => [
          m.dishName,
          m.method,
          `${m.attempts.length}/3`,
          m.attempts.length >= 3 ? 'PROVEN' : 'In Progress',
          m.provenDate || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42] },
      });
    }

    const tableEndY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 50;

    if (checks.length > 0) {
      doc.setFontSize(12);
      doc.text('Weekly Cooking Checks', 14, tableEndY + 12);
      autoTable(doc, {
        startY: tableEndY + 16,
        head: [['Dish', 'Date', 'Temperature (°C)', 'Recorder', 'Notes']],
        body: checks.map(c => [
          getDishName(c.dishId),
          c.date,
          c.temperature,
          c.recorder,
          c.notes || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42] },
      });
    }

    doc.save(`cooking-validation-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'prove', label: 'Prove Method', icon: <Flame size={16} /> },
    { key: 'weekly', label: 'Weekly Checks', icon: <CalendarDays size={16} /> },
  ];

  return (
    <div className="space-y-4 content-area px-4 p-4 pb-24 min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      <div className="section-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5" style={{ color: 'var(--navy)' }} />
          Cooking Validation
        </div>
        {(methods.length > 0 || checks.length > 0) && (
          <button type="button" onClick={exportPDF}
            className="btn-outline min-h-[44px] px-3 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0">
            <FileText size={14} /> Export PDF
          </button>
        )}
      </div>

      <div className="card rounded-2xl p-1.5 flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'shadow-md' : ''}`}
            style={tab === t.key ? { background: 'var(--navy)', color: 'var(--btn-primary-text)' } : { color: 'var(--text-muted)' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'prove' && (
        <div className="space-y-3">
          {methods.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm">
              <Flame size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No cooking methods added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Tap + to add a dish and prove your cooking method</p>
            </div>
          ) : (
            methods.map(m => {
              const isExpanded = expandedId === m.id;
              const isProven = m.attempts.length >= 3;
              return (
                <div key={m.id} className="card rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: isProven ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)' }}>
                          {isProven
                            ? <CheckCircle2 size={16} className="text-green-500" />
                            : <Clock size={16} className="text-amber-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{m.dishName}</p>
                            {isProven && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-green-600 bg-green-50 shrink-0">
                                PROVEN
                              </span>
                            )}
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.method || 'No method description'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ProgressDots count={Math.min(m.attempts.length, 3)} />
                      {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {m.method && (
                        <p className="text-xs pt-3" style={{ color: 'var(--text-muted)' }}>
                          <span className="font-semibold">Method:</span> {m.method}
                        </p>
                      )}

                      {m.attempts.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
                            Attempt History
                          </p>
                          {m.attempts.map((a, i) => (
                            <div key={i} className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                              <div className="flex justify-between">
                                <span className="font-semibold" style={{ color: 'var(--text)' }}>Attempt {i + 1}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{a.date}</span>
                              </div>
                              <div className="flex gap-4" style={{ color: 'var(--text-muted)' }}>
                                <span>Temp: <strong style={{ color: 'var(--text)' }}>{a.finalTemp}°C</strong></span>
                                <span>Time: <strong style={{ color: 'var(--text)' }}>{a.timeMinutes} min</strong></span>
                              </div>
                              <div style={{ color: 'var(--text-muted)' }}>Recorder: {a.recorder}</div>
                              {a.notes && <div style={{ color: 'var(--text-faint)' }}>{a.notes}</div>}
                            </div>
                          ))}
                        </div>
                      )}

                      {m.provenDate && (
                        <p className="text-xs" style={{ color: 'var(--navy)' }}>
                          Proven on: <strong>{m.provenDate}</strong>
                        </p>
                      )}

                      <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        {!isProven && (
                          <button type="button" onClick={() => openRecordAttempt(m.id)}
                            className="flex-1 min-h-[44px] px-4 rounded-xl btn-primary flex items-center justify-center gap-2 text-sm font-medium">
                            <Plus size={14} /> Record Attempt
                          </button>
                        )}
                        <button type="button" onClick={() => deleteDish(m.id)}
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

      {tab === 'weekly' && (
        <div className="space-y-3">
          {checks.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No weekly checks recorded yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                {provenMethods.length === 0
                  ? 'Prove a cooking method first, then record weekly checks'
                  : 'Tap + to record a weekly cooking check'}
              </p>
            </div>
          ) : (
            checks.map(c => (
              <div key={c.id} className="card rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{getDishName(c.dishId)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {c.date} · <strong>{c.temperature}°C</strong>
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Recorded by: {c.recorder}</p>
                    {c.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{c.notes}</p>}
                  </div>
                  <button type="button" onClick={() => deleteCheck(c.id)} aria-label="Delete check"
                    className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 active:scale-95 transition-all shrink-0">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <button type="button" onClick={tab === 'prove' ? openAddDish : openAddCheck}
        className="fab" aria-label={tab === 'prove' ? 'Add dish' : 'Add weekly check'}>
        <Plus className="w-7 h-7" />
      </button>

      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} aria-hidden />
          <div className="sheet p-6">
            <div className="sheet-handle" />

            {sheetMode === 'addDish' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Add Dish</h3>
                <InputField label="Dish Name *" value={dishForm.dishName}
                  onChange={v => setDishForm({ ...dishForm, dishName: v })} placeholder="e.g. Chicken Supreme" />
                <AreaField label="Cooking Method" value={dishForm.method}
                  onChange={v => setDishForm({ ...dishForm, method: v })}
                  placeholder="Describe the cooking method..." />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSheet(false)}
                    className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">Cancel</button>
                  <button type="button" onClick={addDish}
                    className="btn-primary flex-1 py-3 min-h-[44px] rounded-xl text-sm">Add Dish</button>
                </div>
              </div>
            )}

            {sheetMode === 'recordAttempt' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Record Attempt — {methods.find(m => m.id === targetDishId)?.dishName}
                </h3>
                <InputField label="Date" value={attemptForm.date} type="date"
                  onChange={v => setAttemptForm({ ...attemptForm, date: v })} />
                <InputField label="Final Temperature (°C) *" value={attemptForm.finalTemp}
                  onChange={v => setAttemptForm({ ...attemptForm, finalTemp: v })}
                  type="number" placeholder="e.g. 75" inputMode="decimal" />
                <InputField label="Cooking Time (minutes)" value={attemptForm.timeMinutes}
                  onChange={v => setAttemptForm({ ...attemptForm, timeMinutes: v })}
                  type="number" placeholder="e.g. 45" inputMode="numeric" />
                <InputField label="Recorder" value={attemptForm.recorder}
                  onChange={v => setAttemptForm({ ...attemptForm, recorder: v })}
                  placeholder="Who recorded this?" />
                <AreaField label="Notes" value={attemptForm.notes}
                  onChange={v => setAttemptForm({ ...attemptForm, notes: v })}
                  placeholder="Any observations..." />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSheet(false)}
                    className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">Cancel</button>
                  <button type="button" onClick={saveAttempt}
                    className="btn-primary flex-1 py-3 min-h-[44px] rounded-xl text-sm">Save Attempt</button>
                </div>
              </div>
            )}

            {sheetMode === 'addCheck' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Add Weekly Check</h3>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Proven Dish *</label>
                  <select value={checkForm.dishId} onChange={e => setCheckForm({ ...checkForm, dishId: e.target.value })}
                    aria-label="Proven Dish" className="glass-input w-full min-h-[44px] px-4 rounded-xl" style={{ color: 'var(--text)' }}>
                    {provenMethods.length === 0 && <option value="">No proven dishes available</option>}
                    {provenMethods.map(m => <option key={m.id} value={m.id}>{m.dishName}</option>)}
                  </select>
                  {provenMethods.length === 0 && (
                    <p className="text-xs mt-1 text-amber-500">Prove a cooking method first (3 successful attempts)</p>
                  )}
                </div>
                <InputField label="Date" value={checkForm.date} type="date"
                  onChange={v => setCheckForm({ ...checkForm, date: v })} />
                <InputField label="Temperature (°C) *" value={checkForm.temperature}
                  onChange={v => setCheckForm({ ...checkForm, temperature: v })}
                  type="number" placeholder="e.g. 75" inputMode="decimal" />
                <InputField label="Recorder" value={checkForm.recorder}
                  onChange={v => setCheckForm({ ...checkForm, recorder: v })}
                  placeholder="Who recorded this?" />
                <AreaField label="Notes" value={checkForm.notes}
                  onChange={v => setCheckForm({ ...checkForm, notes: v })}
                  placeholder="Any observations..." />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSheet(false)}
                    className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">Cancel</button>
                  <button type="button" onClick={addCheck} disabled={!checkForm.dishId || !checkForm.temperature.trim()}
                    className="btn-primary flex-1 py-3 min-h-[44px] rounded-xl text-sm disabled:opacity-40">Save Check</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
