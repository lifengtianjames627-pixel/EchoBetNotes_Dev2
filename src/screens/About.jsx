import React from 'react';
import { motion } from 'framer-motion';
import { Music2, Heart, Users } from 'lucide-react';

// Paper journal aesthetic — cream base, near-black ink, ochre accent.
export default function About() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: '#f3efe6' }}>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 flex items-center justify-center" style={{ background: '#faf8f2', border: '1px solid #e0d9c8' }}>
              <Music2 className="w-6 h-6" style={{ color: '#bf7a35' }} />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: '#bf7a35' }}>Echo Between Notes</p>
          <h1 className="mt-2 font-playfair text-5xl italic leading-tight" style={{ color: '#1a1815' }}>About Us</h1>
          <div className="h-px mx-auto w-20 mt-5" style={{ background: '#e0d9c8' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 mb-8"
          style={{ background: '#faf8f2', border: '1px solid #e0d9c8' }}
        >
          <p className="text-base leading-relaxed" style={{ color: '#4a4a4a' }}>
            We are a group of high school students united by one thing: a genuine, deep love for music. Across every hallway conversation and late-night playlist session, we kept running into the same problem — there was no real home on the internet for people who <em>truly</em> appreciate music across all its forms, not just the mainstream charts. So we built one. <strong style={{ color: '#1a1815' }}>Echo Between Notes</strong> is our attempt to create a platform where every genre gets the attention and respect it deserves — a space for honest reviews, real conversation, and the kind of passion that only comes from people who actually care. Whether you're deep into jazz, obsessed with metal, or rediscovering classic country, you belong here.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Music2, title: 'Every Genre', desc: 'From classical to hardcore — no genre left behind.' },
            { icon: Heart, title: 'Real Passion', desc: 'Built by music lovers, for music lovers.' },
            { icon: Users, title: 'Community First', desc: 'A place to share, discover, and connect.' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="p-5 text-center"
              style={{ background: '#faf8f2', border: '1px solid #e0d9c8' }}
            >
              <Icon className="w-5 h-5 mx-auto mb-3" style={{ color: '#bf7a35' }} />
              <p className="text-sm font-semibold mb-1" style={{ color: '#1a1815' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5a5a5a' }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}