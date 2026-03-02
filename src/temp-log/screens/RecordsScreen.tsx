import { useState, useMemo } from 'react';
import { format, subDays, addDays, parseISO, isToday, startOfWeek } from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar, Pencil, Trash2, CheckCircle2, Download, StickyNote, AlertTriangle, BarChart3 } from 'lucide-react';
import { useTempLog } from '../TempLogContext';
import { AddUnitModal, EditUnitModal, BulkUpdateModal, ExportModal } from '../modals';

export function RecordsScreen() {
  const { units, getTemp, setTemp, getTempStatus, getCorrectiveAction, getNote, setNoteText, deleteUnit, setScreen } = useTempLog();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);

  const weekStart = startOfWeek(parseISO(date), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeklyStats = useMemo(() => {
    let total = 0, logged = 0, outOfRange = 0;
    weekDays.forEach(d => {
      const ds = format(d, 'yyyy-MM-dd');
      units.forEach(u => {
        total++;
        const t = getTemp(u.id, ds);
        if (t) { logged++; if (getTempStatus(u, t) === 'warn') outOfRange++; }
      });
    });
    const compliance = total > 0 ? Math.round((logged / total) * 100) : 0;
    return { total, logged, compliance, outOfRange };
  }, [weekDays, units, getTemp, getTempStatus]);

  return (
    <div className="p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen('landing')} className="p-3 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }} title="Back"><ArrowLeft size={22} /></button>
          <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>Daily Records</h2>
          <div className="flex gap-1.5 no-print">
            <button onClick={() => setShowAdd(true)} className="p-2.5 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }} title="Add unit"><Plus size={18} /></button>
            <button onClick={() => setShowBulk(true)} className="p-2.5 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }} title="Bulk update"><Calendar size={18} /></button>
          </div>
        </div>

        <div className="card rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setDate(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'))} className="p-2.5 rounded-xl transition-all shrink-0" style={{ color: 'var(--navy)' }} title="Previous day"><ChevronLeft size={22} /></button>
            <div className="text-center min-w-0">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-lg font-bold text-center bg-transparent outline-none cursor-pointer w-full" style={{ color: 'var(--navy)' }} title="Select date" />
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {format(parseISO(date), 'EEEE')}
                {isToday(parseISO(date)) && <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--bg-alt)', color: 'var(--navy)' }}>Today</span>}
              </p>
            </div>
            <button onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))} className="p-2.5 rounded-xl transition-all shrink-0" style={{ color: 'var(--navy)' }} title="Next day"><ChevronRight size={22} /></button>
          </div>
          {!isToday(parseISO(date)) && (
            <button onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))} className="w-full mt-3 min-h-[44px] py-2 text-xs font-bold rounded-xl transition-all" style={{ background: 'var(--bg-alt)', color: 'var(--navy)' }}>Go to Today</button>
          )}
        </div>

        <div className="card rounded-2xl overflow-hidden mb-4 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--navy)' }}>Temperatures</span>
            <span className="ml-auto text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{units.filter(u => getTemp(u.id, date)).length}/{units.length}</span>
          </div>
          {units.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No units added</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {units.map(u => {
                const t = getTemp(u.id, date);
                const status = getTempStatus(u, t);
                const ca = getCorrectiveAction(u.id, date);
                return (
                  <div key={u.id} className="px-4 py-3 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {status === 'warn' ? <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                          : t ? <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--navy)' }} />
                          : <div className="w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: 'var(--border)' }} />}
                        <div className="min-w-0">
                          <span className="font-semibold text-sm truncate block" style={{ color: 'var(--text)' }}>{u.name}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.minTemp} to {u.maxTemp}°C</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5">
                          <input type="number" step="0.1" value={t} onChange={e => setTemp(u.id, date, e.target.value)}
                            className="glass-input w-16 text-center min-h-[44px] py-1.5 rounded-lg text-sm font-bold outline-none transition-all" placeholder="--" inputMode="decimal" />
                          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>°C</span>
                        </div>
                        <button onClick={() => setEditId(u.id)} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => deleteUnit(u.id)} className="p-2 rounded-lg transition-all hover:bg-red-50" style={{ color: 'var(--text-muted)' }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {ca && <p className="text-xs text-amber-600 mt-1 ml-7">Action: {ca}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card rounded-2xl p-4 mb-4 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--navy)' }}><StickyNote size={14} /> Notes for {format(parseISO(date), 'EEE dd/MM')}</label>
          <textarea value={getNote(date)?.note || ''} onChange={e => setNoteText(date, e.target.value)}
            className="w-full p-3 rounded-xl text-sm font-medium outline-none resize-none glass-input" rows={2} placeholder="Any problems or notes..." />
          {getNote(date)?.recorder && <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>By: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{getNote(date)?.recorder}</span></p>}
        </div>

        <button onClick={() => setShowWeekly(!showWeekly)}
          className="w-full card rounded-2xl p-4 mb-4 text-left shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--navy)' }}><BarChart3 size={16} /> Weekly Summary</span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{format(weekStart, 'dd/MM')} — {format(addDays(weekStart, 6), 'dd/MM')}</span>
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}><span className="font-bold" style={{ color: weeklyStats.compliance >= 80 ? '#34d399' : '#f59e0b' }}>{weeklyStats.compliance}%</span> compliance</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}><span className="font-bold">{weeklyStats.logged}</span>/{weeklyStats.total} logged</span>
            {weeklyStats.outOfRange > 0 && <span className="text-xs text-amber-500 font-bold">{weeklyStats.outOfRange} out of range</span>}
          </div>
        </button>

        {showWeekly && (
          <div className="card rounded-2xl overflow-hidden mb-4 overflow-x-auto shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--text-secondary)' }}>Unit</th>
                  {dayLabels.map((d, i) => <th key={d} className="px-2 py-2 text-center font-bold" style={{ color: 'var(--text-muted)' }}>{d}<br /><span className="font-normal">{format(weekDays[i], 'dd')}</span></th>)}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {units.map(u => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 font-bold truncate max-w-[80px]" style={{ color: 'var(--text)' }}>{u.name}</td>
                    {weekDays.map(d => {
                      const ds = format(d, 'yyyy-MM-dd');
                      const t = getTemp(u.id, ds);
                      const status = getTempStatus(u, t);
                      return (
                        <td key={ds} className={`px-2 py-2 text-center font-semibold ${status === 'warn' ? 'text-amber-500' : ''}`} style={status !== 'warn' ? { color: 'var(--text)' } : undefined}>
                          {t ? `${t}°` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-4 no-print">
          <button onClick={() => setShowExport(true)} className="w-full flex items-center justify-center gap-2 min-h-[44px] py-3.5 rounded-xl font-bold text-sm btn-outline transition-all">
            <Download size={16} /> Export Data (Excel / PDF)
          </button>
        </div>
      </div>

      {showAdd && <AddUnitModal onClose={() => setShowAdd(false)} />}
      {editId && <EditUnitModal unitId={editId} onClose={() => setEditId(null)} />}
      {showBulk && <BulkUpdateModal onClose={() => setShowBulk(false)} />}
      {showExport && <ExportModal baseDate={date} onClose={() => setShowExport(false)} />}
    </div>
  );
}
