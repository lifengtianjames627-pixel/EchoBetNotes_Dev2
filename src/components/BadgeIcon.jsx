import React from 'react';
import {
  BookMarked, Bookmark, BookOpen, Sunrise, CalendarDays, Hourglass, Clock3,
  NotebookPen, PenTool, Library, Music4, GraduationCap, Eye, Stamp, Feather,
  Quote, Award, MessageSquare, MessagesSquare, Users, Scroll,
} from 'lucide-react';
import { BADGE_MAP } from '@/lib/badgeConfig';

const ICONS = {
  BookMarked, Bookmark, BookOpen, Sunrise, CalendarDays, Hourglass, Clock3,
  NotebookPen, PenTool, Library, Music4, GraduationCap, Eye, Stamp, Feather,
  Quote, Award, MessageSquare, MessagesSquare, Users, Scroll,
};

// A badge reads like a library seal pressed into paper: a soft cream plaque,
// a thin ink border, the family's icon in muted ink, and tier marks (· ·· ···)
// along the bottom. No glow, no gradients, no saturated colour.
export default function BadgeIcon({ badgeId, size = 'md', locked = false, showName = false, onClick }) {
  const badge = BADGE_MAP[badgeId];
  if (!badge) return null;

  const sizeMap = { xs: 28, sm: 44, md: 62, lg: 82 };
  const s = sizeMap[size] || 62;
  const Icon = ICONS[badge.icon] || Bookmark;
  const ink = locked ? '#a9a094' : badge.color;

  return (
    <div
      className={`flex flex-col items-center gap-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      title={`${badge.name} — ${badge.desc}`}
    >
      <div
        className="relative flex flex-col items-center justify-center"
        style={{
          width: s,
          height: s,
          background: locked ? '#f0ece2' : '#f7f2e6',
          border: `1px solid ${locked ? '#e2dbcc' : ink}`,
          borderRadius: Math.round(s * 0.16),
          opacity: locked ? 0.55 : 1,
        }}
      >
        <Icon style={{ width: s * 0.38, height: s * 0.38, color: ink }} strokeWidth={1.5} />
        {s >= 44 && (
          <div className="flex items-center gap-[3px]" style={{ marginTop: s * 0.08 }}>
            {[1, 2, 3].map(i => (
              <span
                key={i}
                style={{
                  width: 3, height: 3, borderRadius: 999,
                  background: i <= badge.tier ? ink : 'transparent',
                  border: i <= badge.tier ? 'none' : `1px solid ${locked ? '#ddd6c6' : '#ddd0b6'}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      {showName && (
        <span
          className="text-center leading-tight"
          style={{
            fontSize: Math.round(s * 0.15),
            color: locked ? '#a9a094' : '#5a534a',
            maxWidth: s + 20,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {badge.name}
        </span>
      )}
    </div>
  );
}