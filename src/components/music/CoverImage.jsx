import React, { useState } from 'react';
import { Music } from 'lucide-react';

// When a real cover URL exists, show it. When it's missing or fails to load,
// show a clean, honest placeholder (title + music note) — never fake
// performance photography masquerading as album art.
export default function CoverImage({ src, alt, className, loading = 'lazy' }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`${className || ''} bg-muted`}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
        <Music className="h-6 w-6 shrink-0 text-muted-foreground" />
        <span className="line-clamp-3 text-xs leading-tight text-muted-foreground">
          {alt}
        </span>
      </div>
    </div>
  );
}