import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';
import recruitCopy from '@/features/soulmate/i18n/recruitCopy';

const V = { bg: '#f3efe6', card: '#faf8f2', border: '#e0d8c8', accent: '#bf7a35', text: '#1a1815', muted: '#6b6358' };

function Section({ title, children }) {
  return (
    <div>
      <p className="text-sm font-semibold mb-1" style={{ color: '#1a1815' }}>{title}</p>
      <p className="text-sm leading-relaxed" style={{ color: '#5a534a' }}>{children}</p>
    </div>
  );
}

export default function Terms() {
  const { lang } = useLang();
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: V.bg }}>
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs mb-5" style={{ color: V.muted }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: V.accent }}>Legal</p>
        <h1 className="font-playfair text-4xl italic mt-1" style={{ color: V.text }}>Terms of Service</h1>
        <div className="h-px w-20 mt-5 mb-8" style={{ background: V.border }} />
        <div className="space-y-5 p-7" style={{ background: V.card, border: `1px solid ${V.border}` }}>
          <Section title="Who may use Echo Between Notes">
            {recruitCopy(lang).participation}
          </Section>
          <Section title="Be respectful">
            Write honestly and kindly. Hate speech, harassment, and spam are not tolerated and may be removed.
          </Section>
          <Section title="Keep contact in-app">
            For your safety, keep all communication inside the platform's messaging. Do not share or request personal contact details from other members.
          </Section>
          <Section title="Content you post">
            You own your reviews and messages, but you grant the platform a license to display them within Echo Between Notes. Inappropriate content may be moderated.
          </Section>
          <Section title="Liability">
            The platform is provided as-is for a school community. We are not liable for interactions between members; follow the in-app safety guidelines and report concerns.
          </Section>
        </div>
      </div>
    </div>
  );
}