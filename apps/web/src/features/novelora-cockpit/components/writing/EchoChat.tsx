import { useEffect, useRef, useState } from 'react';
import { streamChat, type ChatMessage } from '../../lib/hermesChat';
import { EchoComposer, type ComposerSendPayload } from './EchoComposer';

interface EchoChatProps { context: string }

const HEALTH_URL = '/hermes/health';
const OFFLINE_POLL_MS = 15000;
const BACK_ONLINE_NOTICE_MS = 5000;

export function EchoChat({ context }: EchoChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [backOnline, setBackOnline] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const contextSent = useRef(false);

  useEffect(() => {
    if (!offline) return undefined;
    const timer = window.setInterval(() => {
      void fetch(HEALTH_URL)
        .then((response) => {
          if (response.ok) {
            setOffline(false);
            setError('');
            setBackOnline(true);
          }
        })
        .catch(() => undefined);
    }, OFFLINE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [offline]);

  useEffect(() => {
    if (!backOnline) return undefined;
    const timer = window.setTimeout(() => setBackOnline(false), BACK_ONLINE_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [backOnline]);

  async function send({ text, model, attachments }: ComposerSendPayload) {
    if (streaming) return;
    setError('');
    const attached = attachments.map((file) => file.name).join(', ');
    const body = attached ? `Attached: ${attached}\n\n${text}` : text;
    const prefixed = contextSent.current ? body : `${context}\n\n${body}`;
    contextSent.current = true;
    const next: ChatMessage[] = [...messages, { role: 'user', content: prefixed }, { role: 'assistant', content: '' }];
    setMessages(next);
    setStreaming(true);
    abortRef.current = new AbortController();
    try {
      const wireMessages = next.slice(0, -1);
      for await (const delta of streamChat(wireMessages, abortRef.current.signal, { model })) {
        setMessages((current) => {
          const copy = [...current];
          copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + delta };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Echo is unreachable. Is the hermes gateway running?');
        setOffline(true);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <section className="echo-chat" aria-label="Echo chat">
      <header className="echo-chat__header">
        <span className={`echo-chat__pulse${offline ? ' is-offline' : ''}`} aria-hidden="true" />
        <div>
          <p className="echo-chat__eyebrow">Writing partner</p>
          <h2>Echo</h2>
        </div>
      </header>
      <div className="echo-chat__log" role="log" aria-live="polite">
        {messages.map((message, index) => (
          <p key={index} data-role={message.role}>{message.content}</p>
        ))}
        {error ? <p role="alert">{error}</p> : null}
        {backOnline ? <p role="status">Echo is back online</p> : null}
      </div>
      <EchoComposer
        streaming={streaming}
        onSend={(payload) => { void send(payload); }}
        onStop={() => abortRef.current?.abort()}
      />
    </section>
  );
}
