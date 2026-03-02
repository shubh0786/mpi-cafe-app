import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface Complaint {
  id: string;
  customerName: string;
  contact: string;
  purchaseDate: string;
  affectedFood: string;
  complaint: string;
  actionTaken: string;
  prevention: string;
  recordedBy: string;
  createdAt: string;
}

const STORAGE_KEY = 'cafe-complaints';

export default function CustomerComplaints({ recorder }: { recorder: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(recorder));

  useEffect(() => {
    setComplaints(load<Complaint[]>(STORAGE_KEY, []));
  }, []);

  function emptyForm(rec: string) {
    return {
      customerName: '',
      contact: '',
      purchaseDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      affectedFood: '',
      complaint: '',
      actionTaken: '',
      prevention: '',
      recordedBy: rec,
    };
  }

  const openSheet = () => {
    setForm(emptyForm(recorder));
    setShowSheet(true);
  };

  const addComplaint = () => {
    if (!form.customerName.trim() || !form.complaint.trim()) return;
    const entry: Complaint = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...complaints];
    setComplaints(updated);
    save(STORAGE_KEY, updated);
    setShowSheet(false);
  };

  const deleteComplaint = (id: string) => {
    const updated = complaints.filter((c) => c.id !== id);
    setComplaints(updated);
    save(STORAGE_KEY, updated);
  };

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4 content-area">
      {complaints.length === 0 && (
        <div className="card rounded-2xl p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No complaints recorded</p>
        </div>
      )}

      <div className="space-y-3">
        {complaints.map((c) => {
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} className="card rounded-2xl p-4">
              <div
                className="flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{c.customerName}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{c.purchaseDate}</p>
                  {!isExpanded && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{c.complaint}</p>
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
                  {c.contact && <DetailRow label="Contact" value={c.contact} />}
                  {c.affectedFood && <DetailRow label="Affected Food" value={c.affectedFood} />}
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Complaint</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.complaint}</p>
                  </div>
                  {c.actionTaken && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Action Taken</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.actionTaken}</p>
                    </div>
                  )}
                  {c.prevention && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Prevention</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.prevention}</p>
                    </div>
                  )}
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Recorded by {c.recordedBy}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteComplaint(c.id); }}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-red-500 bg-red-50 active:scale-[0.97] transition-all"
                  >
                    Delete Complaint
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={openSheet} className="fab" aria-label="Add new complaint">
        <Plus size={26} />
      </button>

      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Complaint</h3>
              <InputField label="Customer Name" value={form.customerName} onChange={(v) => set('customerName', v)} />
              <InputField label="Contact Details" value={form.contact} onChange={(v) => set('contact', v)} />
              <InputField label="Date/Time of Purchase" value={form.purchaseDate} onChange={(v) => set('purchaseDate', v)} type="datetime-local" />
              <InputField label="Affected Food (batch/lot)" value={form.affectedFood} onChange={(v) => set('affectedFood', v)} />
              <AreaField label="Complaint Description" value={form.complaint} onChange={(v) => set('complaint', v)} />
              <AreaField label="Action Taken Immediately" value={form.actionTaken} onChange={(v) => set('actionTaken', v)} />
              <AreaField label="Steps to Prevent Recurrence" value={form.prevention} onChange={(v) => set('prevention', v)} />
              <InputField label="Recorded By" value={form.recordedBy} onChange={(v) => set('recordedBy', v)} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSheet(false)} className="btn-outline flex-1 py-3 rounded-xl text-sm">
                  Cancel
                </button>
                <button onClick={addComplaint} className="btn-primary flex-1 py-3 rounded-xl text-sm">
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

function InputField({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="glass-input w-full px-4 py-3 rounded-xl text-sm" />
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}
