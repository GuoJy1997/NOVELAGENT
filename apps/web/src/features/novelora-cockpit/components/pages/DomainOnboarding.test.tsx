import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetImportSessions } from '../../lib/importSession';
import { DomainOnboarding } from './DomainOnboarding';

vi.mock('../../lib/hermesChat', () => ({
  DEFAULT_LLM_MODEL: 'deepseek-v4-flash',
  streamChat: vi.fn(),
}));

import { streamChat } from '../../lib/hermesChat';

const streamChatMock = vi.mocked(streamChat);

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

async function* fakeStream(chunks: string[]) {
  for (const chunk of chunks) yield { content: chunk };
}

const extracted = {
  characters: [{ id: 'char-1', name: '渔人', role: '误入者' }],
  relationships: [],
};

describe('DomainOnboarding', () => {
  afterEach(() => {
    resetImportSessions();
    vi.unstubAllGlobals();
    streamChatMock.mockReset();
  });

  it('imports a file chosen in Explorer after the model organizes it', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse-file') && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({ title: '选择大纲文件' });
        return Promise.resolve(okJson({ path: 'D:\\桃园密码\\素材\\大纲.md' }));
      }
      if (path.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '卷一：风起 杂记' }));
      }
      if (path.includes('/documents/outline') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(
      fakeStream(['# 卷一\n', '风起']) as ReturnType<typeof streamChat>,
    );
    const onImport = vi.fn().mockResolvedValue(undefined);

    render(
      <DomainOnboarding
        kind="document"
        documentKind="outline"
        projectId="p1"
        domainLabel="大纲"
        onImport={onImport}
        onStartEmpty={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /已有文件/ }));
    expect(screen.queryByRole('list', { name: '文件列表' })).not.toBeInTheDocument();

    expect(await screen.findByLabelText('整理预览')).toHaveTextContent('# 卷一');
    await waitFor(() => expect(onImport).toHaveBeenCalledWith('# 卷一\n风起'));
    expect(streamChatMock.mock.calls[0]?.[2]).toEqual({ model: 'deepseek-v4-flash' });
  });

  it('explains that 人物 and 关系 share one file', () => {
    render(
      <DomainOnboarding
        kind="characters"
        projectId="p1"
        domainLabel="关系"
        onSaved={() => undefined}
        onStartEmpty={() => undefined}
      />,
    );

    expect(screen.getByRole('region', { name: '关系初始化' })).toHaveTextContent(
      '人物和关系共用一份档案',
    );
  });

  it('starts empty when choosing 暂不存在', async () => {
    const user = userEvent.setup();
    const onStartEmpty = vi.fn();
    render(
      <DomainOnboarding
        kind="document"
        documentKind="world"
        projectId="p1"
        domainLabel="世界观"
        onImport={() => Promise.resolve()}
        onStartEmpty={onStartEmpty}
      />,
    );

    await user.click(screen.getByRole('button', { name: /暂不存在/ }));
    expect(onStartEmpty).toHaveBeenCalledOnce();
  });

  it('reports picker failures with a Chinese alert', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(
      <DomainOnboarding
        kind="document"
        documentKind="outline"
        projectId="p1"
        domainLabel="大纲"
        onImport={() => Promise.resolve()}
        onStartEmpty={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /已有文件/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('打开系统文件选择器失败');
  });

  it('routes a file chosen in Explorer through AI extraction for characters', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse-file') && init?.method === 'POST') {
        return Promise.resolve(okJson({ path: 'D:\\桃园密码\\设定\\人物.md' }));
      }
      if (path.startsWith('/api/local-text?path=')) return Promise.resolve(okJson({ content: 'text' }));
      if (path.endsWith('/characters') && init?.method === 'PUT') return Promise.resolve(okJson(extracted));
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(
      fakeStream(['```json\n', JSON.stringify(extracted), '\n```']) as ReturnType<typeof streamChat>,
    );
    const onSaved = vi.fn();

    render(
      <DomainOnboarding
        kind="characters"
        projectId="p1"
        domainLabel="人物"
        onSaved={onSaved}
        onStartEmpty={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /已有文件/ }));

    expect(await screen.findByRole('table', { name: '人物预览' })).toHaveTextContent('渔人');
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(extracted));
  });
});
