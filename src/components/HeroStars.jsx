import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const NUM_STARS = 40;

export default function HeroStars() {
  const stars = useMemo(() => 
    Array.from({ length: NUM_STARS }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 3,
      opacity: Math.random() * 0.6 + 0.2,
      rotate: Math.random() * 360,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: '-10px',
            width: star.size,
            height: star.size,
          }}
          initial={{ y: -20, opacity: 0, rotate: star.rotate }}
          animate={{
            y: ['0%', '110vh'],
            opacity: [0, star.opacity, star.opacity, 0],
            rotate: [star.rotate, star.rotate + 360],
            x: [0, Math.sin(star.id) * 40, Math.sin(star.id + 1) * 60, Math.sin(star.id + 2) * 30],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        >
          <svg viewBox="0 0 10 10" width={star.size * 3} height={star.size * 3} fill="white" opacity={star.opacity}>
            <polygon points="5,0 6,4 10,4 7,6 8,10 5,7.5 2,10 3,6 0,4 4,4" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}