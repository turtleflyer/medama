/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Selector } from '../medama.types';
import { createSelectorRecord, type SelectorTrigger } from '../selectorStore';
import type { KeyHandleCollector } from '../state';

describe('testing selector store part', () => {
  test('createSelectorRecord works correctly', () => {
    let selectorReturn = 11;
    const selector = jest.fn(() => selectorReturn);

    const unregisterHandle = jest.fn(() => {});
    let memImmediateTask: (() => void) | undefined;
    let memSelectorTrigger: SelectorTrigger | undefined;

    const keyHandle = jest.fn((runImmediately: () => void, trigger: SelectorTrigger) => {
      memImmediateTask = runImmediately;
      memSelectorTrigger = trigger;

      return unregisterHandle;
    });

    const runOverState = jest.fn(
      (selector: Selector<{}, number>, keyHandleCollector?: KeyHandleCollector): number => {
        keyHandleCollector?.(keyHandle);

        return selector({});
      }
    );

    const { addSubscription, getValue } = createSelectorRecord(selector, runOverState);
    expect(memImmediateTask).toBeDefined();
    expect(memSelectorTrigger).toBeDefined();
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(1);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];

    selectorReturn = 33;
    expect(getValue()).toBe(11);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];

    expect(getValue()).toBe(33);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(1);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];

    expect(getValue()).toBe(33);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);

    let calcResult1: number | undefined;

    const subscriptionJob1 = jest.fn((v: number) => {
      calcResult1 = v;
    });

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];

    selectorReturn = 25;
    const unsubscribeJob1 = addSubscription(subscriptionJob1);
    expect(calcResult1).toBeUndefined();
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    expect(getValue()).toBe(33);
    expect(calcResult1).toBeUndefined();
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(25);
    expect(subscriptionJob1).toHaveBeenCalledTimes(1);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    expect(getValue()).toBe(25);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);

    let calcResult2: number | undefined;

    const subscriptionJob2 = jest.fn((v: number) => {
      calcResult2 = v;
    });

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    selectorReturn = 88;
    const unsubscribeJob2 = addSubscription(subscriptionJob2);
    expect(calcResult1).toBe(25);
    expect(calcResult2).toBeUndefined();
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(getValue()).toBe(25);
    expect(calcResult1).toBe(25);
    expect(calcResult2).toBeUndefined();
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(88);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(1);
    expect(subscriptionJob2).toHaveBeenCalledTimes(1);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    selectorReturn = 75;
    unsubscribeJob1();
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(88);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(getValue()).toBe(88);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(88);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(1);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    selectorReturn = 333;
    unsubscribeJob2();
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(getValue()).toBe(75);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(getValue()).toBe(333);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(1);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    selectorReturn = 66;
    expect(getValue()).toBe(333);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];
    subscriptionJob2.mock.calls = [];

    expect(getValue()).toBe(66);
    expect(calcResult1).toBe(88);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(1);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);
    expect(subscriptionJob2).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    addSubscription(subscriptionJob1);
    expect(calcResult1).toBe(88);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(0);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(66);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(1);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    selectorReturn = -100;
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(66);
    expect(runOverState).toHaveBeenCalledTimes(0);
    expect(selector).toHaveBeenCalledTimes(0);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(1);

    runOverState.mock.calls = [];
    selector.mock.calls = [];
    keyHandle.mock.calls = [];
    subscriptionJob1.mock.calls = [];

    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    memImmediateTask!();
    expect(memSelectorTrigger!.isToAdd()).toBe(true);
    memSelectorTrigger!.trigger();
    expect(memSelectorTrigger!.isToAdd()).toBe(false);
    expect(calcResult1).toBe(-100);
    expect(runOverState).toHaveBeenCalledTimes(1);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(keyHandle).toHaveBeenCalledTimes(0);
    expect(subscriptionJob1).toHaveBeenCalledTimes(1);
  });
});
