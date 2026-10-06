import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, onRate, size = 'md' }) {
  const sizeClasses = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          disabled={!onRate}
          className="disabled:cursor-default"
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/30'
            } ${onRate ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
          />
        </button>
      ))}
    </div>
  );
}