import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// "Binding" logic: the User record is the single source of truth for a member's
// display name. Several entities denormalise that name into a snapshot field at
// creation time (reviewer_name, author_name, sender_name, …) so lists can render
// without a per-row user lookup. When a member renames themselves, this
// function re-syncs every one of those snapshots to their current name, so all
// historical reviews, recruit posts, comments, band memberships, follows,
// subscriptions, friend requests and chat messages reflect the new name.
//
// Profile pictures are NOT snapshotted anywhere — they are resolved live from
// the User record wherever shown (profiles, chat directory), so an avatar
// change already propagates instantly with nothing to do here.
//
// Each update is filtered to the calling user's own records (by their email),
// so the service-role bulk write only ever touches content they authored.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email;
    const name = user.display_name || user.full_name || email;
    const svc = base44.asServiceRole;

    await svc.entities.Review.updateMany({ reviewer_email: email }, { $set: { reviewer_name: name } });
    await svc.entities.RecruitPost.updateMany({ author_email: email }, { $set: { author_name: name } });
    await svc.entities.Comment.updateMany({ author_email: email }, { $set: { author_name: name } });
    await svc.entities.BandMember.updateMany({ user_email: email }, { $set: { user_name: name } });
    await svc.entities.BandFollow.updateMany({ follower_email: email }, { $set: { follower_name: name } });
    await svc.entities.Subscription.updateMany({ subscriber_email: email }, { $set: { subscriber_name: name } });
    await svc.entities.ChatMessage.updateMany({ sender_email: email }, { $set: { sender_name: name } });
    await svc.entities.FriendRequest.updateMany({ from_email: email }, { $set: { from_name: name } });
    await svc.entities.FriendRequest.updateMany({ to_email: email }, { $set: { to_name: name } });

    return Response.json({ ok: true, name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}