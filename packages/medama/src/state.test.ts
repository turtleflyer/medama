import { createJobPool, createRegisterTriggerJob, createStateImage } from './state';

const symbKey = Symbol('symbKey');

describe('testing state part', () => {
  test('createJobPool works correctly', () => {
    let jobs = Array.from({ length: 5 }, () => jest.fn());
    const { addToPool, runPool } = createJobPool();
    runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(0));

    addToPool(new Set([jobs[0]]));
    runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i === 0 ? 1 : 0));

    runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i === 0 ? 1 : 0));

    jobs = Array.from({ length: 5 }, () => jest.fn());
    runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(0));

    addToPool(new Set(jobs));
    runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(1));

    runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(1));

    jobs = Array.from({ length: 5 }, () => jest.fn());
    runPool();
    jobs.every(({ mock: { calls } }) => expect(calls).toHaveLength(0));

    addToPool(new Set(jobs.slice(2)));
    runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i < 2 ? 0 : 1));

    runPool();
    jobs.every(({ mock: { calls } }, i) => expect(calls).toHaveLength(i < 2 ? 0 : 1));
  });

  test('createRegisterTriggerJob works correctly', () => {
    let triggerReturn1 = true;
    let triggerReturn2 = true;
    let selectorTrigger1 = jest.fn(() => triggerReturn1);
    let selectorTrigger2 = jest.fn(() => triggerReturn2);
    const triggerJobSet1 = new Set<() => void>();
    const triggerJobSet2 = new Set<() => void>();
    let registerTriggerJob1 = createRegisterTriggerJob(selectorTrigger1);
    let registerTriggerJob2 = createRegisterTriggerJob(selectorTrigger2);
    expect(triggerJobSet1.size).toBe(0);

    registerTriggerJob1(triggerJobSet1);
    expect(triggerJobSet1.size).toBe(1);

    registerTriggerJob2(triggerJobSet1);
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
    registerTriggerJob1 = createRegisterTriggerJob(selectorTrigger1);
    registerTriggerJob2 = createRegisterTriggerJob(selectorTrigger2);
    registerTriggerJob1(triggerJobSet1);
    registerTriggerJob1(triggerJobSet2);
    registerTriggerJob2(triggerJobSet2);
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

    let { registerSelectorTrigger, writeState } = createStateImage<{
      a: number;
      2: string;
      [symbKey]: boolean;
    }>();

    let readStateFromImage = registerSelectorTrigger(selectorTrigger1);

    expect(readStateFromImage((state) => state.a)).toBeUndefined();
    expect(readStateFromImage((state) => state[2])).toBeUndefined();
    expect(readStateFromImage((state) => state[symbKey])).toBeUndefined();

    ({ registerSelectorTrigger, writeState } = createStateImage({
      a: 21,
      2: 'abc',
      [symbKey]: false,
    }));

    readStateFromImage = registerSelectorTrigger(selectorTrigger1);

    expect(readStateFromImage((state) => state.a)).toBe(21);
    expect(readStateFromImage((state) => state[2])).toBe('abc');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(0);

    writeState({ a: 33, 2: 'fff', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('fff');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);

    writeState({ 2: 'eee', [symbKey]: false });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('eee');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);

    writeState({ a: 33, 2: 'ddd', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('ddd');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);

    writeState({ a: 100, 2: 'ddd', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(100);
    expect(readStateFromImage((state) => state[2])).toBe('ddd');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);

    triggerReturn1 = false;
    writeState({ a: 12 });
    expect(readStateFromImage((state) => state.a)).toBe(12);
    expect(selectorTrigger1.mock.calls).toHaveLength(3);

    writeState({ a: 44 });
    expect(readStateFromImage((state) => state.a)).toBe(44);
    expect(selectorTrigger1.mock.calls).toHaveLength(3);

    triggerReturn1 = true;
    selectorTrigger1 = jest.fn(() => triggerReturn1);
    registerSelectorTrigger(selectorTrigger1);
    readStateFromImage(({ a, [symbKey]: s }) => ({ a, s }));
    registerSelectorTrigger(selectorTrigger2);
    readStateFromImage(({ 2: two }) => two);
    writeState({ a: 33, 2: 'fff', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(33);
    expect(readStateFromImage((state) => state[2])).toBe('fff');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(1);
    expect(selectorTrigger2.mock.calls).toHaveLength(1);

    writeState({ a: 45, 2: 'ooo' });
    expect(readStateFromImage((state) => state.a)).toBe(45);
    expect(readStateFromImage((state) => state[2])).toBe('ooo');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(2);
    expect(selectorTrigger2.mock.calls).toHaveLength(2);

    triggerReturn2 = false;
    writeState({ a: 45, [symbKey]: false });
    expect(readStateFromImage((state) => state.a)).toBe(45);
    expect(readStateFromImage((state) => state[2])).toBe('ooo');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(3);
    expect(selectorTrigger2.mock.calls).toHaveLength(2);

    writeState({ a: 17, 2: 'yyy' });
    expect(readStateFromImage((state) => state.a)).toBe(17);
    expect(readStateFromImage((state) => state[2])).toBe('yyy');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(4);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    writeState({ 2: 'qqq' });
    expect(readStateFromImage((state) => state.a)).toBe(17);
    expect(readStateFromImage((state) => state[2])).toBe('qqq');
    expect(readStateFromImage((state) => state[symbKey])).toBe(false);
    expect(selectorTrigger1.mock.calls).toHaveLength(4);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    triggerReturn1 = false;
    writeState({ 2: 'ttt', [symbKey]: true });
    expect(readStateFromImage((state) => state.a)).toBe(17);
    expect(readStateFromImage((state) => state[2])).toBe('ttt');
    expect(readStateFromImage((state) => state[symbKey])).toBe(true);
    expect(selectorTrigger1.mock.calls).toHaveLength(5);
    expect(selectorTrigger2.mock.calls).toHaveLength(3);

    writeState({ a: 88 });
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
