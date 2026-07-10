import { useState } from 'react';
import './styles/cockpit.css';
import { AppShell } from './features/novelora-cockpit/components/AppShell';
import { ChapterSwimlane } from './features/novelora-cockpit/components/ChapterSwimlane';
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
  const [selectedActId, setSelectedActId] = useState(
    initialChapter?.actId ?? noveloraMockProject.acts[0]?.id ?? '',
  );
  const activeChapters = noveloraMockProject.chapters
    .filter((chapter) => chapter.actId === selectedActId)
    .sort((first, second) => first.order - second.order);

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
      rightPanel={
        <div className="coming-soon-panel">
          <p className="workspace-eyebrow">Workspace assistant</p>
          <h2>Coming soon</h2>
          <p>Guided story support will appear here.</p>
        </div>
      }
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
    </AppShell>
  );
}
