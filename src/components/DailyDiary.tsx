import { useState, useCallback, useEffect } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { load, save } from '../lib/storage';

const STORAGE_KEY = 'cafe-diary-checks';

export interface DiaryEntry {
  openingChecks: boolean[];
  closingChecks: boolean[];
  notes: string;
  weeklyCleaningDone: boolean;
  weeklyMaintenanceDone: boolean;
  pestActivity: boolean;
  pestNotes: string;
  recorder: string;
}

const defaultEntry = (recorder: string): DiaryEntry => ({
  openingChecks: [false, false, false],
  closingChecks: [false, false, false, false, false],
  notes: '',
  weeklyCleaningDone: false,
  weeklyMaintenanceDone: false,
  pestActivity: false,
  pestNotes: '',
  recorder,
});

const OPENING_LABELS = [
  'Staff are fit for work, clean and presentable',
  'Food preparation areas are clean',
  'Hand washing and cleaning materials available',
];

const CLOSING_LABELS = [
  'Food is protected from contamination',
  'Perishable food stored at correct temperature',
  'Food past use-by date thrown away',
  'Cleaning completed',
  'Waste removed and fresh bags in place',
];

const CheckIcon = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface DailyDiaryProps {
  recorder: string;
}

export default function DailyDiary({ recorder }: DailyDiaryProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weeklyOpen, setWeeklyOpen] = useState(true);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const getEntries = useCallback((): Record<string, DiaryEntry> => {
    return load<Record<string, DiaryEntry>>(STORAGE_KEY, {});
  }, []);

  const getEntry = useCallback(
    (key: string): DiaryEntry => {
      const entries = getEntries();
      const existing = entries[key];
      if (existing) {
        const merged: DiaryEntry = {
          ...defaultEntry(recorder),
          ...existing,
          recorder,
          openingChecks: OPENING_LABELS.map((_, i) => existing.openingChecks?.[i] ?? false),
          closingChecks: CLOSING_LABELS.map((_, i) => existing.closingChecks?.[i] ?? false),
        };
        return merged;
      }
      return defaultEntry(recorder);
    },
    [getEntries, recorder]
  );

  const [entry, setEntry] = useState<DiaryEntry>(() => getEntry(dateKey));

  useEffect(() => {
    setEntry(getEntry(dateKey));
  }, [dateKey, getEntry]);

  const updateEntry = useCallback(
    (updates: Partial<DiaryEntry>) => {
      const entries = getEntries();
      const current = getEntry(dateKey);
      const next = { ...current, ...updates };
      entries[dateKey] = next;
      save(STORAGE_KEY, entries);
      setEntry(next);
    },
    [dateKey, getEntries, getEntry]
  );

  const goToDate = useCallback(
    (d: Date) => {
      setSelectedDate(d);
      setEntry(getEntry(format(d, 'yyyy-MM-dd')));
    },
    [getEntry]
  );

  const setOpeningCheck = (index: number, checked: boolean) => {
    const next = [...entry.openingChecks];
    next[index] = checked;
    updateEntry({ openingChecks: next });
  };

  const setClosingCheck = (index: number, checked: boolean) => {
    const next = [...entry.closingChecks];
    next[index] = checked;
    updateEntry({ closingChecks: next });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24 min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goToDate(subDays(selectedDate, 1))}
              className="btn-outline rounded-xl p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Previous day"
            >
              <ChevronLeft size={24} strokeWidth={2.5} style={{ color: 'var(--navy)' }} />
            </button>
            <div className="flex-1 flex flex-col items-center min-w-0">
              <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {format(selectedDate, 'd MMM yyyy')}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {format(selectedDate, 'EEEE')}
              </span>
              {isToday(selectedDate) && (
                <span className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'var(--navy)', color: 'var(--btn-primary-text)' }}>
                  Today
                </span>
              )}
              {!isToday(selectedDate) && (
                <button
                  type="button"
                  onClick={() => goToDate(new Date())}
                  className="btn-primary mt-2 px-4 py-2 text-sm min-h-[44px] flex items-center justify-center touch-manipulation"
                >
                  Go to Today
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => goToDate(addDays(selectedDate, 1))}
              className="btn-outline rounded-xl p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Next day"
            >
              <ChevronRight size={24} strokeWidth={2.5} style={{ color: 'var(--navy)' }} />
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="section-header">Opening Checks</h2>
          <div className="space-y-2">
            {OPENING_LABELS.map((label, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => setOpeningCheck(i, !entry.openingChecks[i])}
                onKeyDown={(e) => e.key === 'Enter' && setOpeningCheck(i, !entry.openingChecks[i])}
                className={`check-row min-h-[44px] ${entry.openingChecks[i] ? 'checked' : ''}`}
              >
                <div className="check-box">
                  {entry.openingChecks[i] && <CheckIcon />}
                </div>
                <span className="check-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="section-header">Closing Checks</h2>
          <div className="space-y-2">
            {CLOSING_LABELS.map((label, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => setClosingCheck(i, !entry.closingChecks[i])}
                onKeyDown={(e) => e.key === 'Enter' && setClosingCheck(i, !entry.closingChecks[i])}
                className={`check-row min-h-[44px] ${entry.closingChecks[i] ? 'checked' : ''}`}
              >
                <div className="check-box">
                  {entry.closingChecks[i] && <CheckIcon />}
                </div>
                <span className="check-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="section-header">Daily Notes</h2>
          <textarea
            value={entry.notes}
            onChange={(e) => updateEntry({ notes: e.target.value })}
            className="glass-input w-full rounded-xl px-4 py-3 min-h-[100px] resize-y"
            style={{ color: 'var(--text)' }}
            placeholder="Any problems or changes – what were they and what did you do?"
          />
        </div>

        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setWeeklyOpen((o) => !o)}
            className="w-full flex items-center justify-between p-4 min-h-[44px] text-left touch-manipulation"
          >
            <h2 className="section-header mb-0">Weekly Checks</h2>
            {weeklyOpen ? (
              <ChevronUp size={22} className="shrink-0" style={{ color: 'var(--navy)' }} />
            ) : (
              <ChevronDown size={22} className="shrink-0" style={{ color: 'var(--navy)' }} />
            )}
          </button>
          {weeklyOpen && (
            <div className="px-4 pb-4 pt-2 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between gap-3 min-h-[44px]">
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Cleaning tasks completed</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={entry.weeklyCleaningDone ? 'true' : 'false'}
                  aria-label="Cleaning tasks completed"
                  onClick={() => updateEntry({ weeklyCleaningDone: !entry.weeklyCleaningDone })}
                  className={`toggle ${entry.weeklyCleaningDone ? 'on' : ''}`}
                />
              </div>
              <div className="flex items-center justify-between gap-3 min-h-[44px]">
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Maintenance tasks completed</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={entry.weeklyMaintenanceDone ? 'true' : 'false'}
                  aria-label="Maintenance tasks completed"
                  onClick={() => updateEntry({ weeklyMaintenanceDone: !entry.weeklyMaintenanceDone })}
                  className={`toggle ${entry.weeklyMaintenanceDone ? 'on' : ''}`}
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 min-h-[44px]">
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Signs of pest activity</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={entry.pestActivity ? 'true' : 'false'}
                    aria-label="Signs of pest activity"
                    onClick={() => updateEntry({ pestActivity: !entry.pestActivity, pestNotes: entry.pestActivity ? '' : entry.pestNotes })}
                    className={`toggle ${entry.pestActivity ? 'on' : ''}`}
                  />
                </div>
                {entry.pestActivity && (
                  <textarea
                    value={entry.pestNotes}
                    onChange={(e) => updateEntry({ pestNotes: e.target.value })}
                    placeholder="Describe pest activity and actions taken..."
                    className="glass-input w-full rounded-xl px-4 py-3 mt-2 min-h-[80px] resize-y"
                    style={{ color: 'var(--text)' }}
                  />
                )}
              </div>
              <p className="text-sm italic pt-2" style={{ color: 'var(--text)' }}>
                The procedures in our Food Control Plan were followed and effectively supervised this week.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
