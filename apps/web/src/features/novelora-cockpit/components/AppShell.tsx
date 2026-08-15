import { useEffect, useRef, type ReactNode } from 'react';
import { EchoBookForeground } from './EchoBookForeground';
import { EchoHeroBackground } from './EchoHeroBackground';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  hero: ReactNode;
  children: ReactNode;
}

const ECHO_DESIGN_WIDTH = 1728;
const ECHO_DESIGN_HEIGHT = 972;

export function AppShell({ sidebar, topbar, hero, children }: AppShellProps) {
  const scaleViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = scaleViewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const width = viewport.clientWidth || window.innerWidth;
      const height = viewport.clientHeight || window.innerHeight;
      const scale = Math.min(width / ECHO_DESIGN_WIDTH, height / ECHO_DESIGN_HEIGHT);
      viewport.style.setProperty('--echo-scale', String(scale));
      viewport.style.setProperty(
        '--echo-offset-x',
        `${(width - ECHO_DESIGN_WIDTH * scale) / 2}px`,
      );
      viewport.style.setProperty(
        '--echo-offset-y',
        `${(height - ECHO_DESIGN_HEIGHT * scale) / 2}px`,
      );
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="echo-scale-viewport" ref={scaleViewportRef}>
      <div className="echo-scale-root">
        <div className="echo-page cockpit-scroll">
          <EchoHeroBackground />
          <div className="cockpit-shell">
            <aside className="cockpit-sidebar" aria-label="Project navigation">
              {sidebar}
            </aside>
            <section className="cockpit-workspace" aria-label="Novel workspace">
              <header className="cockpit-topbar" aria-label="Project controls">
                {topbar}
              </header>
              <div className="echo-hero-slot">{hero}</div>
              <main className="cockpit-main" aria-label="Story workspace">
                {children}
              </main>
            </section>
          </div>
          <EchoBookForeground />
        </div>
      </div>
    </div>
  );
}
