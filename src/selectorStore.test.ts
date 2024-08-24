import type { ReadState, Selector } from './medama.types';
import { createSelectorRecord, createSelectorStore } from './selectorStore';

describe('testing selector store part', () => {
  test('createSelectorRecord works correctly', () => {
    let selectorReturn = 11;
    const selector = jest.fn(() => selectorReturn);
    const readState = jest.fn(<V>(selector: Selector<{}, V>) => (selector as () => V)());
    let memSelectorTrigger: () => boolean;

    const registerSelectorTrigger = jest.fn((selectorTrigger: () => boolean) => {
      memSelectorTrigger = selectorTrigger;

      return readState as ReadState<{}>;
    });

    const { addSubscription, getValue } = createSelectorRecord(selector, registerSelectorTrigger);
    expect(selector.mock.calls).toHaveLength(0);
    expect(readState.mock.calls).toHaveLength(0);

    expect(getValue()).toBe(11);
    expect(selector.mock.calls).toHaveLength(1);
    expect(readState.mock.calls).toHaveLength(1);

    expect(memSelectorTrigger!()).toBe(false);
    expect(selector.mock.calls).toHaveLength(1);
    expect(readState.mock.calls).toHaveLength(1);

    selectorReturn = 33;
    let calcResult1;

    const subscriptionJob1 = jest.fn((v: unknown) => {
      calcResult1 = v;
    });

    const unsubscribeJob1 = addSubscription(subscriptionJob1);
    expect(getValue()).toBe(33);
    expect(calcResult1).toBeUndefined();
    expect(subscriptionJob1.mock.calls).toHaveLength(0);
    expect(selector.mock.calls).toHaveLength(2);
    expect(readState.mock.calls).toHaveLength(2);

    expect(getValue()).toBe(33);
    expect(subscriptionJob1.mock.calls).toHaveLength(0);
    expect(selector.mock.calls).toHaveLength(2);
    expect(readState.mock.calls).toHaveLength(2);

    expect(calcResult1).toBeUndefined();
    expect(getValue()).toBe(33);
    expect(subscriptionJob1.mock.calls).toHaveLength(0);
    expect(selector.mock.calls).toHaveLength(2);
    expect(readState.mock.calls).toHaveLength(2);

    selectorReturn = 25;
    expect(memSelectorTrigger!()).toBe(true);
    expect(subscriptionJob1.mock.calls).toHaveLength(1);
    expect(selector.mock.calls).toHaveLength(3);
    expect(readState.mock.calls).toHaveLength(3);
    expect(calcResult1).toBe(25);

    expect(getValue()).toBe(25);
    expect(subscriptionJob1.mock.calls).toHaveLength(1);
    expect(selector.mock.calls).toHaveLength(3);
    expect(readState.mock.calls).toHaveLength(3);

    selectorReturn = 88;
    let calcResult2;

    const subscriptionJob2 = jest.fn((v: unknown) => {
      calcResult2 = v;
    });

    const unsubscribeJob2 = addSubscription(subscriptionJob2);
    expect(getValue()).toBe(25);
    expect(subscriptionJob1.mock.calls).toHaveLength(1);
    expect(subscriptionJob2.mock.calls).toHaveLength(0);
    expect(selector.mock.calls).toHaveLength(3);
    expect(readState.mock.calls).toHaveLength(3);
    expect(calcResult1).toBe(25);
    expect(calcResult2).toBeUndefined();

    expect(memSelectorTrigger!()).toBe(true);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(1);
    expect(selector.mock.calls).toHaveLength(4);
    expect(readState.mock.calls).toHaveLength(4);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(88);

    unsubscribeJob1();
    selectorReturn = 75;

    expect(memSelectorTrigger!()).toBe(true);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(2);
    expect(selector.mock.calls).toHaveLength(5);
    expect(readState.mock.calls).toHaveLength(5);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);

    unsubscribeJob2();
    selectorReturn = 333;

    expect(memSelectorTrigger!()).toBe(false);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(2);
    expect(selector.mock.calls).toHaveLength(5);
    expect(readState.mock.calls).toHaveLength(5);
    expect(calcResult1).toBe(88);
    expect(calcResult2).toBe(75);

    expect(getValue()).toBe(333);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(2);
    expect(selector.mock.calls).toHaveLength(6);
    expect(readState.mock.calls).toHaveLength(6);

    selectorReturn = 66;
    expect(getValue()).toBe(333);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(2);
    expect(selector.mock.calls).toHaveLength(6);
    expect(readState.mock.calls).toHaveLength(6);

    expect(memSelectorTrigger!()).toBe(false);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(2);
    expect(selector.mock.calls).toHaveLength(6);
    expect(readState.mock.calls).toHaveLength(6);

    expect(memSelectorTrigger!()).toBe(false);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(2);
    expect(selector.mock.calls).toHaveLength(6);
    expect(readState.mock.calls).toHaveLength(6);

    expect(getValue()).toBe(66);
    expect(subscriptionJob1.mock.calls).toHaveLength(2);
    expect(subscriptionJob2.mock.calls).toHaveLength(2);
    expect(selector.mock.calls).toHaveLength(7);
    expect(readState.mock.calls).toHaveLength(7);
  });

  test('createSelectorStore works correctly', () => {
    const readState = jest.fn(<V>(selector: Selector<{}, V>) => (selector as () => V)());
    let memSelectorTrigger: (() => boolean) | undefined;

    const registerSelectorTrigger = jest.fn((selectorTrigger: () => boolean) => {
      memSelectorTrigger = selectorTrigger;

      return readState as ReadState<{}>;
    });

    const { getSelectorValue, subscribeToStateInSelectorStore } =
      createSelectorStore(registerSelectorTrigger);

    let selectorReturn1 = 199;
    const selector1 = jest.fn(() => selectorReturn1);

    expect(getSelectorValue(selector1)).toBe(199);
    expect(selector1.mock.calls).toHaveLength(1);
    expect(memSelectorTrigger).toBeDefined();

    const memSelectorTrigger1 = memSelectorTrigger!;
    selector1.mock.calls = [];
    expect(getSelectorValue(selector1)).toBe(199);
    expect(selector1.mock.calls).toHaveLength(0);

    selectorReturn1 = 44;
    selector1.mock.calls = [];
    expect(memSelectorTrigger1()).toBe(false);
    expect(getSelectorValue(selector1)).toBe(44);
    expect(selector1.mock.calls).toHaveLength(1);

    let subscriptionReturn1;

    const subscription1 = jest.fn((selectorResult: unknown) => {
      subscriptionReturn1 = selectorResult;
    });

    selector1.mock.calls = [];
    const unsubscribe1 = subscribeToStateInSelectorStore(selector1, subscription1);
    expect(selector1.mock.calls).toHaveLength(0);
    expect(subscription1.mock.calls).toHaveLength(1);

    selectorReturn1 = 11;
    selector1.mock.calls = [];
    subscription1.mock.calls = [];
    expect(memSelectorTrigger1()).toBe(true);
    expect(selector1.mock.calls).toHaveLength(1);
    expect(subscription1.mock.calls).toHaveLength(1);
    expect(subscriptionReturn1).toBe(11);

    selectorReturn1 = 56;
    selector1.mock.calls = [];
    subscription1.mock.calls = [];
    expect(selector1.mock.calls).toHaveLength(0);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(getSelectorValue(selector1)).toBe(11);

    let subscriptionReturn2_1;

    const subscription2Final = jest.fn((selectorResult: unknown) => {
      subscriptionReturn2_1 = selectorResult;
    });

    let subscriptionReturn2_2;

    const subscription2Init = jest.fn((selectorResult: unknown) => {
      subscriptionReturn2_2 = selectorResult;

      return subscription2Final;
    });

    memSelectorTrigger = undefined;
    const unsubscribe2_1 = subscribeToStateInSelectorStore(selector1, subscription2Init);
    selectorReturn1 = 77;
    selector1.mock.calls = [];
    subscription1.mock.calls = [];
    expect(memSelectorTrigger).toBeUndefined();
    expect(selector1.mock.calls).toHaveLength(0);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(1);
    expect(subscription2Final.mock.calls).toHaveLength(0);
    expect(subscriptionReturn2_2).toBe(11);

    selectorReturn1 = 755;
    selector1.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(memSelectorTrigger1()).toBe(true);
    expect(selector1.mock.calls).toHaveLength(1);
    expect(subscription1.mock.calls).toHaveLength(1);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(1);
    expect(subscriptionReturn1).toBe(755);
    expect(subscriptionReturn2_1).toBe(755);
    expect(subscriptionReturn2_2).toBe(11);

    selectorReturn1 = 999;
    selector1.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    let selectorReturn2 = 800;
    const selector2 = jest.fn(() => selectorReturn2);
    const unsubscribe2_2 = subscribeToStateInSelectorStore(selector2, subscription2Init);
    expect(memSelectorTrigger).toBeDefined();
    expect(selector1.mock.calls).toHaveLength(0);
    expect(selector2.mock.calls).toHaveLength(1);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(1);
    expect(subscription2Final.mock.calls).toHaveLength(0);
    expect(subscriptionReturn1).toBe(755);
    expect(subscriptionReturn2_1).toBe(755);
    expect(subscriptionReturn2_2).toBe(800);

    const memSelectorTrigger2 = memSelectorTrigger!;
    selectorReturn1 = 345;
    selectorReturn2 = 134;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(getSelectorValue(selector1)).toBe(755);
    expect(getSelectorValue(selector2)).toBe(800);
    expect(selector1.mock.calls).toHaveLength(0);
    expect(selector2.mock.calls).toHaveLength(0);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(0);

    selectorReturn1 = 13;
    selectorReturn2 = 44;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(memSelectorTrigger1()).toBe(true);
    expect(memSelectorTrigger2()).toBe(true);
    expect(selector1.mock.calls).toHaveLength(1);
    expect(selector2.mock.calls).toHaveLength(1);
    expect(subscription1.mock.calls).toHaveLength(1);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(2);
    expect(subscriptionReturn1).toBe(13);
    expect(subscriptionReturn2_1).toBe(44);
    expect(subscriptionReturn2_2).toBe(800);

    unsubscribe1();
    selectorReturn1 = 66;
    selectorReturn2 = 89;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(memSelectorTrigger1()).toBe(true);
    expect(memSelectorTrigger2()).toBe(true);
    expect(selector1.mock.calls).toHaveLength(1);
    expect(selector2.mock.calls).toHaveLength(1);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(2);
    expect(subscriptionReturn1).toBe(13);
    expect(subscriptionReturn2_1).toBe(89);
    expect(subscriptionReturn2_2).toBe(800);

    unsubscribe2_1();
    selectorReturn1 = 265;
    selectorReturn2 = 112;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(memSelectorTrigger1()).toBe(false);
    expect(memSelectorTrigger2()).toBe(true);
    expect(selector1.mock.calls).toHaveLength(0);
    expect(selector2.mock.calls).toHaveLength(1);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(1);
    expect(subscriptionReturn1).toBe(13);
    expect(subscriptionReturn2_1).toBe(112);
    expect(subscriptionReturn2_2).toBe(800);

    selectorReturn1 = 567;
    selectorReturn2 = 908;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(getSelectorValue(selector1)).toBe(567);
    expect(selector1.mock.calls).toHaveLength(1);
    expect(selector2.mock.calls).toHaveLength(0);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(0);
    expect(subscriptionReturn1).toBe(13);
    expect(subscriptionReturn2_1).toBe(112);
    expect(subscriptionReturn2_2).toBe(800);

    selectorReturn1 = 45;
    selectorReturn2 = 78;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(getSelectorValue(selector1)).toBe(567);
    expect(selector1.mock.calls).toHaveLength(0);
    expect(selector2.mock.calls).toHaveLength(0);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(0);
    expect(subscriptionReturn1).toBe(13);
    expect(subscriptionReturn2_1).toBe(112);
    expect(subscriptionReturn2_2).toBe(800);

    unsubscribe2_2();
    selectorReturn1 = 422;
    selectorReturn2 = 90;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(memSelectorTrigger1()).toBe(false);
    expect(memSelectorTrigger2()).toBe(false);
    expect(selector1.mock.calls).toHaveLength(0);
    expect(selector2.mock.calls).toHaveLength(0);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(0);
    expect(subscriptionReturn1).toBe(13);
    expect(subscriptionReturn2_1).toBe(112);
    expect(subscriptionReturn2_2).toBe(800);

    selectorReturn1 = 100;
    selectorReturn2 = 66;
    selector1.mock.calls = [];
    selector2.mock.calls = [];
    subscription1.mock.calls = [];
    subscription2Init.mock.calls = [];
    subscription2Final.mock.calls = [];
    expect(getSelectorValue(selector1)).toBe(100);
    expect(getSelectorValue(selector2)).toBe(66);
    expect(selector1.mock.calls).toHaveLength(1);
    expect(selector2.mock.calls).toHaveLength(1);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2Init.mock.calls).toHaveLength(0);
    expect(subscription2Final.mock.calls).toHaveLength(0);
    expect(subscriptionReturn1).toBe(13);
    expect(subscriptionReturn2_1).toBe(112);
    expect(subscriptionReturn2_2).toBe(800);
  });
});
