import { useState, useEffect, useRef } from 'react';
import { load, save } from '../lib/storage';
import {
  Thermometer, Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Camera, Download, Info, X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface CalibrationRecord {
  id: string;
  date: string;
  thermometerId: string;
  icePointReading: string;
  boilingPointReading: string;
  isAccurate: boolean;
  actionTaken: string;
  recorder: string;
  photoDataUrl: string;
}

const STORAGE_KEY = 'cafe-calibrations';

function InputField({ label, value, onChange, type = 'text', placeholder = '', inputMode, hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'decimal'; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        inputMode={inputMode} className="glass-input w-full min-h-[44px] px-4 rounded-xl" style={{ color: 'var(--text)' }} />
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{hint}</p>}
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

function isWithinTolerance(reading: string, expected: number): boolean | null {
  const val = parseFloat(reading);
  if (isNaN(val)) return null;
  return Math.abs(val - expected) <= 1;
}

function AccuracyIndicator({ reading, expected }: { reading: string; expected: number }) {
  const result = isWithinTolerance(reading, expected);
  if (result === null) return null;
  return result
    ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
    : <AlertTriangle size={16} className="text-red-500 shrink-0" />;
}

export default function Calibration({ recorder }: { recorder: string }) {
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [showProcedure, setShowProcedure] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    date: '', thermometerId: '', icePointReading: '', boilingPointReading: '',
    actionTaken: '', recorder: '', photoDataUrl: '',
  });

  useEffect(() => {
    setRecords(load<CalibrationRecord[]>(STORAGE_KEY, []));
  }, []);

  const persist = (updated: CalibrationRecord[]) => { setRecords(updated); save(STORAGE_KEY, updated); };

  const iceOk = isWithinTolerance(form.icePointReading, 0);
  const boilOk = isWithinTolerance(form.boilingPointReading, 100);
  const bothAccurate = iceOk === true && boilOk === true;
  const formInaccurate = (iceOk === false || boilOk === false);

  const openAddSheet = () => {
    setForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      thermometerId: '',
      icePointReading: '',
      boilingPointReading: '',
      actionTaken: '',
      recorder,
      photoDataUrl: '',
    });
    setShowSheet(true);
  };

  const saveRecord = () => {
    if (!form.thermometerId.trim() || !form.icePointReading.trim() || !form.boilingPointReading.trim()) return;
    const entry: CalibrationRecord = {
      id: crypto.randomUUID(),
      ...form,
      isAccurate: bothAccurate,
    };
    persist([entry, ...records]);
    setShowSheet(false);
  };

  const deleteRecord = (id: string) => {
    persist(records.filter(r => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, photoDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const accurateCount = records.filter(r => r.isAccurate).length;
  const accuracyRate = records.length > 0 ? Math.round((accurateCount / records.length) * 100) : 0;
  const lastDate = records.length > 0 ? records[0].date : null;

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Thermometer Calibration Records', 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Thermometer ID', 'Ice Point (°C)', 'Boiling Point (°C)', 'Accurate', 'Action Taken', 'Recorder']],
      body: records.map(r => [
        r.date,
        r.thermometerId,
        r.icePointReading,
        r.boilingPointReading,
        r.isAccurate ? 'Yes' : 'No',
        r.actionTaken || '—',
        r.recorder,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`calibration-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const procedureSteps = [
    { title: 'Ice Point Check', desc: 'Fill a container with crushed ice and top up with cold water. Submerge the probe — the thermometer should read 0°C (±1°C).' },
    { title: 'Boiling Point Check', desc: 'Place the probe in boiling water — the thermometer should read 100°C (±1°C).' },
    { title: 'If Not Accurate', desc: 'Adjust the thermometer according to manufacturer instructions, or replace with a calibrated unit.' },
  ];

  return (
    <div className="space-y-4 content-area px-4 p-4 pb-24 min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      {/* Header */}
      <div className="section-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5" style={{ color: 'var(--navy)' }} />
          Calibration Records
        </div>
        {records.length > 0 && (
          <button type="button" onClick={exportPDF}
            className="btn-outline min-h-[44px] px-3 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0">
            <Download size={14} /> Export PDF
          </button>
        )}
      </div>

      {/* Collapsible procedure card */}
      <div className="card rounded-2xl overflow-hidden shadow-sm">
        <button type="button" onClick={() => setShowProcedure(!showProcedure)}
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Info size={16} className="text-amber-500" />
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Calibration Procedure</span>
          </div>
          {showProcedure
            ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} />
            : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
        </button>
        {showProcedure && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
            {procedureSteps.map((step, i) => (
              <div key={i} className="flex gap-3 pt-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'var(--navy)', color: 'var(--btn-primary-text)' }}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card rounded-2xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{records.length}</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Records</p>
          </div>
          <div className="card rounded-2xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: accuracyRate >= 80 ? '#22c55e' : '#ef4444' }}>{accuracyRate}%</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Accuracy Rate</p>
          </div>
          <div className="card rounded-2xl p-3 text-center shadow-sm">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--navy)' }}>{lastDate || '—'}</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Last Calibration</p>
          </div>
        </div>
      )}

      {/* Records list */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="card rounded-2xl p-8 text-center shadow-sm">
            <Thermometer size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-faint)' }} />
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No calibration records yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Tap + to record a thermometer calibration</p>
          </div>
        ) : (
          records.map(r => {
            const isExpanded = expandedId === r.id;
            const iceAccurate = isWithinTolerance(r.icePointReading, 0);
            const boilAccurate = isWithinTolerance(r.boilingPointReading, 100);
            return (
              <div key={r.id} className="card rounded-2xl overflow-hidden shadow-sm">
                <button type="button" onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: r.isAccurate ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)' }}>
                        {r.isAccurate
                          ? <CheckCircle2 size={16} className="text-green-500" />
                          : <AlertTriangle size={16} className="text-red-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.thermometerId}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            r.isAccurate ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                          }`}>
                            {r.isAccurate ? 'ACCURATE' : 'INACCURATE'}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.date}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: iceAccurate ? '#22c55e' : '#ef4444' }}>{r.icePointReading}°</span>
                      <span>/</span>
                      <span style={{ color: boilAccurate ? '#22c55e' : '#ef4444' }}>{r.boilingPointReading}°</span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-faint)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-faint)' }} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>Ice Point</span>
                          {iceAccurate
                            ? <CheckCircle2 size={14} className="text-green-500" />
                            : <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                        <p className="text-lg font-bold" style={{ color: iceAccurate ? '#22c55e' : '#ef4444' }}>
                          {r.icePointReading}°C
                        </p>
                        <p style={{ color: 'var(--text-faint)' }}>Expected: 0°C ±1°C</p>
                      </div>
                      <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>Boiling Point</span>
                          {boilAccurate
                            ? <CheckCircle2 size={14} className="text-green-500" />
                            : <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                        <p className="text-lg font-bold" style={{ color: boilAccurate ? '#22c55e' : '#ef4444' }}>
                          {r.boilingPointReading}°C
                        </p>
                        <p style={{ color: 'var(--text-faint)' }}>Expected: 100°C ±1°C</p>
                      </div>
                    </div>

                    {r.actionTaken && (
                      <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                        <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Action Taken</p>
                        <p style={{ color: 'var(--text-muted)' }}>{r.actionTaken}</p>
                      </div>
                    )}

                    {r.photoDataUrl && (
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <img src={r.photoDataUrl} alt="Calibration photo" className="w-full max-h-48 object-cover" />
                      </div>
                    )}

                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Recorded by: {r.recorder}</p>

                    <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <button type="button" onClick={() => deleteRecord(r.id)}
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

      {/* FAB */}
      <button type="button" onClick={openAddSheet} className="fab" aria-label="Add calibration record">
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom sheet */}
      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} aria-hidden />
          <div className="sheet p-6">
            <div className="sheet-handle" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Record Calibration</h3>

              <InputField label="Date" value={form.date} type="date"
                onChange={v => setForm({ ...form, date: v })} />

              <InputField label="Thermometer ID *" value={form.thermometerId}
                onChange={v => setForm({ ...form, thermometerId: v })}
                placeholder="e.g. TH-001" />

              {/* Ice point with live accuracy */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Ice Point Reading (°C) *
                </label>
                <div className="relative">
                  <input type="number" value={form.icePointReading}
                    onChange={e => setForm({ ...form, icePointReading: e.target.value })}
                    placeholder="0" inputMode="decimal"
                    className="glass-input w-full min-h-[44px] px-4 pr-10 rounded-xl"
                    style={{ color: 'var(--text)' }} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AccuracyIndicator reading={form.icePointReading} expected={0} />
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Expected: 0°C (±1°C acceptable)</p>
              </div>

              {/* Boiling point with live accuracy */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Boiling Point Reading (°C) *
                </label>
                <div className="relative">
                  <input type="number" value={form.boilingPointReading}
                    onChange={e => setForm({ ...form, boilingPointReading: e.target.value })}
                    placeholder="100" inputMode="decimal"
                    className="glass-input w-full min-h-[44px] px-4 pr-10 rounded-xl"
                    style={{ color: 'var(--text)' }} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AccuracyIndicator reading={form.boilingPointReading} expected={100} />
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Expected: 100°C (±1°C acceptable)</p>
              </div>

              {/* Auto-calculated accuracy banner */}
              {(iceOk !== null || boilOk !== null) && (
                <div className={`rounded-xl p-3 flex items-center gap-2 text-sm font-medium ${
                  bothAccurate ? 'bg-green-50 text-green-700' : formInaccurate ? 'bg-red-50 text-red-700' : ''
                }`}>
                  {bothAccurate
                    ? <><CheckCircle2 size={16} /> Thermometer is within tolerance</>
                    : formInaccurate
                      ? <><AlertTriangle size={16} /> Thermometer is outside tolerance</>
                      : null}
                </div>
              )}

              {/* Action taken — shown when inaccurate */}
              {formInaccurate && (
                <AreaField label="Action Taken *" value={form.actionTaken}
                  onChange={v => setForm({ ...form, actionTaken: v })}
                  placeholder="e.g. Adjusted thermometer / Replaced with TH-002" />
              )}

              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Photo Evidence</label>
                <input ref={photoRef} type="file" accept="image/*" capture="environment"
                  onChange={handlePhoto} className="hidden" aria-label="Upload calibration photo" />
                {form.photoDataUrl ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <img src={form.photoDataUrl} alt="Calibration preview" className="w-full max-h-40 object-cover" />
                    <button type="button" aria-label="Remove photo"
                      onClick={() => setForm({ ...form, photoDataUrl: '' })}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => photoRef.current?.click()}
                    className="btn-outline w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-sm">
                    <Camera size={16} /> Take / Upload Photo
                  </button>
                )}
              </div>

              <InputField label="Recorder" value={form.recorder}
                onChange={v => setForm({ ...form, recorder: v })}
                placeholder="Who performed this calibration?" />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSheet(false)}
                  className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">Cancel</button>
                <button type="button" onClick={saveRecord}
                  disabled={!form.thermometerId.trim() || !form.icePointReading.trim() || !form.boilingPointReading.trim()}
                  className="btn-primary flex-1 py-3 min-h-[44px] rounded-xl text-sm disabled:opacity-40">
                  Save Record
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
