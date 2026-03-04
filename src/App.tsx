import { useState, useEffect, useCallback } from 'react';
import { Thermometer, ClipboardCheck, SprayCan, Users, MoreHorizontal, MessageSquareWarning, AlertTriangle, CalendarCheck, User, X, Menu, Moon, Sun, Truck, Flame, Snowflake, ShieldAlert } from 'lucide-react';
import { loadStr, saveStr } from './lib/storage';
import TempLogApp from './temp-log/TempLogApp';
import DailyDiary from './components/DailyDiary';
import CleaningMaintenance from './components/CleaningMaintenance';
import StaffTraining from './components/StaffTraining';
import CustomerComplaints from './components/CustomerComplaints';
import Incidents from './components/Incidents';
import FourWeekReview from './components/FourWeekReview';
import SuppliersDeliveries from './components/SuppliersDeliveries';
import AllergenRegister from './components/AllergenRegister';
import CookingValidation from './components/CookingValidation';
import CoolingRecords from './components/CoolingRecords';
import Calibration from './components/Calibration';

type Tab = 'home' | 'temps' | 'diary' | 'cleaning' | 'staff' | 'suppliers' | 'allergens' | 'cooking' | 'cooling' | 'calibration' | 'complaints' | 'incidents' | 'review';

const ALL_TABS: { id: Tab; label: string; short: string; icon: typeof Thermometer; desc: string }[] = [
  { id: 'home', label: 'Home', short: 'Home', icon: ClipboardCheck, desc: 'Dashboard' },
  { id: 'temps', label: 'Temperature Log', short: 'Temps', icon: Thermometer, desc: 'Fridge & chiller checks' },
  { id: 'diary', label: 'Daily Diary', short: 'Diary', icon: ClipboardCheck, desc: 'Opening & closing checks' },
  { id: 'cleaning', label: 'Cleaning', short: 'Cleaning', icon: SprayCan, desc: 'Cleaning & maintenance' },
  { id: 'staff', label: 'Staff', short: 'Staff', icon: Users, desc: 'Staff & training records' },
  { id: 'suppliers', label: 'Suppliers', short: 'Suppliers', icon: Truck, desc: 'Suppliers & delivery records' },
  { id: 'allergens', label: 'Allergens', short: 'Allergens', icon: ShieldAlert, desc: 'Allergen register' },
  { id: 'cooking', label: 'Cooking', short: 'Cooking', icon: Flame, desc: 'Cooking process validation' },
  { id: 'cooling', label: 'Cooling', short: 'Cooling', icon: Snowflake, desc: 'Cooling temperature records' },
  { id: 'calibration', label: 'Calibration', short: 'Calibrate', icon: Thermometer, desc: 'Thermometer calibration' },
  { id: 'complaints', label: 'Complaints', short: 'Complaints', icon: MessageSquareWarning, desc: 'Customer complaints' },
  { id: 'incidents', label: 'Incidents', short: 'Incidents', icon: AlertTriangle, desc: 'When things go wrong' },
  { id: 'review', label: '4-Week Review', short: 'Review', icon: CalendarCheck, desc: 'Periodic FCP review' },
];

