import path from 'node:path';
import { HttpError } from '../entities/policies.js';
import { safeMemberName } from '../shared/identity.js';
import { containsExternalContact } from '../shared/chatPolicy.js';
import { moderateText } from '../shared/llm.js';
import { abortParts, completeParts, writePart } from '../storage/multipart.js';
import { putObject, signedObjectUrl, storageKey } from '../storage/objectStorage.js';
import { records, requireAdmin, requireUser } from './_helpers.js';

const PART_BYTES = 16 * 1024 * 1024;
const MAX_AUDIO_BYTES = 1024 * 1024 * 1024;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const audioExtensions = new Set(['wav', 'mp3', 'm4a', 'aac', 'ogg', 'opus', 'flac', 'webm']);

const extension = (name) => path.extname(String(name || '')).slice(1).toLowerCase();
const assertImage = (file) => {
  if (!file?.bytes?.length || file.bytes.length > 5 * 1024 * 1024 || !imageTypes.has(file.mimetype)) {
    throw new HttpError(400, 'INVALID_IMAGE');
  }
};

export async function podcastUpload(context, payload) {
  const user = requireAdmin(context);
  const action = payload.action;
  if (action === 'configuration') {
    return { connection_ok: true, cors_ready: false, policy: [] };
  }
  if (action === 'start') {
    const size = Number(payload.size_bytes);
    const ext = extension(payload.file_name);
    if (!audioExtensions.has(ext) || !Number.isFinite(size) || size < 16 || size > MAX_AUDIO_BYTES) {
      throw new HttpError(400, 'INVALID_AUDIO');
    }
    const session = await records('PodcastUploadSession').create({
      owner_id: user.id,
      object_key: storageKey('podcasts', ext),
      file_name: String(payload.file_name).slice(0, 255),
      size_bytes: size,
      content_type: payload.content_type || 'application/octet-stream',
      status: 'uploading',
      part_count: Math.ceil(size / PART_BYTES),
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    }, user);
    return {
      session_id: session.id,
      part_size: PART_BYTES,
      part_count: session.part_count,
      content_type: session.content_type,
    };
  }
  const session = await records('PodcastUploadSession').find(payload.session_id);
  if (!session || session.owner_id !== user.id) throw new HttpError(404, 'INVALID_UPLOAD_STATE');
  if (action === 'proxy') {
    const partNumber = Number(payload.part_number);
    if (session.status !== 'uploading' || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > session.part_count) {
      throw new HttpError(400, 'INVALID_UPLOAD_PART');
    }
    const file = payload.file;
    if (!file?.bytes?.length || file.bytes.length > PART_BYTES) throw new HttpError(400, 'INVALID_UPLOAD_PART_SIZE');
    await writePart(session.id, partNumber, file.bytes);
    return { uploaded: true };
  }
  if (action === 'complete') {
    if (session.status !== 'uploading') throw new HttpError(409, 'INVALID_UPLOAD_STATE');
    await completeParts(session.id, session.part_count, session.object_key, session.content_type);
    await records('PodcastUploadSession').update(session.id, { status: 'completed' });
    return { completed: true };
  }
  if (action === 'abort') {
    if (session.status === 'published') throw new HttpError(409, 'UPLOAD_ALREADY_PUBLISHED');
    await abortParts(session.id);
    await records('PodcastUploadSession').update(session.id, { status: 'aborted' });
    return { aborted: true };
  }
  if (action === 'part') throw new HttpError(400, 'DIRECT_UPLOAD_UNAVAILABLE');
  throw new HttpError(400, 'INVALID_ACTION');
}

