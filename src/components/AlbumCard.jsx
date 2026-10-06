import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import StarRating from './StarRating';
import GenreBadge from './GenreBadge';
import { MessageSquare } from 'lucide-react';
import CoverImage from '@/components/music/CoverImage';

export default function AlbumCard({ album }) {
  return (
    <Link to={`/album/${album.id}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-card">
        <div className="aspect-square relative overflow-hidden bg-muted">
          <CoverImage src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {album.genre && (
            <div className="absolute top-3 left-3">
              <GenreBadge genre={album.genre} />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm truncate">{album.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{album.artist}</p>
          <div className="flex items-center justify-between mt-3">
            <StarRating rating={album.avg_rating || 0} size="sm" />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {album.review_count || 0}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}