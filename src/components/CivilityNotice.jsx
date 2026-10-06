import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';

export default function CivilityNotice({ v }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl mb-4 overflow-hidden"
      style={{ border: `1px solid ${v.accent}30`, background: `${v.accent}08` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: v.accent }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: v.accent }}>
            Community Guidelines
          </span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: v.muted }} />
          : <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: v.muted }} />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5" style={{ borderTop: `1px solid ${v.accent}20` }}>
              <p className="text-xs leading-relaxed pt-2.5" style={{ color: v.muted }}>
                We welcome passionate music opinions — harsh critiques included. But please keep it about the <strong style={{ color: v.text }}>music</strong>, not the person.
              </p>
              <ul className="text-xs space-y-1" style={{ color: v.muted }}>
                <li>• Be specific — vague praise or hate adds nothing</li>
                <li>• Disagree with others' reviews constructively</li>
                <li>• No personal attacks, slurs, or targeted harassment</li>
                <li>• Spoilers about lyrics/themes are fine — this is a critics' space</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}