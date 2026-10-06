import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!req.headers.get('content-type')?.includes('multipart/form-data')) return Response.json({ error: 'INVALID_IMAGE' }, { status: 400 });
    const file = (await req.formData()).get('file');
    if (!file || typeof file.arrayBuffer !== 'function' || file.size > 5 * 1024 * 1024 || !file.size) return Response.json({ error: 'INVALID_IMAGE' }, { status: 400 });
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
    if (!(png && file.type === 'image/png') && !(jpeg && file.type === 'image/jpeg') && !(webp && file.type === 'image/webp')) return Response.json({ error: 'INVALID_IMAGE' }, { status: 400 });
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    // Neither storage URI nor caller-controlled ownership is returned to the browser.
    const asset = await base44.asServiceRole.entities.RecruitPosterAsset.create({ owner_id: user.id, file_uri, file_name: file.name });
    return Response.json({ asset_id: asset.id });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}