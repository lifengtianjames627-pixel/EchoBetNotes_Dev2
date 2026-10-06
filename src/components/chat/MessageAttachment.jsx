import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

// Renders an attached image inline, a PDF as an inline preview + open link,
// or any other file as a tappable paper chip.
export default function MessageAttachment({ V, url, name, kind }) {
  if (!url) return null;
  if (kind === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
        <img src={url} alt={name || ''} className="rounded-xl max-h-56 max-w-full object-cover" style={{ border: `1px solid ${V.border}` }} />
      </a>
    );
  }
  if (kind === 'pdf') {
    return (
      <div className="mt-1">
        <object
          data={url}
          type="application/pdf"
          className="w-full rounded-xl"
          style={{ height: 220, border: `1px solid ${V.border}`, background: '#faf8f2' }}
          aria-label={name || 'PDF'}
        >
          {/* Fallback shown when the browser can't embed the PDF inline */}
          <div className="flex items-center gap-2 px-3 py-2" style={{ color: '#8a5a20' }}>
            <FileText className="w-4 h-4 shrink-0" />
            <span className="text-xs truncate max-w-[220px]">{name || 'Attachment'}</span>
          </div>
        </object>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-xl hover:underline w-fit"
          style={{ background: '#faf8f2', border: `1px solid ${V.border}`, color: '#8a5a20' }}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs truncate max-w-[220px]">{name || 'Attachment'}</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl hover:underline"
      style={{ background: '#faf8f2', border: `1px solid ${V.border}`, color: '#8a5a20' }}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="text-xs truncate max-w-[220px]">{name || 'Attachment'}</span>
    </a>
  );
}