import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { StructureMap } from './StructureMap';

function StructureMapHarness({ onSelectAct }: { onSelectAct: (actId: string) => void }) {
  const [selectedActId, setSelectedActId] = useState('act-i');

  return (
    <StructureMap
      acts={noveloraMockProject.acts}
      selectedActId={selectedActId}
      onSelectAct={(actId) => {
        setSelectedActId(actId);
        onSelectAct(actId);
      }}
    />
  );
}

describe('StructureMap', () => {
  it('selects Act II and reports the chosen act', async () => {
    const user = userEvent.setup();
    const onSelectAct = vi.fn();

    render(<StructureMapHarness onSelectAct={onSelectAct} />);

    const actTwo = screen.getByRole('button', { name: /Act II — The Drowned Map/i });
    await user.click(actTwo);

    expect(actTwo.getAttribute('aria-pressed')).toBe('true');
    expect(onSelectAct).toHaveBeenCalledWith('act-ii');
  });
});
