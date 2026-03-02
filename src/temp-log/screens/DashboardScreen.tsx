import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ArrowLeft, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTempLog } from '../TempLogContext';
import { SimpleChart } from '../SimpleChart';

export function DashboardScreen() {
  const { units, getTemp, getTempStatus, setScreen } = useTempLog();
  const [period, setPeriod] = useState(7);

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: period }, (_, i) => {
      const d = subDays(today, period - 1 - i);
      const ds = format(d, 'yyyy-MM-dd');
      const values: Record<string, number | null> = {};
      units.forEach(u => {
        const t = getTemp(u.id, ds);
        values[u.id] = t ? parseFloat(t) : null;
      });
      return { date: ds, label: format(d, period <= 7 ? 'EEE' : 'dd/MM'), values };
    });
  }, [units, getTemp, period]);

  const stats = useMemo(() => {
    const today = new Date();
    let totalSlots = 0, logged = 0, outOfRange = 0;
    const unitAvgs: { name: string; avg: number | null; count: number }[] = [];
    units.forEach(u => {
      let sum = 0, cnt = 0;
      for (let i = 0; i < period; i++) {
        const ds = format(subDays(today, i), 'yyyy-MM-dd');
        totalSlots++;
        const t = getTemp(u.id, ds);
        if (t) { logged++; const v = parseFloat(t); if (!isNaN(v)) { sum += v; cnt++; } if (getTempStatus(u, t) === 'warn') outOfRange++; }
      }
      unitAvgs.push({ name: u.name, avg: cnt > 0 ? Math.round((sum / cnt) * 10) / 10 : null, count: cnt });
    });
    return { compliance: totalSlots > 0 ? Math.round((logged / totalSlots) * 100) : 0, logged, totalSlots, outOfRange, unitAvgs };
  }, [units, getTemp, getTempStatus, period]);

  return (
    <div className="p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen('landing')} className="p-3 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }} title="Back"><ArrowLeft size={22} /></button>
          <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>Dashboard</h2>
          <div />
        </div>

        <div className="flex gap-2 mb-4">
          {[7, 14, 30].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-bold transition-all ${p === period ? 'btn-primary' : 'btn-outline'}`}>
              {p} Days
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold" style={{ color: stats.compliance >= 80 ? '#34d399' : '#f59e0b' }}>{stats.compliance}%</div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Compliance</div>
          </div>
          <div className="card rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{stats.logged}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Readings</div>
          </div>
          <div className="card rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold" style={{ color: stats.outOfRange > 0 ? '#f59e0b' : '#34d399' }}>{stats.outOfRange}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Out of Range</div>
          </div>
        </div>

        <div className="card rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} style={{ color: 'var(--navy)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--navy)' }}>Temperature Trends</span>
          </div>
          <SimpleChart data={chartData} unitNames={units.map(u => ({ id: u.id, name: u.name }))} height={220} />
        </div>

        <div className="card rounded-2xl overflow-hidden mb-4 shadow-sm">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--navy)' }}>Unit Averages ({period} days)</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {stats.unitAvgs.map(ua => (
              <div key={ua.name} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm truncate min-w-0" style={{ color: 'var(--text)' }}>{ua.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({ua.count} readings)</span>
                </div>
                <span className="font-bold" style={{ color: 'var(--navy)' }}>{ua.avg !== null ? `${ua.avg}°C` : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {stats.outOfRange > 0 && (
          <div className="card rounded-2xl overflow-hidden mb-4 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-sm font-bold text-amber-600">Out-of-Range Events</span>
            </div>
            <div className="divide-y max-h-48 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {(() => {
                const today = new Date();
                const events: { unit: string; date: string; temp: string }[] = [];
                for (let i = 0; i < period; i++) {
                  const d = subDays(today, i);
                  const ds = format(d, 'yyyy-MM-dd');
                  units.forEach(u => {
                    const t = getTemp(u.id, ds);
                    if (t && getTempStatus(u, t) === 'warn') events.push({ unit: u.name, date: format(d, 'EEE dd/MM'), temp: t });
                  });
                }
                return events.map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={12} className="text-amber-400" />
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{e.unit}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.date}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-600">{e.temp}°C</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
