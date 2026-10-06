import React from 'react';
import { Link } from 'react-router-dom';
import CoverImage from '@/components/music/CoverImage';
import { useLang } from '@/i18n/LanguageContext';
import { useGenreText } from '@/i18n/useGenreText';
import boardCopy from '@/components/reviews/boardCopy';

// Albums ranked server-side by views * 0.3 + review likes * 0.7. The cover
// opens the album; the genre chip jumps straight into that genre's space.
export default function PopularAlbums({ albums = [] }) {
  const { lang } = useLang();
  const { gLabel } = useGenreText();
  const copy = boardCopy(lang);

  return (
    <section className="mt-14">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className="font-playfair text-2xl italic" style={{ color: '#1a1815' }}>{copy.popular}</h2>
        <span className="text-xs" style={{ color: '#8a7e6f' }}>{copy.popularHint}</span>
      </div>
      {albums.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: '#8a7e6f' }}>{copy.empty}</p>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album, i) => (
            <div key={album.id} className="group">
              <Link to={`/album/${album.id}`} className="block">
                <CoverImage src={album.cover_url} alt={album.title} className="w-full aspect-square object-cover" />
              </Link>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-playfair text-lg italic" style={{ color: '#bf7a35' }}>{i + 1}</span>
                <Link to={`/album/${album.id}`} className="font-playfair text-lg italic leading-tight hover:underline" style={{ color: '#1a1815' }}>
                  {album.title}
                </Link>
              </div>
              <p className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: '#8a7e6f' }}>{album.artist}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]" style={{ color: '#6b6358' }}>
                {album.genre && (
                  <Link to={`/genre/${album.genre}`} className="px-2 py-0.5 rounded-full font-semibold hover:underline"
                    style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
                    {gLabel(album.genre, album.genre)}
                  </Link>
                )}
                <span>{album.views} {copy.views}</span>
                <span>·</span>
                <span>{album.likes} {copy.likes}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}