import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';
import { Plus, Trash2, Sparkles, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface CleaningEntry {
  id: string;
  date: string;
  task: string;
  cleanedBy: string;
}

interface MaintenanceEntry {
  id: string;
  date: string;
  task: string;
  completedBy: string;
}

type Tab = 'cleaning' | 'maintenance';

const CLEANING_KEY = 'cafe-cleaning-log';
const MAINTENANCE_KEY = 'cafe-maintenance-log';

export default function CleaningMaintenance({ recorder }: { recorder: string }) {
  const [tab, setTab] = useState<Tab>('cleaning');
  const [cleaningEntries, setCleaningEntries] = useState<CleaningEntry[]>([]);
  const [maintenanceEntries, setMaintenanceEntries] = useState<MaintenanceEntry[]>([]);
  const [showSheet, setShowSheet] = useState(false);

  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formTask, setFormTask] = useState('');
  const [formPerson, setFormPerson] = useState(recorder);

  useEffect(() => {
    setCleaningEntries(load<CleaningEntry[]>(CLEANING_KEY, []));
    setMaintenanceEntries(load<MaintenanceEntry[]>(MAINTENANCE_KEY, []));
  }, []);

  const resetForm = () => {
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormTask('');
    setFormPerson(recorder);
  };

  const openSheet = () => {
    resetForm();
    setShowSheet(true);
  };

  const addCleaning = () => {
    if (!formTask.trim()) return;
    const entry: CleaningEntry = {
      id: crypto.randomUUID(),
      date: formDate,
      task: formTask.trim(),
      cleanedBy: formPerson.trim(),
    };
    const updated = [entry, ...cleaningEntries];
    setCleaningEntries(updated);
    save(CLEANING_KEY, updated);
    setShowSheet(false);
  };

  const addMaintenance = () => {
    if (!formTask.trim()) return;
    const entry: MaintenanceEntry = {
      id: crypto.randomUUID(),
      date: formDate,
      task: formTask.trim(),
      completedBy: formPerson.trim(),
    };
    const updated = [entry, ...maintenanceEntries];
    setMaintenanceEntries(updated);
    save(MAINTENANCE_KEY, updated);
    setShowSheet(false);
  };

  const deleteCleaning = (id: string) => {
    const updated = cleaningEntries.filter((e) => e.id !== id);
    setCleaningEntries(updated);
    save(CLEANING_KEY, updated);
  };

  const deleteMaintenance = (id: string) => {
    const updated = maintenanceEntries.filter((e) => e.id !== id);
    setMaintenanceEntries(updated);
    save(MAINTENANCE_KEY, updated);
  };

  const handleSubmit = () => {
    if (tab === 'cleaning') addCleaning();
    else addMaintenance();
  };

  const entries = tab === 'cleaning' ? cleaningEntries : maintenanceEntries;

  return (
    <div className="space-y-4 content-area px-4">
      <div className="card rounded-2xl p-1.5 flex gap-1">
        <button
          onClick={() => setTab('cleaning')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'cleaning' ? 'shadow-md' : ''
          }`}
          style={tab === 'cleaning' ? { background: 'var(--navy)', color: 'var(--btn-primary-text)' } : { color: 'var(--text-muted)' }}
        >
          <Sparkles size={16} /> Cleaning
        </button>
        <button
          onClick={() => setTab('maintenance')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'maintenance' ? 'shadow-md' : ''
          }`}
          style={tab === 'maintenance' ? { background: 'var(--navy)', color: 'var(--btn-primary-text)' } : { color: 'var(--text-muted)' }}
        >
          <Wrench size={16} /> Maintenance
        </button>
      </div>

      {entries.length === 0 && (
        <div className="card rounded-2xl p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No entries yet</p>
        </div>
      )}

      <div className="space-y-3">
        {tab === 'cleaning' &&
          cleaningEntries.map((e) => (
            <div key={e.id} className="card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{e.task}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{e.date}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--navy)' }}>Cleaned by {e.cleanedBy}</p>
                </div>
                <button
                  onClick={() => deleteCleaning(e.id)}
                  aria-label="Delete entry"
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 active:scale-95 transition-all shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

        {tab === 'maintenance' &&
          maintenanceEntries.map((e) => (
            <div key={e.id} className="card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{e.task}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{e.date}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--navy)' }}>By {e.completedBy}</p>
                </div>
                <button
                  onClick={() => deleteMaintenance(e.id)}
                  aria-label="Delete entry"
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 active:scale-95 transition-all shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
      </div>

      <button onClick={openSheet} className="fab" aria-label="Add new entry">
        <Plus size={26} />
      </button>

      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                New {tab === 'cleaning' ? 'Cleaning' : 'Maintenance'} Entry
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  aria-label="Date"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Task Completed</label>
                <input
                  type="text"
                  value={formTask}
                  onChange={(e) => setFormTask(e.target.value)}
                  placeholder="Describe the task..."
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {tab === 'cleaning' ? 'Cleaned By' : 'Completed By'}
                </label>
                <input
                  type="text"
                  value={formPerson}
                  onChange={(e) => setFormPerson(e.target.value)}
                  aria-label={tab === 'cleaning' ? 'Cleaned By' : 'Completed By'}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
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
