import { apiClient } from '@/api/appClient';
import sendAudioPart from '@/features/podcasts/api/sendAudioPart';
const call = async data => (await apiClient.functions.invoke('podcastUpload', data)).data;
export const abortPodcastUpload = sessionId => call({ action: 'abort', session_id: sessionId });
/** @param {File} file @param {(percent: number) => void} onProgress */
export default async function uploadPodcastAudio(file, onProgress) {
  const configuration = await call({ action: 'configuration', origin: window.location.origin });
  const direct = configuration.cors_ready;
  const session = await call({ action: 'start', file_name: file.name, size_bytes: file.size });
  const loaded = Array(session.part_count).fill(0);
  try {
    const concurrency = direct ? 3 : 1;
    for (let start = 0; start < session.part_count; start += concurrency) {
      const outcomes = await Promise.allSettled(Array.from({ length: Math.min(concurrency, session.part_count - start) }, async (_, offset) => {
        const index = start + offset, blob = file.slice(index * session.part_size, Math.min(file.size, (index + 1) * session.part_size));
        const progress = bytes => { loaded[index] = bytes; onProgress(Math.min(95, Math.floor(loaded.reduce((total, value) => total + value, 0) / file.size * 95))); };
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (direct) {
              const part = await call({ action: 'part', session_id: session.session_id, part_number: index + 1 });
              await sendAudioPart(part.url, blob, session.content_type, progress);
            } else {
              await call({ action: 'proxy', session_id: session.session_id, part_number: index + 1, file: new File([blob], file.name, { type: session.content_type }) });
              progress(blob.size);
            }
            return;
          }
          catch (error) { loaded[index] = 0; if (attempt === 1) throw error; }
        }
      }));
      const failure = outcomes.find(outcome => outcome.status === 'rejected');
      if (failure?.status === 'rejected') throw failure.reason;
    }
    await call({ action: 'complete', session_id: session.session_id });
    onProgress(98);
    return session.session_id;
  } catch (error) { await abortPodcastUpload(session.session_id); throw error; }
}