import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { displayName } from '@/lib/displayName';

const REASONS = [
  { id: 'contact_info', label: 'Sharing phone / WeChat / QQ' },
  { id: 'asking_for_money', label: 'Asking for money or fees' },
  { id: 'adult_contacting_minor', label: 'An adult contacting a minor' },
  { id: 'harassment', label: 'Harassment or threats' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'spam', label: 'Spam or advertising' },
  { id: 'other', label: 'Something else' },
];

// Every post and message needs a path to a human. This writes a Report record
// that admins pick up in the moderation queue.
export default function ReportButton({ targetType, targetId, targetSummary, targetAuthorEmail, currentUser }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: () => base44.entities.Report.create({
      target_type: targetType,
      target_id: targetId,
      target_summary: (targetSummary || '').slice(0, 500),
      target_author_email: targetAuthorEmail || '',
      reporter_email: currentUser?.email || '',
      reporter_name: displayName(currentUser),
      reason,
      details,
      status: 'open',
    }),
    onSuccess: () => setSent(true),
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Report this"
        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-all hover:scale-105"
        style={{ color: 'rgba(140,155,210,0.5)' }}
      >
        <Flag className="w-3 h-3" /> Report
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ background: 'rgba(10,13,32,0.98)', border: '1px solid rgba(124,111,255,0.3)', boxShadow: '0 0 50px rgba(124,111,255,0.15)' }}
              onClick={e => e.stopPropagation()}
            >
              {sent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(134,239,172,0.15)', border: '1px solid rgba(134,239,172,0.35)' }}>
                    <Check className="w-5 h-5" style={{ color: '#86efac' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#86efac' }}>Report sent</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(150,165,215,0.7)' }}>
                    A moderator will review this. If you feel unsafe, stop replying and tell a trusted adult.
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-xs px-4 py-1.5 rounded-full"
                    style={{ border: '1px solid rgba(124,111,255,0.35)', color: '#a5b4fc' }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-playfair italic text-lg" style={{ color: '#e8e9ff' }}>Report</p>
                    <button onClick={() => setOpen(false)} style={{ color: 'rgba(140,155,210,0.5)' }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {REASONS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setReason(r.id)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                        style={reason === r.id
                          ? { background: 'rgba(124,111,255,0.2)', border: '1px solid rgba(124,111,255,0.45)', color: '#c4baff' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.12)', color: 'rgba(180,195,235,0.75)' }
                        }
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="w-full mt-3 px-3 py-2 rounded-xl text-xs outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
                    rows={2}
                    placeholder="Anything else we should know? (optional)"
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                  />

                  <button
                    disabled={!reason || submit.isPending}
                    onClick={() => submit.mutate()}
                    className="w-full mt-3 py-2 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(248,113,113,0.18)',
                      border: '1px solid rgba(248,113,113,0.4)',
                      color: '#fca5a5',
                      opacity: !reason || submit.isPending ? 0.5 : 1,
                    }}
                  >
                    {submit.isPending ? 'Sending…' : 'Submit report'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}