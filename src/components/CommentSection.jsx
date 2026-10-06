import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { awardBadge } from '@/lib/badgeUtils';
import { publicName, initialOf } from '@/shared/identity';
import { useAuthed } from '@/shared/identity';
import { useContentModeration } from '@/shared/hooks/useContentModeration';
import { openPrivateChat } from '@/shared/chat/openPrivateChat';

// Extracted so both the album-detail modal and the review-reading modal can
// share the same comment UI (with AI moderation + badge awards).
export default function CommentSection({ reviewId, v, currentUser }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const { authed, login } = useAuthed();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === 'admin';
  const { moderate, status: commentMod } = useContentModeration();

  const { data: allComments = [] } = useQuery({
    queryKey: ['comments', reviewId],
    queryFn: () => base44.entities.Comment.filter({ review_id: reviewId }, 'created_date', 50),
    enabled: open,
  });
  // Only show approved comments publicly (same rule as reviews)
  const comments = allComments.filter(c => !c.moderation_status || c.moderation_status === 'approved');

  const addComment = useMutation({
    mutationFn: async (content) => {
      const modResult = await moderate(content);

      const modStatus = modResult.suggestedAction === 'review' ? 'pending_review' : 'approved';

      await base44.entities.Comment.create({
        review_id: reviewId,
        content,
        author_name: publicName(currentUser),
        author_email: currentUser?.email || '',
        moderation_status: modStatus,
        moderation_categories: modResult.categories,
        moderation_reason: modResult.reason,
        moderation_confidence: modResult.confidence,
      });

      return modStatus;
    },
    onSuccess: async (modStatus) => {
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] });
      setText('');
      if (modStatus === 'pending_review') {
        return;
      }
      // Check community badges for review author
      const review = await base44.entities.Review.filter({ id: reviewId });
      const reviewerEmail = review[0]?.reviewer_email;
      if (reviewerEmail) {
        const allReviews = await base44.entities.Review.filter({ reviewer_email: reviewerEmail });
        let total = 0;
        for (const r of allReviews) {
          const c = await base44.entities.Comment.filter({ review_id: r.id });
          total += c.length;
        }
        if (total >= 10) awardBadge(reviewerEmail, 'comments_10', queryClient);
        if (total >= 50) awardBadge(reviewerEmail, 'comments_50', queryClient);
        if (total >= 100) awardBadge(reviewerEmail, 'comments_100', queryClient);
        if (total >= 200) awardBadge(reviewerEmail, 'comments_200', queryClient);
      }
    },
    onError: () => {
      // 'blocked' status is set by the moderation hook
    },
  });

  return (
    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${v.cardBorder}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs"
        style={{ color: v.muted }}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {open ? 'Hide' : 'Comments'}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {commentMod === 'blocked' && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.25)', color: '#ff6b6b' }}>
                  🚫 Your comment may not meet community guidelines. Please revise and try again.
                </div>
              )}
              {commentMod === 'pending' && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                  ⏳ Your comment is being checked and will appear once approved.
                </div>
              )}
              {comments.map(c => {
                const canDelete = isAdmin || c.author_email === currentUser?.email;
                return (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: `${v.accent}25`, color: v.accent }}>
                      {initialOf(c.author_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => c.author_email && c.author_email !== currentUser?.email && openPrivateChat(c.author_email, publicName(c.author_name))}
                        className="text-xs font-semibold mr-1.5 hover:underline"
                        style={{ color: v.text, background: 'none', border: 'none', padding: 0, cursor: c.author_email && c.author_email !== currentUser?.email ? 'pointer' : 'default' }}
                      >
                        {publicName(c.author_name)}
                      </button>
                      <span className="text-xs" style={{ color: v.muted }}>{c.content}</span>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this comment?')) {
                            base44.entities.Comment.delete(c.id).then(() =>
                              queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
                            );
                          }
                        }}
                        className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                        style={{ color: '#dc2626' }}
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {authed ? (
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${v.accent}25`, color: v.text }}
                placeholder="Add a comment…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && text.trim()) addComment.mutate(text.trim()); }}
              />
              <button
                disabled={!text.trim() || addComment.isPending}
                onClick={() => text.trim() && addComment.mutate(text.trim())}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: `${v.accent}25`, color: v.accent }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            ) : (
              <button onClick={login} className="mt-3 w-full text-left text-xs" style={{ color: v.muted }}>Log in to comment</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}