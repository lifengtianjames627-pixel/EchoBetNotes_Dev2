import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { publicRecruitment } from '../../shared/recruitmentPolicy.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (typeof body.post_id !== 'string' || !/^[a-f0-9]{24}$/i.test(body.post_id)) return Response.json({ error: 'INVALID_POST' }, { status: 400 });
    const post = (await base44.entities.RecruitPost.filter({ id: body.post_id }, '-created_date', 1))[0];
    if (!post) return Response.json({ error: 'NOT_AVAILABLE' }, { status: 404 });
    const privileged = user.role === 'admin' || post.created_by_id === user.id;
    if (!privileged && !publicRecruitment(post)) return Response.json({ error: 'NOT_AVAILABLE' }, { status: 404 });
    if (!post.poster_asset_id) return Response.json({ error: 'NOT_AVAILABLE' }, { status: 404 });
    const asset = (await base44.asServiceRole.entities.RecruitPosterAsset.filter({ id: post.poster_asset_id }, '-created_date', 1))[0];
    if (!asset || asset.owner_id !== post.created_by_id) return Response.json({ error: 'NOT_AVAILABLE' }, { status: 404 });
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: asset.file_uri, expires_in: 60 });
    return Response.json({ signed_url, expires_in: 60 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}