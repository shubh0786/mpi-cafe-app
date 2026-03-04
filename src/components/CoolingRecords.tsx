import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';
import {
  Snowflake, CalendarDays, Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Timer, Info, Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface CoolingAttempt {
  date: string;
  startTemp: string;
  startTime: string;
  midTemp: string;
  midTime: string;
  endTemp: string;
  endTime: string;
  recorder: string;
  notes: string;
}

interface CoolingMethod {
  id: string;
  dishName: string;
  method: string;
  attempts: CoolingAttempt[];
  provenDate: string;
}

interface WeeklyCoolingCheck {
  id: string;
  dishId: string;
  date: string;
  startTemp: string;
  endTemp: string;
  duration: string;
  passed: boolean;
  recorder: string;
  notes: string;
}

type Tab = 'prove' | 'weekly';

const METHODS_KEY = 'cafe-cooling-methods';
const CHECKS_KEY = 'cafe-weekly-cooling-checks';

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

export default function CoolingRecords({ recorder }: { recorder: string }) {
  const [tab, setTab] = useState<Tab>('prove');
  const [methods, setMethods] = useState<CoolingMethod[]>([]);
  const [checks, setChecks] = useState<WeeklyCoolingCheck[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState<'addDish' | 'recordAttempt' | 'addCheck'>('addDish');
  const [targetDishId, setTargetDishId] = useState('');

  const [dishForm, setDishForm] = useState({ dishName: '', method: '' });
  const [attemptForm, setAttemptForm] = useState<CoolingAttempt>({
    date: '', startTemp: '', startTime: '', midTemp: '', midTime: '', endTemp: '', endTime: '', recorder: '', notes: '',
  });
  const [checkForm, setCheckForm] = useState({
    dishId: '', date: '', startTemp: '', endTemp: '', duration: '', passed: true, recorder: '', notes: '',
  });

  useEffect(() => {
    setMethods(load<CoolingMethod[]>(METHODS_KEY, []));
    setChecks(load<WeeklyCoolingCheck[]>(CHECKS_KEY, []));
  }, []);

  const persistMethods = (m: CoolingMethod[]) => { setMethods(m); save(METHODS_KEY, m); };
  const persistChecks = (c: WeeklyCoolingCheck[]) => { setChecks(c); save(CHECKS_KEY, c); };

  const provenMethods = methods.filter(m => m.attempts.length >= 3);

  const openAddDish = () => {
    setDishForm({ dishName: '', method: '' });
    setSheetMode('addDish');
    setShowSheet(true);
  };

  const openRecordAttempt = (dishId: string) => {
    setTargetDishId(dishId);
    setAttemptForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      startTemp: '', startTime: '', midTemp: '', midTime: '', endTemp: '', endTime: '',
      recorder, notes: '',
    });
    setSheetMode('recordAttempt');
    setShowSheet(true);
  };

  const openAddCheck = () => {
    setCheckForm({
      dishId: provenMethods[0]?.id || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTemp: '', endTemp: '', duration: '', passed: true, recorder, notes: '',
    });
    setSheetMode('addCheck');
    setShowSheet(true);
  };

  const addDish = () => {
    if (!dishForm.dishName.trim()) return;
    const entry: CoolingMethod = {
      id: crypto.randomUUID(), dishName: dishForm.dishName, method: dishForm.method, attempts: [], provenDate: '',
    };
    persistMethods([entry, ...methods]);
    setShowSheet(false);
  };

  const deleteDish = (id: string) => {
    persistMethods(methods.filter(m => m.id !== id));
    setExpandedId(null);
  };

  const saveAttempt = () => {
    if (!attemptForm.startTemp.trim() || !attemptForm.endTemp.trim()) return;
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
    if (!checkForm.dishId || !checkForm.startTemp.trim()) return;
    const entry: WeeklyCoolingCheck = { id: crypto.randomUUID(), ...checkForm };
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
    doc.text('Cooling Temperature Records', 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 24);

    doc.setFontSize(8);
    doc.text('TFCP Rules: 60\u00B0C \u2192 20\u00B0C within 2 hrs | 20\u00B0C \u2192 5\u00B0C within 4 hrs | Total max 6 hrs', 14, 30);

    if (methods.length > 0) {
      doc.setFontSize(12);
      doc.text('Proven Cooling Methods', 14, 40);
      autoTable(doc, {
        startY: 44,
        head: [['Dish', 'Method', 'Attempts', 'Status', 'Proven Date']],
        body: methods.map(m => [
          m.dishName,
          m.method || '—',
          `${m.attempts.length}/3`,
          m.attempts.length >= 3 ? 'PROVEN' : 'In Progress',
          m.provenDate || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42] },
      });
    }

    const tableEndY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 56;

    if (checks.length > 0) {
      doc.setFontSize(12);
      doc.text('Weekly Cooling Checks', 14, tableEndY + 12);
      autoTable(doc, {
        startY: tableEndY + 16,
        head: [['Dish', 'Date', 'Start \u00B0C', 'End \u00B0C', 'Duration', 'Result', 'Recorder', 'Notes']],
        body: checks.map(c => [
          getDishName(c.dishId),
          c.date,
          c.startTemp,
          c.endTemp,
          c.duration || '—',
          c.passed ? 'PASS' : 'FAIL',
          c.recorder,
          c.notes || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42] },
      });
    }

    doc.save(`cooling-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'prove', label: 'Prove Method', icon: <Snowflake size={16} /> },
    { key: 'weekly', label: 'Weekly Checks', icon: <CalendarDays size={16} /> },
  ];

  return (
    <div className="space-y-4 content-area px-4 p-4 pb-24 min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      <div className="section-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5" style={{ color: 'var(--navy)' }} />
          Cooling Records
        </div>
        {(methods.length > 0 || checks.length > 0) && (
          <button type="button" onClick={exportPDF}
            className="btn-outline min-h-[44px] px-3 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0">
            <Download size={14} /> Export PDF
          </button>
        )}
      </div>

      {/* TFCP Cooling Rules Info Card */}
      <div className="card rounded-2xl overflow-hidden shadow-sm">
        <button type="button" onClick={() => setRulesOpen(!rulesOpen)}
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)' }}>
              <Info size={16} style={{ color: 'var(--navy)' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>TFCP Cooling Rules</span>
          </div>
          {rulesOpen
            ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} />
            : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
        </button>
        {rulesOpen && (
          <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-start gap-2 pt-3">
              <Timer size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Stage 1:</strong> 60°C → 20°C within <strong style={{ color: 'var(--navy)' }}>2 hours</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Timer size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Stage 2:</strong> 20°C → 5°C within <strong style={{ color: 'var(--navy)' }}>4 hours</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Timer size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Total:</strong> Maximum <strong style={{ color: 'var(--navy)' }}>6 hours</strong> from start to finish
              </p>
            </div>
            <p className="text-xs pt-1" style={{ color: 'var(--text-faint)' }}>
              Prove your cooling method with 3 successful attempts, then perform weekly checks.
            </p>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="card rounded-2xl p-1.5 flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'shadow-md' : ''}`}
            style={tab === t.key ? { background: 'var(--navy)', color: 'var(--btn-primary-text)' } : { color: 'var(--text-muted)' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Prove Method tab */}
      {tab === 'prove' && (
        <div className="space-y-3">
          {methods.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm">
              <Snowflake size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No cooling methods added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Tap + to add a dish and prove your cooling method</p>
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
                          style={{ background: isProven ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.12)' }}>
                          {isProven
                            ? <CheckCircle2 size={16} className="text-green-500" />
                            : <Snowflake size={16} style={{ color: 'var(--navy)' }} />}
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
                            <div key={i} className="rounded-xl p-3 text-xs space-y-1.5"
                              style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                              <div className="flex justify-between">
                                <span className="font-semibold" style={{ color: 'var(--text)' }}>Attempt {i + 1}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{a.date}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2" style={{ color: 'var(--text-muted)' }}>
                                <div>
                                  <span className="block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Start</span>
                                  <strong style={{ color: 'var(--text)' }}>{a.startTemp}°C</strong>
                                  {a.startTime && <span className="ml-1">@ {a.startTime}</span>}
                                </div>
                                <div>
                                  <span className="block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Mid</span>
                                  <strong style={{ color: 'var(--text)' }}>{a.midTemp || '—'}°C</strong>
                                  {a.midTime && <span className="ml-1">@ {a.midTime}</span>}
                                </div>
                                <div>
                                  <span className="block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>End</span>
                                  <strong style={{ color: 'var(--text)' }}>{a.endTemp}°C</strong>
                                  {a.endTime && <span className="ml-1">@ {a.endTime}</span>}
                                </div>
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

      {/* Weekly Checks tab */}
      {tab === 'weekly' && (
        <div className="space-y-3">
          {checks.length === 0 ? (
            <div className="card rounded-2xl p-8 text-center shadow-sm">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No weekly checks recorded yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                {provenMethods.length === 0
                  ? 'Prove a cooling method first, then record weekly checks'
                  : 'Tap + to record a weekly cooling check'}
              </p>
            </div>
          ) : (
            checks.map(c => (
              <div key={c.id} className="card rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{getDishName(c.dishId)}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        c.passed ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {c.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {c.date} · <strong>{c.startTemp}°C → {c.endTemp}°C</strong>
                      {c.duration && <span> · {c.duration}</span>}
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

      {/* FAB */}
      <button type="button" onClick={tab === 'prove' ? openAddDish : openAddCheck}
        className="fab" aria-label={tab === 'prove' ? 'Add dish' : 'Add weekly check'}>
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Sheet */}
      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} aria-hidden />
          <div className="sheet p-6">
            <div className="sheet-handle" />

            {sheetMode === 'addDish' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Add Dish</h3>
                <InputField label="Dish Name *" value={dishForm.dishName}
                  onChange={v => setDishForm({ ...dishForm, dishName: v })} placeholder="e.g. Cooked Rice" />
                <AreaField label="Cooling Method" value={dishForm.method}
                  onChange={v => setDishForm({ ...dishForm, method: v })}
                  placeholder="Describe the cooling method (e.g. blast chill, ice bath)..." />
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

                <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
                    Start (should be ≥ 60°C)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Temperature (°C) *" value={attemptForm.startTemp}
                      onChange={v => setAttemptForm({ ...attemptForm, startTemp: v })}
                      type="number" placeholder="e.g. 63" inputMode="decimal" />
                    <InputField label="Time" value={attemptForm.startTime}
                      onChange={v => setAttemptForm({ ...attemptForm, startTime: v })}
                      type="time" />
                  </div>
                </div>

                <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
                    Mid-point (should be ≤ 20°C within 2 hrs)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Temperature (°C)" value={attemptForm.midTemp}
                      onChange={v => setAttemptForm({ ...attemptForm, midTemp: v })}
                      type="number" placeholder="e.g. 18" inputMode="decimal" />
                    <InputField label="Time" value={attemptForm.midTime}
                      onChange={v => setAttemptForm({ ...attemptForm, midTime: v })}
                      type="time" />
                  </div>
                </div>

                <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
                    End (should be ≤ 5°C within 4 hrs of mid)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Temperature (°C) *" value={attemptForm.endTemp}
                      onChange={v => setAttemptForm({ ...attemptForm, endTemp: v })}
                      type="number" placeholder="e.g. 4" inputMode="decimal" />
                    <InputField label="Time" value={attemptForm.endTime}
                      onChange={v => setAttemptForm({ ...attemptForm, endTime: v })}
                      type="time" />
                  </div>
                </div>

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
                    <p className="text-xs mt-1 text-amber-500">Prove a cooling method first (3 successful attempts)</p>
                  )}
                </div>
                <InputField label="Date" value={checkForm.date} type="date"
                  onChange={v => setCheckForm({ ...checkForm, date: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Start Temp (°C) *" value={checkForm.startTemp}
                    onChange={v => setCheckForm({ ...checkForm, startTemp: v })}
                    type="number" placeholder="e.g. 60" inputMode="decimal" />
                  <InputField label="End Temp (°C)" value={checkForm.endTemp}
                    onChange={v => setCheckForm({ ...checkForm, endTemp: v })}
                    type="number" placeholder="e.g. 4" inputMode="decimal" />
                </div>
                <InputField label="Duration" value={checkForm.duration}
                  onChange={v => setCheckForm({ ...checkForm, duration: v })}
                  placeholder="e.g. 5 hrs 30 min" />

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Result</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setCheckForm({ ...checkForm, passed: true })}
                      className={`flex-1 min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                        checkForm.passed ? 'shadow-md' : ''
                      }`}
                      style={checkForm.passed
                        ? { background: 'rgba(52,211,153,0.15)', color: '#059669', border: '2px solid #059669' }
                        : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      <CheckCircle2 size={16} /> Pass
                    </button>
                    <button type="button"
                      onClick={() => setCheckForm({ ...checkForm, passed: false })}
                      className={`flex-1 min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                        !checkForm.passed ? 'shadow-md' : ''
                      }`}
                      style={!checkForm.passed
                        ? { background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '2px solid #dc2626' }
                        : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      <XCircle size={16} /> Fail
                    </button>
                  </div>
                </div>

                <InputField label="Recorder" value={checkForm.recorder}
                  onChange={v => setCheckForm({ ...checkForm, recorder: v })}
                  placeholder="Who recorded this?" />
                <AreaField label="Notes" value={checkForm.notes}
                  onChange={v => setCheckForm({ ...checkForm, notes: v })}
                  placeholder="Any observations..." />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSheet(false)}
                    className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">Cancel</button>
                  <button type="button" onClick={addCheck} disabled={!checkForm.dishId || !checkForm.startTemp.trim()}
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
