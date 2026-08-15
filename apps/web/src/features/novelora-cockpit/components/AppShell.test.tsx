import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders one scenic background before the transparent two-column shell', () => {
    const { container } = render(
      <AppShell
        sidebar={<span>Sidebar content</span>}
        topbar={<span>Topbar content</span>}
        hero={<span>Hero content</span>}
      >
        <span>Workspace content</span>
      </AppShell>,
    );

    const page = container.firstElementChild;
    expect(page).toHaveClass('echo-page', 'cockpit-scroll');
    expect(page?.children).toHaveLength(2);
    expect(page?.children[0]).toHaveClass('echo-hero-background');
    expect(page?.children[1]).toHaveClass('cockpit-shell');
    expect(container.querySelectorAll('.echo-hero-background')).toHaveLength(1);
    expect(container.querySelectorAll('img[src*="hero-background-clean"]')).toHaveLength(1);
  });

  it('orders sidebar, topbar, hero, and story workspace without a right rail', () => {
    const { container } = render(
      <AppShell
        sidebar={<span>Sidebar content</span>}
        topbar={<span>Topbar content</span>}
        hero={<span>Hero content</span>}
      >
        <span>Workspace content</span>
      </AppShell>,
    );

    const shell = container.querySelector('.cockpit-shell');
    const workspace = container.querySelector('.cockpit-workspace');

    expect(shell?.children).toHaveLength(2);
    expect(shell?.children[0]).toBe(screen.getByRole('complementary', { name: 'Project navigation' }));
    expect(shell?.children[1]).toBe(workspace);
    expect(workspace?.children).toHaveLength(3);
    expect(workspace?.children[0]).toBe(screen.getByRole('banner', { name: 'Project controls' }));
    expect(workspace?.children[1]).toHaveClass('echo-hero-slot');
    expect(workspace?.children[1]).toHaveTextContent('Hero content');
    expect(workspace?.children[2]).toBe(screen.getByRole('main', { name: 'Story workspace' }));
    expect(screen.queryByRole('complementary', { name: 'Workspace assistant' })).not.toBeInTheDocument();
    expect(container.querySelector('.cockpit-right-panel')).not.toBeInTheDocument();
  });
});