const MOBILE_BAR: Tab[] = ['home', 'temps', 'diary', 'cleaning', 'staff'];
const MORE_IDS: Tab[] = ['suppliers', 'allergens', 'cooking', 'cooling', 'calibration', 'complaints', 'incidents', 'review'];

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
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Majestic" className="w-10 h-10 rounded-full" style={{ border: '2px solid var(--gold)' }} />
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
            <div className="p-4 flex items-center justify-between" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
              <div className="flex items-center gap-3">
                <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Majestic" className="w-9 h-9 rounded-full" style={{ border: '2px solid var(--gold)' }} />
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

        {/* Mobile Header (hidden on home) */}
        <div className={`sticky top-0 z-30 md:hidden ${tab === 'home' ? 'hidden' : ''}`} style={{ background: dark ? 'var(--bg-sidebar)' : '#002e6d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', paddingTop: 'max(4px, env(safe-area-inset-top))' }}>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-1 -ml-1" style={{ color: dark ? 'var(--text-muted)' : 'rgba(255,255,255,0.8)' }}><Menu size={20} /></button>
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Majestic" className="w-7 h-7 rounded-full" style={{ border: `1.5px solid ${dark ? 'var(--gold)' : '#b8a472'}` }} />
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

        {/* Desktop Header (hidden on home) */}
        {tab !== 'home' && (
          <div className="hidden md:flex items-center justify-between px-6 lg:px-8 py-5" style={{ background: 'var(--bg-card)', transition: 'background 0.3s' }}>
            <div>
              <h2 className="text-base lg:text-lg font-semibold" style={{ color: 'var(--navy)' }}>{cur.label}</h2>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{cur.desc}</p>
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>
              {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 ${tab !== 'home' ? 'content-area-mobile' : ''}`} style={{ background: tab === 'home' ? 'transparent' : 'var(--bg-content)', transition: 'background 0.3s' }}>
          <div className="max-w-4xl mx-auto">

            {tab === 'home' && (
              <div className="splash" style={{ background: dark
                ? 'linear-gradient(160deg, #0a0e14 0%, #0f1419 40%, #141c24 70%, #0d1117 100%)'
                : 'linear-gradient(160deg, #f8f7f4 0%, #ffffff 40%, #f5f4f1 70%, #f0efec 100%)'
              }}>
                {/* Menu top-left */}
                <button onClick={() => setSidebarOpen(true)} className="absolute left-3 p-3 rounded-xl md:hidden splash-in"
                  style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,46,109,0.3)', animationDelay: '1.5s', top: 'max(12px, env(safe-area-inset-top, 12px))' }}>
                  <Menu size={20} />
                </button>

                {/* Theme toggle top-right */}
                <button onClick={toggleTheme} className="absolute right-3 p-3 rounded-xl splash-in"
                  style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,46,109,0.3)', animationDelay: '1.5s', top: 'max(12px, env(safe-area-inset-top, 12px))' }}>
                  <span className="theme-icon">{dark ? <Sun size={18} /> : <Moon size={18} />}</span>
                </button>

                {/* Original Logo */}
                <div className="splash-in mb-6" style={{ animationDelay: '0.2s' }}>
                  <div className="logo-ring rounded-full">
                    <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Majestic"
                      className="w-28 h-28 md:w-32 md:h-32 rounded-full"
                      style={{ border: '3px solid #b8a472', boxShadow: dark ? '0 0 40px rgba(184,164,114,0.2)' : '0 0 40px rgba(0,46,109,0.1)' }} />
                  </div>
                </div>

                {/* Brand name */}
                <h1 className="splash-in text-2xl sm:text-3xl md:text-4xl font-medium tracking-[5px] sm:tracking-[8px] italic"
                  style={{ color: dark ? 'white' : '#002e6d', fontFamily: "'Cormorant Garamond', Georgia, serif", animationDelay: '0.6s' }}>
                  MAJESTIC
                </h1>

                <p className="splash-in text-xs tracking-[4px] mt-2" style={{ color: '#b8a472', animationDelay: '0.8s' }}>
                  TEA BAR
                </p>

                {/* Shimmer divider */}
                <div className="splash-in shimmer w-20 h-[2px] my-6" style={{ animationDelay: '1s' }} />

                {/* Subtitle */}
                <p className="splash-in text-sm tracking-wider" style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,46,109,0.4)', animationDelay: '1.1s' }}>
                  Food Control Plan
                </p>

                {/* Date */}
                <p className="splash-in text-sm mt-3 font-medium" style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', animationDelay: '1.2s' }}>
                  {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {/* Name */}
                <div className="splash-in mt-8 w-full max-w-[min(20rem,calc(100vw-3rem))]" style={{ animationDelay: '1.3s' }}>
                  <p className="text-[10px] font-semibold tracking-[2px] uppercase text-center mb-2.5"
                    style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,46,109,0.35)' }}>
                    Who's Recording?
                  </p>
                  <input type="text" value={recorder} onChange={e => updateRecorder(e.target.value)}
                    className="w-full text-center py-3.5 px-4 rounded-2xl text-base font-medium outline-none"
                    style={{
                      background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,46,109,0.04)',
                      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,46,109,0.12)',
                      color: dark ? 'white' : '#002e6d',
                    }}
                    placeholder="Enter your name" />
                </div>

                {/* CTA */}
                <button onClick={() => go('temps')}
                  className="splash-in mt-8 px-12 py-4 rounded-2xl text-base font-bold tracking-wider active:scale-[0.97] transition-transform"
                  style={{
                    background: dark ? 'rgba(212,201,160,0.15)' : '#002e6d',
                    color: dark ? '#b8a472' : 'white',
                    border: dark ? '1.5px solid rgba(184,164,114,0.4)' : '1.5px solid #002e6d',
                    boxShadow: dark ? '0 0 30px rgba(184,164,114,0.1)' : '0 4px 20px rgba(0,46,109,0.25)',
                    animationDelay: '1.5s',
                  }}>
                  Start Logging
                </button>

                {/* Quick links */}
                <div className="splash-in flex flex-wrap justify-center gap-2.5 mt-8" style={{ animationDelay: '1.7s' }}>
                  {[
                    { id: 'diary' as Tab, label: 'Diary', icon: ClipboardCheck },
                    { id: 'cleaning' as Tab, label: 'Cleaning', icon: SprayCan },
                    { id: 'staff' as Tab, label: 'Staff', icon: Users },
                    { id: 'suppliers' as Tab, label: 'Suppliers', icon: Truck },
                    { id: 'allergens' as Tab, label: 'Allergens', icon: ShieldAlert },
                    { id: 'cooking' as Tab, label: 'Cooking', icon: Flame },
                    { id: 'cooling' as Tab, label: 'Cooling', icon: Snowflake },
                    { id: 'calibration' as Tab, label: 'Calibration', icon: Thermometer },
                    { id: 'complaints' as Tab, label: 'Complaints', icon: MessageSquareWarning },
                    { id: 'incidents' as Tab, label: 'Incidents', icon: AlertTriangle },
                    { id: 'review' as Tab, label: 'Review', icon: CalendarCheck },
                  ].map(q => {
                    const Icon = q.icon;
                    return (
                      <button key={q.id} onClick={() => go(q.id)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold active:scale-[0.96] transition-all"
                        style={{
                          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,46,109,0.04)',
                          border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,46,109,0.1)',
                          color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,46,109,0.5)',
                        }}>
                        <Icon size={13} /> {q.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'temps' && <TempLogApp recorder={recorder} />}
            {tab === 'diary' && <DailyDiary recorder={recorder} />}
            {tab === 'cleaning' && <CleaningMaintenance recorder={recorder} />}
            {tab === 'staff' && <StaffTraining recorder={recorder} />}
            {tab === 'suppliers' && <SuppliersDeliveries recorder={recorder} />}
            {tab === 'allergens' && <AllergenRegister recorder={recorder} />}
            {tab === 'cooking' && <CookingValidation recorder={recorder} />}
            {tab === 'cooling' && <CoolingRecords recorder={recorder} />}
            {tab === 'calibration' && <Calibration recorder={recorder} />}
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