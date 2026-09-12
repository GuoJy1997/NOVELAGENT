import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { fetchHermesCatalog, listBixinModels, type HermesCatalog } from '../../lib/hermesCatalog';
import {
  fetchWorkflowGraph,
  resolveWorkflowManual,
  saveWorkflowGraph,
  startWorkflowRun,
  stepWorkflowRun,
} from '../../lib/noveloraApi';
import {
  addCanvasNode,
  BIXIN_NOVEL_SKILLS,
  CANVAS_NODE_SIZE,
  connectCanvasNodes,
  DEFAULT_GRAPH_NAME,
  emptyGraph,
  layoutAcceptanceGraph,
  moveCanvasNode,
  NODE_TYPE_LABEL,
  novelSkillChoices,
  PALETTE_TYPES,
  removeCanvasEdge,
  removeCanvasNode,
  updateCanvasNode,
  withLaidOutNodes,
} from '../../lib/workflowCanvas';
import type { NodeRunStatus, RunStatus, WorkflowGraph, WorkflowNode, WorkflowNodeType, WorkflowRun } from '../../lib/workflowTypes';
import './WorkflowCanvasPage.css';

interface WorkflowCanvasPageProps {
  projectId: string;
}

const RUN_LABEL: Record<RunStatus, string> = {
  running: '运行中',
  waiting_author: '等作者',
  blocked: '受阻',
  offline: '离线',
  done: '完成',
};

const NODE_STATUS_LABEL: Record<NodeRunStatus, string> = {
  pending: '待跑',
  running: '运行中',
  done: '完成',
  blocked: '受阻',
  failed: '失败',
  waiting_author: '等作者',
};

const NODE_TYPE_META: Record<WorkflowNodeType, { label: string; tone: string }> = {
  explore: { label: 'AI 任务', tone: 'blue' }, gene: { label: 'AI 任务', tone: 'blue' },
  outline: { label: 'AI 任务', tone: 'blue' }, write: { label: 'AI 生成', tone: 'purple' },
  deai: { label: '润色', tone: 'purple' }, review: { label: '一致性检查', tone: 'cyan' },
  memory: { label: '记忆', tone: 'cyan' }, gate: { label: '条件判断', tone: 'yellow' },
  manual: { label: '人工审核', tone: 'orange' },
};

