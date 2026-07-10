import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from './noveloraMockProject';

describe('noveloraMockProject', () => {
  it('scopes the fixture to Tides of Embers', () => {
    expect(noveloraMockProject.novelId).toBe('tides-of-embers');
    expect(noveloraMockProject.title).toBe('Tides of Embers');
  });

  it('organizes six chapters across four acts and selects an Act II chapter', () => {
    expect(noveloraMockProject.acts).toHaveLength(4);
    expect(noveloraMockProject.chapters).toHaveLength(6);

    const selectedChapter = noveloraMockProject.chapters.find(
      (chapter) => chapter.id === noveloraMockProject.selectedChapterId,
    );

    expect(selectedChapter?.actId).toBe('act-ii');
  });

  it('locks the ordered act identities and labels', () => {
    expect(
      noveloraMockProject.acts.map(({ id, title }) => ({
        id,
        title: title.split(' \u2014 ')[0],
      })),
    ).toEqual([
      { id: 'act-i', title: 'Act I' },
      { id: 'act-ii', title: 'Act II' },
      { id: 'act-iii', title: 'Act III' },
      { id: 'epilogue', title: 'Epilogue' },
    ]);
  });

  it('provides at least four inspirations and memory sources', () => {
    expect(noveloraMockProject.inspirations.length).toBeGreaterThanOrEqual(4);
    expect(noveloraMockProject.memorySources.length).toBeGreaterThanOrEqual(4);
  });

  it('uses asset keys instead of resource URLs', () => {
    const assetValues = [
      noveloraMockProject.coverAssetKey,
      ...noveloraMockProject.inspirations.map(({ assetKey }) => assetKey),
      ...noveloraMockProject.characters.map(({ portraitAssetKey }) => portraitAssetKey),
    ];

    for (const assetValue of assetValues) {
      expect(assetValue).not.toMatch(/^(?:https?:\/\/|\/src\/|data:)/i);
    }
  });

  it('supplies five character nodes and connected relationships', () => {
    expect(noveloraMockProject.characters).toHaveLength(5);
    expect(noveloraMockProject.characterRelationships.length).toBeGreaterThan(0);
  });

  it('attributes every linked clue flow from provider through payoff', () => {
    expect(noveloraMockProject.clueFlows.length).toBeGreaterThanOrEqual(2);

    for (const clueFlow of noveloraMockProject.clueFlows) {
      expect(clueFlow.provider).toBeTruthy();
      expect(clueFlow.trigger).toBeTruthy();
      expect(clueFlow.receiver).toBeTruthy();
      expect(clueFlow.payoff).toBeTruthy();
    }
  });

  it('assigns responsibility at every clue-flow stage', () => {
    for (const clueFlow of noveloraMockProject.clueFlows) {
      expect(clueFlow.provider.providedBy).toBeTruthy();
      expect(clueFlow.trigger.triggeredBy).toBeTruthy();
      expect(clueFlow.receiver.receivedBy).toBeTruthy();
      expect(clueFlow.payoff.paidOffBy).toBeTruthy();
    }
  });

  it('represents each required agent-task state', () => {
    expect(noveloraMockProject.agentTasks).toHaveLength(4);
    expect(noveloraMockProject.agentTasks.map((task) => task.state).sort()).toEqual([
      'blocked',
      'done',
      'queued',
      'running',
    ]);
  });
});
