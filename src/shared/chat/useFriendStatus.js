import useFriendRequests from '@/features/friends/queries/useFriendRequests';

export function useFriendStatus(myEmail, peerEmail) {
  const query = useFriendRequests(peerEmail ? myEmail : null, peerEmail);
  const reqs = query.data || [];
  return {
    query,
    isFriend: reqs.some(r => r.status === 'accepted'),
    sentRequest: reqs.some(r => r.from_email === myEmail && r.status === 'pending'),
    incomingRequest: reqs.some(r => r.to_email === myEmail && r.status === 'pending'),
  };
}