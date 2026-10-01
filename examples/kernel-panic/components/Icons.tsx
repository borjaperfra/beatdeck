/**
 * Small glyphs drawn as SVG: the local Roboto / Roboto Mono subsets have no ✓ ✕ ≠, and X / LinkedIn / tweet
 * action icons must not depend on system fonts.
 */
type P = { size?: number | string; color?: string; style?: React.CSSProperties };

export const Check = ({ size = '0.8em', color = 'currentColor', style }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ verticalAlign: '-0.08em', ...style }} aria-hidden>
    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="square" />
  </svg>
);

export const Cross = ({ size = '0.8em', color = 'currentColor', style }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ verticalAlign: '-0.08em', ...style }} aria-hidden>
    <path d="M5 5l14 14M19 5L5 19" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="square" />
  </svg>
);

/** ≠ at display size (v3: Roboto 300, 150px, violet). */
export const NotEqual = ({ size = 150, color = 'var(--violet-text)', style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size * 0.62} height={size * 0.7} viewBox="0 0 62 70" style={style} aria-label="≠">
    <path d="M6 27h50M6 45h50M44 8L18 62" fill="none" stroke={color} strokeWidth="4" />
  </svg>
);

/** X (Twitter) logo, monochrome. */
export const XLogo = ({ size = 40, color = 'currentColor', style }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-label="X">
    <path fill={color} d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/** LinkedIn "in" mark, monochrome. */
export const LinkedInLogo = ({ size = 40, color = 'currentColor', style }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-label="LinkedIn">
    <path fill={color} d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
);

/* X post UI icons (outline style of the source screenshot) */
const ui = (d: string, fill = false) => ({ size = 30, color = 'currentColor', style }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
    <path d={d} fill={fill ? color : 'none'} stroke={fill ? 'none' : color} strokeWidth={fill ? 0 : 1.8} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
export const ReplyIcon = ui('M4.5 11.5c0-4 3.4-7 7.9-7 4.3 0 7.6 3 7.6 6.9 0 4.1-3.6 7.1-8 7.1-.9 0-1.6-.1-2.3-.3L5.2 20l1-3.6c-1.1-1.3-1.7-2.9-1.7-4.9z');
export const RepostIcon = ui('M7 4.5L3.8 7.7 7 10.9M3.8 7.7h11.4c1.8 0 3.3 1.5 3.3 3.3v1.5M17 19.5l3.2-3.2-3.2-3.2M20.2 16.3H8.8c-1.8 0-3.3-1.5-3.3-3.3v-1.5');
export const HeartIcon = ui('M12 20.3s-7.8-4.6-9.2-9.6C1.9 7.4 4 4.3 7.3 4.3c2 0 3.6 1.1 4.7 2.8 1.1-1.7 2.7-2.8 4.7-2.8 3.3 0 5.4 3.1 4.5 6.4-1.4 5-9.2 9.6-9.2 9.6z', true);
export const BookmarkIcon = ui('M5.5 3.5h13v17.3L12 16.4l-6.5 4.4z', true);
export const ShareIcon = ui('M12 15V3.8M7.2 8.3L12 3.5l4.8 4.8M4.5 13.5v5.8c0 .7.5 1.2 1.2 1.2h12.6c.7 0 1.2-.5 1.2-1.2v-5.8');
export const GrokIcon = ui('M5 19L19 5M8.5 5.8a7 7 0 019.7 9.7M15.5 18.2a7 7 0 01-9.7-9.7');

/** Blue verified badge (X). */
export const VerifiedBadge = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-label="verificado">
    <path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
    <path fill="#fff" d="M10.54 16.2l-3.74-3.74 1.41-1.42 2.33 2.33 5.24-5.24 1.41 1.42z" />
  </svg>
);
