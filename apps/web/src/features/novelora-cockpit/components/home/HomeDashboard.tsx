import { echoProjectCover } from '../../assetRegistry';
import {
  calendarMonth,
  chapterProgress,
  chapterSummary,
  characterNetwork,
  homeProject,
  sceneSchedule,
  writingGoals,
} from '../../data/homeDashboard';
import { ProgressRing } from './ProgressRing';

interface HomeDashboardProps {
  onOpenProject: () => void;
  onAddSchedule: () => void;
}

export function HomeDashboard({ onOpenProject, onAddSchedule }: HomeDashboardProps) {
  return (
    <div className="echo-home-dashboard">
      <section className="echo-home-card echo-home-card--project" aria-labelledby="home-project-title">
        <h2 id="home-project-title">我的项目</h2>
        <div className="echo-home-card__project-body">
          <img src={echoProjectCover} alt="" width={160} height={160} />
          <div>
            <div className="echo-home-card__project-heading">
              <p>{homeProject.title}</p>
              <span className="echo-status-pill">{homeProject.status}</span>
            </div>
            <p className="echo-home-card__lede">{homeProject.description}</p>
          </div>
        </div>
        <dl className="echo-home-metrics">
          {homeProject.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="echo-home-card__open" onClick={onOpenProject}>
          打开项目
        </button>
      </section>

      <section className="echo-home-card echo-home-card--chapters" aria-labelledby="home-chapters-title">
        <h2 id="home-chapters-title">章节进度</h2>
        <div className="echo-home-card__split">
          <ul className="echo-progress-pills">
            {chapterProgress.map((item) => (
              <li key={item.label} className={item.highlight ? 'is-active' : undefined}>
                <span>{item.label}</span>
                <span>{item.value}</span>
              </li>
            ))}
          </ul>
          <ProgressRing value={35} subtitle="总进度" />
        </div>
        <p className="echo-home-card__meta">{chapterSummary}</p>
      </section>

      <section className="echo-home-card echo-home-card--network" aria-labelledby="home-network-title">
        <h2 id="home-network-title">人物关系</h2>
        <div className="echo-network">
          <svg className="echo-network__lines" viewBox="0 0 600 220" aria-hidden="true">
            <line x1="300" y1="100" x2="90" y2="48" />
            <line x1="300" y1="100" x2="96" y2="140" />
            <line x1="300" y1="100" x2="510" y2="48" />
            <line x1="300" y1="100" x2="505" y2="140" />
          </svg>
          {characterNetwork.nodes.map((node) => (
            <div
              key={node.name}
              className="echo-network__node"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <span className="echo-network__avatar" style={{ background: node.color }}>
                {node.name.slice(0, 1)}
              </span>
              <strong>{node.name}</strong>
              <small>{node.role}</small>
            </div>
          ))}
          <div className="echo-network__node is-center" style={{ left: '50%', top: '46%' }}>
            <span className="echo-network__avatar">{characterNetwork.center.name.slice(0, 1)}</span>
            <strong>{characterNetwork.center.name}</strong>
            <small>{characterNetwork.center.role}</small>
          </div>
        </div>
        <ul className="echo-network__legend">
          {characterNetwork.legend.map((item) => (
            <li key={item.label}>
              <span style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="echo-home-card echo-home-card--goals" aria-labelledby="home-goals-title">
        <h2 id="home-goals-title">写作目标</h2>
        <div className="echo-home-card__split">
          <ProgressRing value={writingGoals.progress} subtitle={writingGoals.subtitle} />
          <ul className="echo-goal-bars">
            {writingGoals.items.map((item) => (
              <li key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <span>
                    {item.current}/{item.total}
                  </span>
                </div>
                <div className="echo-goal-bars__track">
                  <div className="echo-goal-bars__fill" style={{ width: `${item.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="echo-home-dashboard__pair">
        <section className="echo-home-card" aria-labelledby="home-schedule-title">
          <h2 id="home-schedule-title">场景日程</h2>
          <ul className="echo-schedule">
            {sceneSchedule.map((item) => (
              <li key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                </div>
                <span className="echo-status-pill">{item.badge}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="echo-home-card__add" onClick={onAddSchedule}>
            添加日程
          </button>
        </section>

        <section className="echo-home-card" aria-labelledby="home-calendar-title">
          <h2 id="home-calendar-title">{calendarMonth.label}</h2>
          <div className="echo-calendar" role="region" aria-label="日历">
            <div className="echo-calendar__weekdays">
              {calendarMonth.weekdays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="echo-calendar__days">
              {calendarMonth.days.flat().map((day, index) => (
                <span
                  key={`${day}-${index}`}
                  className={day === calendarMonth.active ? 'is-active' : undefined}
                  aria-current={day === calendarMonth.active ? 'date' : undefined}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
