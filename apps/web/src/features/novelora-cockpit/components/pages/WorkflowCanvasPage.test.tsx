import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowCanvasPage } from './WorkflowCanvasPage';

const okJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function stubApi(extra?: (url: string, init?: RequestInit) => Response | undefined) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const override = extra?.(String(url), init);
    if (override) return override;
    if (String(url) === '/hermes/v1/skills') {
      return okJson({
        object: 'list',
        data: [
          { name: 'novel-writing', description: '章节规划与续写' },
          { name: 'zh-writing-humanizer', description: '中文去 AI 味' },
          { name: 'github-pr-workflow', description: 'GitHub' },
        ],
      });
    }
    if (String(url) === '/hermes/v1/models') {
      return okJson({
        object: 'list',
        data: [
          { id: 'hermes-agent', object: 'model' },
          { id: 'deepseek-v4-flash', object: 'model' },
        ],
      });
    }
    if (String(url) === '/api/llm/models') {
      return okJson({
        object: 'list',
        data: [
          { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
          { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' },
        ],
      });
    }
    if (String(url).includes('/workflow/graphs/daily') && init?.method === 'PUT') {
      return okJson({ ok: true, name: 'daily' });
    }
    if (String(url).includes('/workflow/runs') && init?.method === 'POST' && !String(url).includes('/step')) {
      return okJson(
        { id: 'run-1', graphName: 'daily', status: 'running', nodes: {}, createdAt: '2026-08-24' },
        201,
      );
    }
    if (String(url).includes('/workflow/graphs/daily')) {
      return new Response('', { status: 404 });
    }
    return okJson({});
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('WorkflowCanvasPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lets the author drop nodes, draw a typed edge, and save the graph', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);

    expect(await screen.findByRole('heading', { name: '工作流' })).toBeInTheDocument();
    const palette = screen.getByRole('navigation', { name: '节点类型' });
    expect(within(palette).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '探索',
      '基因',
      '大纲',
      '门禁',
      '人工',
      '写作',
      '去AI味',
      '审查',
      '记忆',
    ]);

    await user.click(within(palette).getByRole('button', { name: '探索' }));
    await user.click(within(palette).getByRole('button', { name: '写作' }));
    expect(screen.getByRole('article', { name: '探索节点' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: '写作节点' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '从 探索 连出' }));
    await user.click(screen.getByRole('article', { name: '写作节点' }));

    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([url, init]) => String(url).includes('/workflow/graphs/daily') && (init as RequestInit | undefined)?.method === 'PUT',
      );
      expect(saveCall).toBeTruthy();
      const body = JSON.parse(String((saveCall?.[1] as RequestInit).body));
      expect(body.edges).toEqual([{ from: 'explore', to: 'write', attachmentType: 'fact' }]);
    });
  });

  it('loads the sample pipeline onto the board and can start a run', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);

    await user.click(await screen.findByRole('button', { name: '放入示例图' }));
    expect(screen.getByRole('article', { name: '盘点节点' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: '写第一章节点' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: '门禁节点' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '保存' }));
    await user.click(screen.getByRole('button', { name: '开始运行' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/workflow/runs',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('marks manual nodes as awaiting review', async () => {
    const user = userEvent.setup();
    stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);

    await user.click(await screen.findByRole('button', { name: '放入示例图' }));
    expect(screen.getByText('待审核')).toBeInTheDocument();
  });

  it('groups the complete node palette under the four workflow headings', () => {
    stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);
    const palette = screen.getByRole('navigation', { name: '节点类型' });
    expect(Array.from(palette.querySelectorAll('strong')).map((heading) => heading.textContent)).toEqual([
      'AI 任务', '条件判断', '人工审核', '其他',
    ]);
    expect(within(palette).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '探索', '基因', '大纲', '门禁', '人工', '写作', '去AI味', '审查', '记忆',
    ]);
  });

  it('keeps temperature as adjustable display-only inspector state', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);

    await user.click(await screen.findByRole('button', { name: '写作' }));
    const temperature = screen.getByRole('slider', { name: '温度' });
    expect(temperature).toHaveValue('0.7');
    fireEvent.change(temperature, { target: { value: '0.85' } });
    expect(temperature).toHaveValue('0.85');
    expect(screen.getByText('0.85')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([url, init]) => String(url).includes('/workflow/graphs/daily') && (init as RequestInit | undefined)?.method === 'PUT',
      );
      expect(saveCall).toBeTruthy();
      const body = String((saveCall?.[1] as RequestInit | undefined)?.body ?? '');
      expect(body).not.toContain('temperature');
    });
  });

  it('reports that publishing is not available in the demo', async () => {
    const user = userEvent.setup();
    stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);

    await user.click(screen.getByRole('button', { name: '发布' }));
    expect(screen.getByText('发布功能暂未在演示版开放。')).toBeInTheDocument();
  });

  it('renders cubic edge paths and visible pass/fail labels', async () => {
    const user = userEvent.setup();
    stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);
    await user.click(await screen.findByRole('button', { name: '放入示例图' }));
    const svg = screen.getByLabelText('工作流画布').querySelector('svg');
    expect(svg?.querySelector('path')?.getAttribute('d')).toContain('C');
    expect(Array.from(svg?.querySelectorAll('text') ?? []).map((text) => text.textContent)).toEqual(
      expect.arrayContaining(['通过', '未通过']),
    );
  });

  it('lets the author pick the same DeepSeek models on a node as in chat', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);

    await user.click(await screen.findByRole('button', { name: '写作' }));
    const models = await screen.findByRole('combobox', { name: '模型' });
    expect(await within(models).findByRole('option', { name: 'deepseek-v4-flash' })).toBeInTheDocument();
    expect(within(models).getByRole('option', { name: 'deepseek-v4-pro' })).toBeInTheDocument();

    await user.selectOptions(models, 'deepseek-v4-pro');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([url, init]) => String(url).includes('/workflow/graphs/daily') && (init as RequestInit | undefined)?.method === 'PUT',
      );
      const body = JSON.parse(String((saveCall?.[1] as RequestInit).body));
      const write = body.nodes.find((node: { type: string }) => node.type === 'write');
      expect(write.model).toBe('deepseek-v4-pro');
    });
  });

  it('lets the author pick Hermes skills from a dropdown instead of typing ids', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    render(<WorkflowCanvasPage projectId="default-project" />);

    await user.click(await screen.findByRole('button', { name: '写作' }));
    const skills = await screen.findByRole('combobox', { name: '技能' });
    expect(within(skills).getByRole('option', { name: /novel-writing/ })).toBeInTheDocument();
    expect(within(skills).getByRole('option', { name: /zh-writing-humanizer/ })).toBeInTheDocument();
    expect(within(skills).queryByRole('option', { name: /github-pr-workflow/ })).not.toBeInTheDocument();

    await user.selectOptions(skills, 'novel-writing');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([url, init]) => String(url).includes('/workflow/graphs/daily') && (init as RequestInit | undefined)?.method === 'PUT',
      );
      const body = JSON.parse(String((saveCall?.[1] as RequestInit).body));
      const write = body.nodes.find((node: { type: string }) => node.type === 'write');
      expect(write.skills).toEqual(['novel-writing']);
    });
  });
});
