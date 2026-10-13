import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Star, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReviewCard from '@/components/ReviewCard';
import { withCurrentAlbums, isApproved } from '@/shared/reviews/catalog';
import ProfileHero from '@/components/profile/ProfileHero';
import StatStrip from '@/components/profile/StatStrip';
import ProfileActions from '@/components/profile/ProfileActions';
import { useLang } from '@/i18n/LanguageContext';
import privacyCopy from '@/features/soulmate/i18n/privacyCopy';

// Another member's profile — reached by tapping their avatar on the map.
// Friend request and the one-message introduction live here, so a tap on the
// map never drops you straight into a chat window.
export default function UserProfile() {
  const { email: raw } = useParams();
  const identifier = raw || '';
  const { lang } = useLang();
  const copy = privacyCopy(lang);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: profile, isLoading, error: profileError } = useQuery({
    queryKey: ['public-profile', me?.id, 'open-discovery', identifier],
    queryFn: () => base44.functions.invoke('publicProfile', identifier.includes('@') ? { email: identifier } : { user_id: identifier }).then(r => r.data),
    enabled: !!identifier && !!me?.id, retry: false,
  });
  // No secondary content or actions are requested before the server authorizes the profile.
  const email = profile?.found ? profile.email : '';

  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', me?.id, 'open-discovery', email],
    queryFn: async () => withCurrentAlbums((await base44.entities.Review.filter({ reviewer_email: email }, '-created_date', 30)).filter(isApproved)),
    enabled: !!email,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['user-badges', me?.id, 'open-discovery', email],
    queryFn: () => base44.entities.UserBadge.filter({ user_email: email }),
    enabled: !!email,
  });

  // Admin-only: registration date + aggregate usage averages (never messages).
  const { data: adminUser } = useQuery({
    queryKey: ['admin-user-info', email],
    queryFn: () => base44.entities.User.filter({ email }),
    enabled: !!email && me?.role === 'admin',
  });

  const isAdmin = me?.role === 'admin';
  const name = profile?.full_name || (isAdmin ? email : 'Anonymous');
  const status = profile?.online
    ? 'Online now'
    : profile?.last_active
      ? `Last online ${formatDistanceToNow(new Date(profile.last_active), { addSuffix: true })}`
      : (isAdmin ? email : 'Offline');

  return (
    <div className="min-h-screen" style={{ background: '#f3efe6' }}>
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-16">
        <Link to="/chat" className="inline-flex items-center gap-1.5 text-xs mb-4" style={{ color: '#6b6358' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        {isLoading || !me ? (
          <div className="h-44 animate-pulse" style={{ background: '#ece5d6', borderRadius: 12 }} />
        ) : profileError || !profile?.found ? (
          <p role="status" className="text-sm py-16 text-center text-muted-foreground">{copy.profileUnavailable}</p>
        ) : (
          <>
            <ProfileHero
              name={name}
              email={isAdmin ? email : ''}
              initial={(name || '?')[0].toUpperCase()}
              badges={profile?.equipped_badges || []}
              online={profile?.online}
              statusText={status}
              pictureUrl={profile?.profile_picture_url}
            >
              {me && !profile?.is_me && (
                <ProfileActions me={me} targetEmail={email} targetName={name} />
              )}
              {profile?.is_me && (
                <Link to="/profile" className="px-4 py-2.5 rounded-full text-xs font-semibold"
                  style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #e0d8c8' }}>
                  This is you — open your profile
                </Link>
              )}
            </ProfileHero>

            <StatStrip stats={[
              { label: 'Reviews', val: reviews.length },
              { label: 'Badges', val: badges.length },
              { label: 'Equipped', val: (profile?.equipped_badges || []).length },
            ]} />

            {isAdmin && adminUser?.[0] && (
              <div className="mt-4 p-4" style={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 10 }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#bf7a35' }}>Admin view</p>
                <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: '#5a534a' }}>
                  <div className="col-span-2"><span style={{ color: '#8a7e6f' }}>Email</span><br />{email}</div>
                  <div><span style={{ color: '#8a7e6f' }}>Joined</span><br />{adminUser[0].created_date ? new Date(adminUser[0].created_date).toLocaleDateString() : '—'}</div>
                  <div><span style={{ color: '#8a7e6f' }}>Role</span><br />{adminUser[0].role}</div>
                  <div><span style={{ color: '#8a7e6f' }}>Today</span><br />{adminUser[0].daily_minutes || 0} min</div>
                  <div><span style={{ color: '#8a7e6f' }}>Total</span><br />{adminUser[0].total_browsing_minutes || 0} min</div>
                </div>
              </div>
            )}

            <p className="text-xs uppercase tracking-widest font-bold px-1 mb-3" style={{ color: '#bf7a35' }}>
              Reviews
            </p>
            <div className="space-y-3">
              {reviews.length > 0 ? reviews.map(r => <ReviewCard key={r.id} review={r} />) : (
                <div className="text-center py-14" style={{ color: '#8a7e6f' }}>
                  <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No reviews yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}