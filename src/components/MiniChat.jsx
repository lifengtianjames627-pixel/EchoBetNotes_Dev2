import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus, MessageSquare, ShieldAlert, Clock } from 'lucide-react';
import { useFriendStatus } from '@/shared/chat/useFriendStatus';
import { useFriendMutation } from '@/features/friends/queries/useFriendRequests';
import FriendRequestFeedback from '@/features/friends/components/FriendRequestFeedback';
import { useChat, makeChatId } from '@/lib/useChat';
import { findContactInfo } from '@/lib/contactFilter';
import ReportButton from '@/components/soulmate/ReportButton';

const MAX_MESSAGES = 5;

export default function MiniChat({ peer, currentUser, onClose }) {
  const [text, setText] = useState('');
  const [warning, setWarning] = useState(null);
  const bottomRef = useRef(null);

  const chatId = currentUser?.email && peer?.email
    ? makeChatId(currentUser.email, peer.email)
    : null;

  const { messages, send } = useChat({ chatId, currentUser, limit: 30 });

  const myMessages = messages.filter(m => m.sender_email === currentUser?.email);
  const limitReached = myMessages.length >= MAX_MESSAGES;

  const { isFriend, sentRequest, incomingRequest, query: friendQuery } = useFriendStatus(currentUser?.email, peer?.email);
  const alreadySentRequest = isFriend || sentRequest;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendFriendRequest = useFriendMutation();
  useEffect(() => { sendFriendRequest.reset(); }, [peer?.email]);

  // Contact details stay out of chat: in-app messages are logged and reportable,
  // an exchanged handle is not.
  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    const contact = findContactInfo(content);
    if (contact.length > 0) {
      setWarning(`Keep it in echoesbetweennotes — remove your ${contact.join(', ')}.`);
      return;
    }
    setWarning(null);
    setText('');
    send.mutate(content);
  };

  if (!currentUser || !peer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed bottom-6 right-6 z-[200] w-80 rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: '#faf8f2',
        border: '1px solid #e0d8c8',
        boxShadow: '0 8px 30px rgba(120,100,80,0.18)',
        height: 440,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid #e0d8c8', background: '#e6ddc9' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
          style={{ background: '#f1ebdd', color: '#8a5a20' }}>
          {(peer.name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#1a1815' }}>{peer.name || 'Anonymous'}</p>
          <p className="text-[10px]" style={{ color: '#6b6358' }}>
            Temporary chat · {Math.max(0, MAX_MESSAGES - myMessages.length)} messages left
          </p>
        </div>
        <ReportButton
          targetType="chat_message"
          targetId={chatId}
          targetSummary={messages.slice(-6).map(m => `${m.sender_name}: ${m.content}`).join('\n')}
          targetAuthorEmail={peer.email}
          currentUser={currentUser}
        />
        <button onClick={onClose} style={{ color: '#6b6358' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
            <MessageSquare className="w-8 h-8" style={{ color: '#cdc3b1' }} />
            <p className="text-xs text-center" style={{ color: '#6b6358' }}>
              Start a conversation!<br />You have {MAX_MESSAGES} messages to make a connection.
            </p>
            <p className="text-[10px] text-center mt-1" style={{ color: '#8a7e6f' }}>
              Never share your phone, WeChat or QQ here.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_email === currentUser.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap flex items-end gap-1.5"
                style={{
                  background: isMe ? '#f1ebdd' : '#f5f2ea',
                  color: '#1a1815',
                  border: `1px solid ${isMe ? '#ddd0b6' : '#e6ddc9'}`,
                  opacity: msg._pending ? 0.6 : 1,
                }}>
                <span>{msg.content}</span>
                {msg._pending && <Clock className="w-2.5 h-2.5 shrink-0 mb-0.5 opacity-70" />}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Contact-info warning */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden shrink-0 px-3"
          >
            <div className="flex gap-2 rounded-xl p-2.5 mb-1"
              style={{ background: '#f6efe1', border: '1px solid #ddd0b6' }}>
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#a0522d' }} />
              <p className="text-[10px] leading-relaxed" style={{ color: '#8a5a20' }}>{warning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Limit reached → Friend CTA */}
      {limitReached && (
        <div className="px-3 pb-3 shrink-0">
          <div className="rounded-xl p-3 text-center space-y-2"
            style={{ background: '#f6efe1', border: '1px solid #e0d8c8' }}>
            <p className="text-xs" style={{ color: '#5a534a' }}>
              Message limit reached! Add {peer.name || 'them'} as a friend to keep chatting.
            </p>
            <FriendRequestFeedback query={friendQuery} mutation={sendFriendRequest} incoming={!isFriend && incomingRequest} />
            {alreadySentRequest ? (
              <p className="text-xs font-semibold" style={{ color: '#4d5f3f' }}>✓ Friend request sent!</p>
            ) : (
              <button
                onClick={() => sendFriendRequest.mutate({ action: 'send', target_email: peer.email })}
                disabled={sendFriendRequest.isPending || friendQuery.isPending || friendQuery.isError || incomingRequest}
                className="flex items-center gap-1.5 mx-auto px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
                <UserPlus className="w-3.5 h-3.5" />
                {sendFriendRequest.isPending ? 'Sending…' : 'Add Friend'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      {!limitReached && (
        <div className="px-3 pb-3 pt-1 shrink-0" style={{ borderTop: '1px solid #e6ddc9' }}>
          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }}
              placeholder="Type a message…"
              value={text}
              onChange={e => { setText(e.target.value); if (warning) setWarning(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <button
              disabled={!text.trim()}
              onClick={handleSend}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6', opacity: text.trim() ? 1 : 0.5 }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}