import React from 'react';

const EMOJIS = [
  '😀','😄','😊','🙂','😉','😍','🤩','😎','🤔','😴',
  '😢','😭','😡','😱','🤯','🙃','😇','🤗','🥳','😬',
  '👍','👎','👏','🙏','💪','✌️','🤝','👋','🫶','🔥',
  '❤️','💔','✨','🌟','🎵','🎶','🎸','🥁','🎹','🎤',
  '🎧','🎷','🎻','📀','💿','🎬','📖','☕','🌙','☀️',
];

// Small paper-style emoji palette — inserts the glyph at the end of the draft.
export default function EmojiPicker({ V, onPick, onClose }) {
  return (
    <div
      className="absolute bottom-full mb-2 left-0 z-20 p-2 rounded-2xl grid grid-cols-10 gap-0.5 w-[300px]"
      style={{ background: V.card, border: `1px solid ${V.border}`, boxShadow: '0 8px 24px rgba(120,100,80,0.18)' }}
    >
      {EMOJIS.map(e => (
        <button
          key={e}
          type="button"
          onClick={() => { onPick(e); onClose(); }}
          className="w-7 h-7 rounded-lg text-base leading-none hover:bg-[#f1ebdd]"
        >
          {e}
        </button>
      ))}
    </div>
  );
}