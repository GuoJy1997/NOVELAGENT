import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { AgentDetailsDrawer } from './AgentDetailsDrawer';

function DrawerHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const invokerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={invokerRef} type="button" onClick={() => setIsOpen(true)}>
        Open agent details
      </button>
      <AgentDetailsDrawer
        project={noveloraMockProject}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        invokerRef={invokerRef}
      />
    </>
  );
}

describe('AgentDetailsDrawer', () => {
  it('returns null while closed', () => {
    render(<DrawerHarness />);
    expect(screen.queryByRole('dialog', { name: 'Agent details' })).toBeNull();
  });

  it('opens a modal portal with initial focus and fixture-backed sections', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    await user.click(screen.getByRole('button', { name: 'Open agent details' }));

    const dialog = screen.getByRole('dialog', { name: 'Agent details' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.closest('.agent-details-drawer-backdrop')?.parentElement).toBe(document.body);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close agent details' }));

    for (const heading of ['Subagents', 'Skills', 'Review Checklist', 'Focus Mode']) {
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    }
    for (const subagent of noveloraMockProject.subagents) {
      expect(screen.getByText(subagent.name)).toBeTruthy();
      expect(screen.getByText(subagent.role)).toBeTruthy();
      expect(screen.getByLabelText(`${subagent.name}: ${subagent.active ? 'active' : 'inactive'}`)).toBeTruthy();
    }
    for (const skill of noveloraMockProject.skills) {
      expect(screen.getByText(skill.label)).toBeTruthy();
    }
    for (const item of noveloraMockProject.reviewChecklist) {
      expect(screen.getByText(item.label)).toBeTruthy();
      expect(screen.getByLabelText(`${item.label}: ${item.passed ? 'passed' : 'pending'}`)).toBeTruthy();
    }
  });

  it('closes by button and restores focus after the parent rerenders closed', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const invoker = screen.getByRole('button', { name: 'Open agent details' });
    await user.click(invoker);
    await user.click(screen.getByRole('button', { name: 'Close agent details' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(invoker);
  });

  it('closes by Escape and restores focus after the parent rerenders closed', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const invoker = screen.getByRole('button', { name: 'Open agent details' });
    await user.click(invoker);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(invoker);
  });

  it('wraps Tab and Shift+Tab and toggles local focus mode', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    await user.click(screen.getByRole('button', { name: 'Open agent details' }));

    const closeButton = screen.getByRole('button', { name: 'Close agent details' });
    const focusToggle = screen.getByRole('button', { name: 'Toggle Focus Mode' });
    expect(focusToggle.getAttribute('aria-pressed')).toBe('false');

    await user.tab();
    expect(document.activeElement).toBe(focusToggle);
    await user.tab();
    expect(document.activeElement).toBe(closeButton);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(focusToggle);

    await user.click(focusToggle);
    expect(focusToggle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('On')).toBeTruthy();
  });
});
