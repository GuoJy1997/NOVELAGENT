import { bixinHomeContent } from '../../data/bixinHomeContent';
import type { NavId } from '../../nav';
import { ChallengeCard } from './cards/ChallengeCard';
import { CopilotCard } from './cards/CopilotCard';
import { QuickGenCard } from './cards/QuickGenCard';
import { RecentProjectsRow } from './cards/RecentProjectsRow';
import { AiSuggestionsCard } from './cards/AiSuggestionsCard';

interface HomeDashboardProps {
  onOpenProject: () => void;
  onNewProject: () => void;
  coverSrc?: string;
  projectId?: string;
  onNavigate: (nav: NavId) => void;
  onStartWriting: () => void;
  onShowMessage: (message: string) => void;
}

export function HomeDashboard({
  onOpenProject,
  onNewProject,
  coverSrc,
  onNavigate,
  onStartWriting,
  onShowMessage,
}: HomeDashboardProps) {
  return (
    <div className="bixin-dashboard">
      <div className="bixin-dashboard__cards-row">
        <ChallengeCard
          challenge={bixinHomeContent.challenge}
          onStart={() => onShowMessage('创作挑战暂未在演示版开放。')}
        />
        <CopilotCard
          actions={bixinHomeContent.copilotActions}
          onPick={() => onStartWriting()}
        />
        <QuickGenCard
          actions={[...bixinHomeContent.quickActions]}
          onNavigate={onNavigate}
        />
      </div>
      <RecentProjectsRow
        projects={[...bixinHomeContent.recentProjects]}
        coverSrc={coverSrc}
        onOpen={(id) =>
          id === bixinHomeContent.recentProjects[0].id
            ? onOpenProject()
            : onShowMessage('该演示项目暂未开放。')
        }
        onNew={onNewProject}
      />
      <AiSuggestionsCard suggestions={[...bixinHomeContent.suggestions]} />
    </div>
  );
}
