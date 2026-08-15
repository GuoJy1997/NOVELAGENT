import { useEffect, useState } from 'react';
import { AppShell } from './features/novelora-cockpit/components/AppShell';
import { EchoHeroCopy } from './features/novelora-cockpit/components/EchoHeroCopy';
import { HomeDashboard } from './features/novelora-cockpit/components/home/HomeDashboard';
import { ProjectSidebar } from './features/novelora-cockpit/components/ProjectSidebar';
import { WorkspaceTopbar } from './features/novelora-cockpit/components/WorkspaceTopbar';
import { CharactersPage } from './features/novelora-cockpit/components/pages/CharactersPage';
import { MarkdownDocumentPage } from './features/novelora-cockpit/components/pages/MarkdownDocumentPage';
import { RelationsPage } from './features/novelora-cockpit/components/pages/RelationsPage';
import { TaskBoardPage } from './features/novelora-cockpit/components/pages/TaskBoardPage';
import { WritingView } from './features/novelora-cockpit/components/writing/WritingView';
import { noveloraMockProject } from './features/novelora-cockpit/data/noveloraMockProject';
import type { NavId } from './features/novelora-cockpit/nav';

const ACTION_FEEDBACK_DURATION_MS = 3200;

type AppView = 'dashboard' | 'writing' | 'outline' | 'characters' | 'relations' | 'world' | 'tasks';

export default function App() {
  const [activeNavigation, setActiveNavigation] = useState<NavId>('home');
  const [actionMessage, setActionMessage] = useState('');
  const [view, setView] = useState<AppView>('dashboard');
  const [writingChapterNum, setWritingChapterNum] = useState(1);
  const timelineChapters = [...noveloraMockProject.chapters].sort(
    (first, second) => first.order - second.order,
  );
  const currentChapterIndex = timelineChapters.findIndex(
    (chapter) => chapter.id === noveloraMockProject.selectedChapterId,
  );

  useEffect(() => {
    if (!actionMessage) return undefined;

    const dismissalTimer = window.setTimeout(
      () => setActionMessage(''),
      ACTION_FEEDBACK_DURATION_MS,
    );

    return () => window.clearTimeout(dismissalTimer);
  }, [actionMessage]);

  function openWriting(chapterNum: number) {
    setWritingChapterNum(chapterNum);
    setActiveNavigation('writing');
    setView('writing');
  }

  function selectNavigation(id: NavId) {
    setActiveNavigation(id);
    if (id === 'home') {
      setView('dashboard');
      return;
    }
    if (id === 'writing') {
      openWriting(writingChapterNum);
      return;
    }
    setView(id);
  }

  return (
    <>
      <AppShell
        sidebar={
          <ProjectSidebar
            activeItem={activeNavigation}
            onSelectItem={selectNavigation}
            onNewProject={() =>
              setActionMessage('New project creation is not available in this demo.')
            }
          />
        }
        topbar={<WorkspaceTopbar project={noveloraMockProject} />}
        hero={
          <EchoHeroCopy
            onContinueWriting={() => openWriting(currentChapterIndex + 1)}
            onAIAssist={() =>
              setActionMessage('AI Assist is ready for the selected chapter.')
            }
          />
        }
      >
        {view === 'dashboard' && (
          <HomeDashboard
            onOpenProject={() => openWriting(currentChapterIndex + 1)}
            onAddSchedule={() =>
              setActionMessage('Schedule entries are not editable in this demo.')
            }
          />
        )}
        {view === 'writing' && (
          <WritingView
            projectId="default-project"
            chapterNum={writingChapterNum}
            onSelectChapter={setWritingChapterNum}
            onBack={() => {
              setActiveNavigation('home');
              setView('dashboard');
            }}
          />
        )}
        {view === 'outline' && (
          <MarkdownDocumentPage
            projectId="default-project"
            document="outline"
            title="大纲"
            hint=""
          />
        )}
        {view === 'world' && (
          <MarkdownDocumentPage
            projectId="default-project"
            document="world"
            title="世界观"
            hint="这是设定编辑，不会召唤 Agent。"
          />
        )}
        {view === 'characters' && <CharactersPage projectId="default-project" />}
        {view === 'relations' && <RelationsPage projectId="default-project" />}
        {view === 'tasks' && <TaskBoardPage projectId="default-project" />}
      </AppShell>
      <div
        className={`echo-action-feedback${actionMessage ? ' is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {actionMessage}
      </div>
    </>
  );
}
