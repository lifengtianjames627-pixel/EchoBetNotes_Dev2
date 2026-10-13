import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const V = { bg: '#f3efe6', card: '#faf8f2', border: '#e0d8c8', accent: '#bf7a35', text: '#1a1815', muted: '#6b6358' };

function Section({ title, children }) {
  return (
    <div>
      <p className="text-sm font-semibold mb-1" style={{ color: '#1a1815' }}>{title}</p>
      <p className="text-sm leading-relaxed" style={{ color: '#5a534a' }}>{children}</p>
    </div>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: V.bg }}>
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs mb-5" style={{ color: V.muted }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: V.accent }}>Legal</p>
        <h1 className="font-playfair text-4xl italic mt-1" style={{ color: V.text }}>Privacy Policy</h1>
        <div className="h-px w-20 mt-5 mb-8" style={{ background: V.border }} />
        <div className="space-y-5 p-7" style={{ background: V.card, border: `1px solid ${V.border}` }}>
          <Section title="What we collect">
            Your email and display name for your account; the profile details you choose to add (bio, music preferences, profile picture); and the reviews and messages you write.
          </Section>
          <Section title="Who can see your messages">
            Direct messages are strictly between the two participants. No one else — not even administrators — can read your conversations.
          </Section>
          <Section title="Who can see your profile">
            Your public profile (name, badges, reviews) is visible to other members. Administrators can see your registration date and aggregate usage averages for community management — never your messages.
          </Section>
          <Section title="Reporting & safety">
            Reports capture a snapshot of the reported content so moderators can review it without opening private conversations.
          </Section>
          <Section title="Contact">
            Questions about privacy? Reach out to a site administrator from your profile page.
          </Section>
        </div>
      </div>
    </div>
  );
}