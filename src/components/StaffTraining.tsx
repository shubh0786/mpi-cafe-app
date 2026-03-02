import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';
import { Plus, Trash2, Users, BookOpen, Thermometer, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  startDate: string;
  email: string;
  phone: string;
}

interface TrainingRecord {
  id: string;
  staffId: string;
  staffName: string;
  topic: string;
  employeeSigned: string;
  supervisorSigned: string;
  date: string;
}

interface SicknessRecord {
  id: string;
  name: string;
  symptoms: string;
  date: string;
  actionTaken: string;
}

type Tab = 'staff' | 'training' | 'sickness';

const STAFF_KEY = 'cafe-staff-list';
const TRAINING_KEY = 'cafe-training-records';
const SICKNESS_KEY = 'cafe-sickness-log';

export default function StaffTraining({ recorder: _recorder }: { recorder: string }) {
  void _recorder;
  const [tab, setTab] = useState<Tab>('staff');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [training, setTraining] = useState<TrainingRecord[]>([]);
  const [sickness, setSickness] = useState<SicknessRecord[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [staffForm, setStaffForm] = useState({ name: '', position: '', startDate: format(new Date(), 'yyyy-MM-dd'), email: '', phone: '' });
  const [trainingForm, setTrainingForm] = useState({ staffId: '', topic: '', employeeSigned: '', supervisorSigned: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [sicknessForm, setSicknessForm] = useState({ name: '', symptoms: '', date: format(new Date(), 'yyyy-MM-dd'), actionTaken: '' });

  useEffect(() => {
    setStaff(load<StaffMember[]>(STAFF_KEY, []));
    setTraining(load<TrainingRecord[]>(TRAINING_KEY, []));
    setSickness(load<SicknessRecord[]>(SICKNESS_KEY, []));
  }, []);

  const openSheet = () => {
    if (tab === 'staff') setStaffForm({ name: '', position: '', startDate: format(new Date(), 'yyyy-MM-dd'), email: '', phone: '' });
    if (tab === 'training') setTrainingForm({ staffId: staff[0]?.id || '', topic: '', employeeSigned: '', supervisorSigned: '', date: format(new Date(), 'yyyy-MM-dd') });
    if (tab === 'sickness') setSicknessForm({ name: '', symptoms: '', date: format(new Date(), 'yyyy-MM-dd'), actionTaken: '' });
    setShowSheet(true);
  };

  const addStaff = () => {
    if (!staffForm.name.trim()) return;
    const entry: StaffMember = { id: crypto.randomUUID(), ...staffForm };
    const updated = [entry, ...staff];
    setStaff(updated);
    save(STAFF_KEY, updated);
    setShowSheet(false);
  };

  const deleteStaff = (id: string) => {
    const updated = staff.filter((s) => s.id !== id);
    setStaff(updated);
    save(STAFF_KEY, updated);
    setDetailId(null);
  };

  const addTraining = () => {
    if (!trainingForm.topic.trim()) return;
    const staffMember = staff.find((s) => s.id === trainingForm.staffId);
    const entry: TrainingRecord = {
      id: crypto.randomUUID(),
      ...trainingForm,
      staffName: staffMember?.name || '',
    };
    const updated = [entry, ...training];
    setTraining(updated);
    save(TRAINING_KEY, updated);
    setShowSheet(false);
  };

  const deleteTraining = (id: string) => {
    const updated = training.filter((t) => t.id !== id);
    setTraining(updated);
    save(TRAINING_KEY, updated);
  };

  const addSickness = () => {
    if (!sicknessForm.name.trim()) return;
    const entry: SicknessRecord = { id: crypto.randomUUID(), ...sicknessForm };
    const updated = [entry, ...sickness];
    setSickness(updated);
    save(SICKNESS_KEY, updated);
    setShowSheet(false);
  };

  const deleteSickness = (id: string) => {
    const updated = sickness.filter((s) => s.id !== id);
    setSickness(updated);
    save(SICKNESS_KEY, updated);
  };

  const handleSubmit = () => {
    if (tab === 'staff') addStaff();
    else if (tab === 'training') addTraining();
    else addSickness();
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'staff', label: 'Staff', icon: <Users size={16} /> },
    { key: 'training', label: 'Training', icon: <BookOpen size={16} /> },
    { key: 'sickness', label: 'Sickness', icon: <Thermometer size={16} /> },
  ];

  const selectedStaff = detailId ? staff.find((s) => s.id === detailId) : null;

  return (
    <div className="space-y-4 content-area px-4">
      <div className="card rounded-2xl p-1.5 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'shadow-md' : ''
            }`}
            style={tab === t.key ? { background: 'var(--navy)', color: 'var(--btn-primary-text)' } : { color: 'var(--text-muted)' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'staff' && (
        <div className="space-y-3">
          {staff.length === 0 && (
            <div className="card rounded-2xl p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No staff added yet</p>
            </div>
          )}
          {staff.map((s) => (
            <div
              key={s.id}
              onClick={() => setDetailId(s.id)}
              className="card rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.position}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Started {s.startDate}</p>
                </div>
                <ChevronRight size={20} className="shrink-0" style={{ color: 'var(--text-faint)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-3">
          {training.length === 0 && (
            <div className="card rounded-2xl p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No training records yet</p>
            </div>
          )}
          {training.map((t) => (
            <div key={t.id} className="card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{t.topic}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.staffName}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{t.date}</p>
                  <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--navy)' }}>
                    <span>Employee: {t.employeeSigned || '—'}</span>
                    <span>Supervisor: {t.supervisorSigned || '—'}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTraining(t.id)}
                  aria-label="Delete record"
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 active:scale-95 transition-all shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sickness' && (
        <div className="space-y-3">
          {sickness.length === 0 && (
            <div className="card rounded-2xl p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No sickness records yet</p>
            </div>
          )}
          {sickness.map((s) => (
            <div key={s.id} className="card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{s.symptoms}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{s.date}</p>
                  {s.actionTaken && (
                    <p className="text-xs mt-1" style={{ color: 'var(--navy)' }}>Action: {s.actionTaken}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteSickness(s.id)}
                  aria-label="Delete record"
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 active:scale-95 transition-all shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={openSheet} className="fab" aria-label="Add new record">
        <Plus size={26} />
      </button>

      {selectedStaff && (
        <>
          <div className="sheet-overlay" onClick={() => setDetailId(null)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{selectedStaff.name}</h3>
              <div className="space-y-3">
                <DetailRow label="Position" value={selectedStaff.position} />
                <DetailRow label="Start Date" value={selectedStaff.startDate} />
                <DetailRow label="Email" value={selectedStaff.email || '—'} />
                <DetailRow label="Phone" value={selectedStaff.phone || '—'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDetailId(null)} className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">
                  Close
                </button>
                <button
                  onClick={() => deleteStaff(selectedStaff.id)}
                  className="flex-1 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-white bg-red-500 active:scale-[0.97] transition-all"
                >
                  Delete Staff
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {tab === 'staff' && 'Add Staff Member'}
                {tab === 'training' && 'Add Training Record'}
                {tab === 'sickness' && 'Add Sickness Record'}
              </h3>

              {tab === 'staff' && (
                <>
                  <InputField label="Name" value={staffForm.name} onChange={(v) => setStaffForm({ ...staffForm, name: v })} />
                  <InputField label="Position" value={staffForm.position} onChange={(v) => setStaffForm({ ...staffForm, position: v })} />
                  <InputField label="Start Date" type="date" value={staffForm.startDate} onChange={(v) => setStaffForm({ ...staffForm, startDate: v })} />
                  <InputField label="Email" type="email" value={staffForm.email} onChange={(v) => setStaffForm({ ...staffForm, email: v })} />
                  <InputField label="Phone" type="tel" value={staffForm.phone} onChange={(v) => setStaffForm({ ...staffForm, phone: v })} />
                </>
              )}

              {tab === 'training' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Staff Member</label>
                    <select
                      value={trainingForm.staffId}
                      onChange={(e) => setTrainingForm({ ...trainingForm, staffId: e.target.value })}
                      aria-label="Staff Member"
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                    >
                      {staff.length === 0 && <option value="">No staff available</option>}
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Topic" value={trainingForm.topic} onChange={(v) => setTrainingForm({ ...trainingForm, topic: v })} />
                  <InputField label="Employee Signed" value={trainingForm.employeeSigned} onChange={(v) => setTrainingForm({ ...trainingForm, employeeSigned: v })} />
                  <InputField label="Supervisor Signed" value={trainingForm.supervisorSigned} onChange={(v) => setTrainingForm({ ...trainingForm, supervisorSigned: v })} />
                  <InputField label="Date" type="date" value={trainingForm.date} onChange={(v) => setTrainingForm({ ...trainingForm, date: v })} />
                </>
              )}

              {tab === 'sickness' && (
                <>
                  <InputField label="Name" value={sicknessForm.name} onChange={(v) => setSicknessForm({ ...sicknessForm, name: v })} />
                  <InputField label="Symptoms" value={sicknessForm.symptoms} onChange={(v) => setSicknessForm({ ...sicknessForm, symptoms: v })} />
                  <InputField label="Date" type="date" value={sicknessForm.date} onChange={(v) => setSicknessForm({ ...sicknessForm, date: v })} />
                  <InputField label="Action Taken" value={sicknessForm.actionTaken} onChange={(v) => setSicknessForm({ ...sicknessForm, actionTaken: v })} />
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSheet(false)} className="btn-outline flex-1 py-3 min-h-[44px] rounded-xl text-sm">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="btn-primary flex-1 py-3 min-h-[44px] rounded-xl text-sm">
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="glass-input w-full px-4 py-3 rounded-xl text-sm"
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-medium truncate min-w-0" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}
