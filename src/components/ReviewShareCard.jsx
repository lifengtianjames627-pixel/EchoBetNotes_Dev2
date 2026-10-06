import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Copy, Check } from 'lucide-react';
// Per-genre share colors come from the unified genre config — one place defines
// a genre's identity for both the paper UI and this dark share card.
import { getShareTheme } from '@/shared/config/genres';
import { publicName } from '@/shared/identity';

const FONT = "'Inter','PingFang SC','Microsoft YaHei',sans-serif";

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Blends a color into near-black at a low factor, for opaque background gradient stops.
function tintDark(hex, factor) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  const mix = (c) => Math.round(c * factor + 8);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Splits text into CJK-safe wrap tokens (whole latin words, single CJK chars)
function tokenize(text) {
  const tokens = [];
  let cur = '';
  for (const ch of text) {
    if (/[\u3000-\u9fff\uff00-\uffef]/.test(ch)) {
      if (cur) { tokens.push(cur); cur = ''; }
      tokens.push(ch);
    } else if (ch === ' ') {
      if (cur) { tokens.push(cur); cur = ''; }
      tokens.push(' ');
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function wrapText(ctx, text, maxWidth) {
  const tokens = tokenize(text || '');
  const lines = [];
  let line = '';
  for (const t of tokens) {
    const test = line + t;
    if (ctx.measureText(test).width > maxWidth && line.trim()) {
      lines.push(line.trimEnd());
      line = t.trimStart();
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.length ? lines : [''];
}

function ellipsize(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const t = text.slice(0, mid) + '…';
    if (ctx.measureText(t).width <= maxWidth) lo = mid; else hi = mid - 1;
  }
  return text.slice(0, lo) + '…';
}

function drawStar(ctx, x, y, size, filled, color) {
  const pts = [[12,2],[15.09,8.26],[22,9.27],[17,14.14],[18.18,21.02],[12,17.77],[5.82,21.02],[7,14.14],[2,9.27],[8.91,8.26]];
  const s = size / 24;
  ctx.beginPath();
  pts.forEach(([px, py], i) => {
    const X = x + px * s, Y = y + py * s;
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  });
  ctx.closePath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  if (filled) { ctx.fillStyle = color; ctx.fill(); }
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Draws a vivid, realistic share card: the album cover becomes the atmosphere
// (blurred + darkened + genre-tinted) with a crisp hero cover, grain texture,
// and editorial typography — instead of flat color blocks.
async function renderCard(canvas, review, album) {
  const W = 420, PAD = 28, SCALE = 2;
  const contentW = W - PAD * 2;
  const ctx = canvas.getContext('2d');
  const theme = getShareTheme(album?.genre);
  const ACCENT = theme.accent;
  const SECONDARY = theme.secondary;

  const truncatedContent = review.content?.length > 180
    ? review.content.slice(0, 180).trimEnd() + '…'
    : (review.content || '');

  // Pre-measure text for layout
  ctx.font = `800 20px ${FONT}`;
  const title = ellipsize(ctx, album?.title || review.album_title || '', contentW);

  ctx.font = `13px ${FONT}`;
  const artistText = `${album?.artist || review.album_artist || ''}${album?.release_year ? ' · ' + album.release_year : ''}`;
  const artistLine = ellipsize(ctx, artistText, contentW);

  ctx.font = `italic 13px ${FONT}`;
  const excerptLines = wrapText(ctx, truncatedContent, contentW - 28);

  ctx.font = `700 13px ${FONT}`;
  const authorName = publicName(review.reviewer_name);
  const name = ellipsize(ctx, '@' + authorName.replace(/\s+/g, '_').toLowerCase(), contentW - 32 - 10 - 10);

  ctx.font = `italic 11px ${FONT}`;
  const reviewTitle = review.title ? ellipsize(ctx, `"${review.title}"`, contentW - 32 - 10 - 10) : null;

  const tags = (album?.tags || []).slice(0, 4);
  ctx.font = `600 10px ${FONT}`;
  const tagRows = [];
  let curRow = [], curWidth = 0;
  tags.forEach(tag => {
    const label = `#${tag}`;
    const w = ctx.measureText(label).width + 16;
    if (curWidth + w > contentW && curRow.length) { tagRows.push(curRow); curRow = []; curWidth = 0; }
    curRow.push({ label, w });
    curWidth += w + 6;
  });
  if (curRow.length) tagRows.push(curRow);

  // --- Layout: hero cover at top, content below ---
  const heroSize = 160;
  const heroTop = PAD + 18;
  const heroBottom = heroTop + heroSize;

  const titleBaseline = heroBottom + 30;
  const artistBaseline = titleBaseline + 20;
  const starsTop = artistBaseline + 12;
  const ratingBaseline = starsTop + 26;

  const dividerY = ratingBaseline + 14;

  const reviewerTop = dividerY + 16;
  const nameBaseline = reviewerTop + 16;
  const reviewerTitleBaseline = reviewerTop + 30;
  const reviewerBottom = reviewerTop + 32;

  const excerptTop = reviewerBottom + 12;
  const excerptBoxHeight = 24 + excerptLines.length * 19;
  const excerptBottom = excerptTop + excerptBoxHeight;

  const tagsTop = excerptBottom + 14;
  const tagsBottom = tagRows.length ? tagsTop + tagRows.length * 18 + (tagRows.length - 1) * 6 : excerptBottom;

  const footerBorderY = (tagRows.length ? tagsBottom : excerptBottom) + 14;
  const footerContentY = footerBorderY + 12;
  const footerBottom = footerContentY + 20;

  const H = footerBottom + 22;

  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.textBaseline = 'alphabetic';

  // Base fill (opaque, so corners never flash transparent)
  ctx.fillStyle = '#07060c';
  ctx.fillRect(0, 0, W, H);

  const img = await loadImage(album?.cover_url);

  ctx.save();
  roundRect(ctx, 0, 0, W, H, 20);
  ctx.clip();

  // --- Atmosphere: blurred, enlarged cover as the background ---
  if (img) {
    ctx.save();
    const scale = Math.max(W / img.width, H / img.height) * 1.3;
    const bw = img.width * scale, bh = img.height * scale;
    const bx = (W - bw) / 2, by = (H - bh) / 2;
    ctx.filter = 'blur(28px) saturate(1.15)';
    ctx.drawImage(img, bx, by, bw, bh);
    ctx.filter = 'none';
    ctx.restore();
  } else {
    // No cover — fall back to a genre-tinted gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, tintDark(ACCENT, 0.12)); g.addColorStop(1, tintDark(SECONDARY, 0.14));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // Darken + genre tint overlay so text stays legible
  const ov = ctx.createLinearGradient(0, 0, 0, H);
  ov.addColorStop(0, 'rgba(8,6,14,0.55)');
  ov.addColorStop(0.5, 'rgba(8,6,14,0.72)');
  ov.addColorStop(1, 'rgba(8,6,14,0.88)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);

  // Genre accent wash (top-right glow)
  const rg1 = ctx.createRadialGradient(W * 0.85, H * 0.08, 0, W * 0.85, H * 0.08, W * 0.7);
  rg1.addColorStop(0, hexToRgba(ACCENT, 0.22)); rg1.addColorStop(1, hexToRgba(ACCENT, 0));
  ctx.fillStyle = rg1; ctx.fillRect(0, 0, W, H);
  const rg2 = ctx.createRadialGradient(W * 0.1, H * 0.92, 0, W * 0.1, H * 0.92, W * 0.6);
  rg2.addColorStop(0, hexToRgba(SECONDARY, 0.16)); rg2.addColorStop(1, hexToRgba(SECONDARY, 0));
  ctx.fillStyle = rg2; ctx.fillRect(0, 0, W, H);

  // --- Film grain texture for a realistic, printed feel ---
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();

  ctx.restore(); // end clip

  // --- Hero cover (crisp, with shadow + accent ring) ---
  const heroX = (W - heroSize) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, heroX, heroTop, heroSize, heroSize, 14);
  ctx.fillStyle = hexToRgba(ACCENT, 0.12);
  ctx.fill();
  ctx.restore();
  if (img) {
    ctx.save();
    roundRect(ctx, heroX, heroTop, heroSize, heroSize, 14);
    ctx.clip();
    const s = Math.max(heroSize / img.width, heroSize / img.height);
    const iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, heroX + (heroSize - iw) / 2, heroTop + (heroSize - ih) / 2, iw, ih);
    ctx.restore();
  } else {
    ctx.font = '52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('🎵', W / 2, heroTop + heroSize / 2 + 18);
    ctx.textAlign = 'left';
  }
  // Accent ring around the hero
  ctx.save();
  roundRect(ctx, heroX, heroTop, heroSize, heroSize, 14);
  ctx.strokeStyle = hexToRgba(ACCENT, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // --- Eyebrow (centered, above title) ---
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'center';
  ctx.fillText('ECHOES BETWEEN NOTES', W / 2, heroTop - 6);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  // Title
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = '#f4f0ff';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, titleBaseline);

  // Artist/year
  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = 'rgba(200,190,235,0.75)';
  ctx.fillText(artistLine, W / 2, artistBaseline);

  // Stars (centered cluster)
  const starGap = 22;
  const starsW = 5 * starGap;
  const starsX = (W - starsW) / 2;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsX + i * starGap, starsTop, 18, i < review.rating, ACCENT);
  }

  // Rating text
  ctx.font = `700 11px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.fillText(`${review.rating}.0 / 5.0`, W / 2, ratingBaseline);
  ctx.textAlign = 'left';

  // Divider
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  divGrad.addColorStop(0, hexToRgba(ACCENT, 0));
  divGrad.addColorStop(0.5, hexToRgba(ACCENT, 0.45));
  divGrad.addColorStop(1, hexToRgba(ACCENT, 0));
  ctx.fillStyle = divGrad;
  ctx.fillRect(PAD, dividerY, contentW, 1);

  // Avatar
  const avatarCx = PAD + 16, avatarCy = reviewerTop + 16;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, 16, 0, Math.PI * 2);
  const avGrad = ctx.createLinearGradient(PAD, reviewerTop, PAD + 32, reviewerTop + 32);
  avGrad.addColorStop(0, hexToRgba(ACCENT, 0.45));
  avGrad.addColorStop(1, hexToRgba(SECONDARY, 0.32));
  ctx.fillStyle = avGrad;
  ctx.fill();
  ctx.strokeStyle = hexToRgba(ACCENT, 0.45);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.font = `800 13px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.fillText(authorName[0].toUpperCase(), avatarCx, avatarCy + 5);
  ctx.textAlign = 'left';

  // Reviewer name + title
  const textX = PAD + 32 + 10;
  ctx.font = `700 13px ${FONT}`;
  ctx.fillStyle = '#ece8f7';
  ctx.fillText(name, textX, nameBaseline);
  if (reviewTitle) {
    ctx.font = `italic 11px ${FONT}`;
    ctx.fillStyle = hexToRgba(ACCENT, 0.8);
    ctx.fillText(reviewTitle, textX, reviewerTitleBaseline);
  }

  // Excerpt box (glassy, blurred-backdrop feel)
  ctx.save();
  roundRect(ctx, PAD, excerptTop, contentW, excerptBoxHeight, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();
  ctx.strokeStyle = hexToRgba(ACCENT, 0.22);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  ctx.font = `italic 13px ${FONT}`;
  ctx.fillStyle = 'rgba(220,212,248,0.9)';
  excerptLines.forEach((line, i) => {
    let text = line;
    if (i === 0) text = `"${text}`;
    if (i === excerptLines.length - 1) text = `${text}"`;
    ctx.fillText(text, PAD + 14, excerptTop + 12 + 13 + i * 19);
  });

  // Tags
  if (tagRows.length) {
    let ty = tagsTop;
    tagRows.forEach(row => {
      let tx = PAD;
      row.forEach(({ label, w }) => {
        ctx.save();
        roundRect(ctx, tx, ty, w, 18, 9);
        ctx.fillStyle = hexToRgba(ACCENT, 0.14);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(ACCENT, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        ctx.font = `600 10px ${FONT}`;
        ctx.fillStyle = ACCENT;
        ctx.fillText(label, tx + 8, ty + 12.5);
        tx += w + 6;
      });
      ty += 18 + 6;
    });
  }

  // Footer
  ctx.fillStyle = hexToRgba(ACCENT, 0.14);
  ctx.fillRect(PAD, footerBorderY, contentW, 1);

  ctx.save();
  roundRect(ctx, PAD, footerContentY, 20, 20, 5);
  const fGrad = ctx.createLinearGradient(PAD, footerContentY, PAD + 20, footerContentY + 20);
  fGrad.addColorStop(0, hexToRgba(ACCENT, 0.55));
  fGrad.addColorStop(1, hexToRgba(SECONDARY, 0.55));
  ctx.fillStyle = fGrad;
  ctx.fill();
  ctx.restore();
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('♫', PAD + 10, footerContentY + 15);
  ctx.textAlign = 'left';

  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = hexToRgba(ACCENT, 0.75);
  ctx.fillText('Echoes Between Notes', PAD + 26, footerContentY + 14);

  ctx.font = `10px ${FONT}`;
  ctx.fillStyle = 'rgba(150,140,190,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText('echoesbetweennotes.app', W - PAD, footerContentY + 14);
  ctx.textAlign = 'left';
}

export default function ReviewShareCard({ review, album, onClose }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled || !canvasRef.current) return;
      await renderCard(canvasRef.current, review, album);
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [review, album]);

  const handleDownload = () => {
    if (!canvasRef.current || !ready) return;
    const link = document.createElement('a');
    link.download = `review-${(album?.title || 'album').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopy = () => {
    if (!canvasRef.current || !ready) return;
    canvasRef.current.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        handleDownload();
      }
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex items-center justify-between w-full max-w-[420px]">
          <p className="text-sm font-semibold text-white opacity-80">Share your review</p>
          <button onClick={onClose} className="text-white opacity-40 hover:opacity-80 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 60px rgba(167,139,250,0.3), 0 20px 60px rgba(0,0,0,0.6)', opacity: ready ? 1 : 0.3, transition: 'opacity 0.2s', minWidth: 420, minHeight: 200 }}>
          <canvas ref={canvasRef} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!ready}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(167,139,250,0.2)', color: '#c4baff', border: '1px solid rgba(167,139,250,0.35)' }}
          >
            <Download className="w-4 h-4" />
            {ready ? '下载图片' : '生成中…'}
          </button>
          <button
            onClick={handleCopy}
            disabled={!ready}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{ background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)', color: copied ? '#34d399' : 'rgba(255,255,255,0.7)', border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.15)'}` }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制！' : '复制图片'}
          </button>
        </div>

        <p className="text-xs" style={{ color: 'rgba(160,175,220,0.4)' }}>
          长按或右键图片也可保存 · 可直接分享至朋友圈、微博
        </p>
      </motion.div>
    </motion.div>
  );
}