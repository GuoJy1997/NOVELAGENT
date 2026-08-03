import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { actionIcons, characterPortraits, projectCovers } from '../assetRegistry';
import type { NoveloraProject } from '../types';

interface WorkspaceTopbarProps {
  project: NoveloraProject;
}

export function WorkspaceTopbar({ project }: WorkspaceTopbarProps) {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuId = useId();
  const projectSwitcherRef = useRef<HTMLButtonElement>(null);
  const projectMenuItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isProjectMenuOpen) projectMenuItemRef.current?.focus();
  }, [isProjectMenuOpen]);

  function closeProjectMenu() {
    setIsProjectMenuOpen(false);
    projectSwitcherRef.current?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowDown') return;

    event.preventDefault();
    setIsProjectMenuOpen(true);
  }

  function handleSwitcherKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isProjectMenuOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeProjectMenu();
      return;
    }

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      projectMenuItemRef.current?.focus();
    }
  }

  return (
    <div className="workspace-topbar-content">
      <div className="echo-project-switcher" onKeyDown={handleSwitcherKeyDown}>
        <button
          ref={projectSwitcherRef}
          className="echo-project-switcher__trigger"
          type="button"
          aria-haspopup="menu"
          aria-expanded={isProjectMenuOpen}
          aria-controls={isProjectMenuOpen ? projectMenuId : undefined}
          onClick={() => setIsProjectMenuOpen((isOpen) => !isOpen)}
          onKeyDown={handleTriggerKeyDown}
        >
          <img src={projectCovers[project.coverAssetKey]} alt="" aria-hidden="true" />
          <strong>{project.title}</strong>
          <span aria-hidden="true">⌄</span>
        </button>
        {isProjectMenuOpen ? (
          <div
            className="echo-project-switcher__menu"
            id={projectMenuId}
            role="menu"
            aria-label="Project switcher"
          >
            <button
              ref={projectMenuItemRef}
              type="button"
              role="menuitem"
              aria-current="true"
              onClick={closeProjectMenu}
            >
              <strong>{project.title}</strong>
              <small>Current project</small>
            </button>
          </div>
        ) : null}
      </div>

      <span className="echo-project-status">
        <span aria-hidden="true" />
        In Progress
      </span>
      <span className="echo-word-target">
        <span aria-hidden="true">◎</span>
        <strong>{project.wordGoal.toLocaleString()} words</strong>
      </span>

      <div className="workspace-actions">
        <form className="workspace-search" role="search">
          <label className="sr-only" htmlFor="workspace-search-input">
            Search workspace
          </label>
          <img src={actionIcons.search} alt="" aria-hidden="true" />
          <input id="workspace-search-input" type="search" placeholder="Search anything..." />
          <kbd aria-hidden="true">⌘ K</kbd>
        </form>
        <button type="button" className="topbar-icon-button" aria-label="View notifications">
          <img src={actionIcons.bell} alt="" aria-hidden="true" />
          <span className="echo-notification-dot" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="user-avatar"
          aria-label="Open user menu for Ari Chen"
        >
          <img src={characterPortraits.liora} alt="Ari Chen" />
          <span className="echo-user-presence" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
