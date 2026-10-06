import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useReviewerProfileRefresh } from '@/components/ReviewerProfileProvider';

// Paper avatar: a cream plate with an ochre serif monogram by default, or the
// member's own uploaded picture. `editable` shows a small camera button that
// uploads a file and saves it on the user.
export default function ProfileAvatar({ pictureUrl, initial, size = 74, editable, onUploaded }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const refreshProfiles = useReviewerProfileRefresh();

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture_url: file_url });
      refreshProfiles(); // drop live-profile cache so review avatars re-fetch
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
      onUploaded?.(file_url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: '#f1ebdd',
          color: '#bf7a35',
          border: '1px solid #ddd0b6',
          fontFamily: 'Playfair Display, Georgia, serif',
          fontStyle: 'italic',
          fontSize: size * 0.4,
        }}>
        {pictureUrl
          ? <img src={pictureUrl} alt="profile" className="w-full h-full object-cover" />
          : initial}
      </div>

      {editable && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title="Upload a profile picture"
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: '#faf8f2', color: '#6b6358', border: '1px solid #ddd0b6' }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => upload(e.target.files?.[0])}
      />
    </div>
  );
}