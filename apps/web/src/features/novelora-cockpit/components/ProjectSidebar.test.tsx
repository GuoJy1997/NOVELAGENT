import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { noveloraMockProject } from '../data/noveloraMockProject';
import { ProjectSidebar } from './ProjectSidebar';

describe('ProjectSidebar', () => {
  it('does not render the retired two-dimensional Nova decoration', () => {
    const { container } = render(<ProjectSidebar project={noveloraMockProject} />);

    expect(container.querySelector('.nova-scene')).not.toBeInTheDocument();
    expect(
      container.querySelector('img[alt=""][aria-hidden="true"][src*="mascot_nova_front.svg"]'),
    ).not.toBeInTheDocument();
  });
});
