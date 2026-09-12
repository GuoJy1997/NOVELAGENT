import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  CalendarCheck2,
  FileText,
  Target,
} from 'lucide-react';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { bixinAssets } from '../../../assetRegistry';
import type { HomeDashboardView } from '../../../data/homeDashboardView';

interface ProjectOverviewCardProps extends ComponentPropsWithoutRef<'section'> {
  onOpenProject: () => void;
  coverSrc?: string;
  view: HomeDashboardView['project'];
}

export function ProjectOverviewCard({
  className,
  onOpenProject,
  coverSrc,
  view: project,
  ...sectionProps
}: ProjectOverviewCardProps) {
  const metricIcons = [FileText, Target, CalendarCheck2, BadgeCheck] as const;
  const [coverFailed, setCoverFailed] = useState(false);
  const coverImage = coverFailed || !coverSrc ? bixinAssets.projectCover : coverSrc;

  useEffect(() => {
    setCoverFailed(false);
  }, [coverSrc]);

  return (
    <section
      {...sectionProps}
      className={['bixin-card', 'bixin-card--project', className].filter(Boolean).join(' ')}
      aria-labelledby="bixin-project-title"
    >
      <header className="bixin-card__header">
        <Bookmark aria-hidden="true" />
        <h2 id="bixin-project-title">我的项目</h2>
      </header>
      <div className="bixin-project__body">
        <img
          className="bixin-project__cover"
          src={coverImage}
          alt={`${project.title}封面`}
          width={160}
          height={160}
          onError={() => {
            if (!coverFailed) setCoverFailed(true);
          }}
        />
        <div className="bixin-project__summary">
          <div className="bixin-project__heading">
            <h3>{project.title}</h3>
            <span className="bixin-status-pill">{project.status}</span>
          </div>
          <p>{project.description}</p>
        </div>
      </div>
      <dl className="bixin-project__metrics">
        {project.metrics.map((metric, index) => {
          const MetricIcon = metricIcons[index];

          return (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>
              <MetricIcon aria-hidden="true" />
              {metric.value}
            </dd>
          </div>
          );
        })}
      </dl>
      <button type="button" className="bixin-card__action" onClick={onOpenProject}>
        打开项目
        <ArrowUpRight aria-hidden="true" />
      </button>
    </section>
  );
}
