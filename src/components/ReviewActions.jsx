import React from 'react';
import { ThumbsUp, ThumbsDown, Bell, BellOff } from 'lucide-react';
import useReviewVoting from '@/features/reviews/queries/useReviewVoting';
import voteCopy from '@/features/reviews/model/voteCopy';
import { useLang } from '@/i18n/LanguageContext';
import useReviewerSubscription from '@/features/reviews/queries/useReviewerSubscription';
import subscriptionCopy from '@/features/reviews/model/subscriptionCopy';
import { useAuthed } from '@/hooks/useAuthed';
import ReviewEditControl from '@/components/reviews/ReviewEditControl';

export default function ReviewActions({ review, v, currentUser }) {
  const { login } = useAuthed();
  const { lang } = useLang();
  const { voteMutation, voteLoading, myVote, likesCount, dislikesCount } = useReviewVoting({ review, currentUser });

  const { canSubscribe, isSubscribed: effectiveSub, mutation: subMutation, query: subQuery } = useReviewerSubscription(review, currentUser);
  const subCopy = subscriptionCopy(lang);
  const canVote = !!currentUser?.email;

  const btnBase = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all";

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <ReviewEditControl review={review} user={currentUser} />
      {voteMutation.isError && <p role="alert" className="basis-full text-xs text-destructive">{voteCopy(lang)}</p>}
      {/* Like */}
      <button
        className={btnBase}
        disabled={voteMutation.isPending || voteLoading}
        onClick={() => canVote ? voteMutation.mutate('like') : login()}
        title={canVote ? 'Like' : 'Login to vote'}
        style={{
          background: myVote === 'like' ? `${v.accent}30` : 'rgba(255,255,255,0.05)',
          color: myVote === 'like' ? v.accent : v.muted,
          border: `1px solid ${myVote === 'like' ? v.accent + '60' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: myVote === 'like' ? `0 0 8px ${v.accentGlow}` : 'none',
        }}
      >
        <ThumbsUp className="w-3 h-3" />
        <span>{likesCount}</span>
      </button>

      {/* Dislike */}
      <button
        className={btnBase}
        disabled={voteMutation.isPending || voteLoading}
        onClick={() => canVote ? voteMutation.mutate('dislike') : login()}
        title={canVote ? 'Dislike' : 'Login to vote'}
        style={{
          background: myVote === 'dislike' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.05)',
          color: myVote === 'dislike' ? '#f87171' : v.muted,
          border: `1px solid ${myVote === 'dislike' ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <ThumbsDown className="w-3 h-3" />
        <span>{dislikesCount}</span>
      </button>

      {canSubscribe && (subMutation.isError || subQuery.isError) && (
        <p role="alert" className="basis-full text-xs text-destructive">
          {subQuery.isError ? subCopy.loadFailed : subCopy.failed}
          {subQuery.isError && <button type="button" className="ml-2 underline" onClick={() => subQuery.refetch()}>{subCopy.retry}</button>}
        </p>
      )}
      {/* Subscribe */}
      {canSubscribe && (
        <button
          className={btnBase}
          disabled={subMutation.isPending || subQuery.isFetching || subQuery.isError}
          onClick={() => subMutation.mutate()}
          title={effectiveSub ? subCopy.remove : subCopy.add}
          style={{
            background: effectiveSub ? 'rgba(124,111,255,0.15)' : 'rgba(255,255,255,0.05)',
            color: effectiveSub ? 'hsl(var(--foreground))' : v.muted,
            border: `1px solid ${effectiveSub ? 'rgba(124,111,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {effectiveSub ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
          <span>{effectiveSub ? subCopy.subscribed : subCopy.subscribe}</span>
        </button>
      )}
    </div>
  );
}