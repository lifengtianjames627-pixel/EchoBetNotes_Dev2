import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReviewCard from '@/components/ReviewCard';
import { withCurrentAlbums } from '@/shared/reviews/catalog';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Star, UserPlus, Check, X, Music, Shield, MessageSquare, Search, UserCog } from 'lucide-react';
import UserBadges from '@/components/UserBadges';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileDetails from '@/components/profile/ProfileDetails';
import StatStrip from '@/components/profile/StatStrip';
import EditNameModal from '@/components/profile/EditNameModal';
import { displayName } from '@/lib/displayName';
import { awardBadge } from '@/lib/badgeUtils';
import { earnedFromReviews } from '@/lib/badgeProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLang } from '@/i18n/LanguageContext';
import privacyCopy from '@/features/soulmate/i18n/privacyCopy';
import recruitCopy from '@/features/soulmate/i18n/recruitCopy';
import useFriendRequests, { useFriendMutation } from '@/features/friends/queries/useFriendRequests';
import FriendRequestFeedback from '@/features/friends/components/FriendRequestFeedback';
import friendCopy from '@/features/friends/i18n/friendCopy';

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { lang } = useLang();
  const copy = privacyCopy(lang), shared = recruitCopy(lang);
  const [searchError, setSearchError] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendMsg, setFriendMsg] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showEditName, setShowEditName] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.email],
    queryFn: async () => withCurrentAlbums(await base44.entities.Review.filter({ created_by_id: user.id }, '-created_date', 50), { keepMissing: true }),
    enabled: !!user,
  });

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['earned-badges', user?.email],
    queryFn: () => base44.entities.UserBadge.filter({ user_email: user.email }),
    enabled: !!user,
  });
  const earnedBadgeIds = earnedBadges.map(b => b.badge_id);

  useEffect(() => {
    if (user?.email && earnedBadges !== undefined) {
      awardBadge(user.email, 'critic_welcome', queryClient);
    }
  }, [user?.email, earnedBadges.length === 0]);

  // Albums are needed to work out genre-breadth and readership badges.
  const { data: allAlbums = [] } = useQuery({
    queryKey: ['all-albums-for-badges'],
    queryFn: () => base44.entities.Album.list('-created_date', 500),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.email || !myReviews.length) return;
    earnedFromReviews({ reviews: myReviews, albums: allAlbums }).forEach(id => {
      if (!earnedBadgeIds.includes(id)) awardBadge(user.email, id, queryClient);
    });
  }, [user?.email, myReviews.length, allAlbums.length, earnedBadgeIds.length]);

  const friendQuery = useFriendRequests(user?.email);
  const sentRequests = (friendQuery.data || []).filter(r => r.from_email === user?.email);
  const incomingRequests = (friendQuery.data || []).filter(r => r.to_email === user?.email);
  const friendText = friendCopy(lang);

  useEffect(() => {
    let active = true;
    setSearchResults([]); setSearchError(false);
    if (searchQuery.trim().length < 2 || selectedFriend) { setSearching(false); return; }
    setSearching(true);
    const timeout = setTimeout(() => {
      base44.functions.invoke('searchUsers', { query: searchQuery.trim() })
        .then(res => { if (active) { setSearchResults(res.data?.results || []); } })
        .catch(() => { if (active) setSearchError(true); })
        .finally(() => { if (active) setSearching(false); });
    }, 350);
    return () => { active = false; clearTimeout(timeout); };
  }, [searchQuery, selectedFriend, user?.id]);

  const selectFriend = useMutation({
    mutationFn: async id => {
      const { data } = await base44.functions.invoke('publicProfile', { user_id: id });
      if (!data.found) throw new Error(copy.profileUnavailable);
      return data;
    },
    onSuccess: data => { setSelectedFriend(data); setFriendEmail(data.email); setSearchQuery(data.full_name); },
  });

  const sendFriendRequest = useFriendMutation();
  const respondToRequest = useFriendMutation();
  const submitFriendRequest = () => sendFriendRequest.mutate({ action: 'send', target_email: friendEmail, message: friendMsg }, {
    onSuccess: () => {
      setShowAddFriend(false); setFriendEmail(''); setFriendMsg('');
      setSearchQuery(''); setSearchResults([]); setSelectedFriend(null);
    },
  });

  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');
  const friends = incomingRequests.filter(r => r.status === 'accepted');
  const acceptedSent = sentRequests.filter(r => r.status === 'accepted');
  const friendsList = [
    ...friends.map(r => ({ name: r.from_name, email: r.from_email })),
    ...acceptedSent.map(r => ({ name: r.to_name, email: r.to_email })),
  ];

  if (!user) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#e0d8c8', borderTopColor: '#bf7a35' }} />
    </div>
  );

  const initial = (displayName(user) || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: '#f3efe6' }}>
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-16">

        {/* Profile header */}
        <ProfileHero
          name={displayName(user) || 'Listener'}
          email={user.email}
          initial={initial}
          badges={user?.equipped_badges || []}
          statusText={user.email}
          pictureUrl={user?.profile_picture_url}
          editable
        >
          <button
            onClick={() => setShowEditName(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold"
            style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #e0d8c8' }}
          >
            <UserCog className="w-3.5 h-3.5" /> Edit name
          </button>
          <button
            onClick={() => setShowAddFriend(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold"
            style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #e0d8c8' }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Friend
          </button>
        </ProfileHero>

        <ProfileDetails user={user} />

        {/* Stats row */}
        <StatStrip stats={[
          { label: 'Reviews', val: myReviews.length },
          { label: 'Friends', val: friendsList.length },
          { label: 'Badges', val: earnedBadgeIds.length },
        ]} />

        {/* Tabs */}
        <Tabs defaultValue="reviews">
          <TabsList className="w-full justify-start overflow-x-auto rounded-xl mb-5"
            style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}>
            <TabsTrigger value="reviews" className="flex-1 text-xs"><Star className="w-3.5 h-3.5 mr-1" />Reviews</TabsTrigger>
            <TabsTrigger value="badges" className="flex-1 text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" />Badges
              {earnedBadgeIds.length > 0 && <span className="ml-1 font-bold" style={{ color: '#bf7a35' }}>{earnedBadgeIds.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="recruitment" className="flex-1 text-xs"><Music className="w-3.5 h-3.5 mr-1" />{shared.board}</TabsTrigger>
            <TabsTrigger value="friends" className="flex-1 text-xs">
              <Users className="w-3.5 h-3.5 mr-1" />Friends
              {pendingIncoming.length > 0 && (
                <span className="ml-1 text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center"
                  style={{ background: '#bf7a35', color: '#faf8f2' }}>{pendingIncoming.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-3">
            {myReviews.length > 0 ? myReviews.map(review => <ReviewCard key={review.id} review={review} />) : (
              <div className="text-center py-16" style={{ color: '#8a7e6f' }}>
                <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No reviews yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="badges">
            <UserBadges user={user} earnedBadgeIds={earnedBadgeIds} />
          </TabsContent>

          <TabsContent value="recruitment">
            <Link to="/soulmate" className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-semibold text-card-foreground">
              <Music className="w-3.5 h-3.5" /> {shared.board}
            </Link>
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            <FriendRequestFeedback query={friendQuery} mutation={respondToRequest} />
            {pendingIncoming.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest font-bold px-1" style={{ color: '#bf7a35' }}>
                  Pending · {pendingIncoming.length}
                </p>
                {pendingIncoming.map(req => (
                  <div key={req.id} data-friend-request={req.id} className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: '#f6efe1', border: '1px solid #ddd0b6' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: '#efe4d0', color: '#8a5a20' }}>
                      {req.from_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: '#1a1815' }}>{req.from_name || 'Anonymous'}</p>
                      {req.message && <p className="text-xs truncate" style={{ color: '#8a7e6f' }}>"{req.message}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: '#efe4d0', color: '#8a5a20' }}
                        aria-label={friendText.accept} disabled={respondToRequest.isPending || friendQuery.isFetching}
                        onClick={() => respondToRequest.mutate({ action: 'respond', id: req.id, status: 'accepted' })}>
                        <Check className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: '#f3e2df', color: '#9c3b33' }}
                        aria-label={friendText.decline} disabled={respondToRequest.isPending || friendQuery.isFetching}
                        onClick={() => respondToRequest.mutate({ action: 'respond', id: req.id, status: 'declined' })}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest font-bold px-1" style={{ color: '#8a7e6f' }}>
                Friends · {friendsList.length}
              </p>
              {friendsList.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: '#efe4d0', color: '#8a5a20' }}>
                    {f.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: '#1a1815' }}>{f.name || 'Anonymous'}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/chat?with=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name || '')}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                    style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #e0d8c8' }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>
                </div>
              ))}
              {friendsList.length === 0 && !friendQuery.isPending && !friendQuery.isError && (
                <div className="text-center py-16" style={{ color: '#8a7e6f' }}>
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No friends yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showEditName && <EditNameModal user={user} onClose={() => setShowEditName(false)} />}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowAddFriend(false); setSearchQuery(''); setSearchResults([]); setSelectedFriend(null); }}>
          <div
            className="rounded-2xl p-6 w-full max-w-sm space-y-4"
            style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-semibold text-base" style={{ color: '#1a1815' }}>Send Friend Request</p>
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a7e6f' }} />
                <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedFriend(null); setFriendEmail(''); }}
                  placeholder={copy.search} />
                {(searchError || selectFriend.error) && <p role="alert" className="text-xs text-destructive">{shared.failed}</p>}
                {(searching || searchResults.length > 0) && searchQuery.trim().length >= 2 && !selectedFriend && (
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden max-h-48 overflow-y-auto z-10"
                    style={{ background: '#faf8f2', border: '1px solid #e0d8c8' }}>
                    {searching ? (
                      <p className="text-xs px-4 py-3" style={{ color: '#8a7e6f' }}>Searching…</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(u => (
                        <button key={u.id} type="button" disabled={selectFriend.isPending}
                          onClick={() => selectFriend.mutate(u.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-black/5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: '#efe4d0', color: '#8a5a20' }}>
                            {(u.full_name || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm truncate" style={{ color: '#1a1815' }}>{u.full_name || 'Listener'}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs px-4 py-3" style={{ color: '#8a7e6f' }}>No users found.</p>
                    )}
                  </div>
                )}
              </div>
              <input className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }}
                maxLength={1000} value={friendMsg} onChange={e => setFriendMsg(e.target.value)} placeholder="Add a message (optional)" />
            </div>
            <FriendRequestFeedback mutation={sendFriendRequest} />
            <div className="flex gap-3 pt-1">
              <button disabled={!friendEmail || sendFriendRequest.isPending}
                onClick={submitFriendRequest}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#efe4d0', color: '#8a5a20', border: '1px solid #ddd0b6', opacity: !friendEmail ? 0.4 : 1 }}>
                {sendFriendRequest.isPending ? 'Sending…' : 'Send'}
              </button>
              <button onClick={() => { setShowAddFriend(false); setSearchQuery(''); setSearchResults([]); setSelectedFriend(null); }} className="px-5 py-2.5 rounded-xl text-sm" style={{ color: '#8a7e6f' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}