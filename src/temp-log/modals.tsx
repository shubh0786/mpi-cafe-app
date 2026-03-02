import { useState, useRef } from 'react';
import { Plus, Pencil, Calendar, Trash2, Download, Upload, AlertTriangle, FileSpreadsheet, CalendarDays, CalendarRange } from 'lucide-react';
import { useTempLog } from './TempLogContext';
import { UNIT_PRESETS } from './types';
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, parseISO } from 'date-fns';

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-end md:items-center justify-center z-50 no-print"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.2s ease' }} onClick={onClose}>
      <div className="rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 rounded-full mx-auto mb-4 md:hidden" style={{ background: 'var(--sheet-handle)' }} />
        {children}
      </div>
    </div>
  );
}

export function AddUnitModal({ onClose }: { onClose: () => void }) {
  const { addUnit } = useTempLog();
  const [name, setName] = useState('');
  const [min, setMin] = useState('0');
  const [max, setMax] = useState('5');
  const submit = () => { if (!name.trim()) return; addUnit(name.trim(), parseFloat(min) || 0, parseFloat(max) || 5); onClose(); };
  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}><Plus size={18} className="inline mr-2" />Add Fridge / Chiller</h2>
      <div className="flex gap-2 mb-4">
        {UNIT_PRESETS.map(p => (
          <button key={p.label} onClick={() => { if (!name) setName(p.label + ' ' + (Math.floor(Math.random() * 9) + 1)); setMin(String(p.min)); setMax(String(p.max)); }}
            className="flex-1 py-2 text-xs font-bold rounded-xl btn-outline">{p.label}</button>
        ))}
      </div>
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium mb-3"
        placeholder="e.g. Fridge 3" autoFocus onKeyDown={e => e.key === 'Enter' && submit()} />
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Safe Temperature Range (°C)</label>
      <div className="flex items-center gap-2 mb-5">
        <input type="number" value={min} onChange={e => setMin(e.target.value)} className="glass-input flex-1 min-h-[44px] px-3 rounded-xl text-sm font-bold text-center" inputMode="decimal" placeholder="Min" title="Min temp" />
        <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>to</span>
        <input type="number" value={max} onChange={e => setMax(e.target.value)} className="glass-input flex-1 min-h-[44px] px-3 rounded-xl text-sm font-bold text-center" inputMode="decimal" placeholder="Max" title="Max temp" />
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 min-h-[44px] px-4 text-sm font-semibold rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancel</button>
        <button onClick={submit} disabled={!name.trim()} className="flex-1 btn-primary min-h-[44px] px-5 text-sm font-bold rounded-xl disabled:opacity-40">Add Unit</button>
      </div>
    </ModalShell>
  );
}

export function EditUnitModal({ unitId, onClose }: { unitId: string; onClose: () => void }) {
  const { units, updateUnit, deleteUnit } = useTempLog();
  const unit = units.find(u => u.id === unitId);
  const [name, setName] = useState(unit?.name || '');
  const [min, setMin] = useState(String(unit?.minTemp ?? 0));
  const [max, setMax] = useState(String(unit?.maxTemp ?? 5));
  if (!unit) return null;
  const submit = () => { if (!name.trim()) return; updateUnit(unitId, name.trim(), parseFloat(min) || 0, parseFloat(max) || 5); onClose(); };
  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}><Pencil size={16} className="inline mr-2" />Edit Unit</h2>
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium mb-3"
        autoFocus onKeyDown={e => e.key === 'Enter' && submit()} />
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Safe Range (°C)</label>
      <div className="flex items-center gap-2 mb-3">
        <input type="number" value={min} onChange={e => setMin(e.target.value)} className="glass-input flex-1 min-h-[44px] px-3 rounded-xl text-sm font-bold text-center" inputMode="decimal" title="Min temp" />
        <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>to</span>
        <input type="number" value={max} onChange={e => setMax(e.target.value)} className="glass-input flex-1 min-h-[44px] px-3 rounded-xl text-sm font-bold text-center" inputMode="decimal" title="Max temp" />
      </div>
      <div className="flex justify-between gap-2 mt-4">
        <button onClick={() => { deleteUnit(unitId); onClose(); }} className="min-h-[44px] px-4 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={14} className="inline mr-1" />Delete</button>
        <div className="flex gap-2">
          <button onClick={onClose} className="min-h-[44px] px-4 text-sm font-semibold rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()} className="btn-primary min-h-[44px] px-5 text-sm font-bold rounded-xl disabled:opacity-40">Save</button>
        </div>
      </div>
    </ModalShell>
  );
}

