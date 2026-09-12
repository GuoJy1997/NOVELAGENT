import { useEffect, useState, useSyncExternalStore } from 'react';
import { emptyCatalog, fetchHermesCatalog, listBixinModels, type HermesCatalog } from '../../lib/hermesCatalog';
import { DEFAULT_LLM_MODEL } from '../../lib/hermesChat';
import {
  getChatSession,
  markChatOnline,
  sendChatTurn,
  stopChatSession,
  subscribeChatSession,
} from '../../lib/chatSession';
import { EchoComposer, type ComposerModel, type ComposerSendPayload } from './EchoComposer';
import { Check } from 'lucide-react';

interface EchoChatProps {
  context: string;
  chapterNum: number;
  projectId: string;
  cwd?: string;
  onCandidatesChanged?: () => void;
}

const MODELS_URL = '/hermes/v1/models';
const OFFLINE_POLL_MS = 15000;
const BACK_ONLINE_NOTICE_MS = 5000;
const DEV_KEY = 'novelora-dev-key';

function preferGatewayModels(ids: string[]): ComposerModel[] {
  const unique = [...new Set(ids.filter(Boolean))];
  unique.sort((left, right) => {
    if (left === DEFAULT_LLM_MODEL) return 1;
    if (right === DEFAULT_LLM_MODEL) return -1;
    return left.localeCompare(right);
  });
  return unique.map((id) => ({ id, label: id }));
}

export function EchoChat({ context, chapterNum, projectId, cwd, onCandidatesChanged }: EchoChatProps) {
  const session = useSyncExternalStore(
    (listener) => subscribeChatSession(projectId, listener),
    () => getChatSession(projectId),
    () => getChatSession(projectId),
  );
  const [catalog, setCatalog] = useState<HermesCatalog>(emptyCatalog());
  const [models, setModels] = useState<ComposerModel[]>([
    { id: DEFAULT_LLM_MODEL, label: DEFAULT_LLM_MODEL },
  ]);
  const [backOnline, setBackOnline] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetchHermesCatalog(controller.signal).then(setCatalog);
    void listBixinModels(controller.signal).then((listed) => {
      const next = preferGatewayModels(listed);
      if (next.length) setModels(next);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!session.offline) return undefined;
    const timer = window.setInterval(() => {
      void fetch(MODELS_URL, { headers: { Authorization: `Bearer ${DEV_KEY}` } })
        .then((response) => {
          if (response.ok) {
            markChatOnline(projectId);
            setBackOnline(true);
            void fetchHermesCatalog().then(setCatalog);
            void listBixinModels()
              .then((listed) => {
                const next = preferGatewayModels(listed);
                if (next.length) setModels(next);
              });
          }
        })
        .catch(() => undefined);
    }, OFFLINE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [projectId, session.offline]);

  useEffect(() => {
    if (!backOnline) return undefined;
    const timer = window.setTimeout(() => setBackOnline(false), BACK_ONLINE_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [backOnline]);

  function send({ text, model, attachments }: ComposerSendPayload) {
    void sendChatTurn({
      projectId,
      chapterNum,
      context,
      text,
      model,
      attachments,
      cwd,
      onCandidatesChanged,
    });
  }

  return (
    <section className="bixin-chat" aria-label="Hermes 对话">
      <header className="bixin-chat__header">
        <span className={`bixin-chat__pulse${session.offline ? ' is-offline' : ''}`} aria-hidden="true" />
        <h2>Hermes</h2>
      </header>
      <div className="bixin-chat__context" aria-label="当前上下文"><strong>当前上下文</strong><div>{['当前章节', '前一章节', '大纲', '人物关系', '世界观'].map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}</div></div>
      <div className="bixin-chat__quick" aria-label="快捷能力">{[['续写下一段', '请基于当前章节续写下一段。'], ['润色选中内容', '请润色我当前选中的段落。'], ['检查人物OOC', '请检查本章人物是否有 OOC。'], ['检查世界观冲突', '请检查本章是否与世界观设定冲突。']].map(([label, text]) => <button key={label} type="button" onClick={() => send({ text, model: models[0].id, attachments: [] })}>{label}</button>)}</div>
      <div className="bixin-chat__log" role="log" aria-live="polite">
        {session.messages.map((message, index) => (
          <p key={index} data-role={message.role}>
            {message.role === 'assistant' && message.reasoning ? (
              <span className="bixin-chat__think">{message.reasoning}</span>
            ) : null}
            {message.content}
          </p>
        ))}
        {session.error ? <p role="alert">{session.error}</p> : null}
        {backOnline ? <p role="status">Hermes 已恢复</p> : null}
      </div>
      <EchoComposer
        catalog={catalog}
        models={models}
        streaming={session.streaming}
        onSend={send}
        onStop={() => stopChatSession(projectId)}
      />
    </section>
  );
}
