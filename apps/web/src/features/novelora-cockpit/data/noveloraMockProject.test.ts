import { describe, expect, it } from 'vitest';
import {
  characterPortraits,
  inspirationThumbnails,
  projectCovers,
} from '../assetRegistry';
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

  it('exposes the planned memory-health percentage as project data', () => {
    expect(noveloraMockProject.memoryHealthPercent).toBe(78);
  });

  it('uses asset keys registered in their matching asset groups', () => {
    expect(Object.hasOwn(projectCovers, noveloraMockProject.coverAssetKey)).toBe(true);

    for (const inspiration of noveloraMockProject.inspirations) {
      expect(Object.hasOwn(inspirationThumbnails, inspiration.assetKey)).toBe(true);
    }

    for (const character of noveloraMockProject.characters) {
      expect(Object.hasOwn(characterPortraits, character.portraitAssetKey)).toBe(true);
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

  it('keeps fixture references internally consistent', () => {
    const actIds = new Set(noveloraMockProject.acts.map(({ id }) => id));
    const chapterIds = new Set(noveloraMockProject.chapters.map(({ id }) => id));
    const characterIds = new Set(noveloraMockProject.characters.map(({ id }) => id));

    expect(chapterIds.has(noveloraMockProject.selectedChapterId)).toBe(true);

    for (const act of noveloraMockProject.acts) {
      for (const chapterId of act.chapterIds) {
        const chapter = noveloraMockProject.chapters.find(
          (candidate) => candidate.id === chapterId,
        );

        expect(chapter).toBeDefined();
        expect(chapter?.actId).toBe(act.id);
      }
    }

    for (const chapter of noveloraMockProject.chapters) {
      expect(actIds.has(chapter.actId)).toBe(true);

      const act = noveloraMockProject.acts.find((candidate) => candidate.id === chapter.actId);
      expect(act?.chapterIds).toContain(chapter.id);
    }

    const listedChapterIds = noveloraMockProject.acts.flatMap((act) => act.chapterIds);
    expect(new Set(listedChapterIds).size).toBe(listedChapterIds.length);
    expect(new Set(listedChapterIds)).toEqual(chapterIds);

    for (const relationship of noveloraMockProject.characterRelationships) {
      expect(characterIds.has(relationship.fromCharacterId)).toBe(true);
      expect(characterIds.has(relationship.toCharacterId)).toBe(true);
    }

    for (const clueFlow of noveloraMockProject.clueFlows) {
      const stages = [clueFlow.provider, clueFlow.trigger, clueFlow.receiver, clueFlow.payoff];

      for (const stage of stages) {
        expect(chapterIds.has(stage.chapterId)).toBe(true);
      }
    }

    for (const item of [...noveloraMockProject.inspirations, ...noveloraMockProject.memorySources]) {
      for (const chapterId of item.relatedChapterIds) {
        expect(chapterIds.has(chapterId)).toBe(true);
      }
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
