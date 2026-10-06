import React, { useState } from 'react';
import { X } from 'lucide-react';

// Predefined tag options organized by category
export const TAG_OPTIONS = [
  // Rock family
  'alternative rock', 'indie rock', 'post-rock', 'art rock', 'progressive rock',
  'classic rock', 'hard rock', 'punk rock', 'noise rock', 'math rock',
  // Metal family
  'heavy metal', 'thrash metal', 'death metal', 'black metal', 'doom metal',
  'post-metal', 'nu-metal', 'power metal', 'folk metal',
  // Electronic family
  'ambient', 'techno', 'house', 'IDM', 'trip-hop', 'drum and bass', 'synthwave',
  'electropop', 'shoegaze', 'dream pop', 'darkwave',
  // Hip-hop/R&B
  'boom bap', 'trap', 'conscious rap', 'lo-fi hip hop', 'neo soul', 'funk',
  // Indie/Alternative
  'indie pop', 'chamber pop', 'folk pop', 'baroque pop', 'jangle pop',
  // Jazz family
  'bebop', 'free jazz', 'fusion', 'smooth jazz', 'jazz rap',
  // Other
  'post-punk', 'new wave', 'emo', 'screamo', 'grunge', 'ska',
  'psychedelic', 'experimental', 'noise', 'avant-garde',
  'concept album', 'live album', 'debut', 'EP',
];

export default function TagPicker({ tags = [], onChange, v }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = input.length > 0
    ? TAG_OPTIONS.filter(t => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t))
    : TAG_OPTIONS.filter(t => !tags.includes(t)).slice(0, 12);

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative">
      {/* Selected tags + input */}
      <div
        className="flex flex-wrap gap-1.5 min-h-[40px] px-3 py-2 rounded-lg cursor-text"
        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${v.accent}30` }}
        onClick={() => document.getElementById('tag-input')?.focus()}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${v.accent}20`, color: v.accent, border: `1px solid ${v.accent}35` }}
          >
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} className="opacity-60 hover:opacity-100">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          id="tag-input"
          className="flex-1 min-w-[80px] text-xs outline-none bg-transparent"
          style={{ color: v.text }}
          placeholder={tags.length === 0 ? 'Type or pick a tag…' : ''}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl p-2 z-50 max-h-44 overflow-y-auto"
          style={{ background: 'rgba(10,12,30,0.97)', border: `1px solid ${v.accent}30`, boxShadow: `0 8px 30px rgba(0,0,0,0.5)` }}
        >
          <div className="flex flex-wrap gap-1.5">
            {filtered.map(tag => (
              <button
                key={tag}
                type="button"
                className="text-xs px-2.5 py-1 rounded-full transition-all hover:scale-105"
                style={{ background: `${v.accent}12`, color: `${v.accent}cc`, border: `1px solid ${v.accent}25` }}
                onMouseDown={() => addTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-[10px] mt-1" style={{ color: `${v.muted}60` }}>Press Enter or comma to add a custom tag</p>
    </div>
  );
}