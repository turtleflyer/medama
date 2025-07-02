/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMedama } from 'medama';
import type { ComposeMedama } from '..';
import type {
  CStateG,
  LayerPupilsPreventInference,
  RevealLayersInStateRecursively,
} from '../auxiliaryTypes';

export const medamaGuarantiesTest = (composeMedama: ComposeMedama) => {
  const symbKey = Symbol('symbKey');

  describe('general medama layers tests', () => {
    test('methods inside pupil are identical to the plain methods', () => {
      const methods = composeMedama<{ a: object; b: object }>({
        a: createMedama(),
        b: createMedama(),
      });

      expect(methods.subscribeToState).toBe(methods.pupil.subscribeToState);
      expect(methods.readState).toBe(methods.pupil.readState);
      expect(methods.setState).toBe(methods.pupil.setState);
      expect(methods.resetState).toBe(methods.pupil.resetState);
    });
  });

  describe.each([
    ['using plane `composeMedama`', composeMedama],

    [
      'using `composeMedama` and resetting the state',
      (<State extends CStateG>(
        layers: LayerPupilsPreventInference<State>,
        initState?: RevealLayersInStateRecursively<State>
      ) => {
        const pupilMethods = composeMedama<State>(layers);
        pupilMethods.resetState(initState);

        return pupilMethods;
      }) as ComposeMedama,
    ],

    [
      'using `composeMedama` after throwing error while reading the state',
      ((...args: [any]) => {
        const { readState } = composeMedama({
          a: composeMedama({ a: createMedama() }),
        });

        expect(() =>
          readState(() => {
            throw new Error();
          })
        ).toThrow();

        return composeMedama(...args);
      }) as ComposeMedama,
    ],

    [
      'using `composeMedama` after throwing error in selector while subscribing to the state',
      ((...args: [any]) => {
        const { subscribeToState } = composeMedama({
          a: composeMedama({ a: createMedama() }),
        });

        expect(() =>
          subscribeToState(
            () => {
              throw new Error();
            },

            () => {}
          )
        ).toThrow();

        return composeMedama(...args);
      }) as ComposeMedama,
    ],

    [
      'using `composeMedama` after throwing error in init part of subscription',
      ((...args: [any]) => {
        const { subscribeToState } = composeMedama({
          a: composeMedama({ a: createMedama() }),
        });

        expect(() =>
          subscribeToState(
            () => {},

            () => {
              throw new Error();
            }
          )
        ).toThrow();

        return composeMedama(...args);
      }) as ComposeMedama,
    ],

    [
      'using `composeMedama` after throwing error in subscription job',
      ((...args: [any]) => {
        const { subscribeToState, setState } = composeMedama({
          a: composeMedama({ a: createMedama({ a: 1 }) }),
        });

        subscribeToState(
          (state) => state.a.a.a,

          () => () => {
            throw new Error();
          }
        );

        expect(() => setState({ a: { a: { a: 2 } } })).toThrow();

        return composeMedama(...args);
      }) as ComposeMedama,
    ],
  ])('medama pupil guaranties testcases for medama layers (%s)', (_name, composeMedama) => {
    test('`readState` with simple selectors works correctly', () => {
      const { readState } = composeMedama(
        { a: createMedama(), 1: createMedama(), [symbKey]: createMedama() },
        {
          a: { foo: 10, bar: 'go' },
          1: { [symbKey]: 20 },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      expect(readState((state) => ({ ...state.a }))).toEqual({ foo: 10, bar: 'go' });
      expect(readState(({ 1: { [symbKey]: symb } }) => symb)).toBe(20);
      expect(readState((state) => state[symbKey].yes)).toBe(false);
      expect(readState((state) => ({ ...state[symbKey] }))).toEqual({ no: 'right', yes: false });
    });

    test('`readState` with complex selectors works correctly', () => {
      const { readState } = composeMedama(
        { a: createMedama(), 1: createMedama(), [symbKey]: createMedama() },
        {
          a: { foo: 10, bar: 'go' },
          1: { [symbKey]: 20, 2: 'twenty' },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      expect(
        readState(({ a: { foo }, 1: { [symbKey]: symb }, [symbKey]: { no } }) => foo + symb + no)
      ).toEqual('30right');

      expect(
        readState(
          ({ a: { bar }, 1: { 2: two }, [symbKey]: { no, yes } }) =>
            'your words are ' + yes + ' you have ' + two + ' and must ' + bar + ' turning ' + no
        )
      ).toEqual(`your words are false you have twenty and must go turning right`);
    });

    test('`setState` with object works correctly', () => {
      const { setState, readState } = composeMedama(
        { a: createMedama(), 1: createMedama(), [symbKey]: createMedama() },
        {
          a: { foo: 10, bar: 'go' },
          1: { [symbKey]: 20, 2: 'twenty' },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      expect(setState({ a: { foo: 30 } })).toEqual({ a: { foo: 30 } });
      expect(readState((state) => ({ ...state.a }))).toEqual({
        foo: 30,
        bar: 'go',
      });

      expect(setState({ 1: { [symbKey]: 100 } })).toEqual({ 1: { [symbKey]: 100 } });
      expect(readState((state) => ({ ...state[1] }))).toEqual({
        [symbKey]: 100,
        2: 'twenty',
      });

      expect(setState({ [symbKey]: { yes: true } })).toEqual({ [symbKey]: { yes: true } });
      expect(readState((state) => ({ ...state[symbKey] }))).toEqual({
        no: 'right',
        yes: true,
      });

      expect(
        setState({ a: { bar: 'stay' }, 1: { 2: 'fifty' }, [symbKey]: { no: 'left', yes: false } })
      ).toEqual({ a: { bar: 'stay' }, 1: { 2: 'fifty' }, [symbKey]: { no: 'left', yes: false } });
      expect(
        readState((state) => ({
          a: { ...state.a },
          1: { ...state[1] },
          [symbKey]: { ...state[symbKey] },
        }))
      ).toEqual({
        a: { foo: 30, bar: 'stay' },
        1: { [symbKey]: 100, 2: 'fifty' },
        [symbKey]: { no: 'left', yes: false },
      });
    });

    test('`setState` with simple expression works correctly', () => {
      const { setState, readState } = composeMedama(
        { a: createMedama(), 1: createMedama(), [symbKey]: createMedama() },
        {
          a: { foo: 10, bar: 'go' },
          1: { [symbKey]: 20, 2: 'twenty' },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      expect(setState(() => ({ a: { foo: 30 } }))).toEqual({ a: { foo: 30 } });
      expect(readState((state) => ({ ...state.a }))).toEqual({
        foo: 30,
        bar: 'go',
      });

      expect(setState(() => ({ 1: { [symbKey]: 100 } }))).toEqual({ 1: { [symbKey]: 100 } });
      expect(readState((state) => ({ ...state[1] }))).toEqual({
        [symbKey]: 100,
        2: 'twenty',
      });

      expect(setState(() => ({ [symbKey]: { yes: true } }))).toEqual({ [symbKey]: { yes: true } });
      expect(readState((state) => ({ ...state[symbKey] }))).toEqual({
        no: 'right',
        yes: true,
      });

      expect(
        setState(() => ({
          a: { bar: 'stay' },
          1: { 2: 'fifty' },
          [symbKey]: { no: 'left', yes: false },
        }))
      ).toEqual({ a: { bar: 'stay' }, 1: { 2: 'fifty' }, [symbKey]: { no: 'left', yes: false } });
      expect(
        readState((state) => ({
          a: { ...state.a },
          1: { ...state[1] },
          [symbKey]: { ...state[symbKey] },
        }))
      ).toEqual({
        a: { foo: 30, bar: 'stay' },
        1: { [symbKey]: 100, 2: 'fifty' },
        [symbKey]: { no: 'left', yes: false },
      });
    });

    test('`setState` with complex expression works correctly', () => {
      const { setState, readState } = composeMedama(
        { a: createMedama(), 1: createMedama(), [symbKey]: createMedama() },
        {
          a: { foo: 10, bar: 'go' },
          1: { [symbKey]: 20, 2: 'twenty' },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      expect(setState(({ a: { foo } }) => ({ a: { foo: foo + 3 } }))).toEqual({ a: { foo: 13 } });
      expect(readState((state) => ({ ...state.a }))).toEqual({
        foo: 13,
        bar: 'go',
      });

      expect(setState((state) => ({ a: { foo: state.a.foo + 3 } }))).toEqual({ a: { foo: 16 } });
      expect(readState((state) => ({ ...state.a }))).toEqual({
        foo: 16,
        bar: 'go',
      });

      expect(setState(({ 1: { [symbKey]: symb } }) => ({ 1: { [symbKey]: symb - 3 } }))).toEqual({
        1: { [symbKey]: 17 },
      });
      expect(readState((state) => ({ ...state[1] }))).toEqual({
        [symbKey]: 17,
        2: 'twenty',
      });

      expect(setState((state) => ({ 1: { [symbKey]: state[1][symbKey] - 3 } }))).toEqual({
        1: { [symbKey]: 14 },
      });
      expect(readState((state) => ({ ...state[1] }))).toEqual({
        [symbKey]: 14,
        2: 'twenty',
      });

      expect(setState(({ [symbKey]: { yes } }) => ({ [symbKey]: { yes: !yes } }))).toEqual({
        [symbKey]: { yes: true },
      });
      expect(readState((state) => ({ ...state[symbKey] }))).toEqual({
        no: 'right',
        yes: true,
      });

      expect(setState((state) => ({ [symbKey]: { yes: !state[symbKey].yes } }))).toEqual({
        [symbKey]: { yes: false },
      });
      expect(readState((state) => ({ ...state[symbKey] }))).toEqual({
        no: 'right',
        yes: false,
      });

      expect(
        setState(({ a: { bar }, 1: { 2: two }, [symbKey]: { no, yes } }) => ({
          a: { bar: bar + ' far' },
          1: { 2: two + ' two' },
          [symbKey]: { no: no + 'ish', yes: !yes },
        }))
      ).toEqual({
        a: { bar: 'go far' },
        1: { 2: 'twenty two' },
        [symbKey]: { no: 'rightish', yes: true },
      });
      expect(
        readState((state) => ({
          a: { ...state.a },
          1: { ...state[1] },
          [symbKey]: { ...state[symbKey] },
        }))
      ).toEqual({
        a: { foo: 16, bar: 'go far' },
        1: { [symbKey]: 14, 2: 'twenty two' },
        [symbKey]: { no: 'rightish', yes: true },
      });
    });

    test('complex computation in `setState` works correctly', () => {
      const { setState, readState } = composeMedama(
        { a: createMedama(), 1: createMedama(), [symbKey]: createMedama() },
        {
          a: { foo: 10, bar: 'go' },
          1: { [symbKey]: 20, 2: 'twenty' },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      expect(setState((state) => ({ a: { foo: state.a.foo + state[1][symbKey] } }))).toEqual({
        a: { foo: 30 },
      });
      expect(readState((state) => ({ ...state.a }))).toEqual({
        foo: 30,
        bar: 'go',
      });

      expect(setState((state) => ({ 1: { 2: state[symbKey].no + ' to ' + state.a.bar } }))).toEqual(
        {
          1: { 2: 'right to go' },
        }
      );
      expect(readState((state) => ({ ...state[1] }))).toEqual({
        [symbKey]: 20,
        2: 'right to go',
      });

      expect(
        setState((state) => ({
          a: { foo: state.a.foo + 10 },
          1: { [symbKey]: state.a.foo - state[symbKey].no.length },

          [symbKey]: {
            no: state[1][symbKey] + ' to the ' + state[symbKey].no,
            yes: state.a.bar === 'go' && state[1][symbKey] > 19 && state[symbKey].no.length < 6,
          },
        }))
      ).toEqual({
        a: { foo: 40 },
        1: { [symbKey]: 25 },
        [symbKey]: { no: '20 to the right', yes: true },
      });
      expect(
        readState((state) => ({
          a: { ...state.a },
          1: { ...state[1] },
          [symbKey]: { ...state[symbKey] },
        }))
      ).toEqual({
        a: { foo: 40, bar: 'go' },
        1: { [symbKey]: 25, 2: 'right to go' },
        [symbKey]: { no: '20 to the right', yes: true },
      });
    });

    test('`setState` adds new records to the state', () => {
      const { setState, readState } = composeMedama<{
        a: { foo: number; bar: string };
        1: { [symbKey]: string };
      }>({ a: createMedama(), 1: createMedama() }, { a: { foo: 10 } });

      expect(setState({ a: { bar: 'North' } })).toEqual({ a: { bar: 'North' } });
      expect(readState((state) => ({ ...state.a }))).toEqual({
        foo: 10,
        bar: 'North',
      });

      expect(
        setState((state) => ({
          1: {
            [symbKey]: state.a.foo + ' miles to ' + state.a.bar,
          },
        }))
      ).toEqual({ 1: { [symbKey]: '10 miles to North' } });
      expect(readState((state) => ({ ...state.a, ...state[1] }))).toEqual({
        foo: 10,
        bar: 'North',
        [symbKey]: '10 miles to North',
      });
    });

    test('subscription initializing works correctly', () => {
      const { subscribeToState } = composeMedama({ a: createMedama() });

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
      const { subscribeToState } = composeMedama(
        { a: createMedama(), 1: createMedama(), [symbKey]: createMedama() },
        {
          a: { foo: 10, bar: 'go' },
          1: { [symbKey]: 20, 2: 'twenty' },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      let testValue: any;

      subscribeToState(
        (state) => ({ a: { ...state.a }, 1: { ...state[1] }, [symbKey]: { ...state[symbKey] } }),

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toEqual({
        a: { foo: 10, bar: 'go' },
        1: { [symbKey]: 20, 2: 'twenty' },
        [symbKey]: { no: 'right', yes: false },
      });

      subscribeToState(
        (state) => ({ ...state.a }),

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toEqual({ foo: 10, bar: 'go' });

      subscribeToState(
        (state) => ({ ...state[1] }),

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toEqual({ [symbKey]: 20, 2: 'twenty' });

      subscribeToState(
        (state) => ({ ...state[symbKey] }),

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toEqual({ no: 'right', yes: false });

      subscribeToState(
        ({ a }) => ({ ...a }),

        (value) => {
          testValue = value;
        }
      );
      expect(testValue).toEqual({ foo: 10, bar: 'go' });
    });

    test('complex selectors works correctly while initializing subscription and resubscribing ', () => {
      const { subscribeToState } = composeMedama(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      let testValue: any;

      const { resubscribe } = subscribeToState(
        ({ a: { foo }, b: { bar }, c: { baz } }) => foo + baz - bar,

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
      const { subscribeToState, readState, setState } = composeMedama<{
        a: Record<string, number>;
        b: Record<string, number>;
        c: Record<string, number>;
      }>(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      expect(
        readState((state) => ({ a: { ...state.a }, b: { ...state.b }, c: { ...state.c } }))
      ).toEqual({ a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      subscribeToState((state) => state.a.foo, subscription);
      expect(testValue).toBe(13);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      setState({ a: { foo: 100 } });
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      setState({ b: { bar: 2 } });
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar } }) => ({ a: { foo: 100 }, b: { bar: foo + bar } }));
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ a: { foo }, c: { baz } }) => ({ a: { qux: foo + baz } }));
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(103);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscription.mock.calls = [];
      setState(({ a: { qux } }) => ({ a: { foo: qux } }));
      expect(testValue).toBe(133);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(118);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with init part works correctly', () => {
      const { subscribeToState, readState, setState } = composeMedama<{
        a: Record<string, number>;
        b: Record<string, number>;
        c: Record<string, number>;
      }>(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      expect(
        readState((state) => ({ a: { ...state.a }, b: { ...state.b }, c: { ...state.c } }))
      ).toEqual({ a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value - 10;

        return subscription;
      });

      subscribeToState((state) => state.a.foo, subscriptionWithInit);
      expect(testValue).toBe(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: { foo: 100 } });
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ b: { bar: 2 } });
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar } }) => ({ a: { foo: 100 }, b: { bar: foo + bar } }));
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a: { foo }, c: { baz } }) => ({ a: { qux: foo + baz } }));
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(103);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a: { qux } }) => ({ a: { foo: qux } }));
      expect(testValue).toBe(133);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(118);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with no separate init part works correctly after resubscribing', () => {
      const { subscribeToState, readState, setState } = composeMedama<{
        a: Record<string, number>;
        b: Record<string, number>;
        c: Record<string, number>;
      }>(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      expect(
        readState((state) => ({ a: { ...state.a }, b: { ...state.b }, c: { ...state.c } }))
      ).toEqual({ a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const { resubscribe } = subscribeToState((state) => state.a.foo, subscription);
      expect(testValue).toBe(30);
      expect(subscription).toHaveBeenCalledTimes(1);

      const nextSubscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      resubscribe(nextSubscription);
      expect(testValue).toBe(13);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscription.mock.calls = [];
      setState({ a: { foo: 100 } });
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscription.mock.calls = [];
      setState({ b: { bar: 2 } });
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar } }) => ({ a: { foo: 100 }, b: { bar: foo + bar } }));
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, c: { baz } }) => ({ a: { qux: foo + baz } }));
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(103);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscription.mock.calls = [];
      setState(({ a: { qux } }) => ({ a: { foo: qux } }));
      expect(testValue).toBe(133);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(118);
      expect(nextSubscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with init part works correctly after resubscribing', () => {
      const { subscribeToState, readState, setState } = composeMedama<{
        a: Record<any, number>;
        b: Record<any, number>;
        c: Record<any, number>;
      }>(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 100 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      expect(
        readState((state) => ({ a: { ...state.a }, b: { ...state.b }, c: { ...state.c } }))
      ).toEqual({ a: { foo: 100 }, b: { bar: 20 }, c: { baz: 30 } });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value * 10;

        return subscription;
      });

      const { resubscribe } = subscribeToState((state) => state.a.foo, subscriptionWithInit);
      expect(testValue).toBe(1000);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: { foo: 10 } });
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
      setState({ a: { foo: 100 } });
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState({ b: { bar: 2 } });
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar } }) => ({ a: { foo: 100 }, b: { bar: foo + bar } }));
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, c: { baz } }) => ({ a: { qux: foo + baz } }));
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(103);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(0);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a: { qux } }) => ({ a: { foo: qux } }));
      expect(testValue).toBe(133);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);

      nextSubscriptionWithInit.mock.calls = [];
      nextSubscription.mock.calls = [];
      setState(({ a: { foo }, b: { bar }, c: { baz } }) => ({
        a: { foo: (foo + bar - baz / 15) / 2 },
      }));
      expect(testValue).toBe(118);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with no separate init part works correctly after transferring to another selector', () => {
      type State = {
        a: Record<string, number>;
        b: Record<string, number>;
        c: Record<string, number>;
      };

      const { subscribeToState, readState, setState } = composeMedama<State>(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      expect(
        readState((state) => ({ a: { ...state.a }, b: { ...state.b }, c: { ...state.c } }))
      ).toEqual({ a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const selector1 = jest.fn((state: State) => state.a.foo);

      const { transfer } = subscribeToState(selector1, subscription);
      expect(testValue).toBe(30);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: { foo: 11 } });
      expect(testValue).toBe(33);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: { bar: 50 } });
      expect(testValue).toBe(33);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      const selector2 = jest.fn((state: State) => state.b.bar);

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

      setState({ a: { foo: 100 } });
      expect(testValue).toBe(150);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: { bar: 22 } });
      expect(testValue).toBe(66);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('subscribed tasks with init part works correctly after transferring', () => {
      type State = {
        a: Record<any, number>;
        b: Record<any, number>;
        c: Record<any, number>;
      };

      const { subscribeToState, readState, setState } = composeMedama<State>(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 100 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      expect(
        readState((state) => ({ a: { ...state.a }, b: { ...state.b }, c: { ...state.c } }))
      ).toEqual({ a: { foo: 100 }, b: { bar: 20 }, c: { baz: 30 } });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value * 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value * 10;

        return subscription;
      });

      const selector1 = jest.fn((state: State) => state.a.foo);

      const { transfer } = subscribeToState(selector1, subscriptionWithInit);
      expect(testValue).toBe(1000);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ a: { foo: 11 } });
      expect(testValue).toBe(33);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: { bar: 50 } });
      expect(testValue).toBe(33);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      const selector2 = jest.fn((state: State) => state.b.bar);

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

      setState({ a: { foo: 100 } });
      expect(testValue).toBe(150);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: { bar: 22 } });
      expect(testValue).toBe(66);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('unsubscribing works correctly', () => {
      const { subscribeToState, readState, setState } = composeMedama(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 } }
      );

      expect(readState((state) => ({ a: { ...state.a }, b: { ...state.b } }))).toEqual({
        a: { foo: 10 },
        b: { bar: 20 },
      });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value;

        return subscription;
      });

      const { unsubscribe } = subscribeToState(({ a, b }) => a.foo + b.bar, subscriptionWithInit);
      expect(testValue).toBe(30);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: { foo: 100 } });
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
      setState({ a: { foo: 50 } });
      expect(testValue).toBe(123);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);
    });

    test('resubscribing after unsubscribing works correctly', () => {
      const { subscribeToState, readState, setState } = composeMedama(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 } }
      );

      expect(readState((state) => ({ a: { ...state.a }, b: { ...state.b } }))).toEqual({
        a: { foo: 10 },
        b: { bar: 20 },
      });

      let testValue: number | undefined;

      const subscription = jest.fn((value: number) => {
        testValue = value + 3;
      });

      const subscriptionWithInit = jest.fn((value: number) => {
        testValue = value;

        return subscription;
      });

      const { unsubscribe, resubscribe } = subscribeToState(
        ({ a, b }) => a.foo + b.bar,
        subscriptionWithInit
      );

      expect(testValue).toBe(30);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ a: { foo: 100 } });
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
      setState({ a: { foo: 50 } });
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
      setState({ a: { foo: 25 } });
      expect(testValue).toBe(135);
      expect(nextSubscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(nextSubscription).toHaveBeenCalledTimes(1);
    });

    test('transferring after unsubscribing works correctly', () => {
      type State = {
        a: { foo: number };
        b: { bar: number };
      };

      const { subscribeToState, readState, setState } = composeMedama<State>(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 } }
      );

      expect(readState((state) => ({ a: { ...state.a }, b: { ...state.b } }))).toEqual({
        a: { foo: 10 },
        b: { bar: 20 },
      });

      const selector1 = jest.fn(({ a, b }: State) => a.foo + b.bar);

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

      setState({ a: { foo: 100 } });
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

      setState({ a: { foo: 50 } });
      expect(testValue).toBe(123);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      const selector2 = jest.fn(({ a }: State) => a.foo);

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

      setState({ a: { foo: 25 } });
      expect(testValue).toBe(28);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];

      setState({ b: { bar: 30 } });
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

      setState({ a: { foo: 200 } });
      expect(testValue).toBe(28);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);
    });

    test('multiple subscriptions with different selectors work correctly', () => {
      type State = {
        a: Record<string, number>;
        b: Record<string, number>;
        c: Record<string, number>;
      };

      const { subscribeToState, readState, setState } = composeMedama<State>(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } }
      );

      expect(
        readState((state) => ({ a: { ...state.a }, b: { ...state.b }, c: { ...state.c } }))
      ).toEqual({ a: { foo: 10 }, b: { bar: 20 }, c: { baz: 30 } });

      const selector1 = jest.fn((state: State) => state.a.foo);

      let testValue1: number | undefined;

      const subscription1 = jest.fn((value: number) => {
        testValue1 = value + 3;
      });

      const subscriptionWithInit1 = jest.fn((value: number) => {
        testValue1 = value;

        return subscription1;
      });

      const subscribeReturn1 = subscribeToState(selector1, subscriptionWithInit1);
      expect(testValue1).toBe(10);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscriptionWithInit1.mock.calls = [];
      subscription1.mock.calls = [];

      setState({ a: { foo: 100 } });
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

      const selector2 = jest.fn((state: State) => state.b.bar);

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

      const subscribeReturn2 = subscribeToState(
        ({ a, b, c }) => a.foo + b.bar + c.baz,
        subscriptionWithInit2
      );

      expect(testValue2).toBe(147);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      nextSubscriptionWithInit1.mock.calls = [];
      nextSubscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscription2.mock.calls = [];

      setState({ a: { foo: 15 }, b: { bar: 25 }, c: { qux: 2 } });
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

      setState({ c: { qux: 12 } });
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

      setState({ c: { baz: 4 } });
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

      setState({ c: { baz: 50 } });
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

      setState({ b: { bar: 100 } });
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

      setState({ a: { foo: 1 }, b: { bar: 2 }, c: { baz: 3, qux: 4 } });
      expect(testValue1).toBe(200);
      expect(testValue2).toBe(49);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(nextSubscriptionWithInit1).toHaveBeenCalledTimes(0);
      expect(nextSubscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
    });

    test('change of multiple records of the state triggers subscription once', () => {
      const { subscribeToState, setState } = composeMedama<{
        a: { foo: number; qux: string };
        3: { bar: object };
        [symbKey]: { baz: string };
      }>({ a: createMedama(), 3: createMedama(), [symbKey]: createMedama() });

      const subscription1 = jest.fn(() => {});

      const { resubscribe, unsubscribe } = subscribeToState((state) => {
        state.a.foo;
        state[3].bar;
        state[symbKey].baz;
      }, subscription1);

      expect(subscription1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      setState({ a: { foo: 1, qux: 'so' }, 3: { bar: { quux: 3 } }, [symbKey]: { baz: 'abc' } });
      expect(subscription1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      setState({ a: { foo: 2, qux: 'less' }, 3: { bar: {} }, [symbKey]: { baz: 'xyz' } });
      expect(subscription1).toHaveBeenCalledTimes(1);

      const subscription2 = jest.fn(() => {});

      subscription1.mock.calls = [];
      resubscribe(subscription2);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState({ a: { foo: 8, qux: 'zzz' }, 3: { bar: { quux: 'ty' } }, [symbKey]: { baz: 'no' } });
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      unsubscribe();

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState({ a: { foo: 66, qux: 'top' }, 3: { bar: {} }, [symbKey]: { baz: 'yes' } });
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);
    });

    test('change of the state with identical primitives does not trigger subscriber', () => {
      const { subscribeToState, readState, setState } = composeMedama<{
        1: Record<string, unknown>;
        2: Record<string, unknown>;
      }>({ 1: createMedama(), 2: createMedama() }, { 1: { a: 1 }, 2: { b: 2 } });

      const subscription = jest.fn(() => {});
      const subscriptionWithInit = jest.fn(() => subscription);

      subscribeToState((s) => ({ ...s[1], ...s[2] }), subscriptionWithInit);
      expect(subscriptionWithInit).toHaveBeenCalledTimes(1);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ 1: { a: 2 }, 2: { b: 3 } });
      expect(readState((state) => ({ ...state[1], ...state[2] }))).toEqual({
        a: 2,
        b: 3,
      });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ 1: { a: 2 }, 2: { b: 3 } });
      expect(readState((state) => ({ ...state[1], ...state[2] }))).toEqual({
        a: 2,
        b: 3,
      });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(0);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ 1: { a: {} }, 2: { b: {} } });
      expect(readState((state) => ({ ...state[1], ...state[2] }))).toEqual({
        a: {},
        b: {},
      });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ 1: { a: {} } });
      expect(readState((state) => ({ ...state[1], ...state[2] }))).toEqual({
        a: {},
        b: {},
      });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);

      subscriptionWithInit.mock.calls = [];
      subscription.mock.calls = [];
      setState({ 2: { b: {} } });
      expect(readState((state) => ({ ...state[1], ...state[2] }))).toEqual({
        a: {},
        b: {},
      });
      expect(subscriptionWithInit).toHaveBeenCalledTimes(0);
      expect(subscription).toHaveBeenCalledTimes(1);
    });

    test('extracted state object will not allow to read state outside the selector', () => {
      const { readState, setState, subscribeToState } = composeMedama(
        { 1: createMedama(), 2: createMedama() },
        { 1: { a: 1 }, 2: { b: -1 } }
      );

      setState({ 1: { a: 100 } });
      expect(readState((s) => s[1].a)).toBe(100);

      const stateHandler1 = readState((s) => s[1]);
      expect(() => stateHandler1.a).toThrow(/Medama Error/);

      let stateHandler2: { 1: { a: number }; 2: { b: number } } | undefined;
      let state: { 1: { a: number }; 2: { b: number } };

      subscribeToState(
        (s) => {
          stateHandler2 = s;

          return { 1: { ...s[1] }, 2: { ...s[2] } };
        },

        (v) => {
          state = v;
        }
      );
      expect(stateHandler2).toBeDefined();
      expect(() => stateHandler2![1]).toBeDefined();
      expect(() => stateHandler2![1].a).toThrow(/Medama Error/);
      expect(() => stateHandler2![2]).toBeDefined();
      expect(() => stateHandler2![2].b).toThrow(/Medama Error/);
      expect(state!).toEqual({ 1: { a: 100 }, 2: { b: -1 } });
    });

    test("selectors after unsubscribing won't run", () => {
      type State = { 1: { a: number }; 2: { b: number } };

      const { setState, subscribeToState } = composeMedama<State>(
        { 1: createMedama(), 2: createMedama() },
        { 1: { a: 1 }, 2: { b: -1 } }
      );

      const selector1 = jest.fn(({ 1: { a }, 2: { b } }: State) => ({ a, b }));
      const selector2 = jest.fn(({ 1: { a }, 2: { b } }: State) => ({ a: a + 10, b: b - 10 }));

      const { unsubscribe, resubscribe, transfer } = subscribeToState(selector1, () => {});
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      setState({ 1: { a: 100 }, 2: { b: -100 } });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      setState({ 1: { a: 100 } });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ 1: { a: 100 }, 2: { b: -100 } });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ 1: { a: 200 } });
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
      setState({ 1: { a: 300 } });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe(() => {});
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ 2: { b: -400 } });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe();
      setState({ 1: { a: -100 } });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      transfer(selector1);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ 2: { b: 0 } });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('multiple subscriptions to one selector will run it once', () => {
      type State = { 1: { a: number }; 2: { b: number } };

      const { setState, subscribeToState } = composeMedama<State>(
        { 1: createMedama(), 2: createMedama() },
        { 1: { a: 1 }, 2: { b: -1 } }
      );

      const selector1 = jest.fn(({ 1: { a }, 2: { b } }: State) => ({ newA: a, newB: b }));

      const selector2 = jest.fn(({ 1: { a }, 2: { b } }: State) => ({
        newA: a * 10,
        newB: b * 10,
      }));

      let testValue1!: { newA: number; newB: number };
      let testValue2!: { newA: number; newB: number };

      const { unsubscribe: unsubscribe1, transfer } = subscribeToState(selector1, (v) => {
        testValue1 = v;
      });

      expect(testValue1).toEqual({ newA: 1, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      const { unsubscribe: unsubscribe2, resubscribe } = subscribeToState(selector1, (v) => {
        testValue2 = v;
      });

      expect(testValue2).toEqual({ newA: 1, newB: -1 });
      expect(testValue2).toBe(testValue1);
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ 1: { a: 100 } });
      expect(testValue1).toEqual({ newA: 100, newB: -1 });
      expect(testValue1).toBe(testValue2);
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      transfer(selector2);
      expect(testValue1).toEqual({ newA: 1000, newB: -10 });
      expect(testValue2).toEqual({ newA: 100, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ 1: { a: 2 } });
      expect(testValue1).toEqual({ newA: 20, newB: -10 });
      expect(testValue2).toEqual({ newA: 2, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe1();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ 2: { b: -200 } });
      expect(testValue1).toEqual({ newA: 20, newB: -10 });
      expect(testValue2).toEqual({ newA: 2, newB: -200 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe2();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ 1: { a: 300 } });
      expect(testValue1).toEqual({ newA: 20, newB: -10 });
      expect(testValue2).toEqual({ newA: 2, newB: -200 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe((v) => {
        testValue1 = v;
      });
      expect(testValue1).toEqual({ newA: 300, newB: -200 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe((v) => {
        testValue2 = v;
      });
      expect(testValue1).toEqual({ newA: 300, newB: -200 });
      expect(testValue2).toBe(testValue1);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ 2: { b: -400 } });
      expect(testValue1).toEqual({ newA: 300, newB: -200 });
      expect(testValue2).toEqual({ newA: 300, newB: -400 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('subscription of one job to multiple selectors works correctly', () => {
      type State = { 1: { a: number }; 2: { b: number; c: string } };

      const { setState, subscribeToState } = composeMedama<State>(
        { 1: createMedama(), 2: createMedama() },
        { 1: { a: 1 }, 2: { b: -1, c: 'go' } }
      );

      let testValue!: string;

      const subscription = jest.fn((v: string) => {
        testValue = v;
      });

      const selector1 = jest.fn(({ 1: { a }, 2: { b } }: State) => `${a} ${b}`);
      const { unsubscribe: unsubscribe1 } = subscribeToState(selector1, subscription);

      expect(testValue).toBe('1 -1');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      setState({ 1: { a: 2 } });
      expect(testValue).toBe('2 -1');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      setState({ 2: { b: -2, c: 'stop' } });
      expect(testValue).toBe('2 -2');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn(({ 1: { a }, 2: { b, c } }: State) => `${a} ${b} ${c}`);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      const { unsubscribe: unsubscribe2 } = subscribeToState(selector2, subscription);

      expect(testValue).toBe('2 -2 stop');
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState({ 1: { a: 100 } });
      expect(testValue).toEqual('100 -2 stop');
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);

      subscription.mock.calls = [];
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState({ 1: { a: 20 }, 2: { b: -20, c: 'yes' } });
      expect(testValue).toEqual('20 -20 yes');
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
      setState({ 2: { b: -40 } });
      expect(testValue).toEqual('20 -40');
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
      setState({ 1: { a: 300 } });
      expect(testValue).toEqual('20 -40');
      expect(subscription).toHaveBeenCalledTimes(0);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('`readState` will not recalculate known selector', () => {
      type State = { 1: { a: number }; 2: { b: number } };

      const { readState, setState, subscribeToState } = composeMedama<State>(
        { 1: createMedama(), 2: createMedama() },
        { 1: { a: 1 }, 2: { b: -1 } }
      );

      const selector1 = jest.fn(({ 1: { a }, 2: { b } }: State) => ({ newA: a, newB: b }));

      const selector2 = jest.fn(({ 1: { a }, 2: { b } }: State) => ({
        newA: a * 10,
        newB: b * 10,
      }));

      let testValue: { newA: number; newB: number } | undefined;

      const { unsubscribe, resubscribe, transfer } = subscribeToState(selector1, (v) => {
        testValue = v;
      });

      expect(testValue).toEqual({ newA: 1, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 1, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ 1: { a: 100 } });
      expect(testValue).toEqual({ newA: 100, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 100, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      unsubscribe();
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 100, newB: -1 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      setState({ 2: { b: -200 } });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 100, newB: -200 });
      expect(selector1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];

      testValue = undefined;
      resubscribe((v) => {
        testValue = v;
      });
      expect(testValue).toEqual({ newA: 100, newB: -200 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: 100, newB: -200 });
      expect(selector1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];

      transfer(selector2);
      expect(testValue).toEqual({ newA: 1000, newB: -2000 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ 1: { a: -10 } });
      expect(testValue).toEqual({ newA: -100, newB: -2000 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];

      expect(readState(selector1)).toEqual({ newA: -10, newB: -200 });
      expect(readState(selector2)).toEqual({ newA: -100, newB: -2000 });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
    });

    test('`subscribeToState` will not recalculate the selector after `readState` is called first', () => {
      type State = { 1: { a: number }; 2: { b: number } };

      const { readState, setState, subscribeToState } = composeMedama<State>(
        { 1: createMedama(), 2: createMedama() },
        { 1: { a: 1 }, 2: { b: -1 } }
      );

      const selector = jest.fn(({ 1: { a }, 2: { b } }: State) => ({ newA: a, newB: b }));

      expect(readState(selector)).toEqual({ newA: 1, newB: -1 });
      expect(selector).toHaveBeenCalledTimes(1);

      let testValue: { newA: number } | undefined;

      selector.mock.calls = [];
      subscribeToState(selector, (v) => {
        testValue = v;
      });
      expect(testValue).toEqual({ newA: 1, newB: -1 });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];
      setState({ 1: { a: 100 } });
      expect(testValue).toEqual({ newA: 100, newB: -1 });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('selector in subsequent calling `readState` works correctly', () => {
      type State = { a: { foo: number } };

      const { readState, setState } = composeMedama<State>(
        { a: createMedama() },
        { a: { foo: 1 } }
      );

      const selector = jest.fn(({ a: { foo } }: State) => ({ newFoo: foo }));

      expect(readState(selector)).toEqual({ newFoo: 1 });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      expect(readState(selector)).toEqual({ newFoo: 1 });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];
      setState({ a: { foo: 100 } });
      expect(readState(selector)).toEqual({ newFoo: 100 });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('not initialized values are `undefined`', () => {
      type State = { a: { foo: number; bar: number }; b: { baz: string } };

      const { readState, setState } = composeMedama<State>(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 1 } }
      );

      const selector = jest.fn(({ a: { foo, bar }, b: { baz } }: State) => ({
        newFoo: foo,
        newBar: bar,
        newBaz: baz,
      }));

      expect(readState(selector)).toEqual({ newFoo: 1, newBar: undefined, newBaz: undefined });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      setState({ b: { baz: 'go' } });
      expect(readState(selector)).toEqual({ newFoo: 1, newBar: undefined, newBaz: 'go' });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      setState({ a: { foo: 100, bar: 200 } });
      expect(readState(selector)).toEqual({ newFoo: 100, newBar: 200, newBaz: 'go' });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('updating not initialized values triggers subscriptions', () => {
      type State = { a: { foo: number; bar: number }; b: { baz: string } };

      const { setState, subscribeToState } = composeMedama<State>(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 1 } }
      );

      const selector = jest.fn(({ a: { foo, bar }, b: { baz } }: State) => ({
        newFoo: foo,
        newBar: bar,
        newBaz: baz,
      }));

      let testValue: { newFoo: number; newBar: number; newBaz: string } | undefined;

      subscribeToState(selector, (v) => {
        testValue = v;
      });
      expect(testValue).toEqual({ newFoo: 1, newBar: undefined, newBaz: undefined });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      setState({ b: { baz: 'go' } });
      expect(testValue).toEqual({ newFoo: 1, newBar: undefined, newBaz: 'go' });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];
      setState({ a: { foo: 100, bar: 200 } });
      expect(testValue).toEqual({ newFoo: 100, newBar: 200, newBaz: 'go' });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('selector remember its dependent state keys', () => {
      type State = { a: { foo: number; bar: number }; b: { baz: number } };

      const { setState, subscribeToState } = composeMedama<State>(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 1, bar: 20 }, b: { baz: 300 } }
      );

      let selectorFirstRun = true;

      const selector = jest.fn((state: State) => [
        selectorFirstRun ? { a: { ...state.a }, b: { ...state.b } } : state.a.foo,
        (selectorFirstRun = false),
      ]);

      const { unsubscribe } = subscribeToState(selector, () => {});

      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ a: { foo: 2 } });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ a: { bar: 30 } });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ b: { baz: 400 } });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      unsubscribe();
      setState({ a: { foo: 3 } });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];

      setState({ a: { bar: 40 } });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];

      setState({ b: { baz: 500 } });
      expect(selector).toHaveBeenCalledTimes(0);

      selector.mock.calls = [];

      subscribeToState(selector, () => {});
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ a: { foo: 4 } });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ a: { bar: 50 } });
      expect(selector).toHaveBeenCalledTimes(1);

      selector.mock.calls = [];

      setState({ b: { baz: 600 } });
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('verify return object of composeMedama and pupil reference the same object', () => {
      const medama = composeMedama(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 1, bar: 20 }, b: { baz: 300 } }
      );

      expect(medama).toBe(medama.pupil);
    });

    test('readState inside subscription job returns updated selector values', () => {
      type State = { foo: { a: number; b: number } };

      const { subscribeToState, setState, readState } = composeMedama(
        { foo: createMedama() },
        { foo: { a: 1, b: 20 } }
      );

      const selector1 = jest.fn(({ foo: { a, b } }: State) => ({ a, b }));

      expect(readState(selector1)).toEqual({ a: 1, b: 20 });
      expect(selector1).toHaveBeenCalledTimes(1);

      let testValue1!: object;

      const subscription1 = jest.fn((v: State['foo']) => {
        testValue1 = v;
      });

      selector1.mock.calls = [];

      subscribeToState(selector1, subscription1);
      expect(testValue1).toEqual({ a: 1, b: 20 });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn(({ foo: { a } }: State) => a);

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

      setState({ foo: { b: 30 } });
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

      setState({ foo: { a: 4 } });
      expect(testValue1).toEqual({ a: 4, b: 30 });
      expect(testValue2).toEqual(4);
      expect(testValue3).toEqual(4);
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);
      expect(subscription3).toHaveBeenCalledTimes(1);
    });

    test('self-firing is allowed in composition', () => {
      const { setState, subscribeToState } = composeMedama(
        { a: createMedama() },
        { a: { b: 500 } }
      );

      let testValue: number[] = [];

      const { resubscribe, transfer } = subscribeToState(
        ({ a: { b } }) => b,

        () => (v) => {
          testValue.push(v);

          if (v === 0) return;

          setState({ a: { b: v - 1 } });
        }
      );

      expect(testValue).toEqual([]);

      setState({ a: { b: 5 } });
      expect(testValue).toEqual([5, 4, 3, 2, 1, 0]);

      testValue = [];
      resubscribe((v) => {
        testValue.push(v);

        if (v === 5) return;

        setState({ a: { b: v + 1 } });
      });
      expect(testValue).toEqual([0, 1, 2, 3, 4, 5]);

      testValue = [];
      transfer(({ a: { b } }) => Math.floor(b / 2));
      expect(testValue).toEqual([2, 1, 1]);
    });
  });
};
