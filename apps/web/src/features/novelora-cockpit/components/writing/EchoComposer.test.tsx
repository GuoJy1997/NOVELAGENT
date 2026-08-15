import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EchoComposer } from './EchoComposer';

describe('EchoComposer', () => {
  it('opens skills when / is typed and inserts the chosen skill', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<EchoComposer streaming={false} onSend={onSend} onStop={() => undefined} />);

    const field = screen.getByRole('textbox', { name: 'Message Echo' });
    await user.type(field, '/');

    const skills = await screen.findByRole('listbox', { name: 'Skills' });
    expect(skills).toBeVisible();
    await user.click(screen.getByRole('option', { name: /单章起草/i }));

    expect(field).toHaveValue('/scene-drafting ');
    expect(screen.queryByRole('listbox', { name: 'Skills' })).not.toBeInTheDocument();
  });

  it('opens experts when @ is typed and inserts the chosen expert', async () => {
    const user = userEvent.setup();
    render(<EchoComposer streaming={false} onSend={() => undefined} onStop={() => undefined} />);

    const field = screen.getByRole('textbox', { name: 'Message Echo' });
    await user.type(field, '@');

    expect(await screen.findByRole('listbox', { name: 'Experts' })).toBeVisible();
    await user.click(screen.getByRole('option', { name: /情节顾问/i }));

    expect(field).toHaveValue('@plot-architect ');
  });

  it('attaches a file chip from the attach control', async () => {
    const user = userEvent.setup();
    render(<EchoComposer streaming={false} onSend={() => undefined} onStop={() => undefined} />);

    const file = new File(['outline'], 'outline.md', { type: 'text/markdown' });
    await user.upload(screen.getByLabelText('Attach files'), file);

    expect(screen.getByText('outline.md')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /voice|microphone/i })).not.toBeInTheDocument();
  });

  it('sends the selected model with the message', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<EchoComposer streaming={false} onSend={onSend} onStop={() => undefined} />);

    await user.click(screen.getByRole('button', { name: 'Model' }));
    await user.click(screen.getByRole('option', { name: 'GPT-4.1' }));
    await user.type(screen.getByRole('textbox', { name: 'Message Echo' }), 'Tighten the ending');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledWith({
      text: 'Tighten the ending',
      model: 'gpt-4.1',
      attachments: [],
    });
  });
});
