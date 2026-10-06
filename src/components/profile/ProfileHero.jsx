import React from 'react';
import BadgeIcon from '@/components/BadgeIcon';
import ProfileAvatar from './ProfileAvatar';

// Paper masthead shared by your own profile and other members' profiles —
// same print-media language as Written Reviews: cream card, ochre hairline,
// serif italic name. No aurora, no vinyl ring, no equaliser.
export default function ProfileHero({ name, email, initial, badges = [], online, statusText, pictureUrl, editable, onPictureUploaded, children }) {
  return (
    <div className="mb-6" style={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 12 }}>
      <div className="h-px w-full" style={{ background: '#bf7a35', opacity: 0.55 }} />
      <div className="px-5 sm:px-7 pt-7 pb-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <ProfileAvatar
              pictureUrl={pictureUrl}
              initial={initial}
              size={74}
              editable={editable}
              onUploaded={onPictureUploaded}
            />
            {online !== undefined && online !== null && (
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full"
                style={{
                  background: online ? '#5f7a4f' : '#c4bba9',
                  border: '2.5px solid #faf8f2',
                }} />
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-playfair italic text-2xl sm:text-3xl leading-tight truncate" style={{ color: '#1a1815' }}>
              {name}
            </h1>
            <p className="text-xs mt-1.5 truncate" style={{ color: '#6b6358' }}>
              {statusText || email}
            </p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {badges.map(id => <BadgeIcon key={id} badgeId={id} size="xs" />)}
              </div>
            )}
          </div>
        </div>

        {children && <div className="flex flex-wrap gap-2.5 mt-5">{children}</div>}
      </div>
    </div>
  );
}