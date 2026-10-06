import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import SetupHeader from '@/components/setup/SetupHeader';
import SetupName from '@/components/setup/SetupName';
import MusicPreferences from '@/components/setup/MusicPreferences';
import ProfileEssentials from '@/components/setup/ProfileEssentials';
import ConnectionChoices from '@/components/setup/ConnectionChoices';
import SetupSubmit from '@/components/setup/SetupSubmit';
import { randomAlias } from '@/lib/randomAlias';

export default function ProfileSetup() {
  const navigate = useNavigate(); const queryClient = useQueryClient(); const { updateCurrentUser } = useAuth();
  const [preferences, setPreferences] = useState([]); const [biography, setBiography] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [locationAllowed, setLocationAllowed] = useState(false); const [hasBand, setHasBand] = useState(false); const [bandName, setBandName] = useState('');
  const save = useMutation({ mutationFn: () => updateCurrentUser({ display_name: displayName.trim() || randomAlias(), music_preferences: preferences, biography, location_network_allowed: locationAllowed, has_band: hasBand, band_name: hasBand ? bandName : '', profile_completed: true }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['me'] }); navigate('/profile', { replace: true }); } });
  const toggle = item => setPreferences(items => items.includes(item) ? items.filter(x => x !== item) : [...items, item]);
  const change = (key, value) => { if (key === 'location') setLocationAllowed(value); if (key === 'band') setHasBand(value); if (key === 'bandName') setBandName(value); };
  return <div className="min-h-screen px-4 py-12" style={{ background: '#f3efe6' }}><div className="max-w-xl mx-auto"><SetupHeader /><form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="p-5 sm:p-7" style={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 12 }}><SetupName value={displayName} onChange={setDisplayName} /><MusicPreferences values={preferences} onToggle={toggle} /><ProfileEssentials biography={biography} onChange={setBiography} /><ConnectionChoices locationAllowed={locationAllowed} hasBand={hasBand} bandName={bandName} onChange={change} /><SetupSubmit pending={save.isPending} /></form></div></div>;
}