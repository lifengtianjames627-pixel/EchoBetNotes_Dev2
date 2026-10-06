import { base44 } from '@/api/base44Client';

// Downloads an externally-hosted cover image (iTunes/MusicBrainz/NetEase/Last.fm)
// and re-uploads it to our own storage, so future page loads read a fast,
// permanent URL instead of re-hitting a slow third-party host every time.
// Done via a backend function — fetching straight from the browser hits CORS/
// hotlink blocks on many of these hosts, which silently failed and left the
// raw (often broken) external URL stored instead.
export async function storeCoverImage(externalUrl) {
  if (!externalUrl) return null;
  try {
    const res = await base44.functions.invoke('storeCoverImage', { imageUrl: externalUrl });
    return res.data?.file_url || externalUrl;
  } catch {
    return externalUrl;
  }
}