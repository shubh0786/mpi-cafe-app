import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface Incident {
  id: string;
  date: string;
  whatWentWrong: string;
  fixAction: string;
  preventionAction: string;
  foodSafety: string;
  recordedBy: string;
}

const STORAGE_KEY = 'cafe-incidents';

export default function Incidents({ recorder }: { recorder: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(recorder));

  useEffect(() => {
    setIncidents(load<Incident[]>(STORAGE_KEY, []));
  }, []);

  function emptyForm(rec: string) {
    return {
      date: format(new Date(), 'yyyy-MM-dd'),
      whatWentWrong: '',
      fixAction: '',
      preventionAction: '',
      foodSafety: '',
      recordedBy: rec,
    };
  }

  const openSheet = () => {
    setForm(emptyForm(recorder));
    setShowSheet(true);
  };

  const addIncident = () => {
    if (!form.whatWentWrong.trim()) return;
    const entry: Incident = { id: crypto.randomUUID(), ...form };
    const updated = [entry, ...incidents];
    setIncidents(updated);
    save(STORAGE_KEY, updated);
    setShowSheet(false);
  };

  const deleteIncident = (id: string) => {
    const updated = incidents.filter((i) => i.id !== id);
    setIncidents(updated);
    save(STORAGE_KEY, updated);
  };

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4 content-area px-4">
      {incidents.length === 0 && (
        <div className="card rounded-2xl p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No incidents recorded</p>
        </div>
      )}

      <div className="space-y-3">
        {incidents.map((inc) => {
          const isExpanded = expandedId === inc.id;
          return (
            <div key={inc.id} className="card rounded-2xl p-4">
              <div
                className="flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : inc.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{inc.date}</p>
                  {!isExpanded && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{inc.whatWentWrong}</p>
                  )}
                  {isExpanded && (
                    <p className="font-semibold mt-1" style={{ color: 'var(--text)' }}>Incident Details</p>
                  )}
                </div>
                <div className="shrink-0 w-11 h-11 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronUp size={20} style={{ color: 'var(--text-faint)' }} />
                  ) : (
                    <ChevronDown size={20} style={{ color: 'var(--text-faint)' }} />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>What went wrong</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inc.whatWentWrong}</p>
                  </div>
                  {inc.fixAction && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>What was done to fix it</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inc.fixAction}</p>
                    </div>
                  )}
                  {inc.preventionAction && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Prevention steps</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inc.preventionAction}</p>
                    </div>
                  )}
                  {inc.foodSafety && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>How food was kept safe</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inc.foodSafety}</p>
                    </div>
                  )}
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Recorded by {inc.recordedBy}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteIncident(inc.id); }}
                    className="w-full py-3 min-h-[44px] rounded-xl text-sm font-semibold text-red-500 bg-red-50 active:scale-[0.97] transition-all"
                  >
                    Delete Incident
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={openSheet} className="fab" aria-label="Add new incident">
        <Plus size={26} />
      </button>

      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Incident</h3>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  aria-label="Date"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <AreaField label="What Went Wrong" value={form.whatWentWrong} onChange={(v) => set('whatWentWrong', v)} />
              <AreaField label="What Was Done to Fix It" value={form.fixAction} onChange={(v) => set('fixAction', v)} />
              <AreaField label="Prevention Steps" value={form.preventionAction} onChange={(v) => set('preventionAction', v)} />
              <AreaField label="How Food Was Kept Safe" value={form.foodSafety} onChange={(v) => set('foodSafety', v)} />
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Recorded By</label>
                <input
                  type="text"
                  value={form.recordedBy}
                  onChange={(e) => set('recordedBy', e.target.value)}
                  aria-label="Recorded By"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSheet(false)} className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">
                  Cancel
                </button>
                <button onClick={addIncident} className="btn-primary flex-1 py-3 min-h-[44px] rounded-xl text-sm">
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AreaField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} aria-label={label} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-y" />
    </div>
  );
}
