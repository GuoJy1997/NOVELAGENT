import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EchoHeroCopy } from './EchoHeroCopy';

describe('EchoHeroCopy', () => {
  it('renders the reference heading and supporting copy', () => {
    render(<EchoHeroCopy onContinueWriting={() => undefined} onAIAssist={() => undefined} />);

    expect(
      screen.getByRole('heading', { name: 'Bring your story to life with AI' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Your intelligent writing partner that helps you craft compelling stories, one chapter at a time.',
      ),
    ).toBeVisible();
  });

  it('reports both hero actions', async () => {
    const user = userEvent.setup();
    const onContinueWriting = vi.fn();
    const onAIAssist = vi.fn();
    render(
      <EchoHeroCopy onContinueWriting={onContinueWriting} onAIAssist={onAIAssist} />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue Writing' }));
    await user.click(screen.getByRole('button', { name: 'AI Assist' }));

    expect(onContinueWriting).toHaveBeenCalledOnce();
    expect(onAIAssist).toHaveBeenCalledOnce();
  });
});
