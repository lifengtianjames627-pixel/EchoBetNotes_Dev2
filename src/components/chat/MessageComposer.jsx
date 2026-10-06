import React, { useRef, useState } from 'react';
import { Send, Smile, Paperclip, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EmojiPicker from './EmojiPicker';

const MAX = 2000;

// Multi-line composer: Enter inserts a newline, the send button (or ⌘/Ctrl+Enter)
// sends. Supports a character counter, emoji palette and image/PDF attachments.
export default function MessageComposer({ V, value, onChange, onSend, placeholder }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [pending, setPending] = useState(null); // { url, name, kind }
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    setPending({
      url: file_url,
      name: file.name,
      kind: file.type?.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file',
    });
  };

  const submit = () => {
    const content = value.trim();
    if (!content && !pending) return;
    const sent = onSend({
      content: content || pending.name,
      attachment_url: pending?.url,
      attachment_name: pending?.name,
      attachment_kind: pending?.kind,
    });
    if (sent !== false) setPending(null);
  };

  return (
    <div className="px-5 py-3 shrink-0" style={{ borderTop: `1px solid ${V.border}`, background: '#e6ddc9' }}>
      {pending && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full w-fit max-w-full"
          style={{ background: '#faf8f2', border: `1px solid ${V.border}` }}>
          {pending.kind === 'image' && <img src={pending.url} alt="" className="w-6 h-6 rounded object-cover" />}
          <span className="text-xs truncate max-w-[220px]" style={{ color: V.text }}>{pending.name}</span>
          <button onClick={() => setPending(null)} style={{ color: V.muted }}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex items-center gap-1 pb-1.5">
          <button
            type="button"
            onClick={() => setShowEmoji(s => !s)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ color: V.muted }}
            title="Emoji"
          >
            <Smile className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ color: V.muted }}
            title="Image or PDF"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={pickFile} />
          {showEmoji && (
            <EmojiPicker V={V} onPick={(e) => onChange(value + e)} onClose={() => setShowEmoji(false)} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            rows={1}
            maxLength={MAX}
            className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none resize-none max-h-40"
            style={{ background: '#ffffff', border: `1px solid ${V.border}`, color: V.text }}
            placeholder={placeholder}
            value={value}
            onChange={e => {
              onChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
            }}
          />
          <p className="text-[10px] mt-1 px-1 flex justify-between" style={{ color: V.muted }}>
            <span>Enter = new line · ⌘/Ctrl + Enter = send</span>
            <span>{value.length}/{MAX}</span>
          </p>
        </div>

        <button
          onClick={submit}
          aria-label="Send message"
          disabled={!value.trim() && !pending}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-6"
          style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6', opacity: (value.trim() || pending) ? 1 : 0.5 }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}