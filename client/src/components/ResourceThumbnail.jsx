import React from 'react';
import { Camera } from 'lucide-react';
import './ResourceThumbnail.css';

// ── Default Type Graphics ────────────────────────────────────────────────────
const DefaultGraphics = {
  classroom: () => (
    <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rt-default-svg">
      <defs>
        <linearGradient id="cr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Board */}
      <rect x="25" y="15" width="110" height="50" rx="6" fill="url(#cr-grad)" stroke="rgba(147,197,253,0.4)" strokeWidth="1.5"/>
      <line x1="35" y1="28" x2="80" y2="28" stroke="rgba(250,234,9,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="35" y1="38" x2="105" y2="38" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="35" y1="46" x2="95" y2="46" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="35" y1="54" x2="65" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Podium & Desk */}
      <rect x="68" y="70" width="24" height="18" rx="3" fill="rgba(30,58,138,0.7)" stroke="rgba(147,197,253,0.4)"/>
      <line x1="80" y1="65" x2="80" y2="70" stroke="rgba(250,234,9,0.8)" strokeWidth="2"/>
      <circle cx="80" cy="63" r="2.5" fill="#faea09"/>
      {/* Tiered Rows */}
      <path d="M15 90 H145" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
      <path d="M30 82 H130" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
    </svg>
  ),
  lab: () => (
    <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rt-default-svg">
      <defs>
        <linearGradient id="lab-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#064e3b" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Atom Orbitals */}
      <ellipse cx="80" cy="46" rx="45" ry="18" stroke="rgba(52,211,153,0.35)" strokeWidth="1.2" transform="rotate(-25 80 46)"/>
      <ellipse cx="80" cy="46" rx="45" ry="18" stroke="rgba(52,211,153,0.35)" strokeWidth="1.2" transform="rotate(25 80 46)"/>
      <circle cx="80" cy="46" r="4" fill="#34d399"/>
      {/* Flask Left */}
      <path d="M48 30 L54 30 L54 44 L40 68 A4 4 0 0 0 44 74 L64 74 A4 4 0 0 0 68 68 L54 44 L54 30 Z" 
            fill="url(#lab-grad)" stroke="rgba(52,211,153,0.6)" strokeWidth="1.5"/>
      <path d="M43 64 Q54 60 65 64 L64 74 L44 74 Z" fill="rgba(52,211,153,0.4)"/>
      {/* Microscope Silhouette Right */}
      <rect x="106" y="68" width="22" height="6" rx="2" fill="rgba(52,211,153,0.6)"/>
      <path d="M117 68 V45 L108 38 L114 30 L123 37 L117 45" stroke="rgba(250,234,9,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="111" cy="34" r="3" fill="#faea09"/>
    </svg>
  ),
  hall: () => (
    <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rt-default-svg">
      <defs>
        <linearGradient id="hall-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Spotlight Beams */}
      <path d="M25 10 L50 75 L90 75 L35 10 Z" fill="rgba(192,132,252,0.12)"/>
      <path d="M135 10 L110 75 L70 75 L125 10 Z" fill="rgba(192,132,252,0.12)"/>
      {/* Stage */}
      <ellipse cx="80" cy="74" rx="55" ry="14" fill="url(#hall-grad)" stroke="rgba(192,132,252,0.4)" strokeWidth="1.5"/>
      {/* Lectern / Podium */}
      <rect x="74" y="52" width="12" height="20" rx="2" fill="rgba(139,92,246,0.8)" stroke="#faea09" strokeWidth="1.2"/>
      <circle cx="80" cy="48" r="2.5" fill="#faea09"/>
      {/* Audience Arcs */}
      <path d="M20 92 Q80 82 140 92" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
      <path d="M35 98 Q80 90 125 98" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
    </svg>
  ),
  equipment: () => (
    <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rt-default-svg">
      <defs>
        <linearGradient id="eq-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Projector Body */}
      <rect x="40" y="35" width="80" height="34" rx="7" fill="url(#eq-grad)" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5"/>
      {/* Lens */}
      <circle cx="62" cy="52" r="11" fill="rgba(15,23,42,0.8)" stroke="#faea09" strokeWidth="2"/>
      <circle cx="62" cy="52" r="6" fill="rgba(250,234,9,0.4)"/>
      <circle cx="60" cy="50" r="2" fill="#ffffff"/>
      {/* Vents & Buttons */}
      <line x1="86" y1="46" x2="108" y2="46" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="86" y1="52" x2="108" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="86" y1="58" x2="100" y2="58" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
      {/* Projection Light Beam */}
      <polygon points="51,52 10,32 10,72" fill="rgba(250,234,9,0.12)"/>
    </svg>
  ),
  other: () => (
    <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rt-default-svg">
      <defs>
        <linearGradient id="oth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Campus Building Silhouettes */}
      <rect x="30" y="38" width="40" height="46" rx="4" fill="url(#oth-grad)" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5"/>
      <rect x="74" y="24" width="44" height="60" rx="4" fill="url(#oth-grad)" stroke="rgba(56,189,248,0.5)" strokeWidth="1.5"/>
      <rect x="122" y="44" width="22" height="40" rx="3" fill="url(#oth-grad)" stroke="rgba(56,189,248,0.3)" strokeWidth="1.2"/>
      {/* Windows Grid */}
      <line x1="84" y1="36" x2="88" y2="36" stroke="#faea09" strokeWidth="2" strokeLinecap="round"/>
      <line x1="94" y1="36" x2="98" y2="36" stroke="#faea09" strokeWidth="2" strokeLinecap="round"/>
      <line x1="104" y1="36" x2="108" y2="36" stroke="#faea09" strokeWidth="2" strokeLinecap="round"/>
      <line x1="84" y1="46" x2="88" y2="46" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="94" y1="46" x2="98" y2="46" stroke="#faea09" strokeWidth="2" strokeLinecap="round"/>
      <line x1="104" y1="46" x2="108" y2="46" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="84" y1="56" x2="88" y2="56" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="94" y1="56" x2="98" y2="56" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="104" y1="56" x2="108" y2="56" stroke="#faea09" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

const TypeLabels = {
  classroom: 'Classroom Facility',
  lab: 'Laboratory & Research',
  hall: 'Auditorium & Conference',
  equipment: 'Equipment & AV Gear',
  other: 'Institutional Facility'
};

/**
 * ResourceThumbnail
 * Shows the actual uploaded photo if available (first image),
 * or renders a default glassmorphic vector thumbnail design if no images exist.
 */
export default function ResourceThumbnail({
  images = [],
  type = 'other',
  name = 'Resource',
  size = 'md', // 'sm' (table row), 'md' (card banner), 'lg' (detail hero)
  showBadge = true,
  onClick,
  className = '',
  style = {}
}) {
  // Normalize images to array
  let imgList = [];
  if (Array.isArray(images)) {
    imgList = images.filter(Boolean);
  } else if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images);
      imgList = Array.isArray(parsed) ? parsed.filter(Boolean) : [images];
    } catch {
      imgList = [images];
    }
  }

  const hasImage = imgList.length > 0;
  const primaryImage = hasImage ? imgList[0] : null;
  const normalizedType = (type || 'other').toLowerCase();
  const DefaultGraphic = DefaultGraphics[normalizedType] || DefaultGraphics.other;
  const typeLabel = TypeLabels[normalizedType] || TypeLabels.other;

  return (
    <div
      className={`rt-container rt-container--${size} rt-container--${normalizedType} ${hasImage ? 'rt-container--has-photo' : 'rt-container--default'} ${onClick ? 'rt-container--clickable' : ''} ${className}`}
      style={style}
      onClick={onClick}
      title={hasImage ? `${name} - Click to view photos` : `${name} (${typeLabel})`}
    >
      {hasImage ? (
        <>
          <img
            src={primaryImage}
            alt={name}
            className="rt-image"
            loading="lazy"
            onError={(e) => {
              // Graceful fallback to default thumbnail if URL fails to load
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                parent.classList.remove('rt-container--has-photo');
                parent.classList.add('rt-container--default');
              }
            }}
          />
          {showBadge && imgList.length > 1 && (
            <span className="rt-photo-count-badge">
              <Camera size={12} />
              <span>{imgList.length} Photos</span>
            </span>
          )}
        </>
      ) : (
        <div className="rt-default-design">
          <div className="rt-default-graphic-wrap">
            <DefaultGraphic />
          </div>
          {size !== 'sm' && (
            <div className="rt-default-meta">
              <span className="rt-default-type-tag">{typeLabel}</span>
              <span className="rt-default-indicator">Facility View</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
