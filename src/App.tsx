import { useState, useEffect, useCallback } from 'react';
import { Thermometer, ClipboardCheck, SprayCan, Users, MoreHorizontal, MessageSquareWarning, AlertTriangle, CalendarCheck, User, X, ChevronRight, Menu, Moon, Sun } from 'lucide-react';
import { loadStr, saveStr } from './lib/storage';
import TemperatureChecks from './components/TemperatureChecks';
import DailyDiary from './components/DailyDiary';
import CleaningMaintenance from './components/CleaningMaintenance';
import StaffTraining from './components/StaffTraining';
import CustomerComplaints from './components/CustomerComplaints';
import Incidents from './components/Incidents';
import FourWeekReview from './components/FourWeekReview';

type Tab = 'home' | 'temps' | 'diary' | 'cleaning' | 'staff' | 'complaints' | 'incidents' | 'review';

const ALL_TABS: { id: Tab; label: string; short: string; icon: typeof Thermometer; desc: string }[] = [
  { id: 'home', label: 'Home', short: 'Home', icon: ClipboardCheck, desc: 'Dashboard' },
  { id: 'temps', label: 'Temperature Log', short: 'Temps', icon: Thermometer, desc: 'Fridge & chiller checks' },
  { id: 'diary', label: 'Daily Diary', short: 'Diary', icon: ClipboardCheck, desc: 'Opening & closing checks' },
  { id: 'cleaning', label: 'Cleaning', short: 'Cleaning', icon: SprayCan, desc: 'Cleaning & maintenance' },
  { id: 'staff', label: 'Staff', short: 'Staff', icon: Users, desc: 'Staff & training records' },
  { id: 'complaints', label: 'Complaints', short: 'Complaints', icon: MessageSquareWarning, desc: 'Customer complaints' },
  { id: 'incidents', label: 'Incidents', short: 'Incidents', icon: AlertTriangle, desc: 'When things go wrong' },
  { id: 'review', label: '4-Week Review', short: 'Review', icon: CalendarCheck, desc: 'Periodic FCP review' },
];

