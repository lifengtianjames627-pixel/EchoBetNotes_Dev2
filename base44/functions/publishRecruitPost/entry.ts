import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { moderateRecruitment } from '../../shared/recruitmentModeration.ts';
import { recruitmentDraft, recruitmentText, containsRecruitmentContact } from '../../shared/recruitmentDraft.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const draft = recruitmentDraft(body.draft);
    if (!draft || body.agreed !== true) return Response.json({ error: 'INVALID_DRAFT' }, { status: 400 });
    const text = recruitmentText(draft);
    if (containsRecruitmentContact(text)) return Response.json({ error: 'CONTACT' }, { status: 400 });
    if (draft.poster_asset_id) {
      const asset = (await base44.asServiceRole.entities.RecruitPosterAsset.filter({ id: draft.poster_asset_id }, '-created_date', 1))[0];
      if (!asset || asset.owner_id !== user.id) return Response.json({ error: 'INVALID_IMAGE' }, { status: 400 });
    }
    // Dedicated recruitment rubric; uncertainty/failure is pending, never an automatic rejection.
    let action = 'review';
    let reason = 'Moderation unavailable; manual review required';
    try {
      const result = await moderateRecruitment(base44, text);
      action = result.action; reason = result.reason;
    } catch (error) { console.warn('Recruitment moderation unavailable:', error.message); }
    if (action === 'block') return Response.json({ error: 'MODERATION' }, { status: 422 });
    if (draft.poster_asset_id) { action = 'review'; reason = 'Poster image requires manual review'; }
    const name = user.display_name || user.full_name || 'Anonymous';
    let post = await base44.entities.RecruitPost.create({
      ...draft, author_email: user.email, author_name: name.includes('@') ? 'Anonymous' : name,
      status: 'active', moderation_status: 'pending_review',
      moderation_reason: reason, report_count: 0,
    });
    if (action === 'allow') {
      try {
        post = await base44.asServiceRole.entities.RecruitPost.update(post.id, { moderation_status: 'approved' });
      } catch { action = 'review'; }
    }
    return Response.json({ id: post.id, action, moderation_status: action === 'allow' ? 'approved' : 'pending_review' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}