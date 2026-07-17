import homeIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/home.svg';
import charactersIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/characters.svg';
import inspirationIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/inspiration.svg';
import projectsIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/projects.svg';
import reviewIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/review.svg';
import structureIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/structure.svg';
import worldbuildingIcon from '../../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/worldbuilding.svg';
import { logo, projectCovers } from '../assetRegistry';
import type { NoveloraProject } from '../types';

interface ProjectSidebarProps {
  project: NoveloraProject;
}

const navigationItems: ReadonlyArray<{ label: string; icon: string; active?: boolean }> = [
  { label: 'Home', icon: homeIcon },
  { label: 'Story Map', icon: structureIcon, active: true },
  { label: 'Characters', icon: charactersIcon },
  { label: 'Worldbuilding', icon: worldbuildingIcon },
  { label: 'Projects', icon: projectsIcon },
  { label: 'Inspiration', icon: inspirationIcon },
  { label: 'Review', icon: reviewIcon },
];

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  return (
    <div className="project-sidebar-content">
      <img className="novelora-logo" src={logo} alt="Novelora" />

      <nav aria-label="Workspace navigation" className="project-navigation">
        {navigationItems.map(({ label, icon, active }) => (
          <button
            className={`project-navigation__item${active ? ' is-active' : ''}`}
            type="button"
            aria-pressed={active ?? false}
            key={label}
          >
            <img src={icon} alt="" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <section className="project-mini-list" aria-labelledby="project-list-title">
        <div className="sidebar-section-heading">
          <h2 id="project-list-title">Current project</h2>
          <button type="button" aria-label="Add project" className="sidebar-add-project">
            +
          </button>
        </div>
        <button type="button" className="project-mini-card" aria-label={`Open ${project.title}`}>
          <img src={projectCovers[project.coverAssetKey]} alt="" />
          <span>
            <strong>{project.title}</strong>
            <small>{project.chapters.length} chapters</small>
          </span>
        </button>
      </section>

      <section className="writing-streak" aria-label="Writing streak">
        <span className="writing-streak__count">12</span>
        <span>
          <strong>day writing streak</strong>
          <small>Keep your harbor burning.</small>
        </span>
      </section>
    </div>
  );
}
