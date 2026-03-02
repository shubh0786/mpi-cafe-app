import { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, StickyNote, AlertTriangle } from 'lucide-react';
import { useTempLog } from '../TempLogContext';
import { SuccessCheck, CelebrationOverlay } from '../visuals';

export function CompleteScreen() {
  const { units, getTemp, getTempStatus, getCorrectiveAction, recorder, setScreen, setNoteText } = useTempLog();

  const selectedDate = format(new Date(), 'yyyy-MM-dd');
  const [submitted, setSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completeNote, setCompleteNote] = useState('');

  const handleSubmit = () => {
    if (completeNote.trim()) setNoteText(selectedDate, completeNote);
    setSubmitted(true);
    setShowCelebration(true);
  };
  const hideCelebration = useCallback(() => setShowCelebration(false), []);

  const outOfRangeCount = units.filter(u => getTempStatus(u, getTemp(u.id, selectedDate)) === 'warn').length;

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8">
        {showCelebration && <CelebrationOverlay onDone={hideCelebration} />}
        <div className="w-full max-w-md text-center">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}><CheckCircle2 size={40} style={{ color: 'var(--navy)' }} /></div>
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>All Done!</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Log saved for {format(parseISO(selectedDate), 'EEEE, d MMM')} by {recorder}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setScreen('logging')} className="w-full min-h-[44px] py-3.5 rounded-2xl font-bold text-sm btn-primary shadow-lg">Log Another Day</button>
            <button onClick={() => setScreen('records')} className="w-full min-h-[44px] py-3.5 rounded-2xl font-bold text-sm btn-outline">View Records</button>
            <button onClick={() => setScreen('landing')} className="text-sm font-semibold transition-colors mt-2" style={{ color: 'var(--text-muted)' }}>Back to Overview</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mb-4"><SuccessCheck size={90} /></div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>All Temperatures Recorded!</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {format(parseISO(selectedDate), 'EEEE, d MMMM yyyy')} &middot; {recorder}
          </p>
          {outOfRangeCount > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-amber-500">
              <AlertTriangle size={14} /><span className="text-xs font-bold">{outOfRangeCount} out of range</span>
            </div>
          )}
        </div>

        <div className="card rounded-2xl overflow-hidden mb-4 shadow-sm">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {units.map((u) => {
              const t = getTemp(u.id, selectedDate);
              const status = getTempStatus(u, t);
              const ca = getCorrectiveAction(u.id, selectedDate);
              return (
                <div key={u.id} className="px-4 py-3 cursor-pointer transition-all" onClick={() => setScreen('logging')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {status === 'warn' ? <AlertTriangle size={16} className="text-amber-500" />
                        : t ? <CheckCircle2 size={16} style={{ color: 'var(--navy)' }} />
                        : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />}
                      <div>
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{u.name}</span>
                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>({u.minTemp} to {u.maxTemp}°C)</span>
                      </div>
                    </div>
                    <span className={`font-bold ${status === 'warn' ? 'text-amber-500' : ''}`} style={status !== 'warn' ? { color: t ? 'var(--navy)' : 'var(--text-faint)' } : undefined}>
                      {t ? `${t}°C` : '—'}
                    </span>
                  </div>
                  {ca && <p className="text-xs text-amber-600 mt-1 ml-7">Action: {ca}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card rounded-2xl p-4 mb-4 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--navy)' }}>
            <StickyNote size={14} /> Add a note (optional)
          </label>
          <textarea value={completeNote} onChange={e => setCompleteNote(e.target.value)}
            className="w-full p-3 rounded-xl text-sm font-medium outline-none resize-none glass-input" rows={2} placeholder="Any problems or notes for today..." />
        </div>

        <div>
          <button onClick={handleSubmit} className="w-full min-h-[44px] py-4 rounded-2xl text-white text-lg font-bold transition-all active:scale-[0.97] btn-primary shadow-xl">
            <span className="flex items-center justify-center gap-3"><CheckCircle2 size={22} /> Submit Log</span>
          </button>
        </div>
        <button onClick={() => setScreen('logging')} className="w-full mt-3 py-2.5 text-sm font-semibold transition-colors text-center" style={{ color: 'var(--text-muted)' }}>← Go back and edit</button>
      </div>
    </div>
  );
}
