import { useState, useCallback } from 'react';
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  format,
  parseISO,
  isSameWeek,
  eachDayOfInterval,
  add,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Thermometer,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { load, save } from '../lib/storage';

interface Unit {
  id: string;
  name: string;
}

interface TempRecord {
  unitId: string;
  date: string;
  temperature: string;
}

interface DailyNote {
  date: string;
  note: string;
  recorder: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UNITS_KEY = 'cafe-temp-units';
const RECORDS_KEY = 'cafe-temp-records';
const NOTES_KEY = 'cafe-temp-notes';

function getWeekStart(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function getWeekDays(weekStart: Date): Date[] {
  return eachDayOfInterval({
    start: weekStart,
    end: add(weekStart, { days: 6 }),
  });
}

interface TemperatureChecksProps {
  recorder: string;
}

export default function TemperatureChecks({ recorder }: TemperatureChecksProps) {
  const [units, setUnits] = useState<Unit[]>(() =>
    load<Unit[]>(UNITS_KEY, [])
  );
  const [records, setRecords] = useState<TempRecord[]>(() =>
    load<TempRecord[]>(RECORDS_KEY, [])
  );
  const [notes, setNotes] = useState<DailyNote[]>(() =>
    load<DailyNote[]>(NOTES_KEY, [])
  );
  const [weekStart, setWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  );
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [bulkSheetOpen, setBulkSheetOpen] = useState(false);
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkUnitId, setBulkUnitId] = useState('');
  const [bulkTemp, setBulkTemp] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);

  const persistUnits = useCallback((u: Unit[]) => {
    setUnits(u);
    save(UNITS_KEY, u);
  }, []);

  const persistRecords = useCallback((r: TempRecord[]) => {
    setRecords(r);
    save(RECORDS_KEY, r);
  }, []);

  const persistNotes = useCallback((n: DailyNote[]) => {
    setNotes(n);
    save(NOTES_KEY, n);
  }, []);

