import React, { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';

export default function LocationDialog({ title, description, onClose, busy, children }) {
  const { t } = useLang();
  const opener = useRef(document.activeElement);
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[300] bg-foreground/70" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[310] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card text-card-foreground shadow-xl p-5 max-h-[90dvh] overflow-y-auto"
        onCloseAutoFocus={e => { e.preventDefault(); opener.current?.focus(); }}>
        <Dialog.Title className="font-playfair italic text-lg pr-8">{title}</Dialog.Title>
        <Dialog.Description className="text-xs text-muted-foreground mt-2 mb-3">{description}</Dialog.Description>
        <Dialog.Close disabled={busy} aria-label={t('location.close')} className="absolute right-4 top-4 p-1 text-muted-foreground disabled:opacity-50"><X className="w-4 h-4" /></Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}