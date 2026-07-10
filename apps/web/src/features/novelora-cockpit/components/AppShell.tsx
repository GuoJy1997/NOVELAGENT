import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  rightPanel: ReactNode;
}

export function AppShell({ sidebar, topbar, children, rightPanel }: AppShellProps) {
  return (
    <div className="cockpit-scroll">
      <div className="cockpit-shell">
        <aside className="cockpit-sidebar" aria-label="Project navigation">
          {sidebar}
        </aside>
        <section className="cockpit-workspace" aria-label="Novel workspace">
          <header className="cockpit-topbar" aria-label="Project controls">
            {topbar}
          </header>
          <main className="cockpit-main" aria-label="Story workspace">
            {children}
          </main>
        </section>
        <aside className="cockpit-right-panel" aria-label="Workspace assistant">
          {rightPanel}
        </aside>
      </div>
    </div>
  );
}
