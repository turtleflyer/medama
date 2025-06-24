import { createSelectorRecord, type SelectorTrigger } from '..';

test('createSelectorRecord works correctly', () => {
  let value = 100;
  const calculateValue = jest.fn(() => value);

  let captureImmediateTask: (() => void) | undefined;
  let captureSelectorTrigger: SelectorTrigger | undefined;

  const manageSubscriptions = jest.fn<
    undefined,
    [immediateTask: () => void, selectorTrigger: SelectorTrigger]
  >((immediateTask, selectorTrigger) => {
    captureImmediateTask = immediateTask;
    captureSelectorTrigger = selectorTrigger;
  });

  const unsubscribe = jest.fn();

  const { getValue, addSubscription } = createSelectorRecord(
    calculateValue,
    manageSubscriptions,
    unsubscribe
  );

  const chunk1 = (v: number, expectSubscription = true) => {
    calculateValue.mock.calls = [];
    manageSubscriptions.mock.calls = [];
    unsubscribe.mock.calls = [];

    value = v;
    expect(getValue()).toBe(v);
    expect(calculateValue).toHaveBeenCalledTimes(1);
    expect(manageSubscriptions).toHaveBeenCalledTimes(expectSubscription ? 1 : 0);
    expect(unsubscribe).toHaveBeenCalledTimes(0);
    expect(captureImmediateTask).toBeDefined();
    expect(captureSelectorTrigger).toBeDefined();

    calculateValue.mock.calls = [];
    manageSubscriptions.mock.calls = [];
    unsubscribe.mock.calls = [];

    value = v + 1;
    expect(value).not.toBe(v);
    expect(getValue()).toBe(v);
    expect(calculateValue).toHaveBeenCalledTimes(0);
    expect(manageSubscriptions).toHaveBeenCalledTimes(0);
    expect(unsubscribe).toHaveBeenCalledTimes(0);
    expect(captureImmediateTask).toBeDefined();
    expect(captureSelectorTrigger).toBeDefined();
  };

  chunk1(100);

  const chunk2 = () => {
    expect(captureSelectorTrigger?.isToAdd()).toBe(true);
    expect(captureSelectorTrigger?.isToAdd()).toBe(false);
    expect(captureSelectorTrigger?.isToAdd()).toBe(false);
  };

  chunk2();

  const chunk3 = (expectEmptyPool = true) => {
    calculateValue.mock.calls = [];
    manageSubscriptions.mock.calls = [];
    unsubscribe.mock.calls = [];

    captureSelectorTrigger?.trigger();
    expect(calculateValue).toHaveBeenCalledTimes(0);
    expect(manageSubscriptions).toHaveBeenCalledTimes(0);
    expect(unsubscribe).toHaveBeenCalledTimes(expectEmptyPool ? 1 : 0);
  };

  chunk3();
  chunk2();

  captureImmediateTask?.();
  chunk1(200);

  const subscription1 = jest.fn();
  const subscription2 = jest.fn();

  const unsubscribeJob1 = addSubscription(subscription1);
  const unsubscribeJob2 = addSubscription(subscription2);
  chunk3(false);
  chunk2();
  expect(subscription1).toHaveBeenCalledTimes(1);
  expect(subscription2).toHaveBeenCalledTimes(1);

  captureImmediateTask?.();
  chunk1(300, false);

  subscription1.mock.calls = [];
  subscription2.mock.calls = [];

  unsubscribeJob2();
  chunk3(false);
  chunk2();
  expect(subscription1).toHaveBeenCalledTimes(1);
  expect(subscription2).toHaveBeenCalledTimes(0);

  captureImmediateTask?.();
  chunk1(400, false);

  subscription1.mock.calls = [];
  subscription2.mock.calls = [];

  unsubscribeJob1();
  chunk3();
  chunk2();
  expect(subscription1).toHaveBeenCalledTimes(0);
  expect(subscription2).toHaveBeenCalledTimes(0);

  captureImmediateTask?.();
  chunk1(500);
});
