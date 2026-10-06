import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function SetupSubmit({ pending }) {
  return <button type="submit" disabled={pending} className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:opacity-60 transition-colors" style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}>{pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enter echoesbetweennotes <ArrowRight className="w-4 h-4" /></>}</button>;
}