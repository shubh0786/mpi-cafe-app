import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  periodStart: string;
  periodEnd: string;
  answers: Record<string, boolean>;
  details: Record<string, string>;
  councilApproval: boolean;
  councilNotes: string;
  signedBy: string;
  date: string;
}

const STORAGE_KEY = 'cafe-reviews';

const QUESTIONS = [
  { key: 'q1', text: 'Same thing went wrong 3+ times?' },
  { key: 'q2', text: 'Any customer complaints?' },
  { key: 'q3', text: 'Any new food handlers?' },
  { key: 'q4', text: 'Have they been trained?' },
  { key: 'q5', text: 'Preparing any new types of food?' },
  { key: 'q6', text: 'Any new suppliers?' },
  { key: 'q7', text: 'Any new or different equipment?' },
  { key: 'q8', text: 'Any other significant changes?' },
  { key: 'q9', text: 'Food Control Plan updated?' },
];

function emptyReview(recorder: string): Omit<Review, 'id'> {
  return {
    periodStart: format(new Date(), 'yyyy-MM-dd'),
    periodEnd: format(new Date(), 'yyyy-MM-dd'),
    answers: Object.fromEntries(QUESTIONS.map((q) => [q.key, false])),
    details: Object.fromEntries(QUESTIONS.map((q) => [q.key, ''])),
    councilApproval: false,
    councilNotes: '',
    signedBy: recorder,
    date: format(new Date(), 'yyyy-MM-dd'),
  };
}

export default function FourWeekReview({ recorder }: { recorder: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [form, setForm] = useState(emptyReview(recorder));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setReviews(load<Review[]>(STORAGE_KEY, []));
  }, []);

  const openSheet = () => {
    setForm(emptyReview(recorder));
    setShowSheet(true);
  };

  const saveReview = () => {
    if (!form.signedBy.trim()) return;
    const entry: Review = { id: crypto.randomUUID(), ...form };
    const updated = [entry, ...reviews];
    setReviews(updated);
    save(STORAGE_KEY, updated);
    setShowSheet(false);
  };

  const deleteReview = (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    save(STORAGE_KEY, updated);
  };

  const toggleAnswer = (key: string) => {
    setForm((f) => ({
      ...f,
      answers: { ...f.answers, [key]: !f.answers[key] },
      details: { ...f.details, [key]: !f.answers[key] ? f.details[key] : '' },
    }));
  };

  return (
    <div className="space-y-4 content-area">
      {reviews.length === 0 && (
        <div className="card rounded-2xl p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No reviews yet</p>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="card rounded-2xl p-4">
              <div
                className="flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>
                    {r.periodStart} — {r.periodEnd}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Signed by {r.signedBy} on {r.date}</p>
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
                <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                  {QUESTIONS.map((q) => (
                    <div key={q.key} className="flex items-start gap-2 text-sm">
                      <span
                        className="mt-0.5 px-2 py-0.5 rounded text-xs font-medium shrink-0"
                        style={r.answers[q.key]
                          ? { background: 'var(--bg-hover)', color: 'var(--navy)' }
                          : { background: 'var(--bg-alt)', color: 'var(--text-muted)' }
                        }
                      >
                        {r.answers[q.key] ? 'Yes' : 'No'}
                      </span>
                      <div className="flex-1">
                        <span style={{ color: 'var(--text-secondary)' }}>{q.text}</span>
                        {r.answers[q.key] && r.details[q.key] && (
                          <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.details[q.key]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {r.councilApproval && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-sm font-medium text-amber-700">Council approval required</p>
                      {r.councilNotes && <p className="text-xs text-amber-600 mt-1">{r.councilNotes}</p>}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteReview(r.id); }}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-red-500 bg-red-50 active:scale-[0.97] transition-all mt-2"
                  >
                    Delete Review
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={openSheet} className="fab" aria-label="Add new review">
        <Plus size={26} />
      </button>

      {showSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSheet(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Four-Week Review</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Period Start</label>
                  <input
                    type="date"
                    value={form.periodStart}
                    onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                    aria-label="Period Start"
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Period End</label>
                  <input
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                    aria-label="Period End"
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {QUESTIONS.map((q, i) => (
                  <div key={q.key}>
                    <div className="flex items-center justify-between gap-3 py-2">
                      <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
                        <span className="mr-1" style={{ color: 'var(--text-faint)' }}>{i + 1}.</span> {q.text}
                      </span>
                      <button
                        onClick={() => toggleAnswer(q.key)}
                        className={`toggle ${form.answers[q.key] ? 'on' : ''}`}
                        aria-label={`Toggle ${q.text}`}
                      />
                    </div>
                    {form.answers[q.key] && (
                      <textarea
                        value={form.details[q.key]}
                        onChange={(e) => setForm({ ...form, details: { ...form.details, [q.key]: e.target.value } })}
                        placeholder="Provide details..."
                        rows={2}
                        className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-y mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Council approval required?</span>
                  <button
                    onClick={() => setForm({ ...form, councilApproval: !form.councilApproval, councilNotes: form.councilApproval ? '' : form.councilNotes })}
                    className={`toggle ${form.councilApproval ? 'on' : ''}`}
                    aria-label="Toggle council approval"
                  />
                </div>
                {form.councilApproval && (
                  <textarea
                    value={form.councilNotes}
                    onChange={(e) => setForm({ ...form, councilNotes: e.target.value })}
                    placeholder="Notes on changes requiring approval..."
                    rows={2}
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-y mt-1"
                  />
                )}
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Signed By</label>
                  <input
                    type="text"
                    value={form.signedBy}
                    onChange={(e) => setForm({ ...form, signedBy: e.target.value })}
                    aria-label="Signed By"
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    aria-label="Date"
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSheet(false)} className="btn-outline flex-1 py-3 rounded-xl text-sm">
                  Cancel
                </button>
                <button onClick={saveReview} className="btn-primary flex-1 py-3 rounded-xl text-sm">
                  Save Review
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
