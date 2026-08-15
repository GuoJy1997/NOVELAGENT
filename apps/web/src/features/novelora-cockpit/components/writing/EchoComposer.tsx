import { useMemo, useRef, useState, type KeyboardEvent } from 'react';

export interface ComposerSendPayload {
  text: string;
  model: string;
  attachments: File[];
}

interface EchoComposerProps {
  streaming: boolean;
  onSend: (payload: ComposerSendPayload) => void;
  onStop: () => void;
}

const ECHO_MODELS = [
  { id: 'hermes-agent', label: 'Hermes Agent' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
] as const;

const ECHO_SKILLS = [
  { id: 'scene-drafting', label: '单章起草', hint: 'writing' },
  { id: 'draft-act', label: '一幕起草', hint: 'writing' },
  { id: 'draft-volume', label: '一卷起草', hint: 'writing' },
  { id: 'expand', label: '扩写', hint: 'writing' },
  { id: 'polish', label: '润色', hint: 'writing' },
  { id: 'continue', label: '续写', hint: 'writing' },
];

const ECHO_EXPERTS = [
  { id: 'plot-architect', label: '情节顾问', hint: '结构与转折' },
  { id: 'character-voice', label: '人物声音', hint: '对白是否人设' },
  { id: 'worldbuilding-check', label: '世界观考据', hint: '只查不改设定' },
  { id: 'story-architect', label: '结构', hint: '幕与卷拆章' },
];

type TriggerKind = 'skill' | 'expert';

interface ActiveTrigger {
  kind: TriggerKind;
  query: string;
  start: number;
}

function readTrigger(value: string, caret: number): ActiveTrigger | null {
  const before = value.slice(0, caret);
  const match = before.match(/(^|[\s])([/@][^\s]*)$/);
  if (!match) return null;
  const token = match[2];
  return {
    kind: token.startsWith('/') ? 'skill' : 'expert',
    query: token.slice(1).toLowerCase(),
    start: caret - token.length,
  };
}

export function EchoComposer({ streaming, onSend, onStop }: EchoComposerProps) {
  const [input, setInput] = useState('');
  const [caret, setCaret] = useState(0);
  const [modelId, setModelId] = useState<string>(ECHO_MODELS[0].id);
  const [modelOpen, setModelOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const trigger = readTrigger(input, caret);
  const items = useMemo(() => {
    if (!trigger) return [];
    const source = trigger.kind === 'skill' ? ECHO_SKILLS : ECHO_EXPERTS;
    return source.filter((item) => {
      const haystack = `${item.id} ${item.label}`.toLowerCase();
      return haystack.includes(trigger.query);
    });
  }, [trigger]);

  const modelLabel = ECHO_MODELS.find((model) => model.id === modelId)?.label ?? 'Hermes Agent';

  function updateInput(next: string, nextCaret: number) {
    setInput(next);
    setCaret(nextCaret);
    setActiveIndex(0);
  }

  function insertToken(id: string) {
    if (!trigger) return;
    const token = `${trigger.kind === 'skill' ? '/' : '@'}${id} `;
    const next = `${input.slice(0, trigger.start)}${token}${input.slice(caret)}`;
    const nextCaret = trigger.start + token.length;
    updateInput(next, nextCaret);
    requestAnimationFrame(() => {
      const field = fieldRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function submit() {
    const text = input.trim();
    if (!text || streaming) return;
    onSend({ text, model: modelId, attachments });
    setInput('');
    setCaret(0);
    setAttachments([]);
    setModelOpen(false);
  }

  function onFieldKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape' && trigger) {
      event.preventDefault();
      const next = `${input.slice(0, trigger.start)}${input.slice(caret)}`;
      updateInput(next, trigger.start);
      return;
    }

    if (trigger && items.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % items.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + items.length) % items.length);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        insertToken(items[activeIndex]?.id ?? items[0].id);
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
    if (event.key === 'Escape') setModelOpen(false);
  }

  return (
    <div className="echo-chat__composer">
      {trigger ? (
        <ul
          className="echo-chat__menu"
          role="listbox"
          aria-label={trigger.kind === 'skill' ? 'Skills' : 'Experts'}
        >
          {items.map((item, index) => (
            <li key={item.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? 'is-active' : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertToken(item.id)}
              >
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {attachments.length > 0 ? (
        <ul className="echo-chat__chips">
          {attachments.map((file) => (
            <li key={`${file.name}:${file.lastModified}`}>{file.name}</li>
          ))}
        </ul>
      ) : null}

      <div className="echo-chat__composer-card">
        <textarea
          ref={fieldRef}
          aria-label="Message Echo"
          placeholder="问 Echo 关于本章"
          rows={3}
          value={input}
          onChange={(event) => updateInput(event.target.value, event.target.selectionStart ?? event.target.value.length)}
          onClick={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
          onKeyUp={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
          onKeyDown={onFieldKeyDown}
        />
        <div className="echo-chat__composer-bar">
          <label className="echo-chat__attach">
            <input
              type="file"
              multiple
              aria-label="Attach files"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) setAttachments((current) => [...current, ...files]);
                event.target.value = '';
              }}
            />
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </label>

          <div className="echo-chat__model">
            <button
              type="button"
              aria-label="模型"
              aria-haspopup="listbox"
              aria-expanded={modelOpen}
              onClick={() => setModelOpen((open) => !open)}
            >
              {modelLabel}
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            {modelOpen ? (
              <ul className="echo-chat__menu echo-chat__menu--model" role="listbox" aria-label="Models">
                {ECHO_MODELS.map((model) => (
                  <li key={model.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={model.id === modelId}
                      onClick={() => {
                        setModelId(model.id);
                        setModelOpen(false);
                      }}
                    >
                      {model.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {streaming ? (
            <button type="button" className="echo-chat__send is-stop" onClick={onStop}>
              停止
            </button>
          ) : (
            <button type="button" className="echo-chat__send" onClick={submit} disabled={!input.trim()}>
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
