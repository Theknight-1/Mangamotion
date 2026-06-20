export const IconLogo = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Manga panel frame */}
    <rect x="1" y="1" width="34" height="34" rx="6" fill="none" stroke="#c8e86b" strokeWidth="1.5"/>

    {/* Speed lines from center */}
    <g stroke="#c8e86b" strokeWidth="0.7" opacity="0.45">
      <line x1="18" y1="18" x2="1" y2="1"/>
      <line x1="18" y1="18" x2="10" y2="1"/>
      <line x1="18" y1="18" x2="18" y2="1"/>
      <line x1="18" y1="18" x2="26" y2="1"/>
      <line x1="18" y1="18" x2="35" y2="1"/>
      <line x1="18" y1="18" x2="35" y2="10"/>
      <line x1="18" y1="18" x2="35" y2="18"/>
      <line x1="18" y1="18" x2="35" y2="26"/>
      <line x1="18" y1="18" x2="35" y2="35"/>
      <line x1="18" y1="18" x2="26" y2="35"/>
      <line x1="18" y1="18" x2="18" y2="35"/>
      <line x1="18" y1="18" x2="10" y2="35"/>
      <line x1="18" y1="18" x2="1" y2="35"/>
      <line x1="18" y1="18" x2="1" y2="26"/>
      <line x1="18" y1="18" x2="1" y2="18"/>
      <line x1="18" y1="18" x2="1" y2="10"/>
    </g>

    {/* Play button circle */}
    <circle cx="18" cy="18" r="9" fill="#c8e86b"/>

    {/* Play triangle */}
    <polygon points="15,13.5 15,22.5 23,18" fill="#060e06"/>
  </svg>
);