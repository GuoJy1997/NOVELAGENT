import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AiSuggestionsCard } from './AiSuggestionsCard';

describe('AiSuggestionsCard', () => {
  it('renders suggestions and rotates them', async () => {
    render(<AiSuggestionsCard suggestions={[{ id: 'a', text: '建议一' }, { id: 'b', text: '建议二' }]} />);
    expect(screen.getByRole('region', { name: 'AI 建议' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['建议一', '建议二']);
    await userEvent.click(screen.getByRole('button', { name: '换一换' }));
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['建议二', '建议一']);
  });
});
