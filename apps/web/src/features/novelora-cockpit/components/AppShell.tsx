import type { ReactNode } from 'react';
import { EchoHeroBackground } from './EchoHeroBackground';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  hero: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, topbar, hero, children }: AppShellProps) {
  return (
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
    </div>
  );
}
