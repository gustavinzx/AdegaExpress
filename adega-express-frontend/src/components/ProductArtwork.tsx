'use client';

import { useState } from 'react';

interface ProductArtworkProps {
  name: string;
  brand: string;
  categoryName?: string;
  volumeMl?: number;
  imageUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface Palette {
  liquidTop: string;
  liquidBottom: string;
  labelBg: string;
  labelAccent: string;
  cap: string;
  vessel: 'can' | 'glass-bottle' | 'carafe' | 'tea-bottle';
}

function resolvePalette(name: string, categoryName = '', volumeMl = 500): Palette {
  const lower = `${name} ${categoryName}`.toLowerCase();
  const isCan =
    lower.includes('lata') || (volumeMl >= 250 && volumeMl <= 360 && !lower.includes('garrafa'));

  if (lower.includes('coca-cola')) {
    return {
      liquidTop: '#3a0b0b',
      liquidBottom: '#160404',
      labelBg: '#b91c1c',
      labelAccent: '#fef2f2',
      cap: '#dc2626',
      vessel: isCan ? 'can' : 'carafe',
    };
  }
  if (lower.includes('guaran')) {
    return {
      liquidTop: '#b4690e',
      liquidBottom: '#5c3104',
      labelBg: '#14532d',
      labelAccent: '#fde68a',
      cap: '#15803d',
      vessel: isCan ? 'can' : 'carafe',
    };
  }
  if (lower.includes('sprite') || (lower.includes('limão') && lower.includes('refrigerante'))) {
    return {
      liquidTop: '#0f766e',
      liquidBottom: '#064e3b',
      labelBg: '#047857',
      labelAccent: '#ecfdf5',
      cap: '#10b981',
      vessel: isCan ? 'can' : 'glass-bottle',
    };
  }
  if (lower.includes('tônica') || lower.includes('tonica')) {
    return {
      liquidTop: '#1e3a5f',
      liquidBottom: '#0f172a',
      labelBg: '#ca8a04',
      labelAccent: '#fefce8',
      cap: '#eab308',
      vessel: isCan ? 'can' : 'glass-bottle',
    };
  }
  if (lower.includes('uva')) {
    return {
      liquidTop: '#4c0519',
      liquidBottom: '#1f030d',
      labelBg: '#27171c',
      labelAccent: '#f4c095',
      cap: '#881337',
      vessel: 'carafe',
    };
  }
  if (lower.includes('laranja')) {
    return {
      liquidTop: '#ea580c',
      liquidBottom: '#9a3412',
      labelBg: '#1c1917',
      labelAccent: '#fdba74',
      cap: '#ea580c',
      vessel: 'carafe',
    };
  }
  if (lower.includes('pêssego') || lower.includes('pessego')) {
    return {
      liquidTop: '#d97706',
      liquidBottom: '#78350f',
      labelBg: '#261c14',
      labelAccent: '#fcd34d',
      cap: '#b45309',
      vessel: lower.includes('chá') || lower.includes('cha') ? 'tea-bottle' : 'carafe',
    };
  }
  if (lower.includes('maçã') || lower.includes('maca')) {
    return {
      liquidTop: '#a16207',
      liquidBottom: '#422006',
      labelBg: '#1f1a14',
      labelAccent: '#fef08a',
      cap: '#b91c1c',
      vessel: 'glass-bottle',
    };
  }
  if (lower.includes('mate') || lower.includes('chá') || lower.includes('cha')) {
    return {
      liquidTop: '#78350f',
      liquidBottom: '#291305',
      labelBg: '#1f2419',
      labelAccent: '#d9f99d',
      cap: '#65a30d',
      vessel: isCan ? 'can' : 'tea-bottle',
    };
  }
  const sparkling =
    lower.includes('com gás') || lower.includes('com gas') || lower.includes('gaseificada');
  return {
    liquidTop: sparkling ? '#0e4f6e' : '#164e63',
    liquidBottom: '#082635',
    labelBg: '#11222b',
    labelAccent: '#bae6fd',
    cap: sparkling ? '#0284c7' : '#38bdf8',
    vessel: volumeMl >= 1000 ? 'carafe' : 'glass-bottle',
  };
}

export default function ProductArtwork({
  name,
  brand,
  categoryName,
  volumeMl = 500,
  imageUrl,
  className = '',
  size = 'md',
}: ProductArtworkProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const palette = resolvePalette(name, categoryName, volumeMl);
  const volumeLabel =
    volumeMl >= 1000 ? `${(volumeMl / 1000).toString().replace('.', ',')}L` : `${volumeMl}ml`;
  const uid = `${name}-${brand}-${volumeMl}`.replace(/[^a-zA-Z0-9]/g, '');

  if (imageUrl && !imgFailed) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  const svgScale = size === 'sm' ? 'h-20 w-20' : size === 'lg' ? 'h-72 w-56' : 'h-48 w-40';

  return (
    <div className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 180 250"
        className={`${svgScale} drop-shadow-[0_14px_20px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:scale-105`}
        role="img"
        aria-label={`${name} - ${brand}`}
      >
        <defs>
          <linearGradient id={`liq-${uid}`} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor={palette.liquidTop} />
            <stop offset="100%" stopColor={palette.liquidBottom} />
          </linearGradient>
          <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {palette.vessel === 'can' ? (
          <g>
            <ellipse cx="90" cy="48" rx="41" ry="7" fill="#d4d4d8" />
            <ellipse cx="90" cy="48" rx="35" ry="4.5" fill="#71717a" />
            <path
              d="M49 48 L45 64 L45 210 Q45 224 58 228 L122 228 Q135 224 135 210 L135 64 L131 48 Z"
              fill={`url(#liq-${uid})`}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.2"
            />
            <rect
              x="46"
              y="88"
              width="88"
              height="94"
              rx="4"
              fill={palette.labelBg}
              stroke={palette.labelAccent}
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <rect x="52" y="54" width="16" height="168" rx="8" fill={`url(#shine-${uid})`} />
            <ellipse cx="90" cy="228" rx="34" ry="5" fill="#a1a1aa" />
          </g>
        ) : palette.vessel === 'carafe' ? (
          <g>
            <rect x="76" y="16" width="28" height="16" rx="4" fill={palette.cap} />
            <rect x="74" y="30" width="32" height="5" rx="2" fill="#d6b882" />
            <path
              d="M77 35 L75 66 Q44 92 44 126 L44 218 Q44 232 58 234 L122 234 Q136 232 136 218 L136 126 Q136 92 105 66 L103 35 Z"
              fill={`url(#liq-${uid})`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.4"
            />
            <rect
              x="50"
              y="112"
              width="80"
              height="84"
              rx="6"
              fill={palette.labelBg}
              stroke="#c9a256"
              strokeOpacity="0.55"
              strokeWidth="1.1"
            />
            <path
              d="M54 102 Q51 116 51 135 L51 215 L63 215 L63 130 Q63 112 69 98 Z"
              fill={`url(#shine-${uid})`}
            />
          </g>
        ) : (
          <g>
            <rect x="78" y="18" width="24" height="15" rx="3.5" fill={palette.cap} />
            <rect x="76" y="31" width="28" height="4" rx="1.5" fill="#c9a256" />
            <path
              d="M79 35 L77 72 Q52 96 52 124 L52 218 Q52 231 65 233 L115 233 Q128 231 128 218 L128 124 Q128 96 103 72 L101 35 Z"
              fill={`url(#liq-${uid})`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.3"
            />
            <rect
              x="56"
              y="114"
              width="68"
              height="80"
              rx="5"
              fill={palette.labelBg}
              stroke={palette.labelAccent}
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <rect x="59" y="102" width="12" height="118" rx="6" fill={`url(#shine-${uid})`} />
          </g>
        )}

        <text
          x="90"
          y={palette.vessel === 'can' ? '118' : '140'}
          textAnchor="middle"
          fill={palette.labelAccent}
          fontSize="9"
          fontWeight="700"
          letterSpacing="1.8"
        >
          {brand.slice(0, 14).toUpperCase()}
        </text>
        <line
          x1="68"
          y1={palette.vessel === 'can' ? '126' : '148'}
          x2="112"
          y2={palette.vessel === 'can' ? '126' : '148'}
          stroke={palette.labelAccent}
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />
        <text
          x="90"
          y={palette.vessel === 'can' ? '146' : '167'}
          textAnchor="middle"
          fill="#f4efe6"
          fontSize="8.5"
          fontWeight="600"
          letterSpacing="0.6"
        >
          {(categoryName || 'BEBIDA').toUpperCase()}
        </text>
        <text
          x="90"
          y={palette.vessel === 'can' ? '166' : '184'}
          textAnchor="middle"
          fill={palette.labelAccent}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1"
        >
          {volumeLabel}
        </text>
      </svg>
    </div>
  );
}
