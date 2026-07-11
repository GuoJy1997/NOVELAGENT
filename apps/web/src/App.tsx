import { useRef, useState } from 'react';
import { AgentPanel } from './features/novelora-cockpit/components/AgentPanel';
import './styles/cockpit.css';
import { AppShell } from './features/novelora-cockpit/components/AppShell';
import { ChapterSwimlane } from './features/novelora-cockpit/components/ChapterSwimlane';
import { ChapterDetailDrawer } from './features/novelora-cockpit/components/ChapterDetailDrawer';
import { CharacterGraph } from './features/novelora-cockpit/components/CharacterGraph';
import { ClueAttributionFlow } from './features/novelora-cockpit/components/ClueAttributionFlow';
import { InspirationVault } from './features/novelora-cockpit/components/InspirationVault';
import { ProjectSidebar } from './features/novelora-cockpit/components/ProjectSidebar';
import { StructureMap } from './features/novelora-cockpit/components/StructureMap';
import { WorkspaceTopbar } from './features/novelora-cockpit/components/WorkspaceTopbar';
import { noveloraMockProject } from './features/novelora-cockpit/data/noveloraMockProject';

export default function App() {
  const initialChapter = noveloraMockProject.chapters.find(
    (chapter) => chapter.id === noveloraMockProject.selectedChapterId,
  );
  const [selectedChapterId, setSelectedChapterId] = useState(noveloraMockProject.selectedChapterId);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);
  const chapterDetailsButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedActId, setSelectedActId] = useState(
    initialChapter?.actId ?? noveloraMockProject.acts[0]?.id ?? '',
  );
  const activeChapters = noveloraMockProject.chapters
    .filter((chapter) => chapter.actId === selectedActId)
    .sort((first, second) => first.order - second.order);
  const selectedChapter = noveloraMockProject.chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );

  function selectAct(actId: string) {
    const act = noveloraMockProject.acts.find((candidate) => candidate.id === actId);
    const firstChapterId = act?.chapterIds[0];

    setSelectedActId(actId);
    if (firstChapterId) {
      setSelectedChapterId(firstChapterId);
    }
  }

  return (
    <AppShell
      sidebar={<ProjectSidebar project={noveloraMockProject} />}
      topbar={<WorkspaceTopbar project={noveloraMockProject} />}
      rightPanel={<AgentPanel project={noveloraMockProject} />}
    >
      <div className="story-workspace">
        <StructureMap
          acts={noveloraMockProject.acts}
          selectedActId={selectedActId}
          onSelectAct={selectAct}
        />
        <ChapterSwimlane
          chapters={activeChapters}
          selectedChapterId={selectedChapterId}
          onSelectChapter={setSelectedChapterId}
        />
        <div className="chapter-selection-actions">
          <button
            ref={chapterDetailsButtonRef}
            className="chapter-details-button"
            type="button"
            disabled={!selectedChapter}
            onClick={() => setIsChapterDrawerOpen(true)}
          >
            Open chapter details
          </button>
          <button
            className="chapter-clear-button"
            type="button"
            disabled={!selectedChapter}
            onClick={() => {
              setSelectedChapterId('');
              setIsChapterDrawerOpen(false);
            }}
          >
            Clear chapter selection
          </button>
        </div>
        <div className="knowledge-workspace-grid">
          <InspirationVault inspirations={noveloraMockProject.inspirations} />
          <CharacterGraph
            characters={noveloraMockProject.characters}
            relationships={noveloraMockProject.characterRelationships}
          />
        </div>
        <ClueAttributionFlow
          clueFlows={noveloraMockProject.clueFlows}
          chapters={noveloraMockProject.chapters}
          selectedChapterId={selectedChapterId}
        />
      </div>
      <ChapterDetailDrawer
        project={noveloraMockProject}
        selectedChapter={selectedChapter}
        isOpen={isChapterDrawerOpen}
        onClose={() => setIsChapterDrawerOpen(false)}
        invokerRef={chapterDetailsButtonRef}
      />
    </AppShell>
  );
}
