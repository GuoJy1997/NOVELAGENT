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
