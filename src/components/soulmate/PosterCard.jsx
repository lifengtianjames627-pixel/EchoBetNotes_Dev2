import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, GraduationCap, Guitar, MessageSquare, Users } from 'lucide-react';
import ReportButton from '@/components/soulmate/ReportButton';
import { useLang } from '@/i18n/LanguageContext';
import PrivatePosterImage from '@/features/soulmate/components/PrivatePosterImage';

// Paper recruitment poster card. Location in ochre (the cross-cultural accent),
// square photo (no rounded / no scrim), black print contact button.
export default function PosterCard({ post, currentUser, index = 0 }) {
  const { t } = useLang();
  const isMine = post.author_email === currentUser?.email;
  const initial = (post.author_name || '?')[0].toUpperCase();

  const openChat = () => {
    if (isMine || !post.author_email) return;
    window.dispatchEvent(new CustomEvent('openMiniChat', {
      detail: { email: post.author_email, name: post.author_name || '' },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4 }}
      className="overflow-hidden flex flex-col transition-colors"
      style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}
    >
      {/* Poster image — square, no rounded, no scrim */}
      {post.poster_asset_id ? (
        <div className="relative aspect-[4/3] overflow-hidden shrink-0">
          <PrivatePosterImage post={post} className="w-full h-full object-cover" />
          <span
            className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1"
            style={{ background: '#faf8f2', color: '#bf7a35', border: '1px solid #e6ddc9' }}
          >
            {post.kind === 'band' ? t('sm.bandRecruiting') : t('sm.playerAvailable')}
          </span>
        </div>
      ) : (
        <div className="px-5 pt-5">
          <span
            className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1"
            style={{ background: '#f3efe6', color: '#bf7a35', border: '1px solid #e6ddc9' }}
          >
            {post.kind === 'band' ? t('sm.bandRecruiting') : t('sm.playerAvailable')}
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {post.band_name && (
          <p className="text-xs mb-1" style={{ color: '#8a7e6f' }}>{post.band_name}</p>
        )}
        <p className="font-playfair italic text-lg leading-tight" style={{ color: '#1a1815' }}>{post.title}</p>

        {/* Meta row — location in ochre */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]" style={{ color: '#6b6358' }}>
          {post.city && <span className="flex items-center gap-1" style={{ color: '#bf7a35' }}><MapPin className="w-3 h-3" />{post.city}</span>}
          {post.school && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{post.school}</span>}
          {post.commitment && <span>{t(`sm.commit.${post.commitment}`)}</span>}
        </div>

        {/* Looking for — warm gray tags */}
        {post.looking_for?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: '#8a7e6f' }}>
              {t('sm.lookingFor')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {post.looking_for.map(role => (
                <span key={role} className="text-[11px] px-2 py-0.5 font-medium"
                  style={{ background: '#f3efe6', color: '#1a1815', border: '1px solid #e0d8c8' }}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Plays */}
        {post.i_play?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px]" style={{ color: '#6b6358' }}>
            <Guitar className="w-3 h-3 shrink-0" style={{ color: '#bf7a35' }} />
            <span>{t('sm.plays')} {post.i_play.join(' · ')}</span>
          </div>
        )}

        {post.influences && (
          <p className="text-[11px] mt-2 italic" style={{ color: '#8a7e6f' }}>
            {t('sm.soundsLike')} {post.influences}
          </p>
        )}

        {post.description && (
          <p className="text-xs leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: '#5a534a' }}>
            {post.description}
          </p>
        )}

        {post.genre_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.genre_tags.map(tag => (
              <span key={tag} className="text-[10px]" style={{ color: '#bf7a35' }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Author + contact — print button */}
        <div className="flex items-center gap-2.5 mt-auto pt-4" style={{ borderTop: '1px solid #e6ddc9' }}>
          <button
            onClick={openChat}
            disabled={isMine}
            title={isMine ? 'This is your post' : `Message ${post.author_name || 'them'}`}
            className="w-9 h-9 flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
            style={{
              background: '#1a1815',
              color: '#faf8f2',
              cursor: isMine ? 'default' : 'pointer',
              opacity: isMine ? 0.5 : 1,
            }}
          >
            {initial}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: '#1a1815' }}>
              {post.author_name || t('sm.anonymous')}
            </p>
            <p className="text-[10px]" style={{ color: '#8a7e6f' }}>
              {isMine ? t('sm.yourPost') : t('sm.tapAvatar')}
            </p>
          </div>

          {!isMine && (
            <button
              onClick={openChat}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 font-semibold shrink-0 transition-colors hover:bg-[#1a1815] hover:text-[#faf8f2]"
              style={{ color: '#1a1815', border: '1px solid #1a1815' }}
            >
              <MessageSquare className="w-3 h-3" /> {t('sm.message')}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="flex items-center gap-1 text-[10px]" style={{ color: '#8a7e6f' }}>
            <Users className="w-3 h-3" /> {t('sm.inAppOnly')}
          </span>
          <ReportButton
            targetType="recruit_post"
            targetId={post.id}
            targetSummary={`${post.title} — ${post.description || ''}`}
            targetAuthorEmail={post.author_email}
            currentUser={currentUser}
          />
        </div>
      </div>
    </motion.div>
  );
}