import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BixinHomePage } from './BixinHomePage';

const handlers = { activeNavigation: 'home' as const, onSelectNavigation: vi.fn(), onContinueWriting: vi.fn(), onNewProject: vi.fn(), onOpenProject: vi.fn(), onShowMessage: vi.fn() };
describe('BixinHomePage', () => {
  it('renders hero and new dashboard sections', () => {
    const { container } = render(<BixinHomePage {...handlers} />);
    expect(screen.getByRole('heading', { name: /笔心在手/ })).toBeVisible();
    expect(screen.getByRole('region', { name: '今日创作挑战' })).toBeVisible();
    expect(container.querySelector('.bixin-book-layer')).not.toBeInTheDocument();
  });
  it('places one transparent mascot in the continuous scene and keeps the copy layer transparent', () => {
    const { container } = render(<BixinHomePage {...handlers} />);
    const sceneCanvas = container.querySelector('.bixin-scene-layer__canvas');
    const hero = container.querySelector('.bixin-hero-section');

    expect(sceneCanvas?.querySelectorAll('.bixin-scene-layer__base')).toHaveLength(1);
    expect(sceneCanvas?.querySelectorAll('.bixin-scene-layer__mascot')).toHaveLength(1);
    expect(container.querySelector('.bixin-scene-layer__ambient')).not.toBeInTheDocument();
    expect(container.querySelector('.bixin-scene-layer__subject')).not.toBeInTheDocument();
    expect(hero?.querySelector('img')).not.toBeInTheDocument();
  });
  it('keeps the only live brand inside the navigation rail', () => {
    const { container } = render(<BixinHomePage {...handlers} />);
    const rail = screen.getByRole('navigation', { name: '工作区导航' });

    expect(rail).toHaveTextContent('笔心');
    expect(container.querySelector('.bixin-brand-header')).not.toBeInTheDocument();
  });
  it('forwards hero and dashboard actions', async () => {
    render(<BixinHomePage {...handlers} />);
    await userEvent.click(screen.getByRole('button', { name: '继续写作' }));
    await userEvent.click(screen.getByRole('button', { name: '立即挑战' }));
    expect(handlers.onContinueWriting).toHaveBeenCalledOnce();
    expect(handlers.onShowMessage).toHaveBeenCalledWith('创作挑战暂未在演示版开放。');
  });
  it('renders writing workbench children with the native writing profile and without hero', () => {
    const { container } = render(<BixinHomePage {...handlers} activeNavigation="writing"><p>工作台内容</p></BixinHomePage>);
    expect(screen.getByRole('main', { name: '工作台' })).toHaveTextContent('工作台内容');
    expect(screen.queryByRole('heading', { name: /笔心在手/ })).not.toBeInTheDocument();
    expect(container.querySelector('.bixin-home--writing')).toBeInTheDocument();
    expect(container.querySelector('.bixin-home__frame')).toHaveAttribute('data-bixin-profile', 'writing');
  });
});
