interface Props {
  platform: string;
  size?: number;
}

export function PlatformIcon({ platform, size = 28 }: Props) {
  const s = size;
  const r = Math.round(s * 0.22);

  switch (platform) {
    case 'facebook':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#1877F2"/>
          <path d="M16 8h-2c-.6 0-1 .4-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 014-4h2v3z" fill="white"/>
        </svg>
      );

    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="ig-bg" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f09433"/>
              <stop offset="33%" stopColor="#e6683c"/>
              <stop offset="55%" stopColor="#dc2743"/>
              <stop offset="77%" stopColor="#cc2366"/>
              <stop offset="100%" stopColor="#bc1888"/>
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig-bg)"/>
          <rect x="4.5" y="4.5" width="15" height="15" rx="4" stroke="white" strokeWidth="1.4" fill="none"/>
          <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.4" fill="none"/>
          <circle cx="16.8" cy="7.2" r="0.9" fill="white"/>
        </svg>
      );

    case 'kakao':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#FEE500"/>
          <path d="M12 5.5C7.86 5.5 4.5 8.08 4.5 11.27c0 2.04 1.32 3.83 3.32 4.87l-.85 3.16c-.07.27.22.49.46.34l3.7-2.46c.27.03.54.05.87.05 4.14 0 7.5-2.58 7.5-5.77C19.5 8.08 16.14 5.5 12 5.5z" fill="#3A1D00"/>
        </svg>
      );

    case 'whatsapp':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#25D366"/>
          <path d="M12 4.5C7.86 4.5 4.5 7.86 4.5 12c0 1.34.35 2.6.96 3.7L4.5 19.5l3.9-.93A7.44 7.44 0 0012 19.5c4.14 0 7.5-3.36 7.5-7.5S16.14 4.5 12 4.5zm3.7 10.3c-.16.44-.93.84-1.3.9-.34.05-.77.07-1.24-.08-.29-.09-.65-.22-1.12-.43-1.97-.85-3.25-2.84-3.35-2.97-.1-.13-.8-1.06-.8-2.02s.5-1.44.69-1.63c.18-.19.4-.24.53-.24h.38c.12 0 .29.04.44.34l.63 1.49c.06.14.1.3.02.46l-.23.46-.25.27c.1.17.5.77 1.07 1.3.73.67 1.35.88 1.53.98.18.1.28.08.39-.05l.52-.62c.12-.15.24-.1.4-.04l1.4.66c.16.08.27.12.3.19.04.07.04.42-.1.86z" fill="white"/>
        </svg>
      );

    case 'snapchat':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#FFFC00"/>
          <path d="M12 4.2c-1.97 0-3.8 1.57-3.8 3.98v.64c-.38-.06-.72.1-.9.44-.24.46-.1.97.27 1.2-.18.48-.52.94-1.02 1.3-.2.14-.26.4-.12.62.1.16.27.26.45.26.06 0 .13-.01.2-.04.1-.03.22-.07.35-.1.2-.05.43-.1.66-.1.13 0 .26.01.37.05-.2.4-.56.83-1.08 1.04-.24.1-.35.37-.25.62.07.18.24.3.43.3.05 0 .1 0 .16-.02.06-.01 1.6-.45 3.28-.45s3.22.44 3.28.45c.05.01.1.02.16.02.2 0 .36-.12.43-.3.1-.25-.01-.52-.25-.62-.52-.21-.88-.64-1.08-1.04.11-.04.24-.05.37-.05.23 0 .46.05.66.1.13.03.25.07.35.1.07.03.14.04.2.04.18 0 .36-.1.45-.26.14-.22.08-.48-.12-.62-.5-.36-.84-.82-1.02-1.3.37-.23.51-.74.27-1.2-.18-.34-.52-.5-.9-.44V8.18C15.8 5.77 13.97 4.2 12 4.2z" fill="#000"/>
        </svg>
      );

    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0A66C2"/>
          {/* dot */}
          <circle cx="6.2" cy="7.2" r="1.4" fill="white"/>
          {/* vertical bar */}
          <rect x="5.1" y="10" width="2.2" height="7" rx="0.4" fill="white"/>
          {/* L-shape right column */}
          <rect x="9.5" y="10" width="2.2" height="7" rx="0.4" fill="white"/>
          {/* horizontal bridge */}
          <path d="M11.7 13.2c0-1.5.8-2.4 2.1-2.4 1.2 0 1.8.8 1.8 2.4V17h2.2v-4c0-2.5-1.3-3.6-3-3.6-1.1 0-2 .5-2.5 1.3V10.1H9.5V17h2.2v-3.8z" fill="white"/>
        </svg>
      );

    case 'x':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#000"/>
          <path d="M13.6 10.9L18.7 5h-1.2l-4.4 5.1L9.5 5H5.3l5.3 7.7L5.3 19h1.2l4.7-5.4L14.6 19h4.2l-5.2-8.1zm-1.7 1.9l-.5-.8L6.8 6h1.8l3.4 4.9.5.8 4.5 6.4H15l-3.1-4.3z" fill="white"/>
        </svg>
      );

    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#000"/>
          <path d="M16.5 5.5h-1.8a3 3 0 01-3 3v1.8c.63 0 1.23-.15 1.8-.4v5.4a3 3 0 11-3-3v-1.8a4.8 4.8 0 104.8 4.8V8.9a5.3 5.3 0 003 .9V8c-.9 0-1.8-.3-2.5-.87V5.5z" fill="white"/>
          <path d="M16.5 5.5h-1.8a3 3 0 01-3 3v1.8c.63 0 1.23-.15 1.8-.4v5.4a3 3 0 11-3-3v-1.8a4.8 4.8 0 104.8 4.8V8.9a5.3 5.3 0 003 .9V8c-.9 0-1.8-.3-2.5-.87V5.5z" fill="#69C9D0" opacity="0.6"/>
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="rgba(255,255,255,.2)"/>
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
            {platform[0].toUpperCase()}
          </text>
        </svg>
      );
  }
}
