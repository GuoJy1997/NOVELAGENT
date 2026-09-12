import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CandidateReview } from './CandidateReview';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('CandidateReview', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('accepts a pending chapter candidate', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/candidates') && !init) {
        return okJson([{
          id: 'c1',
          runId: 's',
          targetPath: 'chapters/ch_03.md',
          source: 'dialog',
          status: 'pending',
          createdAt: '2026-08-15T00:00:00.000Z',
        }]);
      }
      if (url.endsWith('/candidates/c1') && !init) {
        return okJson({
          id: 'c1',
          runId: 's',
          targetPath: 'chapters/ch_03.md',
          source: 'dialog',
          status: 'pending',
          createdAt: '2026-08-15T00:00:00.000Z',
          content: '# 第三章草稿',
        });
      }
      if (String(url).includes('/accept')) return okJson({ ok: true });
      return okJson([]);
    });
    vi.stubGlobal('fetch', fetchMock);
    const onAccepted = vi.fn();
    render(<CandidateReview projectId="default-project" chapterNum={3} refreshKey={0} onAccepted={onAccepted} />);
    expect(await screen.findByRole('region', { name: '待审候选' })).toBeInTheDocument();
    expect(screen.getByText('# 第三章草稿')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '接受' }));
    expect(onAccepted).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/candidates/c1/accept',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('discards a pending chapter candidate and refreshes the list', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/candidates') && !init) {
        return okJson(
          fetchMock.mock.calls.filter(([u, i]) => String(u).endsWith('/candidates') && !i).length <= 1
            ? [{
                id: 'c1',
                runId: 's',
                targetPath: 'chapters/ch_03.md',
                source: 'dialog',
                status: 'pending',
                createdAt: '2026-08-15T00:00:00.000Z',
              }]
            : [],
        );
      }
      if (url.endsWith('/candidates/c1') && !init) {
        return okJson({
          id: 'c1',
          runId: 's',
          targetPath: 'chapters/ch_03.md',
          source: 'dialog',
          status: 'pending',
          createdAt: '2026-08-15T00:00:00.000Z',
          content: '# 第三章草稿',
        });
      }
      if (String(url).includes('/discard')) return okJson({ ok: true });
      return okJson([]);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<CandidateReview projectId="default-project" chapterNum={3} refreshKey={0} onAccepted={vi.fn()} />);
    await screen.findByRole('region', { name: '待审候选' });
    await user.click(screen.getByRole('button', { name: '丢弃' }));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/candidates/c1/discard',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(screen.queryByRole('region', { name: '待审候选' })).not.toBeInTheDocument());
  });

  it('only shows candidates targeting the current chapter file', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/candidates')) {
        return okJson([
          {
            id: 'other',
            runId: 's',
            targetPath: 'chapters/ch_01.md',
            source: 'dialog',
            status: 'pending',
            createdAt: '2026-08-15T00:00:00.000Z',
          },
        ]);
      }
      return okJson([]);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<CandidateReview projectId="default-project" chapterNum={3} refreshKey={0} onAccepted={vi.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByRole('region', { name: '待审候选' })).not.toBeInTheDocument();
  });

  it('shows nothing when there are no pending candidates', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okJson([])));
    render(<CandidateReview projectId="default-project" chapterNum={3} refreshKey={0} onAccepted={vi.fn()} />);
    await waitFor(() => expect(screen.queryByRole('region', { name: '待审候选' })).not.toBeInTheDocument());
  });

  it('refetches when refreshKey changes', async () => {
    const fetchMock = vi.fn(async () => okJson([]));
    vi.stubGlobal('fetch', fetchMock);
    const { rerender } = render(
      <CandidateReview projectId="default-project" chapterNum={3} refreshKey={0} onAccepted={vi.fn()} />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    rerender(<CandidateReview projectId="default-project" chapterNum={3} refreshKey={1} onAccepted={vi.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('keeps the candidate and explains when accept fails', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/candidates') && !init) {
        return okJson([{
          id: 'c1',
          runId: 's',
          targetPath: 'chapters/ch_03.md',
          source: 'dialog',
          status: 'pending',
          createdAt: '2026-08-15T00:00:00.000Z',
        }]);
      }
      if (url.endsWith('/candidates/c1') && !init) {
        return okJson({
          id: 'c1',
          runId: 's',
          targetPath: 'chapters/ch_03.md',
          source: 'dialog',
          status: 'pending',
          createdAt: '2026-08-15T00:00:00.000Z',
          content: '# 第三章草稿',
        });
      }
      if (String(url).includes('/accept')) {
        return new Response(JSON.stringify({ error: 'nope' }), { status: 500 });
      }
      return okJson([]);
    });
    vi.stubGlobal('fetch', fetchMock);
    const onAccepted = vi.fn();
    render(<CandidateReview projectId="default-project" chapterNum={3} refreshKey={0} onAccepted={onAccepted} />);
    await screen.findByRole('region', { name: '待审候选' });
    await user.click(screen.getByRole('button', { name: '接受' }));
    expect(onAccepted).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('未能接受候选。');
    expect(screen.getByRole('region', { name: '待审候选' })).toBeInTheDocument();
  });
});
