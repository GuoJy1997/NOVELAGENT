import bellIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/actions/bell.svg';
import searchIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/actions/search.svg';
import type { NoveloraProject } from '../types';

interface WorkspaceTopbarProps {
  project: NoveloraProject;
}

export function WorkspaceTopbar({ project }: WorkspaceTopbarProps) {
  return (
    <div className="workspace-topbar-content">
      <div className="workspace-project-meta">
        <p className="workspace-eyebrow">{project.genre}</p>
        <h1>{project.title}</h1>
        <p className="workspace-progress">3,240 / 80,000 words</p>
      </div>

      <div className="workspace-actions">
        <form className="workspace-search" role="search">
          <label className="sr-only" htmlFor="workspace-search-input">
            Search workspace
          </label>
          <img src={searchIcon} alt="" aria-hidden="true" />
          <input id="workspace-search-input" type="search" placeholder="Search" />
        </form>
        <button type="button" className="topbar-icon-button" aria-label="View notifications">
          <img src={bellIcon} alt="" aria-hidden="true" />
        </button>
        <button type="button" className="user-avatar" aria-label="Open profile menu for Ari Chen">
          AC
        </button>
      </div>
    </div>
  );
}
