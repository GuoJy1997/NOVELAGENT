import { appIcon, navigationIcons } from '../assetRegistry';
import { NAV_ITEMS, type NavId } from '../nav';
import type { NoveloraProject } from '../types';

export interface ProjectSidebarProps {
  activeItem?: NavId;
  onSelectItem?: (id: NavId) => void;
  onNewProject?: () => void;
  /** Temporary compatibility for App until the controlled shell is wired. */
  project?: NoveloraProject;
}

const navIcons: Record<NavId, string> = {
  home: navigationIcons.home,
  writing: navigationIcons.inspiration,
  outline: navigationIcons.structure,
  characters: navigationIcons.characters,
  relations: navigationIcons.projects,
  world: navigationIcons.worldbuilding,
  tasks: navigationIcons.review,
};

const doNothing = () => undefined;

export function ProjectSidebar({
  activeItem = 'home',
  onSelectItem = doNothing,
  onNewProject = doNothing,
}: ProjectSidebarProps) {
  return (
    <div className="project-sidebar-content">
      <div className="echo-brand">
        <img className="echo-brand__mark" src={appIcon} alt="Echo" />
        <span className="echo-brand__copy">
          <strong>echo</strong>
          <small>AI Writing Studio</small>
        </span>
      </div>

      <button className="echo-new-project" type="button" onClick={onNewProject}>
        <span aria-hidden="true">+</span>
        <span>New Project</span>
        <span aria-hidden="true">→</span>
      </button>

      <nav aria-label="Workspace navigation" className="project-navigation">
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = activeItem === id;

          return (
            <button
              className={`project-navigation__item${isActive ? ' is-active' : ''}`}
              type="button"
              aria-pressed={isActive}
              key={id}
              onClick={() => onSelectItem(id)}
            >
              <img src={navIcons[id]} alt="" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="echo-sidebar-utilities" aria-label="Workspace utilities">
        <button className="echo-utility-button" type="button" aria-label="Settings">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1A1.7 1.7 0 0 0 2.4 13.6H2V9.55h.4A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4.05v.4a1.7 1.7 0 0 0 1 1.7 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.35 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4H21v4.05h-.1a1.7 1.7 0 0 0-1.5 1.05Z" />
          </svg>
        </button>
        <button className="echo-utility-button" type="button" aria-label="Theme">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
          </svg>
        </button>
      </div>

      <section className="echo-progress-card" aria-labelledby="echo-progress-title">
        <h2 id="echo-progress-title">Today's Progress</h2>
        <div className="echo-progress-card__ring" aria-label="72 percent complete" role="img">
          <strong>72%</strong>
        </div>
        <p><strong>2,436</strong> / 3,400 words</p>
        <button type="button">View Details</button>
      </section>
    </div>
  );
}
