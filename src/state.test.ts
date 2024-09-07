import { JobPool, StateImage, TriggerJob } from './state';

const symbKey = Symbol('symbKey');

describe('testing state part', () => {
  test('createJobPool works correctly', () => {
    let jobs = Array.from({ length: 5 }, () => jest.fn());
    const jobPool = new JobPool();
    jobPool.runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(0));

    jobPool.addToPool(new Set([jobs[0]]));
    jobPool.runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i === 0 ? 1 : 0));

    jobPool.runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i === 0 ? 1 : 0));

    jobs = Array.from({ length: 5 }, () => jest.fn());
    jobPool.runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(0));

    jobPool.addToPool(new Set(jobs));
    jobPool.runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(1));

    jobPool.runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(1));

    jobs = Array.from({ length: 5 }, () => jest.fn());
    jobPool.runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(0));

    jobPool.addToPool(new Set(jobs.slice(2)));
    jobPool.runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i < 2 ? 0 : 1));

    jobPool.runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i < 2 ? 0 : 1));
  });

  test('createRegisterTriggerJob works correctly', () => {
    let triggerReturn1 = true;
    let triggerReturn2 = true;
    let selectorTrigger1 = jest.fn(() => triggerReturn1);
    let selectorTrigger2 = jest.fn(() => triggerReturn2);
    const triggerJobSet1 = new Set<() => void>();
    const triggerJobSet2 = new Set<() => void>();
    let triggerJob1 = new TriggerJob(selectorTrigger1);
    let triggerJob2 = new TriggerJob(selectorTrigger2);
    expect(triggerJobSet1.size).toBe(0);

    triggerJob1.registerTriggerJob(triggerJobSet1);
    expect(triggerJobSet1.size).toBe(1);

    triggerJob2.registerTriggerJob(triggerJobSet1);
    expect(triggerJobSet1.size).toBe(2);

    triggerJobSet1.forEach((job) => {
      job();
    });

    expect(triggerJobSet1.size).toBe(2);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);
    expect(selectorTrigger2.mock.calls).toHaveLength(1);

    triggerReturn1 = false;

    triggerJobSet1.forEach((job) => {
      job();
    });

    expect(triggerJobSet1.size).toBe(1);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);
    expect(selectorTrigger2.mock.calls).toHaveLength(2);

    triggerReturn2 = false;

    triggerJobSet1.forEach((job) => {
      job();
    });

    expect(triggerJobSet1.size).toBe(0);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    triggerReturn1 = true;
    triggerReturn2 = true;
    selectorTrigger1 = jest.fn(() => triggerReturn1);
    selectorTrigger2 = jest.fn(() => triggerReturn2);
    triggerJob1 = new TriggerJob(selectorTrigger1);
    triggerJob2 = new TriggerJob(selectorTrigger2);
    triggerJob1.registerTriggerJob(triggerJobSet1);
    triggerJob1.registerTriggerJob(triggerJobSet2);
    triggerJob2.registerTriggerJob(triggerJobSet2);
    expect(triggerJobSet1.size).toBe(1);
    expect(triggerJobSet2.size).toBe(2);

    triggerJobSet2.forEach((job) => {
      job();
    });

    expect(triggerJobSet1.size).toBe(1);
    expect(triggerJobSet2.size).toBe(2);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);
    expect(selectorTrigger2.mock.calls).toHaveLength(1);

    triggerReturn1 = false;

    triggerJobSet2.forEach((job) => {
      job();
    });

    expect(triggerJobSet1.size).toBe(0);
    expect(triggerJobSet2.size).toBe(1);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);
    expect(selectorTrigger2.mock.calls).toHaveLength(2);

    triggerReturn2 = false;

    triggerJobSet2.forEach((job) => {
      job();
    });

    expect(triggerJobSet1.size).toBe(0);
    expect(triggerJobSet2.size).toBe(0);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);
  });

  test('createStateImage works correctly', () => {
    let triggerReturn1 = true;
    let triggerReturn2 = true;
    let selectorTrigger1 = jest.fn(() => triggerReturn1);
    const selectorTrigger2 = jest.fn(() => triggerReturn2);

    let stateImage = new StateImage<{
      a: number;
      2: string;
      [symbKey]: boolean;
    }>();

    let readStateFromImage = stateImage.registerSelectorTrigger(selectorTrigger1);

    expect(readStateFromImage((state) => state.a)).toBeUndefined();
    expect(readStateFromImage((state) => state[2])).toBeUndefined();
    expect(readStateFromImage((state) => state[symbKey])).toBeUndefined();

    stateImage = new StateImage({
      a: 21,
      2: 'abc',
      [symbKey]: false,
    });

    readStateFromImage = stateImage.registerSelectorTrigger(selectorTrigger1);

    expect(readStateFromImage((state) => state.a)).toBe(21);
    expect(readStateFromImage((state) => state[2])).toBe('abc');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(0);

    stateImage.writeState({ a: 33, 2: 'fff', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('fff');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);

    stateImage.writeState({ 2: 'eee', [symbKey]: false });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('eee');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);

    stateImage.writeState({ a: 33, 2: 'ddd', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('ddd');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);

    stateImage.writeState({ a: 100, 2: 'ddd', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(100);
    expect(readStateFromImage((state) => state[2])).toBe('ddd');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);

    triggerReturn1 = false;
    stateImage.writeState({ a: 12 });
    expect(readStateFromImage((state) => state.a)).toBe(12);
    expect(selectorTrigger1.mock.calls).toHaveLength(3);

    stateImage.writeState({ a: 44 });
    expect(readStateFromImage((state) => state.a)).toBe(44);
    expect(selectorTrigger1.mock.calls).toHaveLength(3);

    triggerReturn1 = true;
    selectorTrigger1 = jest.fn(() => triggerReturn1);
    stateImage.registerSelectorTrigger(selectorTrigger1);
    readStateFromImage(({ a, [symbKey]: s }) => ({ a, s }));
    stateImage.registerSelectorTrigger(selectorTrigger2);
    readStateFromImage(({ 2: two }) => two);
    stateImage.writeState({ a: 33, 2: 'fff', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('fff');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);
    expect(selectorTrigger2.mock.calls).toHaveLength(1);

    stateImage.writeState({ a: 45, 2: 'ooo' });
    expect(readStateFromImage((state) => state.a)).toBe(45);
    expect(readStateFromImage((state) => state[2])).toBe('ooo');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);
    expect(selectorTrigger2.mock.calls).toHaveLength(2);

    triggerReturn2 = false;
    stateImage.writeState({ a: 45, [symbKey]: false });
    expect(readStateFromImage((state) => state.a)).toBe(45);
    expect(readStateFromImage((state) => state[2])).toBe('ooo');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(3);
    expect(selectorTrigger2.mock.calls).toHaveLength(2);

    stateImage.writeState({ a: 17, 2: 'yyy' });
    expect(readStateFromImage((state) => state.a)).toBe(17);
    expect(readStateFromImage((state) => state[2])).toBe('yyy');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(4);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    stateImage.writeState({ 2: 'qqq' });
    expect(readStateFromImage((state) => state.a)).toBe(17);
    expect(readStateFromImage((state) => state[2])).toBe('qqq');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(4);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    triggerReturn1 = false;
    stateImage.writeState({ 2: 'ttt', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(17);
    expect(readStateFromImage((state) => state[2])).toBe('ttt');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(5);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    stateImage.writeState({ a: 88 });
    expect(readStateFromImage((state) => state.a)).toBe(88);
    expect(readStateFromImage((state) => state[2])).toBe('ttt');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(5);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    let memSate: {};

    readStateFromImage((state) => {
      memSate = state;
    });

    expect(() => ({ ...memSate })).toThrow(/Medama Error/);
  });
});
