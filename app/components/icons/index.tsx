import React from 'react';

export const IconHome = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M3 11.5L12 4l9 7.5" />
    <path d="M9 21V12h6v9" />
  </svg>
);

export const IconGames = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <circle cx="7" cy="8" r="2" />
    <circle cx="17" cy="8" r="2" />
    <path d="M12 14v4" />
    <path d="M4 18h16" />
  </svg>
);

export const IconStore = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M3 7h18v13H3z" />
    <path d="M16 3l-4 4-4-4" />
  </svg>
);

export const IconWallet = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="17" cy="12" r="1.5" />
  </svg>
);

export const IconProfile = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <circle cx="12" cy="8" r="3" />
    <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" />
  </svg>
);

export const IconActivity = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </svg>
);

export const IconAudit = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const IconAbout = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v.01M11 12h1v4" />
  </svg>
);

export const IconContact = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M21 8V7l-3 2-2-1-5 3-6-4v9h18V8z" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export default {};