export function BulkUpdateModal({ onClose }: { onClose: () => void }) {
  const { units, doBulkUpdate } = useTempLog();
  const [temp, setTemp] = useState('');
  const [unitId, setUnitId] = useState('all');
  const [from, setFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const submit = () => { doBulkUpdate(from, to, unitId, temp); onClose(); };
  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}><Calendar size={18} className="inline mr-2" />Bulk Update</h2>
      <div className="space-y-3 mb-5">
        <div><label htmlFor="bf" className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>From</label><input id="bf" type="date" value={from} onChange={e => setFrom(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium" /></div>
        <div><label htmlFor="bt" className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>To</label><input id="bt" type="date" value={to} onChange={e => setTo(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium" /></div>
        <div><label htmlFor="bu" className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Unit</label><select id="bu" value={unitId} onChange={e => setUnitId(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium"><option value="all">All Units</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        <div><label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Temperature (°C)</label><input type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-bold" placeholder="e.g. 4" inputMode="decimal" /></div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 min-h-[44px] px-4 text-sm font-semibold rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancel</button>
        <button onClick={submit} disabled={!temp} className="flex-1 btn-primary min-h-[44px] px-5 text-sm font-bold rounded-xl disabled:opacity-40">Apply</button>
      </div>
    </ModalShell>
  );
}

export function BackupRestoreModal({ onClose }: { onClose: () => void }) {
  const { exportBackup, importBackup } = useTempLog();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importBackup(ev.target?.result as string);
      setStatus(ok ? 'success' : 'error');
      if (ok) setTimeout(onClose, 1200);
    };
    reader.readAsText(file);
  };
  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>Backup & Restore</h2>
      <div className="space-y-3 mb-4">
        <button onClick={exportBackup} className="w-full flex items-center justify-center gap-2 min-h-[44px] py-3 rounded-xl font-bold text-sm btn-outline">
          <Download size={16} /> Download Backup (JSON)
        </button>
        <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 min-h-[44px] py-3 rounded-xl font-bold text-sm btn-outline">
          <Upload size={16} /> Restore from Backup
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
        {status === 'success' && <p className="text-center text-sm font-bold text-green-500">Restored successfully!</p>}
        {status === 'error' && <p className="text-center text-sm font-bold text-red-400">Invalid backup file</p>}
      </div>
      <p className="text-xs text-center mb-4" style={{ color: 'var(--text-muted)' }}>Backup includes all units, temperatures, and notes. Restoring will replace current data.</p>
      <button onClick={onClose} className="w-full min-h-[44px] px-4 text-sm font-semibold rounded-xl" style={{ color: 'var(--text-muted)' }}>Close</button>
    </ModalShell>
  );
}

export function ExportModal({ baseDate, onClose }: { baseDate: string; onClose: () => void }) {
  const { exportExcel, exportPDF, recorder } = useTempLog();
  const [mode, setMode] = useState<'week' | 'month' | 'custom'>('week');
  const [customFrom, setCustomFrom] = useState(baseDate);
  const [customTo, setCustomTo] = useState(baseDate);
  const [signature, setSignature] = useState(recorder);

  const getRange = () => {
    try {
      if (mode === 'week') {
        const ws = startOfWeek(parseISO(baseDate), { weekStartsOn: 1 });
        return { from: format(ws, 'yyyy-MM-dd'), to: format(addDays(ws, 6), 'yyyy-MM-dd'), label: `Week of ${format(ws, 'dd MMM yyyy')}` };
      }
      if (mode === 'month') {
        const ms = startOfMonth(parseISO(baseDate));
        const me = endOfMonth(parseISO(baseDate));
        return { from: format(ms, 'yyyy-MM-dd'), to: format(me, 'yyyy-MM-dd'), label: format(ms, 'MMMM yyyy') };
      }
      return { from: customFrom, to: customTo, label: `${format(parseISO(customFrom), 'dd MMM yyyy')} to ${format(parseISO(customTo), 'dd MMM yyyy')}` };
    } catch {
      return { from: baseDate, to: baseDate, label: baseDate };
    }
  };

  const range = getRange();
  const isValidRange = range.from <= range.to;

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}><Download size={18} className="inline mr-2" />Export Data</h2>

      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Select Period</label>
      <div className="flex gap-2 mb-4">
        {(['week', 'month', 'custom'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2.5 text-xs font-bold rounded-xl transition-all ${mode === m ? 'btn-primary' : 'btn-outline'}`}>
            {m === 'week' && <><CalendarDays size={14} /> Week</>}
            {m === 'month' && <><Calendar size={14} /> Month</>}
            {m === 'custom' && <><CalendarRange size={14} /> Custom</>}
          </button>
        ))}
      </div>

      {mode === 'custom' && (
        <div className="space-y-3 mb-4">
          <div><label htmlFor="ef" className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>From</label><input id="ef" type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium" /></div>
          <div><label htmlFor="et" className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>To</label><input id="et" type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium" /></div>
        </div>
      )}

      <div className="card rounded-xl p-3 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Export range</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{range.label}</p>
        {!isValidRange && <p className="text-xs text-red-400 font-bold mt-1">From date must be before To date</p>}
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Digital Signature</label>
        <input type="text" value={signature} onChange={e => setSignature(e.target.value)}
          className="glass-input w-full min-h-[44px] px-4 rounded-xl text-sm font-medium"
          placeholder="Type your full name to sign" />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>This will appear as your digital signature on the exported document</p>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={() => { exportExcel(range.from, range.to, signature); onClose(); }}
          disabled={!isValidRange}
          className="flex-1 flex items-center justify-center gap-2 min-h-[44px] py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
          <FileSpreadsheet size={16} /> Excel
        </button>
        <button onClick={() => { exportPDF(range.from, range.to, signature); onClose(); }}
          disabled={!isValidRange}
          className="flex-1 flex items-center justify-center gap-2 min-h-[44px] py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
          <Download size={16} /> PDF
        </button>
      </div>

      <button onClick={onClose} className="w-full min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancel</button>
    </ModalShell>
  );
}

export function CorrectiveActionModal({ unitId, date, onClose }: { unitId: string; date: string; onClose: () => void }) {
  const { units, getTemp, getCorrectiveAction, setCorrectiveAction } = useTempLog();
  const unit = units.find(u => u.id === unitId);
  const temp = getTemp(unitId, date);
  const [action, setAction] = useState(getCorrectiveAction(unitId, date));
  const submit = () => { setCorrectiveAction(unitId, date, action); onClose(); };
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-amber-500" />
        <h2 className="text-lg font-bold text-amber-600">Out of Range!</h2>
      </div>
      <div className="card rounded-xl p-3 mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{unit?.name}: <span className="text-amber-600">{temp}°C</span></p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Safe range: {unit?.minTemp}°C to {unit?.maxTemp}°C</p>
      </div>
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>What corrective action was taken?</label>
      <textarea value={action} onChange={e => setAction(e.target.value)} className="w-full p-3 rounded-xl text-sm font-medium outline-none resize-none glass-input"
        rows={3} placeholder="e.g. Adjusted thermostat, moved items, called technician..." autoFocus />
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 min-h-[44px] px-4 text-sm font-semibold rounded-xl" style={{ color: 'var(--text-muted)' }}>Skip</button>
        <button onClick={submit} className="flex-1 btn-primary min-h-[44px] px-5 text-sm font-bold rounded-xl">Save Action</button>
      </div>
    </ModalShell>
  );
}
