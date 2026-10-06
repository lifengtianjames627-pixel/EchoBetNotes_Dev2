import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';

// Paper safety notice — ochre icon, muted ink.
export default function SafetyNotice({ compact = false }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  return (
    <div className="overflow-hidden" style={{ background: '#faf8f2', border: '1px solid #e6ddc9' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
      >
        <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#bf7a35' }} />
        <p className="text-xs font-semibold flex-1" style={{ color: '#1a1815' }}>
          {t('sm.safety.title')}
        </p>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" style={{ color: '#8a7e6f' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5 text-xs leading-relaxed" style={{ color: '#6b6358' }}>
              {[1, 2, 3, 4].map(n => (
                <p key={n}>
                  <span style={{ color: '#bf7a35' }}>{t(`sm.safety.k${n}`)}</span> {t(`sm.safety.b${n}`)}
                </p>
              ))}
              {!compact && (
                <p className="pt-2 mt-1" style={{ borderTop: '1px solid #e6ddc9', color: '#8a7e6f' }}>
                  {t('sm.safety.legal')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}