import { useEffect, useRef, useState } from 'react';
import { AIWritingPartner } from './features/novelora-cockpit/components/AIWritingPartner';
import { AgentDetailsDrawer } from './features/novelora-cockpit/components/AgentDetailsDrawer';
import { AppShell } from './features/novelora-cockpit/components/AppShell';
import { ChapterDetailDrawer } from './features/novelora-cockpit/components/ChapterDetailDrawer';
import { ChapterSwimlane } from './features/novelora-cockpit/components/ChapterSwimlane';
import { CharacterGraph } from './features/novelora-cockpit/components/CharacterGraph';
import { ClueAttributionFlow } from './features/novelora-cockpit/components/ClueAttributionFlow';
import { EchoHeroCopy } from './features/novelora-cockpit/components/EchoHeroCopy';
import { InspirationVault } from './features/novelora-cockpit/components/InspirationVault';
import { MemoryLayer } from './features/novelora-cockpit/components/MemoryLayer';
import { ProjectSidebar } from './features/novelora-cockpit/components/ProjectSidebar';
import { StructureMap } from './features/novelora-cockpit/components/StructureMap';
import { WorkspaceTopbar } from './features/novelora-cockpit/components/WorkspaceTopbar';
import { noveloraMockProject } from './features/novelora-cockpit/data/noveloraMockProject';

// Long enough to read without leaving a permanent obstruction over the workspace.
const ACTION_FEEDBACK_DURATION_MS = 3200;

export default function App() {
  const initialChapter = noveloraMockProject.chapters.find(
    (chapter) => chapter.id === noveloraMockProject.selectedChapterId,
  );
  const [activeNavigation, setActiveNavigation] = useState('Home');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState(noveloraMockProject.selectedChapterId);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const chapterDetailsButtonRef = useRef<HTMLButtonElement>(null);
  const agentDetailsButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedActId, setSelectedActId] = useState(
    initialChapter?.actId ?? noveloraMockProject.acts[0]?.id ?? '',
  );
  const activeChapters = noveloraMockProject.chapters
    .filter((chapter) => chapter.actId === selectedActId)
    .sort((first, second) => first.order - second.order);
  const selectedChapter = noveloraMockProject.chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );

  useEffect(() => {
    if (!actionMessage) return undefined;

    const dismissalTimer = window.setTimeout(
      () => setActionMessage(''),
      ACTION_FEEDBACK_DURATION_MS,
    );

    return () => window.clearTimeout(dismissalTimer);
  }, [actionMessage]);

  function selectAct(actId: string) {
    const act = noveloraMockProject.acts.find((candidate) => candidate.id === actId);
    const firstChapterId = act?.chapterIds[0];

    setSelectedActId(actId);
    if (firstChapterId) setSelectedChapterId(firstChapterId);
  }

  function openAgentDetails() {
    if (document.activeElement instanceof HTMLButtonElement) {
      agentDetailsButtonRef.current = document.activeElement;
    }
    setIsAgentDrawerOpen(true);
  }

  return (
    <>
      <AppShell
        sidebar={
          <ProjectSidebar
            activeItem={activeNavigation}
            onSelectItem={setActiveNavigation}
            onNewProject={() =>
              setActionMessage('New project creation is not available in this demo.')
            }
          />
        }
        topbar={<WorkspaceTopbar project={noveloraMockProject} />}
        hero={
          <EchoHeroCopy
            onContinueWriting={() => setActionMessage('Opening the selected chapter draft.')}
            onAIAssist={() =>
              setActionMessage('AI Assist is ready for the selected chapter.')
            }
          />
        }
      >
        <div className="echo-dashboard">
          <div className="echo-dashboard__primary-row">
            <StructureMap
              acts={noveloraMockProject.acts}
              selectedActId={selectedActId}
              onSelectAct={selectAct}
            />
            <div className="echo-dashboard__timeline">
              <ChapterSwimlane
                chapters={activeChapters}
                selectedChapterId={selectedChapterId}
                onSelectChapter={setSelectedChapterId}
              />
              <button
                ref={chapterDetailsButtonRef}
                className="chapter-details-button"
                type="button"
                disabled={!selectedChapter}
                onClick={() => setIsChapterDrawerOpen(true)}
              >
                Open chapter details
              </button>
            </div>
            <AIWritingPartner
              project={noveloraMockProject}
              onViewAll={openAgentDetails}
              viewAllButtonRef={agentDetailsButtonRef}
            />
          </div>

          <div className="echo-dashboard__lower-row knowledge-workspace-grid">
            <InspirationVault
              inspirations={noveloraMockProject.inspirations}
              onViewAll={() =>
                setActionMessage('The full inspiration archive is available from Inspiration.')
              }
            />
            <CharacterGraph
              characters={noveloraMockProject.characters}
              relationships={noveloraMockProject.characterRelationships}
            />
            <ClueAttributionFlow
              clueFlows={noveloraMockProject.clueFlows}
              chapters={noveloraMockProject.chapters}
              selectedChapterId={selectedChapterId}
            />
            <MemoryLayer
              sources={noveloraMockProject.memorySources}
              onManage={openAgentDetails}
            />
          </div>
        </div>
      </AppShell>

      <ChapterDetailDrawer
        project={noveloraMockProject}
        selectedChapter={selectedChapter}
        isOpen={isChapterDrawerOpen}
        onClose={() => setIsChapterDrawerOpen(false)}
        invokerRef={chapterDetailsButtonRef}
      />
      <AgentDetailsDrawer
        project={noveloraMockProject}
        isOpen={isAgentDrawerOpen}
        onClose={() => setIsAgentDrawerOpen(false)}
        invokerRef={agentDetailsButtonRef}
      />
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
