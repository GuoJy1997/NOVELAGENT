import { useState } from 'react';
import {
  startCharacterImport,
  startDocumentImport,
} from '../../lib/importSession';
import {
  pickWorkspaceFile,
  type CharacterFile,
} from '../../lib/noveloraApi';
import { CharacterImportPreview } from './CharacterImportPreview';
import { DocumentImportPreview } from './DocumentImportPreview';

interface DomainOnboardingBase {
  projectId: string;
  domainLabel: string;
  onStartEmpty: () => void;
}

export type DomainOnboardingProps = DomainOnboardingBase &
  (
    | { kind: 'document'; documentKind: 'outline' | 'world'; onImport: (content: string) => Promise<void> }
    | { kind: 'characters'; onSaved: (file: CharacterFile) => void }
  );

type View = 'choice' | 'document-import' | 'characters-import';

export function DomainOnboarding(props: DomainOnboardingProps) {
  const [view, setView] = useState<View>('choice');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  function openFiles() {
    if (pending) return;
    setPending(true);
    setMessage('');
    pickWorkspaceFile(`选择${props.domainLabel}文件`)
      .then((path) => {
        if (!path) {
          setPending(false);
          return;
        }
        chooseFile(path);
      })
      .catch(() => {
        setMessage('打开系统文件选择器失败，请确认本地 api 服务正在运行。');
        setPending(false);
      });
  }

  function chooseFile(path: string) {
    setSelectedPath(path);
    if (props.kind === 'document') {
      void startDocumentImport({
        projectId: props.projectId,
        kind: props.documentKind,
        filePath: path,
      });
      setView('document-import');
    } else {
      void startCharacterImport({ projectId: props.projectId, filePath: path });
      setView('characters-import');
    }
    setPending(false);
  }

  return (
    <section className="bixin-onboarding" aria-label={`${props.domainLabel}初始化`}>
      {view === 'choice' ? (
        <>
          <header className="bixin-onboarding__header">
            <h3>{`${props.domainLabel}还没有内容`}</h3>
            <p>
              {props.kind === 'characters'
                ? '人物和关系共用一份档案。导入人物小传或关系资料，会同时写到人物列表和关系图。'
                : `你可以用系统文件窗口导入现成的${props.domainLabel}文件，也可以从零开始。`}
            </p>
          </header>
          <div className="bixin-onboarding__cards">
            <button
              type="button"
              className="bixin-onboarding__card"
              onClick={openFiles}
            >
              <strong>已有文件</strong>
              <span>
                {props.kind === 'characters'
                  ? '用系统文件窗口选择 .md 或 .txt，提取人物与关系。'
                  : `用系统文件窗口选择 .md 或 .txt 文件，导入为${props.domainLabel}。`}
              </span>
            </button>
            <button
              type="button"
              className="bixin-onboarding__card"
              onClick={props.onStartEmpty}
            >
              <strong>暂不存在</strong>
              <span>{`从空白开始，直接在编辑器里撰写${props.domainLabel}。`}</span>
            </button>
          </div>
        </>
      ) : null}
      {view === 'document-import' && props.kind === 'document' && selectedPath ? (
        <DocumentImportPreview
          projectId={props.projectId}
          filePath={selectedPath}
          documentKind={props.documentKind}
          domainLabel={props.domainLabel}
          onImport={props.onImport}
          onCancel={props.onStartEmpty}
        />
      ) : null}
      {view === 'characters-import' && props.kind === 'characters' && selectedPath ? (
        <CharacterImportPreview
          projectId={props.projectId}
          filePath={selectedPath}
          onSaved={props.onSaved}
          onCancel={props.onStartEmpty}
        />
      ) : null}
      {message ? <p role="alert">{message}</p> : null}
    </section>
  );
}
