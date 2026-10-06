import { base44 } from '@/api/base44Client';

export async function listFriendRequests(email, peer) {
  const filter = { $or: peer
    ? [{ from_email: email, to_email: peer }, { from_email: peer, to_email: email }]
    : [{ from_email: email }, { to_email: email }] };
  const records = [];
  for (let offset = 0; ; offset += 100) {
    const page = await base44.entities.FriendRequest.filter(filter, 'id', 100, offset);
    records.push(...page);
    if (page.length < 100) return records;
  }
}
export async function saveFriendRequest(payload) {
  const { data } = await base44.functions.invoke('friendRequests', payload);
  return data.request;
}