  const weekDays = getWeekDays(weekStart);
  const isThisWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });

  const goPrevWeek = () => setWeekStart((d) => subWeeks(d, 1));
  const goNextWeek = () => setWeekStart((d) => addWeeks(d, 1));
  const goThisWeek = () => setWeekStart(getWeekStart(new Date()));

  const openAddUnit = () => {
    setEditingUnit(null);
    setUnitName('');
    setUnitSheetOpen(true);
  };

  const openEditUnit = (u: Unit) => {
    setEditingUnit(u);
    setUnitName(u.name);
    setUnitSheetOpen(true);
  };

  const saveUnit = () => {
    const name = unitName.trim();
    if (!name) return;
    if (editingUnit) {
      persistUnits(
        units.map((u) => (u.id === editingUnit.id ? { ...u, name } : u))
      );
    } else {
      persistUnits([
        ...units,
        { id: crypto.randomUUID(), name },
      ]);
    }
    setUnitSheetOpen(false);
  };

  const deleteUnit = (id: string) => {
    persistUnits(units.filter((u) => u.id !== id));
    persistRecords(records.filter((r) => r.unitId !== id));
    setUnitSheetOpen(false);
  };

  const getRecord = (unitId: string, dateStr: string): string => {
    const r = records.find(
      (x) => x.unitId === unitId && x.date === dateStr
    );
    return r?.temperature ?? '';
  };

  const setRecord = (unitId: string, dateStr: string, temp: string) => {
    const rest = records.filter(
      (r) => !(r.unitId === unitId && r.date === dateStr)
    );
    if (temp !== '') {
      persistRecords([...rest, { unitId, date: dateStr, temperature: temp }]);
    } else {
      persistRecords(rest);
    }
  };

  const getNote = (dateStr: string): DailyNote | undefined =>
    notes.find((n) => n.date === dateStr);

  const setNote = (dateStr: string, note: string) => {
    const rest = notes.filter((n) => n.date !== dateStr);
    if (note.trim()) {
      persistNotes([
        ...rest,
        { date: dateStr, note: note.trim(), recorder },
      ]);
    } else {
      persistNotes(rest);
    }
  };

  const applyBulk = () => {
    if (!bulkUnitId || !bulkTemp || !bulkStart || !bulkEnd) return;
    const start = parseISO(bulkStart);
    const end = parseISO(bulkEnd);
    if (start > end) return;
    const days = eachDayOfInterval({ start, end });
    const newRecords = [...records];
    for (const d of days) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const idx = newRecords.findIndex(
        (r) => r.unitId === bulkUnitId && r.date === dateStr
      );
      const rec = { unitId: bulkUnitId, date: dateStr, temperature: bulkTemp };
      if (idx >= 0) newRecords[idx] = rec;
      else newRecords.push(rec);
    }
    persistRecords(newRecords);
    setBulkSheetOpen(false);
    setBulkStart('');
    setBulkEnd('');
    setBulkUnitId('');
    setBulkTemp('');
  };

  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <div className="content-area p-4 pb-24 min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      <div className="card rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl btn-primary"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-bold text-center flex-1 min-w-0" style={{ color: 'var(--text)' }}>
            {format(weekStart, 'd MMM')} – {format(add(weekStart, { days: 6 }), 'd MMM yyyy')}
          </span>
          <button
            type="button"
            onClick={goNextWeek}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl btn-primary"
            aria-label="Next week"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={goThisWeek}
            className={`flex-1 min-h-[44px] px-4 rounded-xl font-medium text-sm ${
              isThisWeek ? 'btn-primary' : 'btn-outline'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setBulkSheetOpen(true)}
            className="min-h-[44px] px-4 rounded-xl btn-outline flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" style={{ color: 'var(--text)' }} />
            Bulk Update
          </button>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center shadow-sm" style={{ color: 'var(--text)' }}>
          No fridge/chiller units. Tap the + button to add one.
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => (
            <div key={unit.id} className="card rounded-2xl p-4 shadow-sm">
              <button
                type="button"
                onClick={() => openEditUnit(unit)}
                className="w-full text-left min-h-[44px] flex items-center gap-2 font-bold mb-3"
                style={{ color: 'var(--text)' }}
              >
                <Thermometer className="w-5 h-5 shrink-0" style={{ color: 'var(--navy)' }} />
                {unit.name}
              </button>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1">
                {weekDays.map((d) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  return (
                    <div
                      key={dateStr}
                      className="shrink-0 w-[72px] flex flex-col gap-1"
                    >
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {format(d, 'dd/MM')}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          step="0.1"
                          className="glass-input w-full min-h-[44px] px-2 rounded-xl text-center text-sm"
                          style={{ color: 'var(--text)' }}
                          placeholder="—"
                          aria-label={`${unit.name} ${format(d, 'd MMM')} °C`}
                          value={getRecord(unit.id, dateStr)}
                          onChange={(e) =>
                            setRecord(unit.id, dateStr, e.target.value)
                          }
                        />
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>°C</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setNotesExpanded((x) => !x)}
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 card rounded-2xl shadow-sm text-left"
        >
          <span className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <FileText className="w-5 h-5" style={{ color: 'var(--navy)' }} />
            Daily Notes
          </span>
          {notesExpanded ? (
            <ChevronUp className="w-5 h-5 shrink-0" style={{ color: 'var(--text)' }} />
          ) : (
            <ChevronDown className="w-5 h-5 shrink-0" style={{ color: 'var(--text)' }} />
          )}
        </button>
        {notesExpanded && (
          <div className="mt-2 space-y-2">
            {weekDays.map((d) => {
              const dateStr = format(d, 'yyyy-MM-dd');
              const note = getNote(dateStr);
              const isExpanded = expandedDay === dateStr;
              return (
                <div key={dateStr} className="card rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDay((prev) => (prev === dateStr ? null : dateStr))
                    }
                    className="w-full flex items-center justify-between min-h-[44px] px-4 py-3 text-left"
                  >
                    <span className="font-medium" style={{ color: 'var(--text)' }}>
                      {format(d, 'EEEE d MMM')}
                      {note && (
                        <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          ({note.recorder})
                        </span>
                      )}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 shrink-0" style={{ color: 'var(--text)' }} />
                    ) : (
                      <ChevronDown className="w-5 h-5 shrink-0" style={{ color: 'var(--text)' }} />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'var(--border)' }}>
                      <textarea
                        className="glass-input w-full mt-3 px-4 py-3 min-h-[88px] rounded-xl resize-y"
                        style={{ color: 'var(--text)' }}
                        placeholder="Add notes for this day..."
                        value={note?.note ?? ''}
                        onChange={(e) => setNote(dateStr, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openAddUnit}
        className="fab"
        aria-label="Add fridge or chiller unit"
      >
        <Plus className="w-7 h-7" />
      </button>

      {unitSheetOpen && (
        <>
          <div
            className="sheet-overlay"
            onClick={() => setUnitSheetOpen(false)}
            aria-hidden
          />
          <div className="sheet p-6">
            <div className="sheet-handle" />
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              {editingUnit ? 'Edit Unit' : 'Add Unit'}
            </h3>
            <input
              type="text"
              className="glass-input w-full min-h-[44px] px-4 rounded-xl mb-4"
              style={{ color: 'var(--text)' }}
              placeholder="Unit name (e.g. Main Fridge)"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              {editingUnit && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this unit and all its records?')) {
                      deleteUnit(editingUnit.id);
                    }
                  }}
                  className="min-h-[44px] px-4 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => setUnitSheetOpen(false)}
                className="btn-outline min-h-[44px] px-4 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveUnit}
                className="btn-primary min-h-[44px] px-4 rounded-xl"
              >
                {editingUnit ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </>
      )}

      {bulkSheetOpen && (
        <>
          <div
            className="sheet-overlay"
            onClick={() => setBulkSheetOpen(false)}
            aria-hidden
          />
          <div className="sheet p-6">
            <div className="sheet-handle" />
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Bulk Update</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="bulk-unit" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Unit</label>
                <select
                  id="bulk-unit"
                  aria-label="Select unit for bulk update"
                  className="glass-input w-full min-h-[44px] px-4 rounded-xl"
                  style={{ color: 'var(--text)' }}
                  value={bulkUnitId}
                  onChange={(e) => setBulkUnitId(e.target.value)}
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="bulk-start" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Start date
                </label>
                <input
                  id="bulk-start"
                  type="date"
                  aria-label="Bulk update start date"
                  className="glass-input w-full min-h-[44px] px-4 rounded-xl"
                  style={{ color: 'var(--text)' }}
                  value={bulkStart}
                  onChange={(e) => setBulkStart(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bulk-end" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  End date
                </label>
                <input
                  id="bulk-end"
                  type="date"
                  aria-label="Bulk update end date"
                  className="glass-input w-full min-h-[44px] px-4 rounded-xl"
                  style={{ color: 'var(--text)' }}
                  value={bulkEnd}
                  onChange={(e) => setBulkEnd(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bulk-temp" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Temperature (°C)
                </label>
                <input
                  id="bulk-temp"
                  type="number"
                  step="0.1"
                  aria-label="Temperature in degrees Celsius"
                  className="glass-input w-full min-h-[44px] px-4 rounded-xl"
                  style={{ color: 'var(--text)' }}
                  placeholder="e.g. 4"
                  value={bulkTemp}
                  onChange={(e) => setBulkTemp(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                onClick={() => setBulkSheetOpen(false)}
                className="btn-outline min-h-[44px] px-4 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyBulk}
                className="btn-primary min-h-[44px] px-4 rounded-xl"
              >
                Apply to All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
