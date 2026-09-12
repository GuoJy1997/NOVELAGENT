import { useCallback, useEffect, useState } from 'react';
import { BixinHomePage } from './features/novelora-cockpit/components/home/BixinHomePage';
import { WorkspacePicker } from './features/novelora-cockpit/components/home/WorkspacePicker';
import { CharactersPage } from './features/novelora-cockpit/components/pages/CharactersPage';
import { MarkdownDocumentPage } from './features/novelora-cockpit/components/pages/MarkdownDocumentPage';
import { RelationsPage } from './features/novelora-cockpit/components/pages/RelationsPage';
import { TaskBoardPage } from './features/novelora-cockpit/components/pages/TaskBoardPage';
import { WorkflowCanvasPage } from './features/novelora-cockpit/components/pages/WorkflowCanvasPage';
import { WritingView } from './features/novelora-cockpit/components/writing/WritingView';
import { noveloraMockProject } from './features/novelora-cockpit/data/noveloraMockProject';
import { useImportCompletionNotice } from './features/novelora-cockpit/lib/importSession';
import { coverUrl, listWorkspaces } from './features/novelora-cockpit/lib/noveloraApi';
import type { NavId } from './features/novelora-cockpit/nav';

const ACTION_FEEDBACK_DURATION_MS = 3200;
const DEFAULT_PROJECT_ID = 'default-project';
const WORKSPACE_STORAGE_KEY = 'novelora.workspace';

export default function App() {
  const [activeNavigation, setActiveNavigation] = useState<NavId>('home');
  const [actionMessage, setActionMessage] = useState('');
  const [actionTarget, setActionTarget] = useState<NavId | null>(null);
  const [writingChapterNum, setWritingChapterNum] = useState(1);
  const [currentProjectId, setCurrentProjectId] = useState(DEFAULT_PROJECT_ID);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [coverVersion, setCoverVersion] = useState(0);
  const timelineChapters = [...noveloraMockProject.chapters].sort(
    (first, second) => first.order - second.order,
  );
  const currentChapterIndex = timelineChapters.findIndex(
    (chapter) => chapter.id === noveloraMockProject.selectedChapterId,
  );

  const showMessage = useCallback((message: string) => {
    setActionTarget(null);
    setActionMessage(message);
  }, []);

  const announceImport = useCallback((notice: { text: string; nav: NavId }) => {
    setActionTarget(notice.nav);
    setActionMessage(notice.text);
  }, []);

  useImportCompletionNotice(currentProjectId, announceImport);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const dismissalTimer = window.setTimeout(() => {
      setActionMessage('');
      setActionTarget(null);
    }, ACTION_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(dismissalTimer);
  }, [actionMessage]);

  useEffect(() => {
    let cancelled = false;
    listWorkspaces()
      .then((workspaces) => {
        if (cancelled || workspaces.length === 0) return;
        const storedId = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
        const matched = workspaces.find((workspace) => workspace.id === storedId);
        const fallback = workspaces[0];
        if (!fallback) return;
        setCurrentProjectId(matched?.id ?? fallback.id);
      })
      .catch(() => {
        /* Keep the demo project when the local api is offline. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openWriting(chapterNum: number) {
    setWritingChapterNum(chapterNum);
    setActiveNavigation('writing');
  }

  function workbench() {
    if (activeNavigation === 'writing') {
      return (
        <WritingView
          projectId={currentProjectId}
          chapterNum={writingChapterNum}
          onSelectChapter={setWritingChapterNum}
          onBack={() => setActiveNavigation('home')}
        />
      );
    }
    if (activeNavigation === 'outline') {
      return (
        <MarkdownDocumentPage
          projectId={currentProjectId}
          document="outline"
          title="大纲"
          hint=""
          onBack={() => setActiveNavigation('home')}
        />
      );
    }
    if (activeNavigation === 'world') {
      return (
        <MarkdownDocumentPage
          projectId={currentProjectId}
          document="world"
          title="世界观"
          hint="这是设定编辑，不会召唤 Agent。"
          onBack={() => setActiveNavigation('home')}
        />
      );
    }
    if (activeNavigation === 'characters') {
      return (
        <CharactersPage
          projectId={currentProjectId}
          onBack={() => setActiveNavigation('home')}
          onOpenRelations={() => setActiveNavigation('relations')}
        />
      );
    }
    if (activeNavigation === 'relations') {
      return <RelationsPage projectId={currentProjectId} onBack={() => setActiveNavigation('home')} />;
    }
    if (activeNavigation === 'workflow') {
      return <WorkflowCanvasPage projectId={currentProjectId} />;
    }
    if (activeNavigation === 'tasks') {
      return <TaskBoardPage projectId={currentProjectId} />;
    }
    return null;
  }

  return (
    <>
      <BixinHomePage
        activeNavigation={activeNavigation}
        onSelectNavigation={setActiveNavigation}
        onContinueWriting={() => openWriting(currentChapterIndex + 1)}
        onOpenProject={() => setPickerOpen(true)}
        onNewProject={() => setPickerOpen(true)}
        onShowMessage={showMessage}
        coverSrc={`${coverUrl(currentProjectId)}?v=${coverVersion}`}
        projectId={currentProjectId}
      >
        {workbench()}
      </BixinHomePage>
      {pickerOpen ? (
        <WorkspacePicker
          currentProjectId={currentProjectId}
          onSelect={(projectId) => {
            setCurrentProjectId(projectId);
            window.localStorage.setItem(WORKSPACE_STORAGE_KEY, projectId);
            setWritingChapterNum(1);
            setPickerOpen(false);
            setCoverVersion((version) => version + 1);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
      <div
        className={`bixin-action-feedback${actionMessage ? ' is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {actionMessage && actionTarget ? (
          <button
            type="button"
            onClick={() => {
              setActiveNavigation(actionTarget);
              setActionMessage('');
              setActionTarget(null);
            }}
          >
            {actionMessage}
          </button>
        ) : actionMessage}
      </div>
    </>
  );
}
