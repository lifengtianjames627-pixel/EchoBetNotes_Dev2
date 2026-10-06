import React from 'react';
import { Music2 } from 'lucide-react';

export default function SetupHeader() {
  return <header className="text-center mb-8">
    <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center" style={{ background: '#f1ebdd', border: '1px solid #ddd0b6', borderRadius: 10 }}><Music2 className="w-5 h-5" style={{ color: '#bf7a35' }} /></div>
    <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: '#bf7a35' }}>Your listening card</p>
    <h1 className="font-playfair italic text-4xl mt-2" style={{ color: '#1a1815' }}>Set your rhythm</h1>
    <p className="text-sm mt-3 max-w-md mx-auto" style={{ color: '#6b6358' }}>A few details make your echoesbetweennotes profile feel like yours.</p>
  </header>;
}