export function WorkflowCanvasPage({ projectId }: WorkflowCanvasPageProps) {
  const [graph, setGraph] = useState<WorkflowGraph>(() => emptyGraph());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [catalog, setCatalog] = useState<HermesCatalog>({ skills: [], commands: [], experts: [] });
  const [modelChoices, setModelChoices] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const drag = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWorkflowGraph(DEFAULT_GRAPH_NAME, projectId)
      .then((loaded) => {
        if (cancelled || !loaded) return;
        setGraph(withLaidOutNodes({ ...loaded, name: DEFAULT_GRAPH_NAME }));
      })
      .catch(() => {
        if (!cancelled) setStatus('画布数据不可用');
      });
    void fetchHermesCatalog().then((next) => {
      if (!cancelled) setCatalog(next);
    });
    void listBixinModels().then((listed) => {
      if (!cancelled) setModelChoices(listed);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selected = graph.nodes.find((node) => node.id === selectedId) ?? null;
  const boardSize = useMemo(() => {
    const right = Math.max(640, ...graph.nodes.map((node) => (node.x ?? 0) + CANVAS_NODE_SIZE.width + 48));
    const bottom = Math.max(420, ...graph.nodes.map((node) => (node.y ?? 0) + CANVAS_NODE_SIZE.height + 48));
    return { width: right, height: bottom };
  }, [graph.nodes]);

  function report(error: unknown, fallback: string) {
    setStatus(error instanceof Error ? error.message : fallback);
  }

  async function onSave(next = graph) {
    setBusy(true);
    try {
      await saveWorkflowGraph(next, projectId);
      setStatus('已保存');
      setGraph(next);
    } catch (error) {
      report(error, '保存失败');
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    setBusy(true);
    try {
      await saveWorkflowGraph(graph, projectId);
      const next = await startWorkflowRun(graph.name, projectId);
      setRun(next);
      setStatus('已开始运行');
    } catch (error) {
      report(error, '无法开始运行');
    } finally {
      setBusy(false);
    }
  }

  async function onStep() {
    if (!run) return;
    setBusy(true);
    try {
      const next = await stepWorkflowRun(run.id, projectId);
      setRun(next);
      setStatus(RUN_LABEL[next.status]);
    } catch (error) {
      report(error, '步进失败');
    } finally {
      setBusy(false);
    }
  }

  async function onManual() {
    if (!run) return;
    const nodeId =
      selected?.type === 'manual'
        ? selected.id
        : graph.nodes.find((node) => run.nodes[node.id]?.status === 'waiting_author')?.id;
    if (!nodeId) {
      setStatus('没有等待放行的人工节点');
      return;
    }
    setBusy(true);
    try {
      const next = await resolveWorkflowManual(run.id, nodeId, projectId, '放行');
      setRun(next);
      setStatus(RUN_LABEL[next.status]);
    } catch (error) {
      report(error, '放行失败');
    } finally {
      setBusy(false);
    }
  }

  function addType(type: (typeof PALETTE_TYPES)[number]) {
    const next = addCanvasNode(graph, type);
    const added = next.nodes[next.nodes.length - 1];
    setGraph(next);
    setSelectedId(added?.id ?? null);
    setPendingFrom(null);
    setStatus('');
  }

  function completeConnect(toId: string) {
    if (!pendingFrom || pendingFrom === toId) {
      setSelectedId(toId);
      return;
    }
    try {
      setGraph(connectCanvasNodes(graph, pendingFrom, toId));
      setStatus('');
    } catch (error) {
      report(error, '无法连线');
    }
    setPendingFrom(null);
    setSelectedId(toId);
  }

  function onNodePointerDown(event: PointerEvent<HTMLElement>, node: WorkflowNode) {
    if ((event.target as HTMLElement).closest('button')) return;
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    drag.current = {
      id: node.id,
      offsetX: event.clientX - (node.x ?? 0),
      offsetY: event.clientY - (node.y ?? 0),
    };
  }

  function onNodePointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) return;
    setGraph((prev) =>
      moveCanvasNode(
        prev,
        current.id,
        Math.max(8, event.clientX - current.offsetX),
        Math.max(8, event.clientY - current.offsetY),
      ),
    );
  }

  function onNodePointerUp() {
    drag.current = null;
  }

  const outgoing = graph.edges.filter((edge) => edge.from === selectedId);
  const nodeModelChoices = useMemo(() => {
    const ids = [...modelChoices];
    for (const id of [selected?.model, graph.model]) {
      if (id && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }, [graph.model, modelChoices, selected?.model]);
  const skillChoices = novelSkillChoices(
    catalog.skills.length > 0 ? catalog.skills : BIXIN_NOVEL_SKILLS.map((item) => ({ ...item, kind: 'skill' as const })),
    selected?.skills ?? [],
  );

  return (
    <section className="workflow-canvas-page" aria-label="工作流">
      <header className="workflow-canvas-page__header">
        <h2>工作流</h2>
        <label className="workflow-canvas-page__graph-model">
          图模型
          <select
            value={graph.model}
            onChange={(event) => setGraph({ ...graph, model: event.target.value })}
          >
            {nodeModelChoices.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        {run ? <span role="status">{RUN_LABEL[run.status]}</span> : null}
        {status ? <span role="status">{status}</span> : null}
        <div className="workflow-canvas-page__actions">
          <button type="button" className="bixin-btn" onClick={() => {
            const next = layoutAcceptanceGraph();
            setGraph(next);
            setSelectedId(next.nodes[0]?.id ?? null);
            setRun(null);
            setPendingFrom(null);
            setStatus('已放入示例图，保存后即可运行');
          }}>
            放入示例图
          </button>
          <button type="button" className="bixin-btn" disabled={busy} onClick={() => void onSave().catch(() => undefined)}>
            保存
          </button>
          <button type="button" className="bixin-btn bixin-btn--primary" disabled={busy} onClick={() => void onStart()}>
            开始运行
          </button>
          <button type="button" className="bixin-btn" disabled={busy || !run} onClick={() => void onStep()}>
            步进
          </button>
          <button type="button" className="bixin-btn" disabled={busy || run?.status !== 'waiting_author'} onClick={() => void onManual()}>
            放行
          </button>
          <button type="button" className="bixin-btn bixin-btn--primary" onClick={() => setStatus('发布功能暂未在演示版开放。')}>
            发布
          </button>
        </div>
      </header>

      <div className="workflow-canvas-page__body">
        <nav className="workflow-canvas-page__palette" aria-label="节点类型">
          {(['AI 任务', '条件判断', '人工审核', '其他'] as const).map((group) => {
            const types = PALETTE_TYPES.filter((type) => group === 'AI 任务'
              ? NODE_TYPE_META[type].label === group
              : group === '条件判断'
                ? type === 'gate'
                : group === '人工审核'
                  ? type === 'manual'
                  : !['AI 任务', '条件判断', '人工审核'].includes(NODE_TYPE_META[type].label));
            if (types.length === 0) return null;
            return <div className="workflow-canvas-page__palette-group" key={group}><strong>{group}</strong>{types.map((type) => <button key={type} type="button" onClick={() => addType(type)}>{NODE_TYPE_LABEL[type]}</button>)}</div>;
          })}
        </nav>

        <div
          className={`workflow-canvas-page__board${pendingFrom ? ' is-linking' : ''}`}
          aria-label="工作流画布"
        >
          <svg
            className="workflow-canvas-page__edges"
            width={boardSize.width}
            height={boardSize.height}
            aria-hidden="true"
          >
            {graph.edges.map((edge) => {
              const from = graph.nodes.find((node) => node.id === edge.from);
              const to = graph.nodes.find((node) => node.id === edge.to);
              if (!from || !to) return null;
              const x1 = (from.x ?? 0) + CANVAS_NODE_SIZE.width;
              const y1 = (from.y ?? 0) + CANVAS_NODE_SIZE.height / 2;
              const x2 = to.x ?? 0;
              const y2 = (to.y ?? 0) + CANVAS_NODE_SIZE.height / 2;
              const mid = (x1 + x2) / 2;
              const label = edge.loop ? '未通过' : from.type === 'gate' ? '通过' : null;
              return <g key={`${edge.from}-${edge.to}-${edge.loop ? 'loop' : 'fwd'}`}>
                <path d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} className={edge.loop ? 'is-loop' : undefined} />
                {label ? <text x={mid} y={(y1 + y2) / 2 - 6} textAnchor="middle">{label}</text> : null}
              </g>;
            })}
          </svg>
          {graph.nodes.map((node) => {
            const nodeStatus = run?.nodes[node.id]?.status;
            return (
              <article
                key={node.id}
                className={`workflow-node${selectedId === node.id ? ' is-selected' : ''}${pendingFrom === node.id ? ' is-source' : ''}`}
                data-tone={NODE_TYPE_META[node.type].tone}
                aria-label={`${node.title}节点`}
                aria-pressed={selectedId === node.id}
                style={{ left: node.x, top: node.y }}
                onClick={() => completeConnect(node.id)}
                onPointerDown={(event) => onNodePointerDown(event, node)}
                onPointerMove={onNodePointerMove}
                onPointerUp={onNodePointerUp}
              >
                <p className="workflow-node__kind">{NODE_TYPE_LABEL[node.type]}</p>
                <h3>{node.title}</h3>
                {nodeStatus ? <span className="workflow-node__status">{NODE_STATUS_LABEL[nodeStatus]}</span> : null}
                {node.type === 'manual' ? <span className="workflow-node__review-badge">待审核</span> : null}
                <button
                  type="button"
                  aria-label={`从 ${node.title} 连出`}
                  aria-pressed={pendingFrom === node.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (pendingFrom && pendingFrom !== node.id) {
                      completeConnect(node.id);
                      return;
                    }
                    setPendingFrom((current) => (current === node.id ? null : node.id));
                    setSelectedId(node.id);
                  }}
                >
                  连出
                </button>
              </article>
            );
          })}
        </div>

        <aside className="workflow-canvas-page__inspector" aria-label="节点配置">
          {selected ? (
            <div className="workflow-canvas-page__inspector-card"><h3>节点设置</h3><form
              className="workflow-canvas-page__form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                标题
                <input
                  value={selected.title}
                  onChange={(event) =>
                    setGraph(updateCanvasNode(graph, selected.id, { title: event.target.value }))
                  }
                />
              </label>
              <label>
                目标
                <textarea
                  value={selected.goal}
                  rows={3}
                  onChange={(event) =>
                    setGraph(updateCanvasNode(graph, selected.id, { goal: event.target.value }))
                  }
                />
              </label>
              {selected.config?.targetPath !== undefined || ['outline', 'write', 'deai', 'memory', 'gene'].includes(selected.type) ? (
                <label>
                  目标文件
                  <input
                    value={selected.config?.targetPath ?? ''}
                    onChange={(event) =>
                      setGraph(
                        updateCanvasNode(graph, selected.id, {
                          config: { ...selected.config, targetPath: event.target.value },
                        }),
                      )
                    }
                  />
                </label>
              ) : null}
              {selected.config?.sourcePaths || ['explore', 'gene', 'memory'].includes(selected.type) ? (
                <label>
                  源文件
                  <input
                    value={(selected.config?.sourcePaths ?? []).join(', ')}
                    onChange={(event) =>
                      setGraph(
                        updateCanvasNode(graph, selected.id, {
                          config: {
                            ...selected.config,
                            sourcePaths: event.target.value
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          },
                        }),
                      )
                    }
                  />
                </label>
              ) : null}
              {selected.type === 'gate' ? (
                <label>
                  分数阈值
                  <input
                    type="number"
                    value={selected.config?.threshold ?? 80}
                    onChange={(event) =>
                      setGraph(
                        updateCanvasNode(graph, selected.id, {
                          config: { ...selected.config, threshold: Number(event.target.value) },
                        }),
                      )
                    }
                  />
                </label>
              ) : null}
              <div className="workflow-canvas-page__skills">
                <label>
                  技能
                  {skillChoices.length === 0 ? (
                    <p>Hermes 离线或还没有小说技能。</p>
                  ) : (
                    <select
                      value=""
                      onChange={(event) => {
                        const id = event.target.value;
                        if (!id || selected.skills.includes(id)) return;
                        setGraph(
                          updateCanvasNode(graph, selected.id, {
                            skills: [...selected.skills, id],
                          }),
                        );
                      }}
                    >
                      <option value="">选择技能</option>
                      {skillChoices.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={selected.skills.includes(item.id)}
                        >
                          {item.label}
                          {item.hint ? ` · ${item.hint}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                {selected.skills.length > 0 ? (
                  <ul className="workflow-canvas-page__skill-chips" aria-label="已选技能">
                    {selected.skills.map((id) => {
                      const item = skillChoices.find((choice) => choice.id === id);
                      const label = item?.label ?? id;
                      return (
                        <li key={id}>
                          <span>{label}</span>
                          <button
                            type="button"
                            aria-label={`移除 ${label}`}
                            onClick={() =>
                              setGraph(
                                updateCanvasNode(graph, selected.id, {
                                  skills: selected.skills.filter((skillId) => skillId !== id),
                                }),
                              )
                            }
                          >
                            移除
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
              <label>
                模型
                <select
                  value={selected.model ?? ''}
                  onChange={(event) =>
                    setGraph(
                      updateCanvasNode(graph, selected.id, {
                        model: event.target.value || undefined,
                      }),
                    )
                  }
                >
                  <option value="">图默认（{graph.model}）</option>
                  {nodeModelChoices.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
              <label>温度 <input type="range" min="0" max="1" step="0.05" aria-label="温度" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /><span>{temperature.toFixed(2).replace(/0$/, '')}</span></label>
              {outgoing.length > 0 ? (
                <ul className="workflow-canvas-page__edges-list">
                  {outgoing.map((edge) => (
                    <li key={`${edge.from}-${edge.to}`}>
                      <span>
                        {edge.loop ? '打回' : '连到'} {graph.nodes.find((node) => node.id === edge.to)?.title ?? edge.to}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGraph(removeCanvasEdge(graph, edge.from, edge.to))}
                      >
                        断开
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                className="bixin-btn"
                onClick={() => {
                  setGraph(removeCanvasNode(graph, selected.id));
                  setSelectedId(null);
                }}
              >
                删除节点
              </button>
            </form></div>
          ) : (
            <p>从左侧点一个类型放到画布上，再点「连出」接到下游节点。</p>
          )}
        </aside>
      </div>
    </section>
  );
}