const MOBILE_BAR: Tab[] = ['home', 'temps', 'diary', 'cleaning', 'staff'];
const MORE_IDS: Tab[] = ['complaints', 'incidents', 'review'];

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [recorder, setRecorder] = useState(() => loadStr('cafe-recorder'));
  const [moreOpen, setMoreOpen] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => loadStr('cafe-theme') === 'dark');
  const [themeAnim, setThemeAnim] = useState(false);
  const [animTarget, setAnimTarget] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    saveStr('cafe-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggleTheme = useCallback(() => {
    const next = !dark;
    setAnimTarget(next);
    setThemeAnim(true);
    setTimeout(() => setDark(next), 350);
    setTimeout(() => setThemeAnim(false), 1100);
  }, [dark]);

  const updateRecorder = (v: string) => { setRecorder(v); saveStr('cafe-recorder', v); };
  const go = (t: Tab) => { setTab(t); setMoreOpen(false); setSidebarOpen(false); };
  const isMore = MORE_IDS.includes(tab);
  const cur = ALL_TABS.find(t => t.id === tab)!;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* === DESKTOP SIDEBAR === */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 fixed top-0 left-0 bottom-0 z-40" style={{ background: 'var(--bg-sidebar)', boxShadow: '2px 0 8px rgba(0,0,0,0.04)', transition: 'background 0.3s' }}>
        <div className="px-5 py-5 flex items-center gap-3">
          <img src="/images/logo.png" alt="Majestic" className="w-10 h-10 rounded-full" style={{ border: '2px solid var(--gold)' }} />
          <div>
            <h1 className="text-[15px] font-medium tracking-[3px] italic" style={{ color: 'var(--navy)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>MAJESTIC</h1>
            <p className="text-[10px] tracking-wider" style={{ color: 'var(--gold)' }}>FOOD CONTROL PLAN</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2" style={{ background: 'var(--sidebar-nav-bg)' }}>
          {ALL_TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => go(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-all"
                style={active
                  ? { background: 'var(--bg-card)', color: 'var(--text-nav-active)', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
                  : { color: 'var(--text-nav)' }
                }
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Icon size={16} style={{ color: active ? 'var(--navy)' : 'var(--text-faint)' }} />
                <span className="text-[13px]">{t.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--navy)' }} />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 space-y-3">
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-1 py-1 rounded text-left transition-all"
            style={{ color: 'var(--text-muted)' }}>
            <span className="theme-icon inline-block">{dark ? <Sun size={15} /> : <Moon size={15} />}</span>
            <span className="text-[12px] font-medium">{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--navy)' }}>
              <User size={12} color="white" />
            </div>
            <input type="text" value={recorder} onChange={e => updateRecorder(e.target.value)}
              className="flex-1 bg-transparent text-[13px] font-medium outline-none min-w-0" style={{ color: 'var(--text)' }}
              placeholder="Your name" />
          </div>
        </div>
      </aside>

      {/* === MOBILE SIDEBAR === */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-50 md:hidden" style={{ background: 'var(--overlay)' }} onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 w-72 z-50 md:hidden flex flex-col" style={{ background: 'var(--bg-sidebar)', animation: 'slideRight 0.2s ease' }}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="Majestic" className="w-9 h-9 rounded-full" style={{ border: '2px solid var(--gold)' }} />
                <span className="text-[15px] font-medium tracking-[3px] italic" style={{ color: 'var(--navy)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>MAJESTIC</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2" style={{ color: 'var(--text-faint)' }}><X size={18} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2" style={{ background: 'var(--sidebar-nav-bg)' }}>
              {ALL_TABS.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => go(t.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                    style={active
                      ? { background: 'var(--bg-card)', color: 'var(--text-nav-active)', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
                      : { color: 'var(--text-nav)' }
                    }>
                    <Icon size={18} style={{ color: active ? 'var(--navy)' : 'var(--text-faint)' }} />
                    <span className="text-sm">{t.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 space-y-3">
              <button onClick={toggleTheme} className="flex items-center gap-2.5" style={{ color: 'var(--text-muted)' }}>
                <span className="theme-icon inline-block">{dark ? <Sun size={16} /> : <Moon size={16} />}</span>
                <span className="text-sm font-medium">{dark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <div className="flex items-center gap-2">
                <User size={16} style={{ color: 'var(--navy)' }} />
                <input type="text" value={recorder} onChange={e => updateRecorder(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium outline-none" style={{ color: 'var(--text)' }}
                  placeholder="Your name" />
              </div>
            </div>
          </aside>
        </>
      )}

      {/* === MAIN === */}
      <div className="flex-1 md:ml-60 lg:ml-64 min-h-screen flex flex-col">

        {/* Mobile Header */}
        <div className="sticky top-0 z-30 md:hidden" style={{ background: dark ? 'var(--bg-sidebar)' : '#002e6d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', paddingTop: 'max(4px, env(safe-area-inset-top))' }}>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-1 -ml-1" style={{ color: dark ? 'var(--text-muted)' : 'rgba(255,255,255,0.8)' }}><Menu size={20} /></button>
              <img src="/images/logo.png" alt="Majestic" className="w-7 h-7 rounded-full" style={{ border: `1.5px solid ${dark ? 'var(--gold)' : '#b8a472'}` }} />
              <span className="text-sm font-medium tracking-[2px] italic" style={{ color: dark ? 'var(--navy)' : 'white', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>MAJESTIC</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-1.5 rounded" style={{ color: dark ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)' }}>
                <span className="theme-icon inline-block">{dark ? <Sun size={16} /> : <Moon size={16} />}</span>
              </button>
              <button onClick={() => setNameEditing(!nameEditing)} className="flex items-center gap-1.5 rounded px-2 py-1.5"
                style={{ border: dark ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)' }}>
                <User size={13} style={{ color: dark ? 'var(--text-faint)' : 'rgba(255,255,255,0.6)' }} />
                <span className="text-xs font-medium truncate max-w-[60px]" style={{ color: dark ? 'var(--text-muted)' : 'rgba(255,255,255,0.9)' }}>{recorder || 'Name'}</span>
              </button>
            </div>
          </div>
          {nameEditing && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <input type="text" value={recorder} onChange={e => updateRecorder(e.target.value)} autoFocus
                className="glass-input flex-1 px-3 py-2 text-sm"
                style={dark ? {} : { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
                placeholder="Enter your name" />
              <button onClick={() => setNameEditing(false)} className="p-2" style={{ color: dark ? 'var(--text-faint)' : 'rgba(255,255,255,0.6)' }}><X size={16} /></button>
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-6 lg:px-8 py-5" style={{ background: 'var(--bg-card)', transition: 'background 0.3s' }}>
          <div>
            <h2 className="text-base lg:text-lg font-semibold" style={{ color: 'var(--navy)' }}>{cur.label}</h2>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{cur.desc}</p>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>
            {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 content-area-mobile" style={{ background: 'var(--bg-content)', transition: 'background 0.3s' }}>
          <div className="max-w-4xl mx-auto">

            {tab === 'home' && (
              <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4">
                <div className="card p-5 md:p-6 mb-6 text-center">
                  <img src="/images/logo.png" alt="Majestic" className="w-16 h-16 rounded-full mx-auto mb-3" style={{ border: '2px solid var(--gold)' }} />
                  <h2 className="text-xl font-medium tracking-[3px] italic" style={{ color: 'var(--navy)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>MAJESTIC</h2>
                  <p className="text-xs tracking-widest mt-1" style={{ color: 'var(--gold)' }}>TEA BAR</p>
                  <div className="divider my-4 mx-auto max-w-[200px]" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-base font-semibold mt-1" style={{ color: 'var(--text)' }}>
                    {recorder ? `Hello, ${recorder}` : 'Welcome'}
                  </p>
                  {!recorder && (
                    <button onClick={() => setNameEditing(true)} className="btn-outline mt-3 px-5 py-2 text-xs">Set Your Name</button>
                  )}
                </div>

                <p className="text-[11px] font-semibold tracking-[1.5px] uppercase mb-3" style={{ color: 'var(--gold)' }}>Sections</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {ALL_TABS.filter(q => q.id !== 'home').map(q => {
                    const Icon = q.icon;
                    return (
                      <button key={q.id} onClick={() => go(q.id)}
                        className="card w-full flex items-center gap-3.5 p-4 text-left active:scale-[0.99] transition-transform">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-hover)' }}>
                          <Icon size={18} style={{ color: 'var(--navy)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold" style={{ color: 'var(--navy)' }}>{q.label}</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{q.desc}</p>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--text-faint)' }} className="flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'temps' && <TemperatureChecks recorder={recorder} />}
            {tab === 'diary' && <DailyDiary recorder={recorder} />}
            {tab === 'cleaning' && <CleaningMaintenance recorder={recorder} />}
            {tab === 'staff' && <StaffTraining recorder={recorder} />}
            {tab === 'complaints' && <CustomerComplaints recorder={recorder} />}
            {tab === 'incidents' && <Incidents recorder={recorder} />}
            {tab === 'review' && <FourWeekReview recorder={recorder} />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="bottom-bar md:hidden no-print">
        <div className="flex items-center justify-around">
          {MOBILE_BAR.map(id => {
            const t = ALL_TABS.find(x => x.id === id)!;
            const Icon = t.icon;
            const active = tab === id;
            return (
              <button key={id} onClick={() => go(id)} className="bottom-bar-item" style={active ? { color: 'var(--text-nav-active)' } : {}}>
                <div className="bar-icon" style={active ? { background: 'var(--bg-hover)' } : {}}><Icon size={18} /></div>
                <span>{t.short}</span>
              </button>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className="bottom-bar-item" style={isMore ? { color: 'var(--text-nav-active)' } : {}}>
            <div className="bar-icon" style={isMore ? { background: 'var(--bg-hover)' } : {}}><MoreHorizontal size={18} /></div>
            <span>More</span>
          </button>
        </div>
      </div>

      {/* More Sheet */}
      {moreOpen && (
        <>
          <div className="sheet-overlay md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="sheet md:hidden">
            <div className="sheet-handle" />
            <div className="p-5 pt-2">
              <p className="text-[11px] font-semibold tracking-[1.5px] uppercase mb-3" style={{ color: 'var(--gold)' }}>More Sections</p>
              <div className="space-y-2">
                {MORE_IDS.map(id => {
                  const t = ALL_TABS.find(x => x.id === id)!;
                  const Icon = t.icon;
                  const active = tab === id;
                  return (
                    <button key={id} onClick={() => go(id)}
                      className="card w-full flex items-center gap-3.5 p-4 text-left active:scale-[0.99] transition-all"
                      style={active ? { background: 'var(--bg-hover)', borderColor: 'var(--border-check-active)' } : {}}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: active ? 'var(--bg-hover)' : 'var(--bg-alt)' }}>
                        <Icon size={18} style={{ color: active ? 'var(--navy)' : 'var(--text-faint)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: active ? 'var(--navy)' : 'var(--text)' }}>{t.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Theme Transition Animation */}
      {themeAnim && (
        <>
          {/* Full screen wipe */}
          <div
            className="theme-wipe"
            style={{ background: animTarget ? '#0f1419' : '#ffffff' }}
          />

          {/* Center stage */}
          <div className="theme-stage">
            {/* Glow ring */}
            <div className="theme-glow" style={{ borderColor: animTarget ? '#d4c9a0' : '#b8a472' }} />

            {/* Rays / Stars behind icon */}
            <svg className="theme-rays-svg" viewBox="0 0 200 200">
              {animTarget
                ? <>
                    {[[40,30],[160,25],[25,140],[170,155],[100,15],[60,170],[15,90],[185,100],[130,20],[70,180],[20,60],[180,140]].map(([cx,cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.5 : 1.5} fill="#d4c9a0" className="theme-star" style={{ animationDelay: `${0.3 + i * 0.04}s` }} />
                    ))}
                  </>
                : [...Array(12)].map((_, i) => (
                    <line key={i} x1="100" y1="12" x2="100" y2="32" stroke="#b8a472" strokeWidth="2.5" strokeLinecap="round"
                      transform={`rotate(${i * 30} 100 100)`} className="theme-ray-line" style={{ animationDelay: `${0.25 + i * 0.03}s` }} />
                  ))
              }
            </svg>

            {/* Particles */}
            <div className="theme-particles">
              {[
                { x: 80, y: -90 }, { x: -70, y: -80 }, { x: 95, y: 60 }, { x: -85, y: 75 },
                { x: 40, y: -110 }, { x: -100, y: -20 }, { x: 110, y: 20 }, { x: -40, y: 100 },
                { x: 60, y: 85 }, { x: -55, y: -95 }, { x: -90, y: 50 }, { x: 75, y: -60 },
              ].map((p, i) => (
                <div key={i} className="theme-dot"
                  style={{
                    background: animTarget ? '#d4c9a0' : '#b8a472',
                    '--tx': `${p.x}px`, '--ty': `${p.y}px`,
                    animationDelay: `${0.28 + i * 0.03}s`,
                    width: i % 3 === 0 ? '6px' : '4px',
                    height: i % 3 === 0 ? '6px' : '4px',
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="theme-icon-main" style={{ color: animTarget ? '#d4c9a0' : '#b8a472' }}>
              {animTarget ? <Moon size={52} strokeWidth={1.5} /> : <Sun size={52} strokeWidth={1.5} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;