import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { NoveloraProject } from '../types';

export interface AgentDetailsDrawerProps {
  project: NoveloraProject;
  isOpen: boolean;
  onClose: () => void;
  invokerRef: RefObject<HTMLButtonElement | null>;
}

const tabbableSelector = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'object',
  'embed',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

function canReceiveTabFocus(element: HTMLElement) {
  if (element.tabIndex < 0 || element.matches(':disabled')) {
    return false;
  }

  for (
    let currentElement: HTMLElement | null = element;
    currentElement;
    currentElement = currentElement.parentElement
  ) {
    if (
      currentElement.hasAttribute('hidden')
      || currentElement.hasAttribute('inert')
      || currentElement.getAttribute('aria-hidden') === 'true'
    ) {
      return false;
    }

    const { display, visibility } = window.getComputedStyle(currentElement);
    if (display === 'none' || visibility === 'hidden' || visibility === 'collapse') {
      return false;
    }
  }

  return true;
}

function tabbableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(tabbableSelector))
    .filter(canReceiveTabFocus)
    .sort((first, second) => {
      if (first.tabIndex === second.tabIndex) return 0;
      if (first.tabIndex === 0) return 1;
      if (second.tabIndex === 0) return -1;
      return first.tabIndex - second.tabIndex;
    });
}

export function AgentDetailsDrawer({
  project,
  isOpen,
  onClose,
  invokerRef,
}: AgentDetailsDrawerProps) {
  const [focusMode, setFocusMode] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
      return;
    }

    if (wasOpenRef.current) {
      invokerRef.current?.focus();
      wasOpenRef.current = false;
    }
  }, [invokerRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const trapFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || !drawerRef.current) return;

    const elements = tabbableElements(drawerRef.current);
    const firstElement = elements[0];
    const lastElement = elements.at(-1);
    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="agent-details-drawer-backdrop">
      <aside
        ref={drawerRef}
        className="agent-details-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Agent details"
        onKeyDown={trapFocus}
      >
        <header className="agent-details-drawer__header">
          <div>
            <p>AI Writing Partner</p>
            <h2>Agent details</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close agent details"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="agent-details-drawer__content">
          <section>
            <h3>Subagents</h3>
            <ul className="agent-details-drawer__subagents">
              {project.subagents.map((subagent) => (
                <li key={subagent.id}>
                  <span className="agent-details-drawer__avatar" aria-hidden="true">
                    {subagent.avatarLabel}
                  </span>
                  <span>
                    <strong>{subagent.name}</strong>
                    <small>{subagent.role}</small>
                  </span>
                  <span aria-label={`${subagent.name}: ${subagent.active ? 'active' : 'inactive'}`}>
                    {subagent.active ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Skills</h3>
            <ul className="agent-details-drawer__skills">
              {project.skills.map((skill) => (
                <li key={skill.id}>
                  <strong>{skill.label}</strong>
                  <span>{skill.category}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Review Checklist</h3>
            <ul className="agent-details-drawer__checklist">
              {project.reviewChecklist.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <span aria-label={`${item.label}: ${item.passed ? 'passed' : 'pending'}`}>
                    {item.passed ? 'Passed' : 'Pending'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="agent-details-drawer__focus-mode">
            <div>
              <h3>Focus Mode</h3>
              <p>Quiet the workspace locally without starting an agent action.</p>
            </div>
            <button
              type="button"
              aria-label="Toggle Focus Mode"
              aria-pressed={focusMode}
              onClick={() => setFocusMode((enabled) => !enabled)}
            >
              {focusMode ? 'On' : 'Off'}
            </button>
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
