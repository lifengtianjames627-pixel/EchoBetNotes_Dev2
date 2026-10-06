import React, { useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Shield, LogOut, LogIn, MessageSquare, Users } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';
import LanguageButton from '@/components/LanguageButton';
import SiteFooter from '@/components/SiteFooter';
import MusicDataSync from '@/components/reviews/MusicDataSync';
import { ReviewerProfileProvider } from '@/components/ReviewerProfileProvider';
import { displayName } from '@/lib/displayName';
import discoveryCopy from '@/features/albums/i18n/discoveryCopy';

const NAV_ITEMS = [
  { path: '/', icon: HomeIcon, labelKey: 'nav.home' },
  { path: '/discover', labelKey: 'nav.discover' },
  { path: '/chat', icon: MessageSquare, labelKey: 'nav.messages' },
];
const ADMIN_ITEMS = [{ path: '/moderation', icon: Shield, labelKey: 'nav.moderation' }];

export default function Layout() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Tapping a member's avatar/name anywhere on the site dispatches this event;
  // here we route it to the full private-chat page (with the pre-friend
  // 3-message gate) instead of a transient popup.
  useEffect(() => {
    const handler = (e) => {
      const { email, name } = e.detail || {};
      if (!email || email === currentUser?.email) return;
      navigate(`/chat?with=${encodeURIComponent(email)}&name=${encodeURIComponent(name || '')}`);
    };
    window.addEventListener('openMiniChat', handler);
    return () => window.removeEventListener('openMiniChat', handler);
  }, [currentUser?.email, navigate]);

  // Fire-and-forget a unique-visitor ping once per app load so the admin
  // analytics page has a daily count. Errors are swallowed — stats are a
  // nice-to-have, never worth blocking the UI.
  useEffect(() => {
    base44.functions.invoke('trackVisit', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).catch(() => {});
  }, []);

  // Unread direct-message count for the Messages nav badge (polled).
  const { data: msgUnreadData } = useQuery({
    queryKey: ['messageUnread'],
    queryFn: () => base44.functions.invoke('messageUnread', {}).then(r => r.data?.unread || 0),
    enabled: !!currentUser?.email,
    refetchInterval: 30000,
  });
  const messageUnread = msgUnreadData || 0;

  // Pending moderation count for the Moderation nav badge (admins only, polled).
  const { data: pendingReviews = [] } = useQuery({
    queryKey: ['mod-pending-reviews'],
    queryFn: () => base44.entities.Review.filter({ moderation_status: 'pending_review' }, '-created_date', 100),
    enabled: currentUser?.role === 'admin',
    refetchInterval: 30000,
  });
  const { data: pendingComments = [] } = useQuery({
    queryKey: ['mod-pending-comments'],
    queryFn: () => base44.entities.Comment.filter({ moderation_status: 'pending_review' }, '-created_date', 100),
    enabled: currentUser?.role === 'admin',
    refetchInterval: 30000,
  });
  const pendingModCount = (pendingReviews?.length || 0) + (pendingComments?.length || 0);

  // ── Time tracking ──────────────────────────────────────────────────────────
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    if (!currentUser?.email) return;

    const flush = async () => {
      const elapsed = Math.round((Date.now() - sessionStartRef.current) / 60000);
      if (elapsed < 1) return;
      sessionStartRef.current = Date.now();

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const weekKey = (() => {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
      })();
      const monthKey = now.toISOString().slice(0, 7);

      const prev = await base44.auth.me();
      const newTotal = (prev.total_browsing_minutes || 0) + elapsed;

      const newDaily = prev.daily_minutes_date === todayStr
        ? (prev.daily_minutes || 0) + elapsed : elapsed;
      const newWeekly = prev.weekly_minutes_week === weekKey
        ? (prev.weekly_minutes || 0) + elapsed : elapsed;
      const newMonthly = prev.monthly_minutes_month === monthKey
        ? (prev.monthly_minutes || 0) + elapsed : elapsed;

      await base44.auth.updateMe({
        total_browsing_minutes: newTotal,
        daily_minutes: newDaily,
        daily_minutes_date: todayStr,
        weekly_minutes: newWeekly,
        weekly_minutes_week: weekKey,
        monthly_minutes: newMonthly,
        monthly_minutes_month: monthKey,
      });

      const { awardBadge } = await import('@/lib/badgeUtils');
      if (newDaily >= 45) awardBadge(prev.email, 'daily_listener', null);
      if (newWeekly >= 180) awardBadge(prev.email, 'weekly_devotee', null);
      if (newMonthly >= 1800) awardBadge(prev.email, 'monthly_obsessive', null);
      if (newTotal >= 600) awardBadge(prev.email, 'time_10h', null);
      if (newTotal >= 6000) awardBadge(prev.email, 'time_100h', null);
      if (newTotal >= 60000) awardBadge(prev.email, 'time_1000h', null);
    };

    const interval = setInterval(flush, 5 * 60 * 1000);
    const handleUnload = () => flush();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [currentUser?.email]);

  const isAdmin = currentUser?.role === 'admin';
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLink = (path, labelKey, badge = 0) => {
    const active = isActive(path);
    return (
      <Link key={path} to={path} className="relative px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap" style={active ? { color: '#1a1815', borderBottom: '2px solid #bf7a35' } : { color: '#6b6358' }}>
        {labelKey === 'nav.discover' ? discoveryCopy(lang).title : t(labelKey)}
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#c0392b' }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f3efe6' }}>
      {/* Top navigation — Bandcamp-style thin bar, no sidebar */}
      <header className="sticky top-0 z-[280] flex items-center gap-3 px-5 h-14" style={{ background: 'rgba(243,239,230,0.92)', borderBottom: '1px solid rgba(26,24,21,0.1)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
        <Link to="/" className="font-playfair italic text-sm sm:text-lg whitespace-nowrap shrink-0" style={{ color: '#1a1815', letterSpacing: '-0.01em' }}>
          Echo Between Notes
        </Link>
        <nav className="hidden sm:flex items-center gap-0.5 ml-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_ITEMS.filter(item => item.path !== '/chat' || currentUser).map(item => navLink(item.path, item.labelKey, item.path === '/chat' ? messageUnread : 0))}
          {isAdmin && ADMIN_ITEMS.map(item => navLink(item.path, item.labelKey, item.path === '/moderation' ? pendingModCount : 0))}
        </nav>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {currentUser && <NotificationBell />}
          <LanguageButton />
          {currentUser ? (
            <>
              <button onClick={() => base44.auth.logout()} title={t('nav.logout')} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ color: '#6b6358', border: '1px solid rgba(26,24,21,0.14)' }}>
                <LogOut className="w-4 h-4" />
              </button>
              <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-colors" style={{ border: '1px solid rgba(26,24,21,0.14)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1a1815', color: '#faf8f2' }}>
                  {(displayName(currentUser) || 'U')[0].toUpperCase()}
                </div>
                <span className="text-xs font-semibold hidden sm:inline max-w-[140px] truncate" style={{ color: '#1a1815' }}>
                  {displayName(currentUser) || t('nav.myAccount')}
                </span>
              </Link>
            </>
          ) : (
            <button onClick={() => base44.auth.redirectToLogin()} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors" style={{ background: '#1a1815', color: '#faf8f2' }}>
              <LogIn className="w-3.5 h-3.5" /> {t('nav.login')}
            </button>
          )}
        </div>
      </header>

      {/* Mobile nav strip — the links that don't fit in the thin top bar */}
      <nav className="sm:hidden flex items-center gap-0.5 px-4 py-1.5 overflow-x-auto" style={{ background: '#e6ddc9', borderBottom: '1px solid rgba(26,24,21,0.08)', scrollbarWidth: 'none' }}>
        {NAV_ITEMS.filter(item => item.path !== '/chat' || currentUser).map(item => navLink(item.path, item.labelKey))}
        {isAdmin && ADMIN_ITEMS.map(item => navLink(item.path, item.labelKey, item.path === '/moderation' ? pendingModCount : 0))}
      </nav>

      <main className="flex-1 min-w-0">
        <ReviewerProfileProvider>
          <Outlet />
        </ReviewerProfileProvider>
      </main>

      <MusicDataSync />
      <SiteFooter />

      {isAdmin && (
        <Link to="/manage" title="Manage members"
          className="fixed right-4 bottom-6 z-30 flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-full shadow-md transition-transform hover:scale-105"
          style={{ background: '#1a1815', color: '#faf8f2' }}>
          <Users className="w-4 h-4" />
          <span className="text-xs font-semibold">Manage</span>
        </Link>
      )}
    </div>
  );
}