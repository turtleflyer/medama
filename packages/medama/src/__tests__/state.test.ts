/* eslint-disable @typescript-eslint/no-empty-function */
import { createJobQueue, createStateImage, type KeyHandle } from '../state';

const symbKey = Symbol('symbKey');

describe('testing state part', () => {
  test('createJobPool works correctly', () => {
    const jobs = Array.from({ length: 5 }, () => jest.fn());
    const { addToQueue, runQueue } = createJobQueue();

    runQueue();
    jobs.every((job) => {
      expect(job).toHaveBeenCalledTimes(0);
    });

    jobs.every((job) => {
      job.mock.calls = [];
    });

    addToQueue(new Set([jobs[0]]));
    runQueue();
    jobs.every((job, i) => {
      expect(job).toHaveBeenCalledTimes(i === 0 ? 1 : 0);
    });

    jobs.every((job) => {
      job.mock.calls = [];
    });

    runQueue();
    jobs.every((job) => {
      expect(job).toHaveBeenCalledTimes(0);
    });

    jobs.every((job) => {
      job.mock.calls = [];
    });

    addToQueue(new Set(jobs));
    runQueue();
    jobs.every((job) => {
      expect(job).toHaveBeenCalledTimes(1);
    });

    jobs.every((job) => {
      job.mock.calls = [];
    });

    runQueue();
    jobs.every((job) => {
      expect(job).toHaveBeenCalledTimes(0);
    });

    jobs.every((job) => {
      job.mock.calls = [];
    });

    addToQueue(new Set(jobs.slice(2)));
    runQueue();
    jobs.every((job, i) => {
      expect(job).toHaveBeenCalledTimes(i < 2 ? 0 : 1);
    });

    jobs.every((job) => {
      job.mock.calls = [];
    });

    runQueue();
    jobs.every((job) => {
      expect(job).toHaveBeenCalledTimes(0);
    });
  });

  test('createStateImage works correctly', () => {
    let memKeyHandle: KeyHandle[] = [];
    const keyHandleCollector = jest.fn((keyHandle: KeyHandle) => {
      memKeyHandle.push(keyHandle);
    });

    const immediateTask = jest.fn(() => {});
    const selectorTrigger = jest.fn(() => {});

    let { runOverState, setState } = createStateImage<{
      a: number;
      2: string;
      [symbKey]: boolean;
    }>();

    expect(runOverState((state) => state.a)).toBeUndefined();
    expect(runOverState((state) => state[2])).toBeUndefined();
    expect(runOverState((state) => state[symbKey])).toBeUndefined();

    ({ runOverState, setState } = createStateImage({ a: 21, 2: 'abc', [symbKey]: false }));

    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 21, 2: 'abc', [symbKey]: false });

    setState({ a: 33, 2: 'fff', [symbKey]: true });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 33, 2: 'fff', [symbKey]: true });

    setState((state) => ({ a: state[2].length }));
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 3, 2: 'fff', [symbKey]: true });

    expect(runOverState((state) => state.a, keyHandleCollector)).toBe(3);
    expect(keyHandleCollector).toHaveBeenCalledTimes(1);
    expect(memKeyHandle).toHaveLength(1);

    keyHandleCollector.mock.calls = [];

    setState({ a: 44 });
    expect(runOverState((state) => state.a)).toBe(44);
    expect(keyHandleCollector).toHaveBeenCalledTimes(0);

    const unregisterCallbacks1 = memKeyHandle.map((handle) =>
      handle(immediateTask, selectorTrigger)
    );
    expect(unregisterCallbacks1).toHaveLength(1);

    setState({ a: 15 });
    expect(runOverState((state) => state.a)).toBe(15);
    expect(immediateTask).toHaveBeenCalledTimes(1);
    expect(selectorTrigger).toHaveBeenCalledTimes(1);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    setState({ 2: 'no', [symbKey]: false });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 15, 2: 'no', [symbKey]: false });
    expect(immediateTask).toHaveBeenCalledTimes(0);
    expect(selectorTrigger).toHaveBeenCalledTimes(0);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    setState({ a: 17, 2: 'go', [symbKey]: true });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 17, 2: 'go', [symbKey]: true });
    expect(immediateTask).toHaveBeenCalledTimes(1);
    expect(selectorTrigger).toHaveBeenCalledTimes(1);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    unregisterCallbacks1.forEach((callback) => {
      callback();
    });
    setState({ a: 200 });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 200, 2: 'go', [symbKey]: true });
    expect(immediateTask).toHaveBeenCalledTimes(0);
    expect(selectorTrigger).toHaveBeenCalledTimes(0);

    memKeyHandle = [];

    expect(
      runOverState(({ 2: two, [symbKey]: symb }) => ({ two, symb }), keyHandleCollector)
    ).toEqual({ two: 'go', symb: true });
    expect(keyHandleCollector).toHaveBeenCalledTimes(2);
    expect(memKeyHandle).toHaveLength(2);

    keyHandleCollector.mock.calls = [];

    setState({ 2: 'see' });
    expect(runOverState((state) => state[2])).toBe('see');
    expect(keyHandleCollector).toHaveBeenCalledTimes(0);

    const unregisterCallbacks2 = memKeyHandle.map((handle) =>
      handle(immediateTask, selectorTrigger)
    );
    expect(unregisterCallbacks2).toHaveLength(2);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    setState({ [symbKey]: false });
    expect(runOverState((state) => state[symbKey])).toBe(false);
    expect(immediateTask).toHaveBeenCalledTimes(1);
    expect(selectorTrigger).toHaveBeenCalledTimes(1);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    setState({ a: 100, [symbKey]: false });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 100, 2: 'see', [symbKey]: false });
    expect(immediateTask).toHaveBeenCalledTimes(0);
    expect(selectorTrigger).toHaveBeenCalledTimes(0);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    setState({ a: 700, 2: 'win', [symbKey]: false });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 700, 2: 'win', [symbKey]: false });
    expect(immediateTask).toHaveBeenCalledTimes(1);
    expect(selectorTrigger).toHaveBeenCalledTimes(1);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    setState({ a: -1, 2: 'loose', [symbKey]: true });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: -1, 2: 'loose', [symbKey]: true });
    expect(immediateTask).toHaveBeenCalledTimes(2);
    expect(selectorTrigger).toHaveBeenCalledTimes(1);

    immediateTask.mock.calls = [];
    selectorTrigger.mock.calls = [];

    unregisterCallbacks2.forEach((callback) => {
      callback();
    });
    setState({ a: 5, 2: 'can', [symbKey]: false });
    expect(runOverState((state) => ({ ...state }))).toEqual({ a: 5, 2: 'can', [symbKey]: false });
    expect(immediateTask).toHaveBeenCalledTimes(0);
    expect(selectorTrigger).toHaveBeenCalledTimes(0);

    let memSate: {};

    runOverState((state) => {
      memSate = state;
    });

    expect(() => ({ ...memSate })).toThrow(/Medama Error/);
  });
});
