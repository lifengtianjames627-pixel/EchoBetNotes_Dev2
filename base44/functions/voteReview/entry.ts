import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { readReviewVotes, latestReviewVotes, reviewVoteTotals } from '../../shared/reviewVotes.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { review_id, vote } = await req.json();
    if (typeof review_id !== 'string' || !review_id || ![null, 'like', 'dislike'].includes(vote)) {
      return Response.json({ error: 'Invalid vote' }, { status: 400 });
    }
    const svc = base44.asServiceRole;
    const [review] = await svc.entities.Review.filter({ id: review_id }, 'id', 1);
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });
    const isPublic = !['pending_review', 'blocked'].includes(review.moderation_status);
    if (!isPublic && review.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const votes = await readReviewVotes(svc, review_id);
    const own = votes.filter(record => String(record.voter_email).toLowerCase() === user.email.toLowerCase());
    const previous = latestReviewVotes(own)[0];
    let saved = null;
    if (vote) {
      saved = previous
        ? await svc.entities.ReviewVote.update(previous.id, { vote, voter_email: user.email })
        : await svc.entities.ReviewVote.create({ review_id, voter_email: user.email, vote });
    }
    for (const record of own) {
      if (record.id !== saved?.id) await svc.entities.ReviewVote.delete(record.id);
    }
    const counts = reviewVoteTotals(await readReviewVotes(svc, review_id));
    await svc.entities.Review.update(review_id, counts);
    return Response.json({ ...counts, vote, vote_id: saved?.id || null, previous_vote: previous?.vote || null });
  } catch (error) {
    console.error('voteReview failed:', error.message);
    return Response.json({ error: 'Could not record vote' }, { status: 500 });
  }
}