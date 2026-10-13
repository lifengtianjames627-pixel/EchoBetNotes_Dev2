import React, { useState } from 'react';
import { Search } from 'lucide-react';
import AlbumCard from '@/components/AlbumCard';
import { genreLabels } from '@/components/GenreBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n/LanguageContext';
import { useAuthed } from '@/shared/identity';
import discoveryCopy from '@/features/albums/i18n/discoveryCopy';
import useDiscoveryAlbums from '@/features/albums/queries/useDiscoveryAlbums';
import DiscoveryAddDialog from '@/features/albums/components/DiscoveryAddDialog';
export default function Discover() {
  const { lang } = useLang();
  const copy = discoveryCopy(lang);
  const { authed, login } = useAuthed();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [adding, setAdding] = useState(false);
  const { albums, create } = useDiscoveryAlbums(() => setAdding(false));
  const filtered = (albums.data || []).filter(a => (genre === 'all' || a.genre === genre) && [a.title, a.artist].some(value => (value || '').toLowerCase().includes(search.trim().toLowerCase())));
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-playfair text-3xl italic">{copy.title}</h1>
      <Button onClick={() => { if (!authed) login(); else { create.reset(); setAdding(true); } }}>{copy.add}</Button>
    </header>
    <p className="mt-2 text-xs text-muted-foreground">{copy.latest}</p>
    <div className="my-6 flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1 basis-64"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label={copy.search} placeholder={copy.search} value={search} onChange={e => setSearch(e.target.value)} /></div>
      <select className="rounded-md border bg-card px-3 py-2 text-sm" aria-label={copy.genre} value={genre} onChange={e => setGenre(e.target.value)}><option value="all">{copy.all}</option>{Object.entries(genreLabels).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
    </div>
    {albums.isError ? <div role="alert" className="py-12 text-center"><p>{copy.failed}</p><Button variant="outline" onClick={() => albums.refetch()}>{copy.retry}</Button></div> : albums.isLoading ? <p role="status" className="py-12 text-center text-muted-foreground">{copy.loading}</p> : filtered.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{filtered.map(album => <AlbumCard key={album.id} album={album} />)}</div> : <p role="status" className="py-12 text-center text-muted-foreground">{copy.empty}</p>}
    {adding && <DiscoveryAddDialog copy={copy} open onClose={() => setAdding(false)} create={create} />}
  </div>;
}