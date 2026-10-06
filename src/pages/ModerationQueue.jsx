import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Check, X, Clock, AlertTriangle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/i18n/LanguageContext';
import RecruitModerationPanel from '@/features/soulmate/components/RecruitModerationPanel';

const STATUS_COLORS = {
  pending_review: { color: '#8a5a20', bg: '#f6efe1', label: 'Pending Review' },
  approved: { color: '#4d5f3f', bg: '#eaeee0', label: 'Approved' },
  blocked: { color: '#9c3b33', bg: '#f3e2df', label: 'Blocked' },
};

function ModCard({ item, type, onApprove, onReject, isPending }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_COLORS[item.moderation_status] || STATUS_COLORS.pending_review;
  const isReview = type === 'review';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-3"
      style={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 10 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ background: isReview ? '#e6ddc9' : '#dcd0e0', color: isReview ? '#6b5a3a' : '#5a4a6b' }}>
              {isReview ? 'Review' : 'Comment'}
            </span>
            <span className="text-sm font-semibold" style={{ color: '#1a1815' }}>{item.reviewer_name || item.author_name || 'Anonymous'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
            {item.moderation_confidence != null && (
              <span className="text-xs opacity-50">confidence: {Math.round(item.moderation_confidence * 100)}%</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#6b6358' }}>
            {isReview
              ? `${item.album_title || '—'} · ${item.album_artist || '—'}`
              : `Comment on review`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onApprove(item.id)}
            disabled={isPending || item.moderation_status === 'approved'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#eaeee0', color: '#4d5f3f', border: '1px solid #d6dcc6', opacity: item.moderation_status === 'approved' ? 0.4 : 1 }}
          >
            <Check className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={() => onReject(item.id)}
            disabled={isPending || item.moderation_status === 'blocked'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#f3e2df', color: '#9c3b33', border: '1px solid #e6cdc8', opacity: item.moderation_status === 'blocked' ? 0.4 : 1 }}
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>

      {/* AI flag info */}
      {item.moderation_reason && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: '#f6efe1', border: '1px solid #e0d8c8' }}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#a0522d' }} />
          <div>
            <p className="text-xs" style={{ color: '#8a5a20' }}>{item.moderation_reason}</p>
            {item.moderation_categories?.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {item.moderation_categories.map(cat => (
                  <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f3e2df', color: '#9c3b33' }}>{cat}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {isReview && item.title && <p className="font-playfair italic text-sm mb-1" style={{ color: '#1a1815' }}>"{item.title}"</p>}
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#5a534a' }}>
          {expanded ? item.content : item.content?.slice(0, 200) + (item.content?.length > 200 ? '…' : '')}
        </p>
        {item.content?.length > 200 && (
          <button onClick={() => setExpanded(e => !e)} className="text-xs mt-1 flex items-center gap-1" style={{ color: '#bf7a35' }}>
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ModerationQueue() {
  const [filter, setFilter] = useState('pending_review');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLang();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['moderation-reviews', filter],
    queryFn: () => base44.entities.Review.filter(
      filter === 'all' ? {} : { moderation_status: filter },
      '-created_date',
      100
    ),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['moderation-comments', filter],
    queryFn: () => base44.entities.Comment.filter(
      filter === 'all' ? {} : { moderation_status: filter },
      '-created_date',
      100
    ),
  });

  // Merge reviews and comments into one list sorted by date (newest first)
  const items = [
    ...reviews.map(r => ({ ...r, _type: 'review' })),
    ...comments.map(c => ({ ...c, _type: 'comment' })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const isLoading = reviewsLoading || commentsLoading;

  const updateReviewStatus = useMutation({
    mutationFn: ({ id, status }) => base44.functions.invoke('editReview', { action: 'moderate', id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: q => /album|review|homeFeed/.test(String(q.queryKey[0])) });
    },
  });

  const updateCommentStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Comment.update(id, { moderation_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-comments'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3efe6' }}>
        <div className="text-center" style={{ color: '#6b6358' }}>
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Admin access required.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'pending_review', label: 'Pending', icon: Clock },
    { key: 'blocked', label: 'Blocked', icon: X },
    { key: 'approved', label: 'Approved', icon: Check },
    { key: 'all', label: 'All', icon: Shield },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f3efe6' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#f1ebdd', border: '1px solid #ddd0b6', borderRadius: 8 }}>
            <Shield className="w-5 h-5" style={{ color: '#bf7a35' }} />
          </div>
          <div>
            <h1 className="font-playfair italic text-2xl" style={{ color: '#1a1815' }}>Moderation Queue</h1>
            <p className="text-xs" style={{ color: '#6b6358' }}>Review flagged content before it goes public</p>
          </div>
          <button
            onClick={() => navigate('/moderation/stats')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}
          >
            <BarChart3 className="w-3.5 h-3.5" /> {t('mod.stats')}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={filter === key
                ? { background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }
                : { background: '#faf8f2', color: '#6b6358', border: '1px solid #e0d8c8' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: '#ece5d6' }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#8a7e6f' }}>
            <Check className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nothing in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs mb-4" style={{ color: '#8a7e6f' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} · {reviews.length} review{reviews.length !== 1 ? 's' : ''} · {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </p>
            <AnimatePresence>
              {items.map(item => (
                <ModCard
                  key={`${item._type}-${item.id}`}
                  item={item}
                  type={item._type}
                  isPending={updateReviewStatus.isPending || updateCommentStatus.isPending}
                  onApprove={(id) => item._type === 'review'
                    ? updateReviewStatus.mutate({ id, status: 'approved' })
                    : updateCommentStatus.mutate({ id, status: 'approved' })}
                  onReject={(id) => item._type === 'review'
                    ? updateReviewStatus.mutate({ id, status: 'blocked' })
                    : updateCommentStatus.mutate({ id, status: 'blocked' })}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        <RecruitModerationPanel filter={filter} />
      </div>
    </div>
  );
}