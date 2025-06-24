/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CreateMedama } from '..';
import type { SelectStateEntriesChanged } from '../selectStateEntriesChanged';

export const medamaTest = (
  createMedama: CreateMedama,
  selectStateEntriesChanged: SelectStateEntriesChanged
) => {
  const symbKey = Symbol('symbKey');

  describe('general medama tests', () => {
    test('methods inside pupil are identical to the plain methods', () => {
      const methods = createMedama<Record<any, number>>();

      expect(methods.subscribeToState).toBe(methods.pupil.subscribeToState);
      expect(methods.readState).toBe(methods.pupil.readState);
      expect(methods.setState).toBe(methods.pupil.setState);
      expect(methods.resetState).toBe(methods.pupil.resetState);
    });
  });

  describe.each([
    ['using plane `createMedama`', createMedama],

    [
      'using `createMedama` and resetting the state',

      (<State extends Record<never, unknown>>(initState: State) => {
        const pupilMethods = createMedama<State>();
        pupilMethods.resetState(initState);

        return pupilMethods;
      }) as CreateMedama,
    ],

    [
      'using `createMedama` after throwing error while reading the state',
      ((...args: [any]) => {
        const { readState } = createMedama();

        expect(() =>
          readState(() => {
            throw new Error();
          })
        ).toThrow();

        return createMedama(...args);
      }) as CreateMedama,
    ],

    [
      'using `createMedama` after throwing error in selector while subscribing to the state',
      ((...args: [any]) => {
        const { subscribeToState } = createMedama();

        expect(() =>
          subscribeToState(
            () => {
              throw new Error();
            },

            () => {}
          )
        ).toThrow();

        return createMedama(...args);
      }) as CreateMedama,
    ],

    [
      'using `createMedama` after throwing error in init part of subscription',
      ((...args: [any]) => {
        const { subscribeToState } = createMedama();

        expect(() =>
          subscribeToState(
            () => {},

            () => {
              throw new Error();
            }
          )
        ).toThrow();

        return createMedama(...args);
      }) as CreateMedama,
    ],

    [
      'using `createMedama` after throwing error in subscription job',
      ((...args: [any]) => {
        const { subscribeToState, setState } = createMedama<{ a: any }>();

        subscribeToState(
          (state) => state.a,

          () => () => {
            throw new Error();
          }
        );

        expect(() => setState({ a: {} })).toThrow();

        return createMedama(...args);
      }) as CreateMedama,
    ],
  ])('medama pupil tests (%s)', (_name, createMedama) => {
    test('`readState` with simple selectors works correctly', () => {
      const { readState } = createMedama({ a: 10, 1: 20, [symbKey]: 30 });

      expect(readState((state) => state.a)).toBe(10);
      expect(readState(({ a }) => a)).toBe(10);
      expect(readState((state) => state[1])).toBe(20);
      expect(readState((state) => state[symbKey])).toBe(30);
    });

    test('`readState` with complex selectors works correctly', () => {
      const { readState } = createMedama({ a: 10, 1: 20, [symbKey]: 30 });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, 1: 20, [symbKey]: 30 });
      expect(readState(({ a, 1: one }) => a + one)).toEqual(30);
      expect(readState(({ a, 1: one, [symbKey]: symb }) => (one - a) * symb)).toEqual(300);
    });

    test('`setState` with object works correctly', () => {
      const { setState, readState } = createMedama({ a: 10, 1: 20, [symbKey]: 30 });

      expect(setState({ a: 15 })).toEqual({ a: 15 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 15, 1: 20, [symbKey]: 30 });

      expect(setState({ 1: 33 })).toEqual({ 1: 33 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 15, 1: 33, [symbKey]: 30 });

      expect(setState({ [symbKey]: 3 })).toEqual({ [symbKey]: 3 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 15, 1: 33, [symbKey]: 3 });

      expect(setState({ a: 22, 1: 11, [symbKey]: 33 })).toEqual({
        a: 22,
        1: 11,
        [symbKey]: 33,
      });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 22, 1: 11, [symbKey]: 33 });
    });

    test('`setState` with simple expression works correctly', () => {
      const { setState, readState } = createMedama({ a: 10, 1: 20, [symbKey]: 30 });

      expect(setState(() => ({ a: 15 }))).toEqual({ a: 15 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 15, 1: 20, [symbKey]: 30 });

      expect(setState(() => ({ 1: 33 }))).toEqual({ 1: 33 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 15, 1: 33, [symbKey]: 30 });

      expect(setState(() => ({ [symbKey]: 3 }))).toEqual({ [symbKey]: 3 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 15, 1: 33, [symbKey]: 3 });

      expect(setState(() => ({ a: 22, 1: 11, [symbKey]: 33 }))).toEqual({
        a: 22,
        1: 11,
        [symbKey]: 33,
      });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 22, 1: 11, [symbKey]: 33 });
    });

    test('`setState` with complex expression works correctly', () => {
      const { setState, readState } = createMedama({ a: 10, 1: 20, [symbKey]: 30 });

      expect(setState(({ a }) => ({ a: a + 3 }))).toEqual({ a: 13 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 13, 1: 20, [symbKey]: 30 });

      expect(setState((state) => ({ a: state.a + 3 }))).toEqual({ a: 16 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 16, 1: 20, [symbKey]: 30 });

      expect(setState(({ 1: one }) => ({ 1: one - 3 }))).toEqual({ 1: 17 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 16, 1: 17, [symbKey]: 30 });

      expect(setState((state) => ({ 1: state[1] - 3 }))).toEqual({ 1: 14 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 16, 1: 14, [symbKey]: 30 });

      expect(setState(({ [symbKey]: symb }) => ({ [symbKey]: symb * 3 }))).toEqual({
        [symbKey]: 90,
      });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 16, 1: 14, [symbKey]: 90 });

      expect(setState((state) => ({ [symbKey]: state[symbKey] * 3 }))).toEqual({ [symbKey]: 270 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 16, 1: 14, [symbKey]: 270 });

      expect(
        setState(({ a, 1: one, [symbKey]: symb }) => ({
          a: a * 2,
          1: one + 2,
          [symbKey]: symb / 9,
        }))
      ).toEqual({ a: 32, 1: 16, [symbKey]: 30 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 32, 1: 16, [symbKey]: 30 });
    });

    test('complex computation in `setState` works correctly', () => {
      const { setState, readState } = createMedama({ a: 10, b: 20, c: 30 });

      expect(setState((state) => ({ a: state.a + state.b }))).toEqual({ a: 30 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 30, b: 20, c: 30 });

      expect(setState((state) => ({ b: state.a + state.c }))).toEqual({ b: 60 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 30, b: 60, c: 30 });

      expect(
        setState((state) => ({
          a: state.a + 10,
          b: state.a - state.c,
          c: state.a + state.b + state.c + 15,
        }))
      ).toEqual({ a: 40, b: 0, c: 135 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 40, b: 0, c: 135 });
    });

    test('`setState` adds new records to the state', () => {
      const { setState, readState } = createMedama<Record<any, number>>({ a: 10 });

      expect(setState({ b: 20 })).toEqual({
        b: 20,
      });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20 });

      expect(
        setState((state) => ({
          b: state.a + 3,
          c: state.b + 5,
        }))
      ).toEqual({
        b: 13,
        c: 25,
      });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 13, c: 25 });
    });

    test('subscription initializing works correctly', () => {
      const { subscribeToState } = createMedama();

      let testValue: any;

      subscribeToState(
        () => {},

        () => {
          testValue = 20;
        }
      );
      expect(testValue).toBe(20);

      subscribeToState(
        () => {},

        () => {
          testValue = 10;

          return () => {};
        }
      );
      expect(testValue).toBe(10);
    });

    test('simple selectors works correctly while initializing subscription', () => {
      const { subscribeToState } = createMedama({ a: 10, 1: 20, [symbKey]: 30 });

      let testValue: any;

      subscribeToState(
        (state) => ({ ...state }),

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toEqual({ a: 10, 1: 20, [symbKey]: 30 });

      subscribeToState(
        (state) => state.a,

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toBe(10);

      subscribeToState(
        (state) => state[1],

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toBe(20);

      subscribeToState(
        (state) => state[symbKey],

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toBe(30);

      subscribeToState(
        ({ a }) => a,

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toBe(10);
    });

    test('complex selectors works correctly while initializing subscription and resubscribing ', () => {
      const { subscribeToState } = createMedama({ a: 10, b: 20, c: 30 });

      let testValue: any;

      const { resubscribe } = subscribeToState(
        ({ a, b, c }) => a + c - b,

        (value) => {
          testValue = value;
        }
      );

      expect(testValue).toBe(20);

      resubscribe((value) => {
        testValue = value * 2;
      });
      expect(testValue).toBe(40);
    });

    test('subscribed tasks with no separate init part works correctly', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
        c: 30,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      subscribeToState((state) => state.a, subscription);
      expect(testValue).toBe(13);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      setState({ b: 2 });
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ a, b }) => ({ a: 100, b: a + b }));
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ a, c }) => ({ d: a + c }));
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ d }) => ({ a: d }));
      expect(testValue).toBe(133);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(118);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with init part works correctly', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
        c: 30,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value - 10;

        return subscription;
      });

      subscribeToState((state) => state.a, subscriptionWithInit);
      expect(testValue).toBe(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ b: 2 });
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a, b }) => ({ a: 100, b: a + b }));
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a, c }) => ({ d: a + c }));
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ d }) => ({ a: d }));
      expect(testValue).toBe(133);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(118);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with no separate init part works correctly after resubscribing', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
        c: 30,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const { resubscribe } = subscribeToState((state) => state.a, subscription);
      expect(testValue).toBe(30);
      expect(subscription).toHaveBeenCalledTimes(1);

      const nextSubscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      resubscribe(nextSubscription);
      expect(testValue).toBe(13);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscription.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscription.mock.calls = [];
      setState({ b: 2 });
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ a, b }) => ({ a: 100, b: a + b }));
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ a, c }) => ({ d: a + c }));
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ d }) => ({ a: d }));
      expect(testValue).toBe(133);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(118);
      expect(nextSubscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with init part works correctly after resubscribing', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 100,
        b: 20,
        c: 30,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 100, b: 20, c: 30 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value * 10;

        return subscription;
      });

      const { resubscribe } = subscribeToState((state) => state.a, subscriptionWithInit);
      expect(testValue).toBe(1000);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 10 });
      expect(testValue).toBe(30);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      const nextSubscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const nextSubscriptionWithInit = jest.fn((value: number) => {
        testValue = value - 10;

        return nextSubscription;
      });

      resubscribe(nextSubscriptionWithInit);
      expect(testValue).toBe(0);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState({ b: 2 });
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a, b }) => ({ a: 100, b: a + b }));
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a, c }) => ({ d: a + c }));
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ d }) => ({ a: d }));
      expect(testValue).toBe(133);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
      expect(testValue).toBe(118);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with no separate init part works correctly after transferring to another selector', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
        c: 30,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const selector1 = jest.fn((state: Record<any, number>) => state.a);

      const { transfer } = subscribeToState(selector1, subscription);
      expect(testValue).toBe(30);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 11 });
      expect(testValue).toBe(33);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: 50 });
      expect(testValue).toBe(33);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      const selector2 = jest.fn((state: Record<any, number>) => state.b);

      selector1.mock.calls = [];
      subscription.mock.calls = [];

      transfer(selector2);
      expect(testValue).toBe(150);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 100 });
      expect(testValue).toBe(150);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: 22 });
      expect(testValue).toBe(66);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with init part works correctly after transferring', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 100,
        b: 20,
        c: 30,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 100, b: 20, c: 30 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value * 10;

        return subscription;
      });

      const selector1 = jest.fn((state: Record<any, number>) => state.a);

      const { transfer } = subscribeToState(selector1, subscriptionWithInit);
      expect(testValue).toBe(1000);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 11 });
      expect(testValue).toBe(33);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: 50 });
      expect(testValue).toBe(33);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      const selector2 = jest.fn((state: Record<any, number>) => state.b);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      subscription.mock.calls = [];

      transfer(selector2);
      expect(testValue).toBe(150);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 100 });
      expect(testValue).toBe(150);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: 22 });
      expect(testValue).toBe(66);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('unsubscribing works correctly', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value;

        return subscription;
      });

      const { unsubscribe } = subscribeToState(({ a, b }) => a + b, subscriptionWithInit);
      expect(testValue).toBe(30);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toBe(123);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      unsubscribe();
      expect(testValue).toBe(123);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 50 });
      expect(testValue).toBe(123);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);
    });

    test('unsubscribing already unsubscribed job is safe', () => {
      const { subscribeToState, setState } = createMedama({
        a: 10,
        b: 20,
      });

      const subscription = jest.fn(() => {});

      const { unsubscribe } = subscribeToState(({ a, b }) => {
        a + b;
      }, subscription);

      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      setState({ a: 100 });
      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      unsubscribe();
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState({ a: 50 });
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      unsubscribe();
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState({ a: 60 });
      expect(subscription).toHaveBeenCalledTimes(0);
    });

    test('resubscribing after unsubscribing works correctly', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20 });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value;

        return subscription;
      });

      const { unsubscribe, resubscribe } = subscribeToState(
        ({ a, b }) => a + b,
        subscriptionWithInit
      );

      expect(testValue).toBe(30);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toBe(123);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      unsubscribe();

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      expect(testValue).toBe(123);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 50 });
      expect(testValue).toBe(123);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      const nextSubscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const nextSubscriptionWithInit = jest.fn((value: number) => {
        testValue = value * 2;

        return nextSubscription;
      });

      resubscribe(nextSubscriptionWithInit);
      expect(testValue).toBe(140);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState({ a: 25 });
      expect(testValue).toBe(135);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);
    });

    test('transferring after unsubscribing works correctly', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20 });

      const selector1 = jest.fn(({ a, b }: Record<any, number>) => a + b);

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value;

        return subscription;
      });

      const { unsubscribe, transfer } = subscribeToState(selector1, subscriptionWithInit);

      expect(testValue).toBe(30);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 100 });
      expect(testValue).toBe(123);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      unsubscribe();
      expect(testValue).toBe(123);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 50 });
      expect(testValue).toBe(123);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      const selector2 = jest.fn(({ a }: Record<any, number>) => a);

      selector1.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      transfer(selector2);
      expect(testValue).toBe(53);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 25 });
      expect(testValue).toBe(28);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: 30 });
      expect(testValue).toBe(28);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      unsubscribe();
      expect(testValue).toBe(28);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: 200 });
      expect(testValue).toBe(28);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);
    });

    test('multiple subscriptions with different selectors work correctly', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
        a: 10,
        b: 20,
        c: 30,
      });

      const selector1 = jest.fn((state: Record<any, number>) => state.a);

      let testValue1: number | undefined;

      const subscription1 = jest.fn((value: number) => {
        testValue1 = value + 3;
      });

      const subscriptionWithInit1 = jest.fn((value: number) => {
        testValue1 = value;

        return subscription1;
      });

      expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

      const subscribeReturn1 = subscribeToState(selector1, subscriptionWithInit1);
      expect(testValue1).toBe(10);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscriptionWithInit1.mock.calls = [];
      subscription1.mock.calls = [];

      setState({ a: 100 });
      expect(testValue1).toBe(103);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      const nextSubscription1 = jest.fn((value: number) => {
        testValue1 = value * 2;
      });

      const nextSubscriptionWithInit1 = jest.fn((value: number) => {
        testValue1 = value - 10;

        return nextSubscription1;
      });

      selector1.mock.calls = [];
      subscriptionWithInit1.mock.calls = [];
      subscription1.mock.calls = [];

      subscribeReturn1.resubscribe(nextSubscriptionWithInit1);
      expect(testValue1).toBe(90);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(1);
      expect(nextSubscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);

      const selector2 = jest.fn((state: Record<any, number>) => state.b);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit1.mock.calls = [];
      subscription1.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];

      subscribeReturn1.transfer(selector2);
      expect(testValue1).toBe(40);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(1);

      let testValue2: number | undefined;

      const subscription2 = jest.fn((value: number) => {
        testValue2 = value + 5;
      });

      const subscriptionWithInit2 = jest.fn((value: number) => {
        testValue2 = value - 3;

        return subscription2;
      });

      const subscribeReturn2 = subscribeToState(({ a, b, c }) => a + b + c, subscriptionWithInit2);

      expect(testValue2).toBe(147);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ a: 15, b: 25, d: 2 });
      expect(testValue1).toBe(50);
      expect(testValue2).toBe(75);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      selector2.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ d: 12 });
      expect(testValue1).toBe(50);
      expect(testValue2).toBe(75);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      selector2.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ c: 4 });
      expect(testValue1).toBe(50);
      expect(testValue2).toBe(49);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscribeReturn2.unsubscribe();

      selector2.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ c: 50 });
      expect(testValue1).toBe(50);
      expect(testValue2).toBe(49);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      selector2.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ b: 100 });
      expect(testValue1).toBe(200);
      expect(testValue2).toBe(49);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscribeReturn1.unsubscribe();

      selector2.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ a: 1, b: 2, c: 3, d: 4 });
      expect(testValue1).toBe(200);
      expect(testValue2).toBe(49);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
    });

    test('change of multiple records of the state triggers subscription once', () => {
      const { subscribeToState, setState } = createMedama<{
        a: number;
        3: object;
        [symbKey]: string;
      }>();

      const subscription1 = jest.fn(() => {});

      const { resubscribe, unsubscribe } = subscribeToState((state) => {
        state.a;
        state[3];
        state[symbKey];
      }, subscription1);

      expect(subscription1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      setState({ a: 1, 3: { foo: 3 }, [symbKey]: 'abc' });
      expect(subscription1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      setState({ a: 2, 3: {}, [symbKey]: 'xyz' });
      expect(subscription1).toHaveBeenCalledTimes(1);

      const subscription2 = jest.fn(() => {});

      subscription1.mock.calls = [];
      resubscribe(subscription2);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState({ a: 8, 3: { bar: 'ty' }, [symbKey]: 'no' });
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      unsubscribe();

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState({ a: 66, 3: {}, [symbKey]: 'yes' });
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
    });

    test('change of the state with identical primitives does not trigger subscriber', () => {
      const { subscribeToState, readState, setState } = createMedama<Record<any, any>>({ a: 1 });

      const subscription = jest.fn(() => {});
      const subscriptionWithInit = jest.fn(() => subscription);

      subscribeToState((s) => ({ ...s }), subscriptionWithInit);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 2 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 2 });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: 2 });
      expect(readState((state) => ({ ...state }))).toEqual({ a: 2 });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: {} });
      expect(readState((state) => ({ ...state }))).toEqual({ a: {} });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: {} });
      expect(readState((state) => ({ ...state }))).toEqual({ a: {} });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('extracted state object will not allow to read state outside the selector', () => {
      const { readState, setState, subscribeToState } = createMedama({ a: 1 });

      setState({ a: 100 });
      expect(readState((s) => s.a)).toBe(100);

      const stateHandler1 = readState((s) => s);
      expect(() => stateHandler1.a).toThrow(/Medama Error/);

      let stateHandler2: { a: number } | undefined;
      let state: { a: number };

      subscribeToState(
        (s) => {
          stateHandler2 = s;

          return { ...s };
        },

        (v) => {
          state = v;
        }
      );
      expect(stateHandler2).toBeDefined();
      expect(() => stateHandler2!.a).toThrow(/Medama Error/);
      expect(state!).toEqual({ a: 100 });
    });

    test("selectors after unsubscribing won't run", () => {
      type State = { a: number };

      const { setState, subscribeToState } = createMedama<State>({ a: 1 });

      const selector1 = jest.fn(({ a }: State) => a);
      const selector2 = jest.fn(({ a }: State) => a + 10);

      const { unsubscribe, resubscribe, transfer } = subscribeToState(selector1, () => {});
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      setState({ a: 100 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      setState({ a: 100 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ a: 200 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      resubscribe(() => {});
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      transfer(selector2);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe();
      setState({ a: 300 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe(() => {});
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: 400 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe();
      setState({ a: -100 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      transfer(selector1);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: 0 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('multiple subscriptions to one selector will run it once', () => {
      type State = { a: number };

      const { setState, subscribeToState } = createMedama<State>({ a: 1 });

      const selector1 = jest.fn(({ a }: State) => ({ newA: a }));
      const selector2 = jest.fn(({ a }: State) => ({ newA: a * 10 }));

      let testValue1!: { newA: number };
      let testValue2!: { newA: number };

      const { unsubscribe: unsubscribe1, transfer } = subscribeToState(selector1, (v) => {
        testValue1 = v;
      });

      expect(testValue1).toEqual({ newA: 1 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      const { unsubscribe: unsubscribe2, resubscribe } = subscribeToState(selector1, (v) => {
        testValue2 = v;
      });

      expect(testValue2).toEqual({ newA: 1 });
      expect(testValue2).toBe(testValue1);
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ a: 100 });
      expect(testValue1).toEqual({ newA: 100 });
      expect(testValue1).toBe(testValue2);
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      transfer(selector2);
      expect(testValue1).toEqual({ newA: 1000 });
      expect(testValue2).toEqual({ newA: 100 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: 2 });
      expect(testValue1).toEqual({ newA: 20 });
      expect(testValue2).toEqual({ newA: 2 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe1();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: 200 });
      expect(testValue1).toEqual({ newA: 20 });
      expect(testValue2).toEqual({ newA: 200 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe2();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: 300 });
      expect(testValue1).toEqual({ newA: 20 });
      expect(testValue2).toEqual({ newA: 200 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe((v) => {
        testValue1 = v;
      });
      expect(testValue1).toEqual({ newA: 300 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe((v) => {
        testValue2 = v;
      });
      expect(testValue2).toEqual({ newA: 300 });
      expect(testValue2).toBe(testValue1);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: 400 });
      expect(testValue1).toEqual({ newA: 300 });
      expect(testValue2).toEqual({ newA: 400 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('subscription of one job to multiple selectors works correctly', () => {
      type State = { a: number; b: string };

      const { setState, subscribeToState } = createMedama<State>({ a: 1, b: 'go' });
      let testValue!: string;

      const subscription = jest.fn((v) => {
        testValue = v;
      });

      const selector1 = jest.fn(({ a }: State) => `${a}`);
      const { unsubscribe: unsubscribe1 } = subscribeToState(selector1, subscription);

      expect(testValue).toBe('1');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      setState({ a: 2, b: 'stop' });
      expect(testValue).toBe('2');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn(({ a, b }: State) => `${a} ${b}`);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      const { unsubscribe: unsubscribe2 } = subscribeToState(selector2, subscription);

      expect(testValue).toBe('2 stop');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toEqual('100 stop');
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState({ a: 20, b: 'yes' });
      expect(testValue).toEqual('20 yes');
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      unsubscribe2();
      expect(subscription).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState({ a: 40 });
      expect(testValue).toEqual('40');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      unsubscribe1();
      expect(subscription).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState({ a: 300 });
      expect(testValue).toEqual('40');
      expect(subscription).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('`readState` will not recalculate known selector', () => {
      type State = { a: number };

      const { readState, setState, subscribeToState } = createMedama<State>({ a: 1 });

      const selector1 = jest.fn(({ a }: State) => ({ newA: a }));
      const selector2 = jest.fn(({ a }: State) => ({ newA: a * 10 }));

      let testValue: { newA: number } | undefined;

      const { unsubscribe, resubscribe, transfer } = subscribeToState(selector1, (v) => {
        testValue = v;
      });

      expect(testValue).toEqual({ newA: 1 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 1 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ a: 100 });
      expect(testValue).toEqual({ newA: 100 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 100 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      unsubscribe();
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 100 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ a: 200 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 200 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      testValue = undefined;
      resubscribe((v) => {
        testValue = v;
      });
      expect(testValue).toEqual({ newA: 200 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 200 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      transfer(selector2);
      expect(testValue).toEqual({ newA: 2000 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: -10 });
      expect(testValue).toEqual({ newA: -100 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: -10 });
      expect(readState(selector2)).toEqual({ newA: -100 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('`subscribeToState` will not recalculate the selector after `readState` is called first', () => {
      type State = { a: number };

      const { readState, setState, subscribeToState } = createMedama<State>({ a: 1 });

      const selector = jest.fn(({ a }: State) => ({ newA: a }));

      expect(readState(selector)).toEqual({ newA: 1 });
      expect(selector).toHaveBeenCalledTimes(1);

      let testValue: { newA: number } | undefined;

      selector.mock.calls = [];
      subscribeToState(selector, (v) => {
        testValue = v;
      });
      expect(testValue).toEqual({ newA: 1 });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];
      setState({ a: 100 });
      expect(testValue).toEqual({ newA: 100 });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('selector in subsequent calling `readState` works correctly', () => {
      type State = { a: number };

      const { readState, setState } = createMedama<State>({ a: 1 });

      const selector = jest.fn(({ a }: State) => ({ newA: a }));

      expect(readState(selector)).toEqual({ newA: 1 });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      expect(readState(selector)).toEqual({ newA: 1 });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];
      setState({ a: 100 });
      expect(readState(selector)).toEqual({ newA: 100 });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('not initialized values are `undefined`', () => {
      type State = { a: number; b: string };

      const { readState, setState } = createMedama<State>({ a: 1 });

      const selector = jest.fn(({ a, b }: State) => ({ newA: a, newB: b }));

      expect(readState(selector)).toEqual({ newA: 1, newB: undefined });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      setState({ a: 100, b: 'go' });
      expect(readState(selector)).toEqual({ newA: 100, newB: 'go' });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('updating not initialized values triggers subscriptions', () => {
      type State = { a: number; b: string };

      const { setState, subscribeToState } = createMedama<State>({ a: 1 });

      const selector = jest.fn(({ a, b }: State) => ({ newA: a, newB: b }));

      let testValue: { newA: number; newB: string } | undefined;

      subscribeToState(selector, (v) => {
        testValue = v;
      });
      expect(testValue).toEqual({ newA: 1, newB: undefined });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      setState({ b: 'go' });
      expect(testValue).toEqual({ newA: 1, newB: 'go' });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('selector remember its dependent state keys', () => {
      type State = { a: number; b: number };

      const { setState, subscribeToState } = createMedama<State>({ a: 1, b: 10 });

      let selectorFirstRun = true;

      const selector = jest.fn((state: State) => [
        selectorFirstRun ? { ...state } : state.a,
        (selectorFirstRun = false),
      ]);

      const { unsubscribe } = subscribeToState(selector, () => {});

      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ a: 2 });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ b: 20 });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      unsubscribe();
      setState({ a: 3 });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];

      setState({ b: 30 });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];

      subscribeToState(selector, () => {});
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ a: 4 });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ b: 40 });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('verify return object of createMedama and pupil reference the same object', () => {
      const medama = createMedama({ a: 1, b: 10 });
      expect(medama).toBe(medama.pupil);
    });

    test('readState inside subscription job returns updated selector values', () => {
      type State = { a: number; b: number };

      const { subscribeToState, setState, readState } = createMedama({ a: 1, b: 20 });

      const selector1 = jest.fn(({ a, b }: State) => ({ a, b }));

      expect(readState(selector1)).toEqual({ a: 1, b: 20 });
      expect(selector1).toHaveBeenCalledTimes(1);

      let testValue1!: object;

      const subscription1 = jest.fn((v: State) => {
        testValue1 = v;
      });

      selector1.mock.calls = [];

      subscribeToState(selector1, subscription1);
      expect(testValue1).toEqual({ a: 1, b: 20 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn(({ a }: State) => a);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      expect(readState(selector2)).toBe(1);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);

      let testValue2!: number;

      const subscription2 = jest.fn((v: number) => {
        testValue2 = v;
      });

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];

      subscribeToState(selector2, subscription2);
      expect(testValue2).toBe(1);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      let testValue3!: number;

      const subscription3 = jest.fn(() => {
        testValue3 = readState(selector2);
      });

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];

      subscribeToState(selector1, subscription3);
      expect(testValue3).toBe(1);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
      expect(subscription3).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];

      setState({ b: 30 });
      expect(testValue1).toEqual({ a: 1, b: 30 });
      expect(testValue2).toEqual(1);
      expect(testValue3).toEqual(1);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(0);
      expect(subscription3).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];

      setState({ a: 4 });
      expect(testValue1).toEqual({ a: 4, b: 30 });
      expect(testValue2).toEqual(4);
      expect(testValue3).toEqual(4);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);
      expect(subscription3).toHaveBeenCalledTimes(1);
    });

    test('selectStateEntriesChanged works properly', () => {
      type State = { 1: number; b: number; [symbKey]: number };

      const { subscribeToState, setState, readState } = createMedama({
        1: 1,
        b: 20,
        [symbKey]: 300,
      });

      setState({ 1: -1, b: -20, [symbKey]: -300 });
      expect(readState(selectStateEntriesChanged)).toEqual({ 1: -1, b: -20, [symbKey]: -300 });

      let callOrder: number[] = [];
      let stateChanged1: Partial<State> | undefined;

      const subscription1 = jest.fn((stateEntriesChanged: Partial<State>) => {
        stateChanged1 = stateEntriesChanged;
        callOrder.push(1);
      });

      const { unsubscribe: unsubscribe1 } = subscribeToState(
        selectStateEntriesChanged,
        () => subscription1
      );

      const selector2 = jest.fn(({ b }: State) => b);
      const subscription2 = jest.fn(() => {
        callOrder.push(2);
      });

      subscribeToState(selector2, subscription2);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual([2]);

      callOrder = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ 1: 3 });
      expect(stateChanged1).toEqual({ 1: 3 });
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
      expect(callOrder).toEqual([1]);

      stateChanged1 = undefined;
      callOrder = [];
      subscription1.mock.calls = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ [symbKey]: 800 });
      expect(stateChanged1).toEqual({ [symbKey]: 800 });
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
      expect(callOrder).toEqual([1]);

      stateChanged1 = undefined;
      callOrder = [];
      subscription1.mock.calls = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ b: 40 });
      expect(stateChanged1).toEqual({ b: 40 });
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual([2, 1]);

      let stateChanged2: Partial<State> | undefined;
      const subscription3 = jest.fn((stateEntriesChanged: Partial<State>) => {
        stateChanged2 = stateEntriesChanged;
        callOrder.push(3);
      });

      subscription1.mock.calls = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];

      const { unsubscribe: unsubscribe3 } = subscribeToState(
        selectStateEntriesChanged,
        () => subscription3
      );
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      stateChanged1 = undefined;
      callOrder = [];
      subscription1.mock.calls = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ b: 50 });
      expect(stateChanged1).toEqual({ b: 50 });
      expect(stateChanged2).toEqual({ b: 50 });
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);
      expect(subscription3).toHaveBeenCalledTimes(1);
      expect(callOrder).toHaveLength(3);
      expect(callOrder[0]).toBe(2);
      expect(callOrder.slice(1)).toContain(1);
      expect(callOrder.slice(1)).toContain(3);

      stateChanged1 = undefined;
      stateChanged2 = undefined;
      subscription1.mock.calls = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      callOrder = [];

      setState({ b: 50 });
      expect(stateChanged1).toBeUndefined();
      expect(stateChanged2).toBeUndefined();
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
      expect(subscription3).toHaveBeenCalledTimes(0);
      expect(callOrder).toHaveLength(0);

      stateChanged1 = undefined;
      stateChanged2 = undefined;
      subscription1.mock.calls = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      callOrder = [];

      setState({ 1: 15, b: 50, [symbKey]: 700 });
      expect(stateChanged1).toEqual({ 1: 15, [symbKey]: 700 });
      expect(stateChanged2).toEqual({ 1: 15, [symbKey]: 700 });
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
      expect(subscription3).toHaveBeenCalledTimes(1);
      expect(callOrder).toHaveLength(2);
      expect(callOrder).not.toContain(2);

      stateChanged1 = undefined;
      stateChanged2 = undefined;
      subscription1.mock.calls = [];
      selector2.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      callOrder = [];

      unsubscribe1();
      setState({ b: -50, [symbKey]: -700 });
      expect(stateChanged1).toBeUndefined();
      expect(stateChanged2).toEqual({ b: -50, [symbKey]: -700 });
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);
      expect(subscription3).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual([2, 3]);

      stateChanged2 = undefined;
      selector2.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      callOrder = [];

      unsubscribe3();
      setState({ b: 150, [symbKey]: -700 });
      expect(readState(selectStateEntriesChanged)).toEqual({ b: 150 });
      expect(stateChanged1).toBeUndefined();
      expect(stateChanged2).toBeUndefined();
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);
      expect(subscription3).toHaveBeenCalledTimes(0);
      expect(callOrder).toEqual([2]);
    });
  });
};
