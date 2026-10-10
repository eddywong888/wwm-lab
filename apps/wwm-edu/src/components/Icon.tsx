import type { IconName } from '../engine/types';

interface IconProps {
  name: IconName;
  className?: string;
}

function Shape({ name }: { name: IconName }) {
  switch (name) {
    case 'owl': return <><path className="edu-icon__soft" d="M5 8.2 3.7 4.7 8 6.4A8.4 8.4 0 0 1 12 5.3a8.4 8.4 0 0 1 4 1.1l4.3-1.7L19 8.2V14a7 7 0 0 1-14 0Z"/><path d="M5 8.2 3.7 4.7 8 6.4A8.4 8.4 0 0 1 12 5.3a8.4 8.4 0 0 1 4 1.1l4.3-1.7L19 8.2V14a7 7 0 0 1-14 0Z"/><circle cx="8.7" cy="11" r="2.2"/><circle cx="15.3" cy="11" r="2.2"/><path d="m10.7 13.8 1.3 1.4 1.3-1.4M9 19v2M15 19v2M6 21h12"/></>;
    case 'user': return <><circle className="edu-icon__soft" cx="12" cy="8" r="4"/><circle cx="12" cy="8" r="4"/><path d="M4.8 20c.7-4 3.2-6 7.2-6s6.5 2 7.2 6"/></>;
    case 'trophy': return <><path className="edu-icon__soft" d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 4h8v5a4 4 0 0 1-8 0ZM9 20h6M12 13v7M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4"/></>;
    case 'medal': return <><circle className="edu-icon__soft" cx="12" cy="15" r="5"/><circle cx="12" cy="15" r="5"/><path d="m8 3 4 7 4-7M7 3h10M12 12.5l.7 1.5 1.7.2-1.2 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.2-1.2 1.7-.2Z"/></>;
    case 'volume': return <><path className="edu-icon__soft" d="M5 10h4l5-4v12l-5-4H5Z"/><path d="M5 10h4l5-4v12l-5-4H5ZM17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></>;
    case 'volume-off': return <><path className="edu-icon__soft" d="M5 10h4l5-4v12l-5-4H5Z"/><path d="M5 10h4l5-4v12l-5-4H5Zm12-1 4 6m0-6-4 6"/></>;
    case 'sparkles': return <><path className="edu-icon__soft" d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4Z"/><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8Zm14-1 .7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7Z"/></>;
    case 'shuffle': return <path d="M3 7h3c5 0 5 10 10 10h5M18 14l3 3-3 3M3 17h3c2.1 0 3.3-1.8 4.4-3.8M14.2 8.8C15.2 7.7 16.3 7 18 7h3M18 4l3 3-3 3"/>;
    case 'brain': return <><path className="edu-icon__soft" d="M9 4a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 4.5 14 3.5 3.5 0 0 0 9 19h1V5.5A1.5 1.5 0 0 0 9 4Zm6 0a3 3 0 0 1 3 3v.5a3.5 3.5 0 0 1 1.5 6.5A3.5 3.5 0 0 1 15 19h-1V5.5A1.5 1.5 0 0 1 15 4Z"/><path d="M9 4a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 4.5 14 3.5 3.5 0 0 0 9 19h1V5.5A1.5 1.5 0 0 0 9 4Zm6 0a3 3 0 0 1 3 3v.5a3.5 3.5 0 0 1 1.5 6.5A3.5 3.5 0 0 1 15 19h-1V5.5A1.5 1.5 0 0 1 15 4Z"/><path d="M10 7a2 2 0 0 0-3 1.2M10 11.5a2.5 2.5 0 0 0-3-.5M10 16a2.5 2.5 0 0 1-3-.8m7-9.9a2 2 0 0 1 3 1.2m-3 3.3a2.5 2.5 0 0 1 3-.5M14 16a2.5 2.5 0 0 0 3-.8"/></>;
    case 'calendar': return <><rect className="edu-icon__soft" x="3" y="5" width="18" height="16" rx="3"/><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01"/></>;
    case 'clipboard': return <><path className="edu-icon__soft" d="M7 5H5a2 2 0 0 0-2 2v13h18V7a2 2 0 0 0-2-2h-2"/><path d="M7 5H5a2 2 0 0 0-2 2v13h18V7a2 2 0 0 0-2-2h-2"/><rect x="8" y="3" width="8" height="4" rx="1.5"/><path d="M8 12h8M8 16h5"/></>;
    case 'calculator': return <><rect className="edu-icon__soft" x="4" y="2.5" width="16" height="19" rx="3"/><rect x="4" y="2.5" width="16" height="19" rx="3"/><path d="M7 6h10v4H7ZM8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01M16 17.5h.01"/></>;
    case 'book': return <><path className="edu-icon__soft" d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v17H4.5A2.5 2.5 0 0 0 2 21.5ZM22 4.5A2.5 2.5 0 0 0 19.5 2H13v17h6.5A2.5 2.5 0 0 1 22 21.5Z"/><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v17H4.5A2.5 2.5 0 0 0 2 21.5Z"/><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v17h6.5A2.5 2.5 0 0 1 22 21.5Z"/><path d="M6 6h3M6 10h3M15 6h3M15 10h3"/></>;
    case 'book-text': return <><path className="edu-icon__soft" d="M5 3h12a2 2 0 0 1 2 2v16H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Z"/><path d="M5 3h12a2 2 0 0 1 2 2v16H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Z"/><path d="M7 3v18M4 17.5A3 3 0 0 1 7 14.5h12M10 7h6M10 11h5"/></>;
    case 'pen': return <><path className="edu-icon__soft" d="m5 15-1 5 5-1L20 8l-4-4Z"/><path d="m5 15-1 5 5-1L20 8l-4-4ZM14 6l4 4M5 15l4 4"/></>;
    case 'package': return <><path className="edu-icon__soft" d="m3 7 9-4 9 4-9 4Z"/><path d="m3 7 9-4 9 4-9 4Zm0 0v10l9 4 9-4V7M12 11v10M7.5 5l9 4"/></>;
    case 'flame': return <><path className="edu-icon__soft" d="M12.5 2.5c.8 4.2-2.2 5.6-1 9.2.8-1.7 2.3-2.7 4-2.8 2.8 2 4.5 4.5 4.5 7.1a8 8 0 0 1-16 0c0-3.5 2.2-6.3 5.7-10.1-.2 2.6.6 4 1.4 5.1.5-2.6.1-5.3 1.4-8.5Z"/><path d="M12.5 2.5c.8 4.2-2.2 5.6-1 9.2.8-1.7 2.3-2.7 4-2.8 2.8 2 4.5 4.5 4.5 7.1a8 8 0 0 1-16 0c0-3.5 2.2-6.3 5.7-10.1-.2 2.6.6 4 1.4 5.1.5-2.6.1-5.3 1.4-8.5Z"/><path d="M9.5 17.2a2.5 2.5 0 0 0 5 0c0-1.2-.7-2.2-1.8-3 .1 1-.3 1.8-.9 2.4-.2-1.3-.9-2.2-1.7-3-.1 1.4-.6 2.4-.6 3.6Z"/></>;
    case 'puzzle': return <><path className="edu-icon__soft" d="M4 4h6a2 2 0 1 0 4 0h6v6a2 2 0 1 1 0 4v6h-6a2 2 0 1 0-4 0H4v-6a2 2 0 1 1 0-4Z"/><path d="M4 4h6a2 2 0 1 0 4 0h6v6a2 2 0 1 1 0 4v6h-6a2 2 0 1 0-4 0H4v-6a2 2 0 1 1 0-4Z"/></>;
    case 'lightbulb': return <><path className="edu-icon__soft" d="M9 15a5 5 0 1 1 6 0l-.8 2H9.8Z"/><path d="M9 15a5 5 0 1 1 6 0l-.8 2H9.8ZM10 17h4M10.5 20h3M12 2.5v2M19.5 10h2M2.5 10h2M17.5 4.5l-1.5 1.5M6.5 4.5l1.5 1.5"/></>;
    case 'target': return <><circle className="edu-icon__soft" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle className="edu-icon__dot" cx="12" cy="12" r="1.5"/><path d="m15.5 8.5 5.5-5.5M18 3h3v3"/></>;
    case 'dumbbell': return <><path className="edu-icon__soft" d="M6 7h2v10H6ZM16 7h2v10h-2Z"/><path d="M6 7h2v10H6ZM16 7h2v10h-2ZM3 9h3v6H3ZM18 9h3v6h-3ZM8 12h8"/></>;
    case 'hash': return <><rect className="edu-icon__soft" x="3" y="3" width="18" height="18" rx="4"/><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9.5 6.5 8 17.5M16 6.5l-1.5 11M6.5 10h11M6 14h11"/></>;
    case 'plus-minus': return <><rect className="edu-icon__soft" x="3" y="3" width="18" height="18" rx="4"/><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 8.5h4M9 6.5v4M13 15.5h4"/></>;
    case 'multiply': return <><rect className="edu-icon__soft" x="3" y="3" width="18" height="18" rx="4"/><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8.5 8.5 7 7m0-7-7 7"/></>;
    case 'wallet': return <><path className="edu-icon__soft" d="M3 6h15a3 3 0 0 1 3 3v10H5a2 2 0 0 1-2-2Z"/><path d="M3 7a3 3 0 0 1 3-3h11v3M3 7h15a3 3 0 0 1 3 3v9H5a2 2 0 0 1-2-2Zm13 5h5v4h-5a2 2 0 0 1 0-4Z"/></>;
    case 'pie': return <><path className="edu-icon__soft" d="M11 3a9 9 0 1 0 9 9h-9Z"/><path d="M11 3a9 9 0 1 0 9 9h-9Zm3-1v7h7A7 7 0 0 0 14 2Z"/></>;
    case 'decimal': return <><rect className="edu-icon__soft" x="3.5" y="6" width="6.5" height="12" rx="3"/><rect x="3.5" y="6" width="6.5" height="12" rx="3"/><rect className="edu-icon__soft" x="14" y="6" width="6.5" height="12" rx="3"/><rect x="14" y="6" width="6.5" height="12" rx="3"/><circle className="edu-icon__dot" cx="12" cy="17" r="1.5"/></>;
    case 'percent': return <><circle className="edu-icon__soft" cx="7" cy="7" r="3"/><circle className="edu-icon__soft" cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="M19 5 5 19"/></>;
    case 'clock': return <><circle className="edu-icon__soft" cx="12" cy="13" r="8"/><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M5 4.5 2.5 7M19 4.5 21.5 7M9.5 2h5"/></>;
    case 'ruler': return <><path className="edu-icon__soft" d="m4 15 11-11 5 5-11 11H4Z"/><path d="m4 15 11-11 5 5-11 11H4Zm9-9 2 2m-5 1 2 2m-5 1 2 2"/></>;
    case 'shapes': return <><circle className="edu-icon__soft" cx="6" cy="16" r="4"/><rect className="edu-icon__soft" x="13" y="3" width="8" height="8" rx="1"/><path className="edu-icon__soft" d="m14 20 4-7 4 7Z"/><circle cx="6" cy="16" r="4"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="m14 20 4-7 4 7Z"/></>;
    case 'map': return <><path className="edu-icon__soft" d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15M12 9h.01M12 13h.01"/></>;
    case 'chart': return <><path className="edu-icon__soft" d="M5 12h3v8H5Zm6-5h3v13h-3Zm6 3h3v10h-3Z"/><path d="M3 3v18h19M5 12h3v8H5Zm6-5h3v13h-3Zm6 3h3v10h-3Z"/></>;
    case 'check': return <><circle className="edu-icon__soft" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="m8 12 2.8 2.8 5.4-5.6"/></>;
    case 'x': return <><circle className="edu-icon__soft" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></>;
    case 'star': return <><path className="edu-icon__soft" d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></>;
    case 'languages': return <><path className="edu-icon__soft" d="M3 5h10v6a4 4 0 0 1-4 4H3Z"/><path d="M3 5h10M8 3v2m-3 4c1.5 3 4 5 7 6m-1-6c-1 3-3.5 5.5-7 7M14 20l3.5-9 3.5 9m-5.5-4h4"/></>;
  }
  const exhaustive: never = name;
  return exhaustive;
}

export default function Icon({ name, className = '' }: IconProps) {
  return (
    <svg className={`edu-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <Shape name={name} />
    </svg>
  );
}
