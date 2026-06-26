import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 16c-1.5 0-3-1.5-3-3s1.5-3 3-3 3 1.5 3 3-1.5 3-3 3z"></path>
    <path d="M18.5 16c-1.5 0-3-1.5-3-3s1.5-3 3-3 3 1.5 3 3-1.5 3-3 3z"></path>
    <path d="M8.5 20c-1.5 0-3-1.5-3-3s1.5-3 3-3 3 1.5 3 3-1.5 3-3 3z"></path>
    <path d="M15.5 20c-1.5 0-3-1.5-3-3s1.5-3 3-3 3 1.5 3 3-1.5 3-3 3z"></path>
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

export default function Footer() {
  const [theme, setTheme] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('light') ? 'light' : 'dark'
  );

  useEffect(() => {
    // Sync the initial theme immediately on mount in case we missed Navbar's setup
    const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    setTheme(currentTheme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="w-full bg-[var(--bg-primary)] border-t border-[var(--border)] pt-16 pb-8 relative z-20">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img
              src={theme === 'light' ? "/logos/firstmerge-logo.svg" : "/logos/firstmerge-logo-dark-bg.svg"}
              alt="FirstMerge Logo"
              className="h-7 w-auto object-contain"
            />
          </Link>
          <p className="text-[14px] text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed">
            Helping developers make their very first open-source contribution through AI-curated issues, step-by-step roadmaps, and PR analysis.
          </p>
          <div className="flex items-center gap-4 text-[var(--text-faint)]">
            <a href="https://github.com/FirstMerge" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">
              <GitHubIcon />
            </a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              <TwitterIcon />
            </a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              <DiscordIcon />
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="font-mono text-[12px] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">Product</h4>
          <Link to="/explore" className="font-sans text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Explore Issues</Link>
          <Link to="/dashboard" className="font-sans text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Dashboard</Link>
          <a href="#" className="font-sans text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Chrome Extension</a>
        </div>

        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="font-mono text-[12px] font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">Legal</h4>
          <a href="#" className="font-sans text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>
          <a href="#" className="font-sans text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Terms of Service</a>
          <a href="#" className="font-sans text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Open Source License</a>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-6 border-t border-[var(--border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-mono text-[12px] text-[var(--text-faint)]">
          &copy; {new Date().getFullYear()} FirstMerge. Made for Hackverse 2026.
        </p>
        <p className="font-sans text-[12px] text-[var(--text-muted)] flex items-center gap-1">
          Made with <span className="text-[var(--accent-purple)]">♥</span> by Team Amor Fati.
        </p>
      </div>
    </footer>
  );
}
