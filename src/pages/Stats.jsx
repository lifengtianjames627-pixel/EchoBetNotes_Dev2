import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, TrendingDown, Users, PenLine, Disc3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';

// Admin-only analytics subpage (linked from the Moderation queue). A rising
// area chart of daily unique visitors over the last 30 days, plus a few
// headline counters. Visitor counts come from the trackVisit function, which
// the site Layout fires once per app load.
export default function Stats() {
  const navigate = useNavigate();
  const { t } = useLang();

  const { data: stats = [] } = useQuery({
    queryKey: ['daily-stats'],
    queryFn: () => base44.entities.DailyStat.list('-date', 60),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['stats-users'],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['stats-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 1000),
  });
  const { data: albums = [] } = useQuery({
    queryKey: ['stats-albums'],
    queryFn: () => base44.entities.Album.list('-created_date', 1000),
  });

  // Build a continuous 30-day axis, filling 0 for days with no record yet.
  const days = useMemo(() => {
    const byDate = new Map((stats || []).map(s => [s.date, s.visitors || 0]));
    // Match the visitor's own calendar day (the same timezone trackVisit uses),
    // not UTC — otherwise a +08:00 day shows up under the previous UTC date.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = fmt.format(d);
      arr.push({
        date: key,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        visitors: byDate.get(key) || 0,
      });
    }
    return arr;
  }, [stats]);

  const today = days[days.length - 1]?.visitors || 0;
  const yesterday = days[days.length - 2]?.visitors || 0;
  const last7 = days.slice(-7).reduce((a, b) => a + b.visitors, 0);
  const prev7 = days.slice(-14, -7).reduce((a, b) => a + b.visitors, 0);
  const last30 = days.reduce((a, b) => a + b.visitors, 0);
  const growthPct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;
  const growing = growthPct === null ? null : growthPct >= 0;

  const cards = [
    { label: t('stats.today'), value: today, sub: `${t('stats.yesterday')}: ${yesterday}` },
    { label: t('stats.last7'), value: last7, sub: growthPct === null ? '—' : `${growthPct >= 0 ? '+' : ''}${growthPct}% ${t('stats.growth')}` },
    { label: t('stats.last30'), value: last30, sub: '' },
    { label: t('stats.totalMembers'), value: users.length, sub: `${t('stats.totalReviews')}: ${reviews.length}` },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f3efe6' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#f1ebdd', border: '1px solid #ddd0b6', borderRadius: 8 }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#bf7a35' }} />
            </div>
            <div>
              <h1 className="font-playfair italic text-2xl" style={{ color: '#1a1815' }}>{t('stats.title')}</h1>
              <p className="text-xs" style={{ color: '#6b6358' }}>{t('stats.dailyVisitors')}</p>
            </div>
          </div>
          <button onClick={() => navigate('/moderation')}
            className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#6b6358' }}>
            <ArrowLeft className="h-4 w-4" /> {t('stats.backToMod')}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {cards.map((c, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#8a7e6f' }}>{c.label}</p>
              <p className="mt-1 font-playfair text-3xl" style={{ color: '#1a1815' }}>{c.value}</p>
              {c.sub && <p className="text-[11px] mt-0.5" style={{ color: '#bf7a35' }}>{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="p-5 rounded-2xl mb-6" style={{ background: '#faf8f2', border: '1px solid #e0d8c8', boxShadow: '0 2px 14px rgba(120,100,80,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-playfair italic text-lg" style={{ color: '#1a1815' }}>{t('stats.dailyVisitors')}</p>
            {growing !== null && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={growing
                  ? { background: '#eaeee0', color: '#4d5f3f', border: '1px solid #d6dcc6' }
                  : { background: '#f3e2df', color: '#9c3b33', border: '1px solid #e6cdc8' }}>
                {growing ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {growthPct >= 0 ? '+' : ''}{growthPct}%
              </span>
            )}
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={days} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bf7a35" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#bf7a35" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d8c8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a7e6f' }} axisLine={{ stroke: '#e0d8c8' }} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: '#8a7e6f' }} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip
                  contentStyle={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: '#6b6358' }}
                  itemStyle={{ color: '#1a1815' }}
                  formatter={(v) => [v, t('stats.dailyVisitors')]}
                />
                <Area type="monotone" dataKey="visitors" stroke="#bf7a35" strokeWidth={2.5} fill="url(#visGrad)" dot={false} activeDot={{ r: 4, fill: '#bf7a35' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary counters */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}>
            <Users className="w-5 h-5 shrink-0" style={{ color: '#bf7a35' }} />
            <div><p className="font-playfair text-xl" style={{ color: '#1a1815' }}>{users.length}</p><p className="text-[10px]" style={{ color: '#8a7e6f' }}>{t('stats.totalMembers')}</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}>
            <PenLine className="w-5 h-5 shrink-0" style={{ color: '#bf7a35' }} />
            <div><p className="font-playfair text-xl" style={{ color: '#1a1815' }}>{reviews.length}</p><p className="text-[10px]" style={{ color: '#8a7e6f' }}>{t('stats.totalReviews')}</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}>
            <Disc3 className="w-5 h-5 shrink-0" style={{ color: '#bf7a35' }} />
            <div><p className="font-playfair text-xl" style={{ color: '#1a1815' }}>{albums.length}</p><p className="text-[10px]" style={{ color: '#8a7e6f' }}>{t('stats.totalAlbums')}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}