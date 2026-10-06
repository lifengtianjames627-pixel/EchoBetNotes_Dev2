import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import BadgeIcon from '@/components/BadgeIcon';
import { BADGES, BADGE_CATEGORIES } from '@/lib/badgeConfig';
import { Bookmark } from 'lucide-react';

export default function UserBadges({ user, earnedBadgeIds }) {
  const queryClient = useQueryClient();
  const [localEquipped, setLocalEquipped] = useState(user?.equipped_badges || []);

  const toggleEquip = async (badgeId) => {
    const isEquipped = localEquipped.includes(badgeId);
    let next;
    if (isEquipped) {
      next = localEquipped.filter(id => id !== badgeId);
    } else {
      if (localEquipped.length >= 4) return; // max 4
      next = [...localEquipped, badgeId];
    }
    setLocalEquipped(next);
    await base44.auth.updateMe({ equipped_badges: next });
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const earnedCount = earnedBadgeIds.length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="flex items-center gap-2">
        <span className="font-playfair text-2xl" style={{ color: '#1a1815' }}>{earnedCount}</span>
        <span className="text-sm text-muted-foreground">badge{earnedCount !== 1 ? 's' : ''} earned</span>
      </div>

      {/* Equipped slots */}
      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
          Equipped <span className="normal-case font-normal opacity-70">({localEquipped.length}/4 — shown on your reviews)</span>
        </p>
        <div className="flex gap-3 flex-wrap">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all"
              style={{
                background: localEquipped[i] ? '#f7f2e6' : '#f1ede3',
                border: localEquipped[i] ? '1px solid #ddd0b6' : '1px dashed #ddd6c6',
              }}
            >
              {localEquipped[i] ? (
                <BadgeIcon badgeId={localEquipped[i]} size="sm" />
              ) : (
                <Bookmark className="w-5 h-5" style={{ color: '#cdc3b1' }} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          {localEquipped.length < 4 ? 'Click an earned badge below to equip it' : 'Click an equipped badge to unequip'}
        </p>
      </div>

      {/* All badges by category */}
      {BADGE_CATEGORIES.map(category => {
        const categoryBadges = BADGES.filter(b => b.category === category);
        return (
          <div key={category}>
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">
              {category}
            </p>
            <div className="flex flex-wrap gap-5">
              {categoryBadges.map(badge => {
                const earned = earnedBadgeIds.includes(badge.id);
                const isEquipped = localEquipped.includes(badge.id);
                const canEquip = earned && (isEquipped || localEquipped.length < 4);
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: earned ? 1.07 : 1 }}
                    className="flex flex-col items-center gap-1.5 select-none"
                    style={{ cursor: earned ? 'pointer' : 'default' }}
                    onClick={() => earned && toggleEquip(badge.id)}
                    title={earned ? (isEquipped ? 'Click to unequip' : canEquip ? 'Click to equip' : 'Unequip another badge first') : 'Not yet earned'}
                  >
                    <div className="relative">
                      <BadgeIcon badgeId={badge.id} size="md" locked={!earned} />
                      {isEquipped && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: '#bf7a35', fontSize: 9 }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="text-center" style={{ maxWidth: 80 }}>
                      <p
                        className="text-xs font-semibold leading-tight"
                        style={{ color: earned ? '#1a1815' : '#a9a094' }}
                      >
                        {badge.name}
                      </p>
                      <p className="text-[10px] leading-tight mt-0.5 text-muted-foreground/60">
                        {badge.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}