export async function publishPodcast(context, payload) {
  const user = requireAdmin(context);
  const title = String(payload.title || '').trim();
  const hostName = String(payload.host_name || '').trim();
  if (!title || title.length > 200 || !hostName || hostName.length > 120) {
    throw new HttpError(400, 'INVALID_METADATA');
  }
  const session = await records('PodcastUploadSession').find(payload.upload_session_id);
  if (!session || session.owner_id !== user.id || !['completed', 'published'].includes(session.status)) {
    throw new HttpError(400, 'UPLOAD_NOT_COMPLETE');
  }
  if (session.status === 'published' && session.podcast_id) {
    return { episode: await records('Podcast').find(session.podcast_id) };
  }
  let coverObjectKey = '';
  if (payload.cover_file) {
    assertImage(payload.cover_file);
    coverObjectKey = storageKey('podcast-covers', extension(payload.cover_file.filename) || 'jpg');
    await putObject(coverObjectKey, payload.cover_file.bytes, payload.cover_file.mimetype);
  }
  const asset = await records('PodcastAudioAsset').create({
    owner_id: user.id,
    storage_provider: 'object-storage',
    object_key: session.object_key,
    file_name: session.file_name,
    content_type: session.content_type,
    size_bytes: session.size_bytes,
    cover_object_key: coverObjectKey,
  }, user);
  const episode = await records('Podcast').create({
    title,
    host_name: hostName,
    host_email: user.email,
    description: String(payload.description || '').slice(0, 5000),
    category: String(payload.category || ''),
    duration_minutes: Number(payload.duration_minutes || 0),
    audio_asset_id: asset.id,
    has_uploaded_cover: Boolean(coverObjectKey),
  }, user);
  await records('PodcastUploadSession').update(session.id, { status: 'published', podcast_id: episode.id });
  return { episode };
}

export async function getPodcastAudio(context, payload) {
  requireUser(context);
  const podcast = await records('Podcast').find(payload.podcast_id);
  if (!podcast?.audio_asset_id) throw new HttpError(404, 'not_found');
  const asset = await records('PodcastAudioAsset').find(podcast.audio_asset_id);
  const key = payload.kind === 'cover' ? asset?.cover_object_key : asset?.object_key;
  if (!key) throw new HttpError(404, 'not_found');
  return { signed_url: await signedObjectUrl(key, 3600), expires_in: 3600 };
}

export async function uploadRecruitPoster(context, payload) {
  const user = requireUser(context);
  assertImage(payload.file);
  const key = storageKey('recruit-posters', extension(payload.file.filename) || 'jpg');
  await putObject(key, payload.file.bytes, payload.file.mimetype);
  const asset = await records('RecruitPosterAsset').create({
    owner_id: user.id,
    object_key: key,
    file_name: String(payload.file.filename || '').slice(0, 255),
  }, user);
  return { asset_id: asset.id };
}

export async function publishRecruitPost(context, payload) {
  const user = requireUser(context);
  if (payload.agreed !== true || !payload.draft || typeof payload.draft !== 'object') {
    throw new HttpError(400, 'INVALID_DRAFT');
  }
  const draft = payload.draft;
  if (!['band', 'musician'].includes(draft.kind) || !String(draft.title || '').trim()) {
    throw new HttpError(400, 'INVALID_DRAFT');
  }
  const text = [draft.title, draft.description, draft.city, draft.school, draft.influences].filter(Boolean).join('\n');
  if (containsExternalContact(text)) throw new HttpError(400, 'CONTACT');
  if (draft.poster_asset_id) {
    const asset = await records('RecruitPosterAsset').find(draft.poster_asset_id);
    if (!asset || asset.owner_id !== user.id) throw new HttpError(400, 'INVALID_IMAGE');
  }
  const moderation = await moderateText(text);
  if (moderation.suggestedAction === 'block') throw new HttpError(422, 'MODERATION', moderation.reason);
  const action = draft.poster_asset_id ? 'review' : moderation.suggestedAction;
  const post = await records('RecruitPost').create({
    ...draft,
    title: String(draft.title).slice(0, 200),
    description: String(draft.description || '').slice(0, 8000),
    author_email: user.email,
    author_name: safeMemberName(user),
    status: 'active',
    moderation_status: action === 'allow' ? 'approved' : 'pending_review',
    moderation_reason: draft.poster_asset_id ? 'Poster image requires manual review' : moderation.reason,
    report_count: 0,
  }, user);
  return { id: post.id, action, moderation_status: post.moderation_status };
}

export async function getRecruitPoster(context, payload) {
  const user = requireUser(context);
  const post = await records('RecruitPost').find(payload.post_id);
  const privileged = user.role === 'admin' || post?.created_by_id === user.id;
  const publiclyVisible = post?.status === 'active' && (!post.moderation_status || post.moderation_status === 'approved');
  if (!post || (!privileged && !publiclyVisible) || !post.poster_asset_id) {
    throw new HttpError(404, 'NOT_AVAILABLE');
  }
  const asset = await records('RecruitPosterAsset').find(post.poster_asset_id);
  if (!asset || asset.owner_id !== post.created_by_id) throw new HttpError(404, 'NOT_AVAILABLE');
  context.reply.header('Cache-Control', 'private, no-store');
  return { signed_url: await signedObjectUrl(asset.object_key, 60), expires_in: 60 };
}
