import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OccludedPanel } from './OccludedPanel';

describe('OccludedPanel', () => {
  it('keeps decorative occlusion geometry separate from functional content', () => {
    const { container } = render(
      <OccludedPanel labelledBy="panel-title" className="test-panel">
        <h2 id="panel-title">Story structure</h2>
        <button type="button">Action</button>
      </OccludedPanel>,
    );

    const panel = screen.getByRole('region', { name: 'Story structure' });
    const action = screen.getByRole('button', { name: 'Action' });
    const directChildren = Array.from(panel.children);

    expect(panel).toHaveAttribute('class', 'occluded-panel test-panel');
    expect(directChildren.map((child) => child.className)).toEqual([
      'occluded-panel__surface',
      'occluded-panel__top-cap occluded-panel__top-cap--left',
      'occluded-panel__top-cap occluded-panel__top-cap--right',
      'occluded-panel__content',
    ]);

    const [surface, leftCap, rightCap, content] = directChildren;
    expect(surface).toHaveAttribute('aria-hidden', 'true');
    expect(leftCap).toHaveAttribute('aria-hidden', 'true');
    expect(rightCap).toHaveAttribute('aria-hidden', 'true');
    expect(surface).toBeEmptyDOMElement();
    expect(leftCap).toBeEmptyDOMElement();
    expect(rightCap).toBeEmptyDOMElement();
    expect(within(surface as HTMLElement).queryByRole('button', { name: 'Action' })).toBeNull();
    expect(within(content as HTMLElement).getByRole('button', { name: 'Action' })).toBe(action);
    expect(container.querySelectorAll('#panel-title')).toHaveLength(1);
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });

  it('uses only the base class when no optional class name is supplied', () => {
    render(
      <OccludedPanel labelledBy="plain-panel-title">
        <h2 id="plain-panel-title">Plain panel</h2>
      </OccludedPanel>,
    );

    expect(screen.getByRole('region', { name: 'Plain panel' })).toHaveAttribute(
      'class',
      'occluded-panel',
    );
  });
});
