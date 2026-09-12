import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EchoComposer } from './EchoComposer';

const catalog = {
  skills: [{ id: 'github-pr-workflow', label: 'github-pr-workflow', hint: 'GitHub', kind: 'skill' as const }],
  commands: [],
  experts: [{ id: 'delegate_task', label: 'delegate_task', hint: 'subagent', kind: 'expert' as const }],
};

const models = [
  { id: 'deepseek-v4-flash', label: 'deepseek-v4-flash' },
  { id: 'deepseek-v4-pro', label: 'deepseek-v4-pro' },
];

describe('EchoComposer', () => {
  it('opens Hermes skills when / is typed and inserts the chosen skill', async () => {
    const user = userEvent.setup();
    render(
      <EchoComposer
        catalog={catalog}
        models={models}
        streaming={false}
        onSend={() => undefined}
        onStop={() => undefined}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), '/');
    const skills = await screen.findByRole('listbox', { name: '技能' });
    expect(skills).toBeVisible();
    await user.click(screen.getByRole('option', { name: /github-pr-workflow/i }));
    expect(screen.getByRole('textbox', { name: '给 Hermes 的消息' })).toHaveValue('/github-pr-workflow ');
  });

  it('opens Hermes experts when @ is typed', async () => {
    const user = userEvent.setup();
    render(
      <EchoComposer
        catalog={catalog}
        models={models}
        streaming={false}
        onSend={() => undefined}
        onStop={() => undefined}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), '@');
    expect(await screen.findByRole('listbox', { name: '专家' })).toBeVisible();
    await user.click(screen.getByRole('option', { name: /delegate_task/i }));
    expect(screen.getByRole('textbox', { name: '给 Hermes 的消息' })).toHaveValue('@delegate_task ');
  });

  it('shows an empty skill menu when Hermes returned no skills', async () => {
    const user = userEvent.setup();
    render(
      <EchoComposer
        catalog={{ skills: [], commands: [], experts: [] }}
        models={models}
        streaming={false}
        onSend={() => undefined}
        onStop={() => undefined}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), '/');
    expect(screen.getByRole('listbox', { name: '技能' })).toBeVisible();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('dismisses the skills listbox when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(
      <EchoComposer
        catalog={catalog}
        models={models}
        streaming={false}
        onSend={() => undefined}
        onStop={() => undefined}
      />,
    );

    const field = screen.getByRole('textbox', { name: '给 Hermes 的消息' });
    await user.type(field, '/');

    expect(await screen.findByRole('listbox', { name: '技能' })).toBeVisible();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox', { name: '技能' })).not.toBeInTheDocument();
    expect(field).toHaveValue('');
  });

  it('attaches a file chip from the attach control', async () => {
    const user = userEvent.setup();
    render(<EchoComposer catalog={catalog} models={models} streaming={false} onSend={() => undefined} onStop={() => undefined} />);

    const file = new File(['outline'], 'outline.md', { type: 'text/markdown' });
    await user.upload(screen.getByLabelText('附件'), file);

    expect(screen.getByText('outline.md')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /voice|microphone/i })).not.toBeInTheDocument();
  });

  it('sends the selected model with the message', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<EchoComposer catalog={catalog} models={models} streaming={false} onSend={onSend} onStop={() => undefined} />);

    await user.click(screen.getByRole('button', { name: '模型' }));
    await user.click(screen.getByRole('option', { name: 'deepseek-v4-pro' }));
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), 'Tighten the ending');
    await user.click(screen.getByRole('button', { name: '发送' }));

    expect(onSend).toHaveBeenCalledWith({
      text: 'Tighten the ending',
      model: 'deepseek-v4-pro',
      attachments: [],
    });
  });
});
