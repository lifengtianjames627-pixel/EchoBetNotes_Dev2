import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Downloads an externally-hosted cover image server-side (avoiding the browser's
// CORS/hotlink restrictions that made client-side fetches to iTunes/NetEase/
// coverartarchive silently fail and leave broken image links) and re-uploads
// it to our own storage.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageUrl } = await req.json();
    if (!imageUrl) return Response.json({ error: 'Missing imageUrl' }, { status: 400 });

    const imgRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!imgRes.ok) return Response.json({ file_url: null });

    const blob = await imgRes.blob();
    const file = new File([blob], 'cover.jpg', { type: blob.type || 'image/jpeg' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return Response.json({ file_url: file_url || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});