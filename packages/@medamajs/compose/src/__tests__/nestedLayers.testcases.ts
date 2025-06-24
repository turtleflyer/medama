/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createMedama } from 'medama';
import type { ComposeMedama, CompositePupil, CompositeState, IsComposite } from '..';
import type {
  CStateG,
  LayerPupilsPreventInference,
  RevealLayersInStateRecursively,
} from '../auxiliaryTypes';

export const compositeMedamaWithNestedLayers = (
  composeMedama: ComposeMedama,
  isComposite: IsComposite
) => {
  const symbKey = Symbol('symbKey');

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
  ])('medama layers test cases with nested layers (%s)', (_name, composeMedama) => {
    test('`readState` works correctly', () => {
      const { readState, pupil } = composeMedama(
        {
          a: composeMedama({
            10: createMedama(),
            foo: createMedama(),
            [symbKey]: createMedama(),
          }),

          1: composeMedama({ 3: createMedama() }),
          [symbKey]: createMedama(),
        },

        {
          a: {
            10: { bar: 100 },
            foo: { [symbKey]: 300 },
            [symbKey]: { 15: 'go' },
          },

          1: { 3: { [symbKey]: 20, 22: 'twenty two' } },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const selector = jest.fn(
        ({
          a: {
            10: { bar },
            foo: { [symbKey]: symb1 },
          },

          1: {
            3: { [symbKey]: symb2 },
          },

          [symbKey]: { no },
        }: State) => bar + symb1 + symb2 + no
      );

      expect(readState(selector)).toEqual('420right');
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('`setState` works correctly in pair with readState', () => {
      const { setState, readState, pupil } = composeMedama(
        {
          a: composeMedama({
            10: composeMedama({ bar: createMedama(), baz: createMedama() }).pupil,
            foo: createMedama(),
            [symbKey]: createMedama(),
          }),

          1: createMedama(),
          [symbKey]: composeMedama({ no: createMedama(), yes: createMedama() }),
        },

        {
          a: {
            10: { bar: { a: 100, b: 'low' }, baz: { c: 'zzz' } },
            foo: { [symbKey]: 300 },
            [symbKey]: { 15: 'go' },
          },

          1: { [symbKey]: 20, 2: { qux: 'twenty', quux: 333 } },
          [symbKey]: { no: { go: 'right', back: 444 }, yes: { drop: false } },
        }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const fooSelector = jest.fn((state: State) => ({ ...state.a.foo }));

      expect(setState({ a: { foo: { [symbKey]: 500 } } })).toEqual({
        a: { foo: { [symbKey]: 500 } },
      });
      expect(readState(fooSelector)).toEqual({ [symbKey]: 500 });
      expect(fooSelector).toHaveBeenCalledTimes(1);

      const barSelector = jest.fn((state: State) => ({ ...state.a[10].bar }));

      fooSelector.mock.calls = [];
      expect(setState({ a: { 10: { bar: { b: 'high' } } } })).toEqual({
        a: { 10: { bar: { b: 'high' } } },
      });
      expect(readState(barSelector)).toEqual({ a: 100, b: 'high' });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(1);

      const fullSelector = jest.fn((state: State) => ({
        a: {
          10: { bar: { ...state.a[10].bar }, baz: { ...state.a[10].baz } },
          foo: { ...state.a.foo },
          [symbKey]: { ...state.a[symbKey] },
        },

        1: { ...state[1] },
        [symbKey]: { no: { ...state[symbKey].no }, yes: { ...state[symbKey].yes } },
      }));

      fooSelector.mock.calls = [];
      barSelector.mock.calls = [];
      expect(
        setState({
          a: { 10: { baz: { c: 'yyy' } } },
          1: { 2: { qux: 'three', quux: 400 } },
          [symbKey]: { no: { go: 'left' } },
        })
      ).toEqual({
        a: { 10: { baz: { c: 'yyy' } } },
        1: { 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left' } },
      });
      expect(readState(fullSelector)).toEqual({
        a: {
          10: { bar: { a: 100, b: 'high' }, baz: { c: 'yyy' } },
          foo: { [symbKey]: 500 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left', back: 444 }, yes: { drop: false } },
      });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(0);
      expect(fullSelector).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      () => setState({ 1: { 2: { qux: 'three' } } });

      fooSelector.mock.calls = [];
      barSelector.mock.calls = [];
      fullSelector.mock.calls = [];
      expect(
        setState(
          ({
            a: {
              foo: { [symbKey]: sk },
            },
            1: {
              2: { qux, quux },
            },
            [symbKey]: {
              no: { go },
            },
          }) => ({
            a: { 10: { baz: { c: qux + ' to ' + go } } },
            [symbKey]: { no: { back: sk - quux } },
          })
        )
      ).toEqual({
        a: { 10: { baz: { c: 'three to left' } } },
        [symbKey]: { no: { back: 100 } },
      });
      expect(readState(fullSelector)).toEqual({
        a: {
          10: { bar: { a: 100, b: 'high' }, baz: { c: 'three to left' } },
          foo: { [symbKey]: 500 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left', back: 100 }, yes: { drop: false } },
      });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(0);
      expect(fullSelector).toHaveBeenCalledTimes(1);
    });

    test('subscribe to state works correctly', () => {
      const { subscribeToState, setState, readState, pupil } = composeMedama(
        {
          a: composeMedama({ aa: createMedama() }),
          b: composeMedama({ bb: createMedama() }),
          c: composeMedama({ cc: composeMedama({ ccc: createMedama() }) }),
        },

        { a: { aa: { aaa: 1 } }, b: { bb: { bbb: 10 } }, c: { cc: { ccc: { c1: 2, c2: 3 } } } }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const selector1 = jest.fn(
        (state: State) =>
          ({
            a: { aa: { ...state.a.aa } },
            b: { bb: { ...state.b.bb } },
            c: { cc: { ccc: { ...state.c.cc.ccc } } },
          }) as object
      );

      expect(readState(selector1)).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);

      let testValue1!: object;

      const subscription1 = jest.fn((v: object) => {
        testValue1 = v;
      });

      selector1.mock.calls = [];

      const { unsubscribe, resubscribe, transfer } = subscribeToState(selector1, subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState({ a: { aa: { aaa: 2 } }, b: { bb: { bbb: 20 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 2 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState({ a: { aa: { aaa: 2 } }, b: { bb: { bbb: 20 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 2 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState({ a: { aa: { aaa: 4 } }, c: { cc: { ccc: { c1: 5, c2: 6 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState({ a: { aa: { aaa: 4 } }, c: { cc: { ccc: { c1: 5, c2: 6 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);

      let testValue2_1!: object;
      let testValue2_2: object | undefined;
      const subscriptionJob2 = jest.fn((v: object) => {
        testValue2_2 = v;
      });
      const subscriptionWithInit2 = jest.fn((v: object) => {
        testValue2_1 = v;

        return subscriptionJob2;
      });

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      resubscribe(subscriptionWithInit2);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_2).toBe(undefined);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(1);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState({ a: { aa: { aaa: 50 } }, c: { cc: { ccc: { c1: 8, c2: 17 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 50 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn((state: State) => ({
        _a: { aa: { ...state.a.aa } },
        _c: { cc: { ccc: { ...state.c.cc.ccc } } },
      }));

      selector1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      transfer(selector2);
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: 50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState({ a: { aa: { aaa: -50 } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState({ b: { bb: { bbb: -100 } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      unsubscribe();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState({ c: { cc: { ccc: { c2: 111 } } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      let testValue3_1!: object;
      let testValue3_2: object | undefined;
      const subscriptionJob3 = jest.fn((v: object) => {
        testValue3_2 = v;
      });
      const subscriptionWithInit3 = jest.fn((v: object) => {
        testValue3_1 = v;

        return subscriptionJob3;
      });

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      resubscribe(subscriptionWithInit3);
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(testValue3_1).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 111 } } },
      });
      expect(testValue3_2).toBe(undefined);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(1);
      expect(subscriptionJob3).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      setState({ c: { cc: { ccc: { c2: 88 } } } });
      expect(testValue3_1).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 111 } } },
      });
      expect(testValue3_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 88 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(0);
      expect(subscriptionJob3).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      unsubscribe();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(0);
      expect(subscriptionJob3).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      transfer(selector1);
      expect(testValue3_2).toEqual({
        a: { aa: { aaa: -50 } },
        b: { bb: { bbb: -100 } },
        c: { cc: { ccc: { c1: 8, c2: 88 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(0);
      expect(subscriptionJob3).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      setState({ b: { bb: { bbb: 7 } } });
      expect(testValue3_2).toEqual({
        a: { aa: { aaa: -50 } },
        b: { bb: { bbb: 7 } },
        c: { cc: { ccc: { c1: 8, c2: 88 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(0);
      expect(subscriptionJob3).toHaveBeenCalledTimes(1);
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

    test('cross-layer firing by subscription job works in composition', () => {
      const { subscribeToState, setState, readState, pupil } = composeMedama(
        {
          a: composeMedama({ aa: createMedama() }),
          b: composeMedama({ bb: createMedama() }),
          c: composeMedama({ cc: composeMedama({ ccc: createMedama() }) }),
        },

        { a: { aa: { aaa: 1 } }, b: { bb: { bbb: 10 } }, c: { cc: { ccc: { c1: 2, c2: 3 } } } }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const selector1_1 = jest.fn(
        (state: State) =>
          ({
            a: { aa: { ...state.a.aa } },
            c: { cc: { ccc: { ...state.c.cc.ccc } } },
          }) as object
      );

      expect(readState(selector1_1)).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn(
        (state: State) =>
          ({
            a: { aa: { ...state.a.aa } },
            b: { bb: { ...state.b.bb } },
          }) as object
      );

      expect(readState(selector2)).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector2).toHaveBeenCalledTimes(1);

      let testValue1!: object;
      const subscription1 = jest.fn((v: object) => {
        testValue1 = v;
      });

      let testValue2!: object;
      const subscription2 = jest.fn((v: object) => {
        testValue2 = v;

        setState(
          ({
            c: {
              cc: {
                ccc: { c1 },
              },
            },
          }) => ({ c: { cc: { ccc: { c1: c1 + 1 } } } })
        );
      });

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      const {
        unsubscribe: unsubscribe1,
        resubscribe: resubscribe1,
        transfer: transfer1,
      } = subscribeToState(selector1_1, subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      const { unsubscribe: unsubscribe2, resubscribe: resubscribe2 } = subscribeToState(
        selector2,
        subscription2
      );
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 3, c2: 3 } } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ c: { cc: { ccc: { c2: 111 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 3, c2: 111 } } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ b: { bb: { bbb: 100 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 4, c2: 111 } } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 100 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: { aa: { aaa: 15 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 5, c2: 111 } } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 100 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(2);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(2);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe1();
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ b: { bb: { bbb: 200 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 5, c2: 111 } } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 200 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe1(subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 6, c2: 111 } } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 200 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      setState({ b: { bb: { bbb: 300 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 7, c2: 111 } } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 300 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);

      const selector1_2 = jest.fn(
        (state: State) =>
          ({
            _a: { aa: { ...state.a.aa } },
          }) as object
      );

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      transfer1(selector1_2);
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 15 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState({ a: { aa: { aaa: 300 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: 300 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState({ b: { bb: { bbb: -7 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState({ c: { cc: { ccc: { c2: 800 } } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe2();
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState({ b: { bb: { bbb: 400 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      resubscribe2(subscription2);
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: 400 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2).toHaveBeenCalledTimes(1);
    });

    test('`readState` works correctly after manipulating with layers', () => {
      const { addLayers } = composeMedama(
        {
          1: createMedama(),
          [symbKey]: createMedama(),
        },

        {
          1: { [symbKey]: 20, 2: 'twenty' },
          [symbKey]: { no: 'right', yes: false },
        }
      );

      const {
        readState: readState1,
        deleteLayers,
        pupil,
      } = addLayers(
        {
          a: composeMedama({
            10: createMedama(),
            foo: createMedama(),
            [symbKey]: createMedama(),
          }),
        },
        {
          a: {
            10: { bar: 100 },
            foo: { [symbKey]: 300 },
            [symbKey]: { 15: 'go' },
          },
        }
      );

      type StateWithAddedLayers = typeof pupil extends CompositePupil<infer S> ? S : never;

      const selector = jest.fn(
        ({
          a: {
            10: { bar },
            foo: { [symbKey]: symb1 },
          },

          1: { [symbKey]: symb2 },
          [symbKey]: { no },
        }: Omit<StateWithAddedLayers, '1'> & { 1: { [symbKey]: number } }) =>
          bar + symb1 + symb2 + no
      );

      expect(readState1(selector)).toEqual('420right');
      expect(selector).toHaveBeenCalledTimes(1);

      const { readState: readState2 } = deleteLayers(1).addLayers(
        { 1: createMedama() },
        { 1: { [symbKey]: 150 } }
      );

      selector.mock.calls = [];
      expect(readState2(selector)).toEqual('550right');
      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('`setState` works correctly in pair with readState after manipulating with layers', () => {
      const { addLayers } = composeMedama(
        {
          1: createMedama(),
          [symbKey]: composeMedama({ no: createMedama(), yes: createMedama() }),
        },

        {
          1: { [symbKey]: 20, 2: { qux: 'twenty', quux: 333 } },
          [symbKey]: { no: { go: 'right', back: 444 }, yes: { drop: false } },
        }
      );

      const {
        readState: readState1,
        setState: setState1,
        pupil,
        deleteLayers,
      } = addLayers(
        {
          a: composeMedama({
            10: composeMedama({ bar: createMedama(), baz: createMedama() }).pupil,
            foo: createMedama(),
            [symbKey]: createMedama(),
          }),
        },

        {
          a: {
            10: { bar: { a: 100, b: 'low' }, baz: { c: 'zzz' } },
            foo: { [symbKey]: 300 },
            [symbKey]: { 15: 'go' },
          },
        }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const fooSelector = jest.fn((state: State) => ({ ...state.a.foo }));

      expect(setState1({ a: { foo: { [symbKey]: 500 } } })).toEqual({
        a: { foo: { [symbKey]: 500 } },
      });
      expect(readState1(fooSelector)).toEqual({ [symbKey]: 500 });
      expect(fooSelector).toHaveBeenCalledTimes(1);

      const barSelector = jest.fn((state: State) => ({ ...state.a[10].bar }));

      fooSelector.mock.calls = [];
      expect(setState1({ a: { 10: { bar: { b: 'high' } } } })).toEqual({
        a: { 10: { bar: { b: 'high' } } },
      });
      expect(readState1(barSelector)).toEqual({ a: 100, b: 'high' });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(1);

      const fullSelector = jest.fn((state: State) => ({
        a: {
          10: { bar: { ...state.a[10].bar }, baz: { ...state.a[10].baz } },
          foo: { ...state.a.foo },
          [symbKey]: { ...state.a[symbKey] },
        },

        1: { ...state[1] },
        [symbKey]: { no: { ...state[symbKey].no }, yes: { ...state[symbKey].yes } },
      }));

      fooSelector.mock.calls = [];
      barSelector.mock.calls = [];
      expect(
        setState1({
          a: { 10: { baz: { c: 'yyy' } } },
          1: { 2: { qux: 'three', quux: 400 } },
          [symbKey]: { no: { go: 'left' } },
        })
      ).toEqual({
        a: { 10: { baz: { c: 'yyy' } } },
        1: { 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left' } },
      });
      expect(readState1(fullSelector)).toEqual({
        a: {
          10: { bar: { a: 100, b: 'high' }, baz: { c: 'yyy' } },
          foo: { [symbKey]: 500 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left', back: 444 }, yes: { drop: false } },
      });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(0);
      expect(fullSelector).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      () => setState1({ 1: { 2: { qux: 'three' } } });

      fooSelector.mock.calls = [];
      barSelector.mock.calls = [];
      fullSelector.mock.calls = [];
      expect(
        setState1(
          ({
            a: {
              foo: { [symbKey]: sk },
            },
            1: {
              2: { qux, quux },
            },
            [symbKey]: {
              no: { go },
            },
          }) => ({
            a: { 10: { baz: { c: qux + ' to ' + go } } },
            [symbKey]: { no: { back: sk - quux } },
          })
        )
      ).toEqual({
        a: { 10: { baz: { c: 'three to left' } } },
        [symbKey]: { no: { back: 100 } },
      });
      expect(readState1(fullSelector)).toEqual({
        a: {
          10: { bar: { a: 100, b: 'high' }, baz: { c: 'three to left' } },
          foo: { [symbKey]: 500 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left', back: 100 }, yes: { drop: false } },
      });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(0);
      expect(fullSelector).toHaveBeenCalledTimes(1);

      const { readState: readState2, setState: setState2 } = deleteLayers(1).addLayers(
        { 1: createMedama() },
        { 1: { [symbKey]: 20, 2: { qux: 'twenty', quux: 333 } } }
      );

      setState2({
        a: {
          10: { bar: { a: 100, b: 'low' }, baz: { c: 'zzz' } },
          foo: { [symbKey]: 300 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'twenty', quux: 333 } },
        [symbKey]: { no: { go: 'right', back: 444 }, yes: { drop: false } },
      });

      fooSelector.mock.calls = [];
      expect(setState2({ a: { foo: { [symbKey]: 500 } } })).toEqual({
        a: { foo: { [symbKey]: 500 } },
      });
      expect(readState2(fooSelector)).toEqual({ [symbKey]: 500 });
      expect(fooSelector).toHaveBeenCalledTimes(1);

      fooSelector.mock.calls = [];
      barSelector.mock.calls = [];
      expect(setState2({ a: { 10: { bar: { b: 'high' } } } })).toEqual({
        a: { 10: { bar: { b: 'high' } } },
      });
      expect(readState2(barSelector)).toEqual({ a: 100, b: 'high' });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(1);

      fooSelector.mock.calls = [];
      barSelector.mock.calls = [];
      fullSelector.mock.calls = [];
      expect(
        setState2({
          a: { 10: { baz: { c: 'yyy' } } },
          1: { 2: { qux: 'three', quux: 400 } },
          [symbKey]: { no: { go: 'left' } },
        })
      ).toEqual({
        a: { 10: { baz: { c: 'yyy' } } },
        1: { 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left' } },
      });
      expect(readState2(fullSelector)).toEqual({
        a: {
          10: { bar: { a: 100, b: 'high' }, baz: { c: 'yyy' } },
          foo: { [symbKey]: 500 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left', back: 444 }, yes: { drop: false } },
      });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(0);
      expect(fullSelector).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      () => setState2({ 1: { 2: { qux: 'three' } } });

      fooSelector.mock.calls = [];
      barSelector.mock.calls = [];
      fullSelector.mock.calls = [];
      expect(
        setState2(
          ({
            a: {
              foo: { [symbKey]: sk },
            },
            1: {
              2: { qux, quux },
            },
            [symbKey]: {
              no: { go },
            },
          }) => ({
            a: { 10: { baz: { c: qux + ' to ' + go } } },
            [symbKey]: { no: { back: sk - quux } },
          })
        )
      ).toEqual({
        a: { 10: { baz: { c: 'three to left' } } },
        [symbKey]: { no: { back: 100 } },
      });
      expect(readState2(fullSelector)).toEqual({
        a: {
          10: { bar: { a: 100, b: 'high' }, baz: { c: 'three to left' } },
          foo: { [symbKey]: 500 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'three', quux: 400 } },
        [symbKey]: { no: { go: 'left', back: 100 }, yes: { drop: false } },
      });
      expect(fooSelector).toHaveBeenCalledTimes(0);
      expect(barSelector).toHaveBeenCalledTimes(0);
      expect(fullSelector).toHaveBeenCalledTimes(1);
    });

    test('subscribe to state works correctly after manipulating with layers', () => {
      const { addLayers: addLayers } = composeMedama(
        {
          a: composeMedama({ aa: createMedama() }),
          b: composeMedama({ bb: createMedama() }),
        },

        { a: { aa: { aaa: 1 } }, b: { bb: { bbb: 10 } } }
      );

      const {
        subscribeToState: subscribeToState1,
        setState: setState1,
        readState: readState1,
        deleteLayers,
        pupil,
      } = addLayers(
        {
          c: composeMedama({ cc: composeMedama({ ccc: createMedama() }) }),
        },

        { c: { cc: { ccc: { c1: 2, c2: 3 } } } }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const selector1 = jest.fn(
        (state: State) =>
          ({
            a: { aa: { ...state.a.aa } },
            b: { bb: { ...state.b.bb } },
            c: { cc: { ccc: { ...state.c.cc.ccc } } },
          }) as object
      );

      expect(readState1(selector1)).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);

      let testValue1: object | undefined;

      const subscription1 = jest.fn((v: object) => {
        testValue1 = v;
      });

      selector1.mock.calls = [];

      const {
        unsubscribe: unsubscribe1,
        resubscribe: resubscribe1,
        transfer: transfer1,
      } = subscribeToState1(selector1, subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState1({ a: { aa: { aaa: 2 } }, b: { bb: { bbb: 20 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 2 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState1({ a: { aa: { aaa: 2 } }, b: { bb: { bbb: 20 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 2 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState1({ a: { aa: { aaa: 4 } }, c: { cc: { ccc: { c1: 5, c2: 6 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState1({ a: { aa: { aaa: 4 } }, c: { cc: { ccc: { c1: 5, c2: 6 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);

      let testValue2_1: object | undefined;
      let testValue2_2: object | undefined;
      const subscriptionJob2 = jest.fn((v: object) => {
        testValue2_2 = v;
      });
      const subscriptionWithInit2 = jest.fn((v: object) => {
        testValue2_1 = v;

        return subscriptionJob2;
      });

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      resubscribe1(subscriptionWithInit2);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_2).toBe(undefined);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(1);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState1({ a: { aa: { aaa: 50 } }, c: { cc: { ccc: { c1: 8, c2: 17 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 50 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn((state: State) => ({
        _a: { aa: { ...state.a.aa } },
        _c: { cc: { ccc: { ...state.c.cc.ccc } } },
      }));

      selector1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      transfer1(selector2);
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: 50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState1({ a: { aa: { aaa: -50 } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState1({ b: { bb: { bbb: -100 } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      unsubscribe1();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState1({ c: { cc: { ccc: { c2: 111 } } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      let testValue3_1: object | undefined;
      let testValue3_2: object | undefined;
      const subscriptionJob3 = jest.fn((v: object) => {
        testValue3_2 = v;
      });
      const subscriptionWithInit3 = jest.fn((v: object) => {
        testValue3_1 = v;

        return subscriptionJob3;
      });

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      resubscribe1(subscriptionWithInit3);
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(testValue3_1).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 111 } } },
      });
      expect(testValue3_2).toBe(undefined);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(1);
      expect(subscriptionJob3).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      setState1({ c: { cc: { ccc: { c2: 88 } } } });
      expect(testValue3_1).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 111 } } },
      });
      expect(testValue3_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 88 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(0);
      expect(subscriptionJob3).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      unsubscribe1();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(0);
      expect(subscriptionJob3).toHaveBeenCalledTimes(0);

      const {
        subscribeToState: subscribeToState2,
        setState: setState2,
        readState: readState2,
      } = deleteLayers('a').addLayers(
        { a: composeMedama({ aa: createMedama() }) },
        { a: { aa: { aaa: 1 } } }
      );

      setState2({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });

      selector1.mock.calls = [];

      expect(readState2(selector1)).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);

      testValue1 = undefined;

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      const {
        unsubscribe: unsubscribe2,
        resubscribe: resubscribe2,
        transfer: transfer2,
      } = subscribeToState2(selector1, subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState2({ a: { aa: { aaa: 2 } }, b: { bb: { bbb: 20 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 2 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState2({ a: { aa: { aaa: 2 } }, b: { bb: { bbb: 20 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 2 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState2({ a: { aa: { aaa: 4 } }, c: { cc: { ccc: { c1: 5, c2: 6 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      setState2({ a: { aa: { aaa: 4 } }, c: { cc: { ccc: { c1: 5, c2: 6 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);

      testValue2_1 = undefined;
      testValue2_2 = undefined;
      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      subscriptionJob2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];

      resubscribe2(subscriptionWithInit2);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_2).toBe(undefined);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(1);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState2({ a: { aa: { aaa: 50 } }, c: { cc: { ccc: { c1: 8, c2: 17 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 4 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 5, c2: 6 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 50 } },
        b: { bb: { bbb: 20 } },
        c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      transfer2(selector2);
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: 50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState2({ a: { aa: { aaa: -50 } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState2({ b: { bb: { bbb: -100 } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      unsubscribe2();
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];

      setState2({ c: { cc: { ccc: { c2: 111 } } } });
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);

      testValue3_1 = undefined;
      testValue3_2 = undefined;
      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit2.mock.calls = [];
      subscriptionJob2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      resubscribe2(subscriptionWithInit3);
      expect(testValue2_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 17 } } },
      });
      expect(testValue3_1).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 111 } } },
      });
      expect(testValue3_2).toBe(undefined);
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit2).toHaveBeenCalledTimes(0);
      expect(subscriptionJob2).toHaveBeenCalledTimes(0);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(1);
      expect(subscriptionJob3).toHaveBeenCalledTimes(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscriptionWithInit3.mock.calls = [];
      subscriptionJob3.mock.calls = [];

      setState2({ c: { cc: { ccc: { c2: 88 } } } });
      expect(testValue3_1).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 111 } } },
      });
      expect(testValue3_2).toEqual({
        _a: { aa: { aaa: -50 } },
        _c: { cc: { ccc: { c1: 8, c2: 88 } } },
      });
      expect(selector1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscriptionWithInit3).toHaveBeenCalledTimes(0);
      expect(subscriptionJob3).toHaveBeenCalledTimes(1);
    });

    test('cross-layer firing by subscription job works in composition after manipulating with layers', () => {
      const { addLayers } = composeMedama(
        {
          a: composeMedama({ aa: createMedama() }),
          b: composeMedama({ bb: createMedama() }),
        },

        { a: { aa: { aaa: 1 } }, b: { bb: { bbb: 10 } } }
      );

      const {
        subscribeToState: subscribeToState1,
        setState: setState1,
        readState: readState1,
        deleteLayers,
        pupil,
      } = addLayers(
        {
          c: composeMedama({ cc: composeMedama({ ccc: createMedama() }) }),
        },

        { c: { cc: { ccc: { c1: 2, c2: 3 } } } }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const selector1_1 = jest.fn(
        (state: State) =>
          ({
            a: { aa: { ...state.a.aa } },
            c: { cc: { ccc: { ...state.c.cc.ccc } } },
          }) as object
      );

      expect(readState1(selector1_1)).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);

      const selector2 = jest.fn(
        (state: State) =>
          ({
            a: { aa: { ...state.a.aa } },
            b: { bb: { ...state.b.bb } },
          }) as object
      );

      expect(readState1(selector2)).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector2).toHaveBeenCalledTimes(1);

      let testValue1: object | undefined;
      const subscription1 = jest.fn((v: object) => {
        testValue1 = v;
      });

      let testValue2_1: object | undefined;
      const subscription2_1 = jest.fn((v: object) => {
        testValue2_1 = v;

        setState1(
          ({
            c: {
              cc: {
                ccc: { c1 },
              },
            },
          }) => ({ c: { cc: { ccc: { c1: c1 + 1 } } } })
        );
      });

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      const {
        unsubscribe: unsubscribe1_1,
        resubscribe: resubscribe1_1,
        transfer: transfer1_1,
      } = subscribeToState1(selector1_1, subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];

      const { unsubscribe: unsubscribe2_1, resubscribe: resubscribe2_1 } = subscribeToState1(
        selector2,
        subscription2_1
      );
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 3, c2: 3 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      setState1({ c: { cc: { ccc: { c2: 111 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 3, c2: 111 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      setState1({ b: { bb: { bbb: 100 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 4, c2: 111 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 100 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      setState1({ a: { aa: { aaa: 15 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 5, c2: 111 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 100 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(2);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(2);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe1_1();
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      setState1({ b: { bb: { bbb: 200 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 5, c2: 111 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 200 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      resubscribe1_1(subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 6, c2: 111 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 200 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      setState1({ b: { bb: { bbb: 300 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 7, c2: 111 } } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 300 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      const selector1_2 = jest.fn(
        (state: State) =>
          ({
            _a: { aa: { ...state.a.aa } },
          }) as object
      );

      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      transfer1_1(selector1_2);
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 15 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState1({ a: { aa: { aaa: 300 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: 300 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState1({ b: { bb: { bbb: -7 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState1({ c: { cc: { ccc: { c2: 800 } } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe2_1();
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      setState1({ b: { bb: { bbb: 400 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      resubscribe2_1(subscription2_1);
      expect(testValue2_1).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: 400 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(1);

      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_1.mock.calls = [];

      unsubscribe1_1();
      unsubscribe2_1();
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_1).toHaveBeenCalledTimes(0);

      const {
        readState: readState2,
        subscribeToState: subscribeToState2,
        setState: setState2,
      } = deleteLayers('a').addLayers(
        { a: composeMedama({ aa: createMedama() }) },
        { a: { aa: { aaa: 1 } } }
      );

      setState2({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });

      selector1_1.mock.calls = [];

      expect(readState2(selector1_1)).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);

      selector2.mock.calls = [];

      expect(readState2(selector2)).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector2).toHaveBeenCalledTimes(1);

      testValue1 = undefined;

      let testValue2_2: object | undefined;
      const subscription2_2 = jest.fn((v: object) => {
        testValue2_2 = v;

        setState2(
          ({
            c: {
              cc: {
                ccc: { c1 },
              },
            },
          }) => ({ c: { cc: { ccc: { c1: c1 + 1 } } } })
        );
      });

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      const {
        unsubscribe: unsubscribe1_2,
        resubscribe: resubscribe1_2,
        transfer: transfer1_2,
      } = subscribeToState2(selector1_1, subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 2, c2: 3 } } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];

      const { unsubscribe: unsubscribe2_2, resubscribe: resubscribe2_2 } = subscribeToState2(
        selector2,
        subscription2_2
      );
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 3, c2: 3 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_2).toHaveBeenCalledTimes(1);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];

      setState2({ c: { cc: { ccc: { c2: 111 } } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 3, c2: 111 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 10 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_2).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];

      setState2({ b: { bb: { bbb: 100 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 1 } },
        c: { cc: { ccc: { c1: 4, c2: 111 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 1 } },
        b: { bb: { bbb: 100 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      setState2({ a: { aa: { aaa: 15 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 5, c2: 111 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 100 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(2);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(2);
      expect(subscription2_2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe1_2();
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_2).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];

      setState2({ b: { bb: { bbb: 200 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 5, c2: 111 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 200 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_2).toHaveBeenCalledTimes(1);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];

      resubscribe1_2(subscription1);
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 6, c2: 111 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 200 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_2).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];

      setState2({ b: { bb: { bbb: 300 } } });
      expect(testValue1).toEqual({
        a: { aa: { aaa: 15 } },
        c: { cc: { ccc: { c1: 7, c2: 111 } } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 15 } },
        b: { bb: { bbb: 300 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      transfer1_2(selector1_2);
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 15 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState2({ a: { aa: { aaa: 300 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: 300 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(1);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(1);
      expect(subscription2_2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState2({ b: { bb: { bbb: -7 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_2).toHaveBeenCalledTimes(1);

      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      setState2({ c: { cc: { ccc: { c2: 800 } } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_2).toHaveBeenCalledTimes(0);

      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];
      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];

      unsubscribe2_2();
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_2).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];

      setState2({ b: { bb: { bbb: 400 } } });
      expect(testValue1).toEqual({
        _a: { aa: { aaa: 300 } },
      });
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: -7 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(0);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_2).toHaveBeenCalledTimes(0);

      selector1_1.mock.calls = [];
      selector1_2.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2_2.mock.calls = [];

      resubscribe2_2(subscription2_2);
      expect(testValue2_2).toEqual({
        a: { aa: { aaa: 300 } },
        b: { bb: { bbb: 400 } },
      });
      expect(selector1_1).toHaveBeenCalledTimes(0);
      expect(selector1_2).toHaveBeenCalledTimes(0);
      expect(selector2).toHaveBeenCalledTimes(1);
      expect(subscription1).toHaveBeenCalledTimes(0);
      expect(subscription2_2).toHaveBeenCalledTimes(1);
    });

    test('`isComposite` allows to reveal the state deep correctly', () => {
      const { readState, pupil } = composeMedama(
        {
          a: composeMedama({
            10: composeMedama({ bar: createMedama(), baz: createMedama() }).pupil,
            foo: createMedama(),
            [symbKey]: createMedama(),
          }),

          1: createMedama(),
          [symbKey]: composeMedama({ no: createMedama(), yes: createMedama() }),
        },

        {
          a: {
            10: { bar: { a: 100, b: 'low' }, baz: { c: 'zzz' } },
            foo: { [symbKey]: 300 },
            [symbKey]: { 15: 'go' },
          },

          1: { [symbKey]: 20, 2: { qux: 'twenty', quux: 333 } },
          [symbKey]: { no: { go: 'right', back: 444 }, yes: { drop: false } },
        }
      );

      type State = typeof pupil extends CompositePupil<infer S> ? S : never;

      const levelDown = <L extends CompositeState<{}>>(layer: L): L =>
        Object.fromEntries(
          (Reflect.ownKeys(layer) as (keyof L)[])
            .filter(Object.prototype.propertyIsEnumerable.bind(layer))
            .map((key) => [
              key,

              layer[key] != null && typeof layer[key] === 'object'
                ? isComposite(layer[key])
                  ? levelDown(layer[key])
                  : { ...layer[key] }
                : layer[key],
            ])
        ) as L;

      const selector = (state: CompositeState<State>) => levelDown(state);

      expect(readState(selector)).toEqual({
        a: {
          10: { bar: { a: 100, b: 'low' }, baz: { c: 'zzz' } },
          foo: { [symbKey]: 300 },
          [symbKey]: { 15: 'go' },
        },

        1: { [symbKey]: 20, 2: { qux: 'twenty', quux: 333 } },
        [symbKey]: { no: { go: 'right', back: 444 }, yes: { drop: false } },
      });
    });
  });
};
