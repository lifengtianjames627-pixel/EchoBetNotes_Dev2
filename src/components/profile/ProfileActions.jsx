import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, MessageSquare, Check, Clock, Send, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { makeChatId } from '@/lib/useChat';
import { useFriendStatus } from '@/shared/chat/useFriendStatus';
import { useFriendMutation } from '@/features/friends/queries/useFriendRequests';
import FriendRequestFeedback from '@/features/friends/components/FriendRequestFeedback';
import { displayName } from '@/lib/displayName';

// Friend + message controls on another member's profile.
// Before you are friends you get exactly ONE message — enough to introduce
// yourself, not enough to pester anyone. Once the friend request is accepted the
// button simply opens the full conversation.
export default function ProfileActions({ me, targetEmail, targetName }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');

  const chatId = me ? makeChatId(me.email, targetEmail) : null;

  const { isFriend, sentRequest: pendingOut, incomingRequest: pendingIn, query: friendQuery } = useFriendStatus(me?.email, targetEmail);
  const { data: messages = [] } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => base44.entities.ChatMessage.filter({ chat_id: chatId }, 'created_date', 200),
    enabled: !!chatId,
  });

  const mySent = messages.filter(m => m.sender_email === me?.email).length;
  const introUsed = !isFriend && mySent >= 1;

  const addFriend = useFriendMutation();

  const sendIntro = useMutation({
    mutationFn: () => base44.entities.ChatMessage.create({
      chat_id: chatId,
      sender_email: me.email,
      sender_name: displayName(me),
      content: text.trim(),
    }),
    onSuccess: () => {
      setText(''); setComposing(false);
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
  });

  const pill = (extra = {}) => ({
    background: '#f1ebdd',
    color: '#8a5a20',
    border: '1px solid #e0d8c8',
    ...extra,
  });

  return (
    <div className="w-full">
      <FriendRequestFeedback query={friendQuery} mutation={addFriend} incoming={!isFriend && pendingIn} />
      <div className="flex flex-wrap gap-2.5">
        {isFriend ? (
          <span className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold"
            style={pill({ background: '#eaeee0', color: '#4d5f3f', border: '1px solid #d6dcc6' })}>
            <Check className="w-3.5 h-3.5" /> Friends
          </span>
        ) : pendingOut ? (
          <span className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold" style={pill({ opacity: 0.75 })}>
            <Clock className="w-3.5 h-3.5" /> Request sent
          </span>
        ) : pendingIn ? (
          <span className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold" style={pill()}>
            <Clock className="w-3.5 h-3.5" /> They asked you — answer in your profile
          </span>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => addFriend.mutate({ action: 'send', target_email: targetEmail, notify: true })}
            disabled={addFriend.isPending || friendQuery.isPending || friendQuery.isError}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold"
            style={pill()}
          >
            <UserPlus className="w-3.5 h-3.5" /> {addFriend.isPending ? 'Sending…' : 'Add friend'}
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (isFriend) navigate(`/chat?with=${encodeURIComponent(targetEmail)}&name=${encodeURIComponent(targetName || targetEmail)}`);
            else if (!introUsed) setComposing(c => !c);
          }}
          disabled={introUsed}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold"
          style={pill({
            background: '#efe4d0',
            color: '#8a5a20',
            border: '1px solid #ddd0b6',
            opacity: introUsed ? 0.5 : 1,
          })}
        >
          {introUsed ? <Lock className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
          {isFriend ? 'Open chat' : introUsed ? 'Intro message used' : 'Send message'}
        </motion.button>
      </div>

      {!isFriend && (
        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: '#8a7e6f' }}>
          {introUsed
            ? 'One introduction message only — you can keep talking once your friend request is accepted.'
            : 'Before you are friends you can send one introduction message.'}
        </p>
      )}

      {composing && !isFriend && !introUsed && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && text.trim()) sendIntro.mutate(); }}
            placeholder="Say hi — one message…"
            className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
            style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }}
          />
          <button
            onClick={() => text.trim() && sendIntro.mutate()}
            disabled={!text.trim() || sendIntro.isPending}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={pill({ opacity: text.trim() ? 1 : 0.4 })}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}