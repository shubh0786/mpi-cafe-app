import { useMemo } from 'react';
import { format } from 'date-fns';
import { Thermometer, ClipboardList, BarChart3, CalendarDays, Settings, ArrowRight, Plus } from 'lucide-react';
import { TempLogProvider, useTempLog } from './TempLogContext';
import { LoggingScreen } from './screens/LoggingScreen';
import { CompleteScreen } from './screens/CompleteScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { BackupRestoreModal } from './modals';
import { FridgeIllustration } from './visuals';
import { ACCENT } from './types';
import { useState } from 'react';

function LandingView() {
  const { units, records, recorder, setScreen } = useTempLog();
  const [showBackup, setShowBackup] = useState(false);

  const selectedDate = format(new Date(), 'yyyy-MM-dd');
  const dailyProgress = useMemo(() =>
    units.filter(u => {
      const t = records.find(r => r.unitId === u.id && r.date === selectedDate)?.temperature;
      return t !== undefined && t !== '';
    }).length,
  [units, records, selectedDate]);

  const pct = units.length > 0 ? Math.round((dailyProgress / units.length) * 100) : 0;

  return (
    <div className="p-4 pb-24" style={{ background: 'var(--bg-alt)' }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>Temperature Log</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          </div>
          <button onClick={() => setShowBackup(true)} className="p-3 rounded-xl transition-all" style={{ color: 'var(--text-faint)' }} title="Backup & Restore">
            <Settings size={18} />
          </button>
        </div>

        <div className="card rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-4">
            <FridgeIllustration size={60} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>Today's Progress</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{dailyProgress} of {units.length} units logged</p>
              <div className="w-full rounded-full h-2 mt-2 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: pct === 100 ? '#34d399' : `linear-gradient(90deg, ${ACCENT}, #1a4a8a)` }} />
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => setScreen('logging')}
          className="w-full card rounded-2xl p-4 mb-4 shadow-sm flex items-center justify-between text-left transition-all active:scale-[0.99]"
          style={{ borderColor: 'var(--navy)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
              <Thermometer size={20} color="white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
                {dailyProgress === units.length && units.length > 0 ? 'All Done! Log Again' : 'Start Logging'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {recorder ? `Recording as ${recorder}` : 'Step-by-step temperature entry'}
              </p>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--text-faint)' }} />
        </button>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { id: 'records' as const, label: 'Records', icon: ClipboardList, desc: 'View & edit' },
            { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3, desc: 'Analytics' },
            { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays, desc: 'Monthly view' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)}
                className="card rounded-2xl p-4 text-center shadow-sm transition-all active:scale-[0.97] min-h-[44px]">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--bg-alt)' }}>
                  <Icon size={18} style={{ color: 'var(--navy)' }} />
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{item.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{item.desc}</p>
              </button>
            );
          })}
        </div>

        {units.length === 0 && (
          <div className="card rounded-2xl p-6 text-center shadow-sm">
            <FridgeIllustration size={70} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No fridge/chiller units yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Start logging to add your first unit</p>
            <button onClick={() => setScreen('logging')} className="mt-3 btn-primary min-h-[44px] px-5 rounded-xl text-sm font-bold">
              <Plus size={16} className="inline mr-1.5" /> Get Started
            </button>
          </div>
        )}
      </div>

      {showBackup && <BackupRestoreModal onClose={() => setShowBackup(false)} />}
    </div>
  );
}

function TempLogRouter() {
  const { screen } = useTempLog();

  switch (screen) {
    case 'logging': return <LoggingScreen />;
    case 'complete': return <CompleteScreen />;
    case 'records': return <RecordsScreen />;
    case 'dashboard': return <DashboardScreen />;
    case 'calendar': return <CalendarScreen />;
    default: return <LandingView />;
  }
}

export default function TempLogApp({ recorder }: { recorder: string }) {
  return (
    <TempLogProvider recorder={recorder}>
      <TempLogRouter />
    </TempLogProvider>
  );
}
