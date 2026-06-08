import { useEffect, useRef } from 'react';
import './Hero.css';

export default function Hero() {
  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroRef = useRef<HTMLElement>(null);

  /* Parallax tilt on mouse move */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const x = (e.clientX / w - 0.5) * 18;
      const y = (e.clientY / h - 0.5) * 10;
      el.style.setProperty('--mx', `${x}deg`);
      el.style.setProperty('--my', `${-y}deg`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="hero" ref={heroRef} aria-label="Introduction">
      {/* Animated dot-grid background */}
      <div className="hero-grid" aria-hidden="true">
        <div className="hero-grid__dots" />
        <div className="hero-grid__scanline" />
      </div>

      {/* Ambient glow blobs */}
      <div className="hero-blob hero-blob--a" aria-hidden="true" />
      <div className="hero-blob hero-blob--b" aria-hidden="true" />

      <div className="hero-content container">
        {/* Status pill */}
        <div className="hero-status">
          <span className="hero-status__dot" />
          <span className="hero-status__text">open to collabs</span>
        </div>

        <div className="hero-name-wrap">
          <h1 className="hero-name">
            {'Eddy Wong'.split('').map((ch, i) => (
              <span
                key={i}
                className="hero-name__char"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </h1>
          <p className="hero-handle">@eddywong</p>
        </div>

        <p className="hero-tagline">
          Building games, experiments<br className="hero-tagline__br" /> &amp; ideas on the web.
        </p>

        <div className="hero-cta">
          <button className="btn btn--primary" onClick={scrollToProjects}>
            See my work
            <span className="btn__arrow">↓</span>
          </button>
          <a
            className="btn btn--ghost"
            href="https://github.com/eddywong888"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-scroll-cue" aria-hidden="true">
        <span className="hero-scroll-cue__line" />
        <span className="hero-scroll-cue__label">scroll</span>
      </div>
    </section>
  );
}
