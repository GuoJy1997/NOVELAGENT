import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetImportSessions, startCharacterImport, startDocumentImport } from './features/novelora-cockpit/lib/importSession';
import App from './App';

vi.mock('./features/novelora-cockpit/lib/hermesChat', () => ({
  DEFAULT_LLM_MODEL: 'deepseek-v4-flash',
  streamChat: vi.fn(),
}));

import { streamChat } from './features/novelora-cockpit/lib/hermesChat';

const streamChatMock = vi.mocked(streamChat);

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  resetImportSessions();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  streamChatMock.mockReset();
});

describe('App', () => {
  it('keeps workspace selection available on the outline workbench', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '小说大纲' }));
    await user.click(screen.getByRole('button', { name: '选择小说项目' }));
    expect(screen.getByRole('dialog', { name: '选择工作区' })).toBeVisible();
    expect(screen.getByRole('button', { name: '选择小说目录' })).toBeVisible();
  });
  it('navigates to outline from QuickGen 小说大纲', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '小说大纲' }));
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });
    expect(within(navigation).getByRole('button', { name: '大纲' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: '大纲' })).toBeInTheDocument();
  });

  it('opens writing from the Copilot start action', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '开始陪写' }));
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });
    expect(within(navigation).getByRole('button', { name: '写作' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('写作工作台')).toBeInTheDocument();
  });

  it('composes the Bixin home chrome with the workbench rail', () => {
    const { container } = render(<App />);
    const frame = container.querySelector('.bixin-home__frame');
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });

    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
    expect(frame?.children[0]).toHaveClass('bixin-scene-layer');
    expect(frame?.children[1]).toHaveClass('bixin-home__interface');
    expect(frame?.children[2]).toBeUndefined();
    expect(container.querySelector('.echo-page')).not.toBeInTheDocument();
    expect(container.querySelector('.echo-hero-background')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Project navigation' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Bring your story to life with AI/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /笔心在手/ })).toBeInTheDocument();
    expect(
      Array.from(navigation.querySelectorAll<HTMLButtonElement>('.bixin-navigation-rail__item')).map(
        (button) => button.textContent,
      ),
    ).toEqual([
      '首页',
      '写作',
      '工作流',
      '大纲',
      '人物',
      '关系',
      '世界观',
      '任务',
    ]);
    expect(screen.getByRole('button', { name: '继续写作' })).toBeInTheDocument();
    expect(within(screen.getByRole('main', { name: '创作首页' })).getByRole('button', { name: '新建作品' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '最近项目' })).toBeInTheDocument();
  });

  it('opens outline from the rail and writing from 继续写作 without leaving the Bixin frame', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });

    await user.click(within(navigation).getByRole('button', { name: '大纲' }));
    expect(screen.getByRole('region', { name: '大纲' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '大纲' })).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /笔心在手/ })).not.toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: '首页' }));
    await user.click(screen.getByRole('button', { name: '继续写作' }));
    expect(screen.getByLabelText('写作工作台')).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
    expect(screen.queryByRole('main', { name: 'Story workspace' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '返回首页' }));
    expect(screen.getByRole('region', { name: '最近项目' })).toBeInTheDocument();
  });

  it('opens project setup from every new-project entry', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const button of screen.getAllByRole('button', { name: '新建作品' })) {
      await user.click(button);
      expect(screen.getByRole('dialog', { name: '选择工作区' })).toBeVisible();
      await user.click(screen.getByRole('button', { name: '关闭' }));
    }

    await user.click(within(screen.getByRole('navigation', { name: '工作区导航' })).getByRole('button', { name: '世界观' }));
    expect(screen.getByRole('region', { name: '世界观' })).toBeInTheDocument();
  });

  it('dismisses action feedback after 3200ms while keeping the live region mounted', () => {
    vi.useFakeTimers();
    render(<App />);
    const status = screen.getByRole('status');
    fireEvent.click(screen.getByRole('button', { name: '查看通知' }));
    expect(status).toHaveClass('is-visible');
    act(() => vi.advanceTimersByTime(3199));
    expect(status).toHaveClass('is-visible');
    act(() => vi.advanceTimersByTime(1));
    expect(status).toBeInTheDocument();
    expect(status).toBeEmptyDOMElement();
    expect(status).not.toHaveClass('is-visible');
  });

  it('opens writing from 写作 and the world editor from 世界观', async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });
    await user.click(within(navigation).getByRole('button', { name: '写作' }));
    expect(screen.getByLabelText('写作工作台')).toBeInTheDocument();
    await user.click(within(navigation).getByRole('button', { name: '世界观' }));
    expect(screen.getByRole('region', { name: '世界观' })).toBeInTheDocument();
    expect(screen.getByText('这是设定编辑，不会召唤 Agent。')).toBeInTheDocument();
  });

  it('opens characters, relations, workflow, and tasks from the rail', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });

    await user.click(within(navigation).getByRole('button', { name: '人物' }));
    expect(screen.getByRole('heading', { name: '人物' })).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: '关系' }));
    expect(screen.getByRole('heading', { name: '人物关系网' })).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: '工作流' }));
    expect(screen.getByRole('heading', { name: '工作流' })).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: '任务' }));
    expect(screen.getByRole('heading', { name: '任务' })).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
  });

  it('keeps visible copy free of em-dashes', () => {
    render(<App />);
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });

  it('opens a workspace picker dialog from 打开项目', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (String(url).includes('/workspaces')) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 'taoyuan',
                  title: '桃园密码',
                  rootPath: 'D:\\桃园密码',
                  addedAt: '2026-08-16T00:00:00.000Z',
                },
              ]),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          );
        }
        return Promise.reject(new Error(`unexpected ${url}`));
      }),
    );
    render(<App />);
    await user.click(screen.getByRole('button', { name: /云上王座/ }));
    expect(screen.getByRole('dialog', { name: '选择工作区' })).toBeInTheDocument();
  });

  it('announces a finished outline import and opens the editor from the notice', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (String(url).startsWith('/api/local-text')) {
          return Promise.resolve(okJson({ content: '卷一杂记' }));
        }
        if (String(url).includes('/documents/outline') && init?.method === 'PUT') {
          return Promise.resolve(okJson({ content: '# 整理大纲' }));
        }
        return Promise.reject(new Error(`unexpected ${url}`));
      }),
    );
    streamChatMock.mockImplementation(async function* () {
      yield { content: '# 整理大纲' };
    });

    render(<App />);
    await act(async () => {
      await startDocumentImport({
        projectId: 'default-project',
        kind: 'outline',
        filePath: 'D:\\桃园密码\\副本大纲.md',
      });
    });

    const notice = await screen.findByRole('button', { name: '大纲已整理完成' });
    expect(document.querySelector('.bixin-action-feedback')).toHaveClass('is-visible');
    await user.click(notice);
    expect(await screen.findByDisplayValue('# 整理大纲')).toBeInTheDocument();
  });

  it('announces a failed character import on the live region', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (String(url).startsWith('/api/local-text')) {
          return Promise.resolve(okJson({ content: '人物草稿' }));
        }
        return Promise.reject(new Error(`unexpected ${url}`));
      }),
    );
    streamChatMock.mockImplementation(async function* () {
      yield { content: '无法提取' };
    });

    render(<App />);
    await act(async () => {
      await startCharacterImport({
        projectId: 'default-project',
        filePath: 'D:\\桃园密码\\人物小传.md',
      });
    });

    expect(await screen.findByRole('button', { name: '人物提取失败，请重试' })).toBeInTheDocument();
  });
});
