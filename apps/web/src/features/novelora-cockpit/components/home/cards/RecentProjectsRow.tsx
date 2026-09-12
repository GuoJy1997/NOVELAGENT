import { Plus, Star } from 'lucide-react';
import { bixinAssets, homeProjectCovers } from '../../../assetRegistry';
import type { HomeRecentProject } from '../../../data/bixinHomeContent';

export function RecentProjectsRow({ projects, onOpen, onNew, coverSrc }: { projects: HomeRecentProject[]; onOpen: (id: string) => void; onNew: () => void; coverSrc?: string }) {
  return (
    <section className="bixin-dashboard-card bixin-dashboard-card--recent" aria-label="最近项目">
      <header><h2><Star aria-hidden="true" />最近项目</h2></header>
      <div className="bixin-recent-projects">
        {projects.map((project, index) => {
          const generatedCover = [
            homeProjectCovers.cloudThrone,
            homeProjectCovers.starseaTraveler,
            homeProjectCovers.changanNightTales,
          ][index] ?? homeProjectCovers.defaultFantasy;
          const projectCover = index === 0 ? (coverSrc ?? generatedCover) : generatedCover;

          return (
          <button type="button" className="bixin-recent-card" key={project.id} onClick={() => onOpen(project.id)}>
            <img src={projectCover ?? bixinAssets.projectCover} alt={`${project.title}封面`} />
            <span className="bixin-status-pill">{project.genre}</span>
            <strong>{project.title}</strong><small>{project.latestChapter}</small><span className="bixin-recent-card__words">{project.words}<small>{project.progressPercent}%</small></span>
            <div className="bixin-recent-card__track"><span style={{ width: `${project.progressPercent}%` }} /></div>
          </button>
          );
        })}
        <button type="button" className="bixin-recent-card bixin-recent-card--new" onClick={onNew}><Plus aria-hidden="true" /> 新建作品</button>
      </div>
    </section>
  );
}
