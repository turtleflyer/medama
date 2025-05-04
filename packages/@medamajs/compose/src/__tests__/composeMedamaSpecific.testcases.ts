/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMedama } from 'medama';
import type { ComposeMedama } from '..';
import type {
  CStateG,
  LayerPupilsPreventInference,
  RevealLayersInStateRecursively,
} from '../auxiliaryTypes';

export const compositeMedamaSpecificTest = (composeMedama: ComposeMedama) => {
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
  ])('medama layers specific test cases (%s)', (_name, composeMedama) => {
    test('adding new layers works correctly', () => {
      const {
        readState: readState1,
        setState: setState1,
        addLayers,
      } = composeMedama(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 } }
      );

      const selector1 = jest.fn((state: { a: { foo: number }; b: { bar: number } }) => ({
        ...state.a,
        ...state.b,
      }));

      expect(readState1(selector1)).toEqual({ foo: 10, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      setState1({ a: { foo: 300 } });
      expect(readState1(selector1)).toEqual({ foo: 300, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];

      const { readState: readState2, setState: setState2 } = addLayers({
        c: createMedama<{ baz: string; qux: string }>(),
      });

      expect(readState1(selector1)).toEqual({ foo: 300, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(0);

      type State2 = { a: { foo: number }; b: { bar: number }; c: { baz: string; qux: string } };

      const selector2 = jest.fn((state: State2) => ({ ...state.a, ...state.b, ...state.c }));

      selector1.mock.calls = [];
      expect(readState1(selector1)).toEqual({ foo: 300, bar: 20 });
      expect(readState2(selector2)).toEqual({ foo: 300, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      expect(readState2(selector1)).toEqual({ foo: 300, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState2({ c: { baz: 'see' } });
      expect(readState1(selector1)).toEqual({ foo: 300, bar: 20 });
      expect(readState2(selector2)).toEqual({ foo: 300, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(0);

      expect(readState2(selector2.bind(null))).toEqual({
        foo: 300,
        bar: 20,
        baz: 'see',
      });

      const selector3 = jest.fn((state: State2) => ({
        ...state.a,
        ...state.b,
        baz: state.c.baz,
        qux: state.c.qux,
      }));

      expect(readState2(selector3)).toEqual({
        foo: 300,
        bar: 20,
        baz: 'see',
        qux: undefined,
      });
      expect(selector3.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      setState2({ c: { qux: 'let' } });
      expect(readState2(selector1)).toEqual({ foo: 300, bar: 20 });
      expect(readState2(selector2)).toEqual({ foo: 300, bar: 20 });
      expect(readState2(selector3)).toEqual({
        foo: 300,
        bar: 20,
        baz: 'see',
        qux: 'let',
      });
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(0);
      expect(selector3.mock.calls).toHaveLength(1);

      expect(readState2(selector2.bind(null))).toEqual({
        foo: 300,
        bar: 20,
        baz: 'see',
        qux: 'let',
      });

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      setState2({ a: { foo: 115 } });
      expect(readState2(selector1)).toEqual({ foo: 115, bar: 20 });
      expect(readState2(selector2)).toEqual({
        foo: 115,
        bar: 20,
        baz: 'see',
        qux: 'let',
      });
      expect(readState2(selector3)).toEqual({
        foo: 115,
        bar: 20,
        baz: 'see',
        qux: 'let',
      });
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(selector3.mock.calls).toHaveLength(1);
    });

    test('adding new layers with init state works correctly', () => {
      const { readState: readState1, addLayers } = composeMedama(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 } }
      );

      const selector1 = jest.fn((state: { a: { foo: number }; b: { bar: number } }) => ({
        ...state.a,
        ...state.b,
      }));

      expect(readState1(selector1)).toEqual({ foo: 10, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];

      const { readState: readState2, setState: setState2 } = addLayers(
        {
          c: createMedama(),
          d: createMedama<{ quux: number }>(),
        },

        { c: { baz: 'see', qux: 'let' } }
      );

      expect(readState1(selector1)).toEqual({ foo: 10, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(0);

      type State2 = {
        a: { foo: number };
        b: { bar: number };
        c: { baz: string; qux: string };
        d: { quux: number };
      };

      const selector2 = jest.fn((state: State2) => ({
        ...state.a,
        ...state.b,
        ...state.c,
        ...state.d,
      }));

      selector1.mock.calls = [];
      expect(readState1(selector1)).toEqual({ foo: 10, bar: 20 });
      expect(readState2(selector2)).toEqual({ foo: 10, bar: 20, baz: 'see', qux: 'let' });
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      expect(readState2(selector1)).toEqual({ foo: 10, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState2({ d: { quux: 400 } });
      expect(readState2(selector1)).toEqual({ foo: 10, bar: 20 });
      expect(readState2(selector2)).toEqual({ foo: 10, bar: 20, baz: 'see', qux: 'let' });
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(0);

      expect(readState2(selector2.bind(null))).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'let',
        quux: 400,
      });
    });

    test('subscribing after adding new layers works correctly', () => {
      const {
        subscribeToState: subscribeToState1,
        setState: setState1,
        addLayers,
      } = composeMedama(
        { a: createMedama(), b: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 } }
      );

      const selector1 = jest.fn((state: { a: { foo: number }; b: { bar: number } }) => ({
        ...state.a,
        ...state.b,
      }));

      let testValue1!: number;

      const subscription1 = jest.fn(({ foo, bar }: { foo: number; bar: number }) => {
        testValue1 = foo + bar;
      });

      subscribeToState1(selector1, subscription1);
      expect(testValue1).toBe(30);
      expect(selector1.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      setState1({ a: { foo: 300 } });
      expect(testValue1).toBe(320);
      expect(selector1.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      const { subscribeToState: subscribeToState2, setState: setState2 } = addLayers({
        c: createMedama<{ baz: string; qux: string }>(),
      });

      expect(selector1.mock.calls).toHaveLength(0);
      expect(subscription1.mock.calls).toHaveLength(0);

      type State2 = { a: { foo: number }; b: { bar: number }; c: { baz: string; qux: string } };

      const selector2 = jest.fn((state: State2) => ({ ...state.a, ...state.b, ...state.c }));

      let testValue2!: string;

      const subscription2 = jest.fn(
        ({ foo, bar, baz, qux }: { foo: number; bar: number; baz: string; qux: string }) => {
          testValue2 = `${foo + bar} ${baz} ${qux}`;
        }
      );

      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      subscribeToState2(selector2, subscription2);
      expect(testValue1).toBe(320);
      expect(testValue2).toBe('320 undefined undefined');
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState2({ c: { baz: 'see' } });
      expect(testValue1).toBe(320);
      expect(testValue2).toBe('320 undefined undefined');
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(0);
      expect(subscription1.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(0);

      const selector3 = jest.fn((state: State2) => ({
        ...state.a,
        ...state.b,
        baz: state.c.baz,
        qux: state.c.qux,
      }));

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      subscribeToState2(selector3, subscription2);
      expect(testValue1).toBe(320);
      expect(testValue2).toBe('320 see undefined');
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(0);
      expect(selector3.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState2({ c: { qux: 'let' } });
      expect(testValue1).toBe(320);
      expect(testValue2).toBe('320 see let');
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(0);
      expect(selector3.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState2({ a: { foo: 500 } });
      expect(testValue1).toBe(520);
      expect(testValue2).toBe('520 see let');
      expect(subscription1.mock.calls).toHaveLength(1);
      expect(subscription2.mock.calls).toHaveLength(2);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState1({ a: { foo: 10 } });
      expect(testValue1).toBe(30);
      expect(testValue2).toBe('30 see let');
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(selector3.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(1);
      expect(subscription2.mock.calls).toHaveLength(2);
    });

    test('deleting a layer works correctly', () => {
      const {
        readState: readState1,
        setState: setState1,
        deleteLayers: deleteLayers1,
      } = composeMedama(
        { a: createMedama(), b: createMedama(), c: createMedama(), d: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 'see', qux: 'let' }, d: { quux: 400 } }
      );

      const selector1 = jest.fn(
        (state: {
          a: { foo: number };
          b: { bar: number };
          c: { baz: string; qux: string };
          d: { quux: number };
        }) => ({
          ...state.a,
          ...state.b,
          ...state.c,
          ...state.d,
        })
      );

      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'let',
        quux: 400,
      });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      setState1({ c: { baz: 'down' } });
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 400,
      });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      const { readState: readState2, setState: setState2 } = deleteLayers1('d');
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 400,
      });
      expect(selector1.mock.calls).toHaveLength(0);

      const selector2 = jest.fn(
        (state: { a: { foo: number }; b: { bar: number }; c: { baz: string; qux: string } }) => ({
          ...state.a,
          ...state.b,
          ...state.c,
        })
      );

      selector1.mock.calls = [];
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 400,
      });
      expect(readState2(selector2)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
      });
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);

      selector2.mock.calls = [];
      expect(readState1(selector2)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
      });
      expect(selector2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState1({ c: { baz: 'see' } });
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'let',
        quux: 400,
      });
      expect(readState2(selector2)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'let',
      });
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState1({ d: { quux: 500 } });
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'let',
        quux: 500,
      });
      expect(readState2(selector2)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'let',
      });
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState2({ c: { qux: 'win' } });
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'win',
        quux: 500,
      });
      expect(readState2(selector2)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'win',
      });
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);
    });

    test('deleting multiple layers works correctly', () => {
      const {
        readState: readState1,
        setState: setState1,
        deleteLayers: deleteLayers1,
      } = composeMedama(
        { a: createMedama(), b: createMedama(), c: createMedama(), d: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 'see', qux: 'let' }, d: { quux: 400 } }
      );

      const selector1 = jest.fn(
        (state: {
          a: { foo: number };
          b: { bar: number };
          c: { baz: string; qux: string };
          d: { quux: number };
        }) => ({
          ...state.a,
          ...state.b,
          ...state.c,
          ...state.d,
        })
      );

      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'see',
        qux: 'let',
        quux: 400,
      });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      setState1({ c: { baz: 'down' } });
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 400,
      });
      expect(selector1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      const { readState: readState2, setState: setState2 } = deleteLayers1(['c', 'd']);
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 400,
      });
      expect(selector1.mock.calls).toHaveLength(0);

      const selector2 = jest.fn((state: { a: { foo: number }; b: { bar: number } }) => ({
        ...state.a,
        ...state.b,
      }));

      selector1.mock.calls = [];
      expect(readState1(selector1)).toEqual({
        foo: 10,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 400,
      });
      expect(readState2(selector2)).toEqual({ foo: 10, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);

      selector2.mock.calls = [];
      expect(readState1(selector2)).toEqual({ foo: 10, bar: 20 });
      expect(selector2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState2({ a: { foo: 50 } });
      expect(readState1(selector1)).toEqual({
        foo: 50,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 400,
      });
      expect(readState2(selector2)).toEqual({ foo: 50, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState1({ d: { quux: 500 } });
      expect(readState1(selector1)).toEqual({
        foo: 50,
        bar: 20,
        baz: 'down',
        qux: 'let',
        quux: 500,
      });
      expect(readState2(selector2)).toEqual({ foo: 50, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(0);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      setState1({ c: { qux: 'win' } });
      expect(readState1(selector1)).toEqual({
        foo: 50,
        bar: 20,
        baz: 'down',
        qux: 'win',
        quux: 500,
      });
      expect(readState2(selector2)).toEqual({ foo: 50, bar: 20 });
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(0);
    });

    test('subscribing after deleting a layer works correctly', () => {
      const {
        subscribeToState: subscribeToState1,
        setState: setState1,
        deleteLayers,
      } = composeMedama(
        { a: createMedama(), b: createMedama(), c: createMedama() },
        { a: { foo: 10 }, b: { bar: 20 }, c: { baz: 'see', qux: 'let' } }
      );

      const selector1 = jest.fn(
        (state: { a: { foo: number }; b: { bar: number }; c: { baz: string; qux: string } }) => ({
          ...state.a,
          ...state.b,
          ...state.c,
        })
      );

      let testValue1!: string;

      const subscription1 = jest.fn(
        ({ foo, bar, baz, qux }: { foo: number; bar: number; baz: string; qux: string }) => {
          testValue1 = `${foo + bar} ${baz} ${qux}`;
        }
      );

      subscribeToState1(selector1, subscription1);
      expect(testValue1).toBe('30 see let');
      expect(selector1.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      setState1({ a: { foo: 300 } });
      expect(testValue1).toBe('320 see let');
      expect(selector1.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      subscription1.mock.calls = [];

      const { subscribeToState: subscribeToState2, setState: setState2 } = deleteLayers('c');

      expect(selector1.mock.calls).toHaveLength(0);
      expect(subscription1.mock.calls).toHaveLength(0);

      const selector2 = jest.fn((state: { a: { foo: number }; b: { bar: number } }) => ({
        ...state.a,
        ...state.b,
      }));

      let testValue2!: number;

      const subscription2 = jest.fn(({ foo, bar }: { foo: number; bar: number }) => {
        testValue2 = foo + bar;
      });

      selector1.mock.calls = [];
      subscription1.mock.calls = [];
      subscribeToState2(selector2, subscription2);
      expect(testValue1).toBe('320 see let');
      expect(testValue2).toBe(320);
      expect(selector1.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState2({ b: { bar: 500 } });
      expect(testValue1).toBe('800 see let');
      expect(testValue2).toBe(800);
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(subscription1.mock.calls).toHaveLength(1);
      expect(subscription2.mock.calls).toHaveLength(1);

      selector1.mock.calls = [];
      selector2.mock.calls = [];
      subscription1.mock.calls = [];
      subscription2.mock.calls = [];
      setState1({ c: { qux: 'nothing' } });
      expect(testValue1).toBe('800 see nothing');
      expect(testValue2).toBe(800);
      expect(selector1.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(0);
      expect(subscription1.mock.calls).toHaveLength(1);
      expect(subscription2.mock.calls).toHaveLength(0);
    });
  });

  describe('general medama layers tests', () => {
    test('layers as individual states and in composite state work together', () => {
      const {
        setState: setState11,
        subscribeToState: subscribeToState11,
        pupil: pupil11,
      } = createMedama({ foo: 10 });

      const selector11 = jest.fn((state: { foo: number }) => ({ ...state }));
      let testValue11!: number;

      const subscription11 = jest.fn(({ foo }: { foo: number }) => {
        testValue11 = foo;
      });

      subscribeToState11(selector11, subscription11);
      expect(testValue11).toBe(10);
      expect(selector11.mock.calls).toHaveLength(1);
      expect(subscription11.mock.calls).toHaveLength(1);

      const {
        setState: setState12,
        subscribeToState: subscribeToState12,
        pupil: pupil12,
      } = createMedama({ bar: 40 });

      const selector12 = jest.fn((state: { bar: number }) => ({ ...state }));
      let testValue12!: number;

      const subscription12 = jest.fn(({ bar }: { bar: number }) => {
        testValue12 = bar;
      });

      subscribeToState12(selector12, subscription12);
      expect(testValue12).toBe(40);
      expect(selector12.mock.calls).toHaveLength(1);
      expect(subscription12.mock.calls).toHaveLength(1);

      const {
        setState: setState2,
        subscribeToState: subscribeToState2,
        deleteLayers: deleteLayers2,
      } = composeMedama({ a: pupil11, b: pupil12, c: createMedama() }, { c: { baz: 50 } });

      const selector2 = jest.fn(
        (state: { a: { foo: number }; b: { bar: number }; c: { baz: number } }) => ({
          ...state.a,
          ...state.b,
          ...state.c,
        })
      );

      let testValue2!: number;

      const subscription2 = jest.fn(
        ({ foo, bar, baz }: { foo: number; bar: number; baz: number }) => {
          testValue2 = foo + bar + baz;
        }
      );

      subscribeToState2(selector2, subscription2);
      expect(testValue2).toBe(100);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(subscription2.mock.calls).toHaveLength(1);

      const {
        setState: setState3,
        subscribeToState: subscribeToState3,
        addLayers: addLayers3,
      } = deleteLayers2('b');

      const selector3 = jest.fn((state: { a: { foo: number }; c: { baz: number } }) => ({
        ...state.a,
        ...state.c,
      }));

      let testValue3!: number;

      const subscription3 = jest.fn(({ foo, baz }: { foo: number; baz: number }) => {
        testValue3 = foo + baz;
      });

      subscribeToState3(selector3, subscription3);
      expect(testValue3).toBe(60);
      expect(selector3.mock.calls).toHaveLength(1);
      expect(subscription3.mock.calls).toHaveLength(1);

      const { setState: setState4, subscribeToState: subscribeToState4 } = addLayers3(
        { d: createMedama() },
        { d: { qux: 700 } }
      );

      const selector4 = jest.fn(
        (state: { a: { foo: number }; c: { baz: number }; d: { qux: number } }) => ({
          ...state.a,
          ...state.c,
          ...state.d,
        })
      );

      let testValue4!: number;

      const subscription4 = jest.fn(
        ({ foo, baz, qux }: { foo: number; baz: number; qux: number }) => {
          testValue4 = foo + baz + qux;
        }
      );

      subscribeToState4(selector4, subscription4);
      expect(testValue4).toBe(760);
      expect(selector4.mock.calls).toHaveLength(1);
      expect(subscription4.mock.calls).toHaveLength(1);

      selector11.mock.calls = [];
      selector12.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      selector4.mock.calls = [];
      subscription11.mock.calls = [];
      subscription12.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      subscription4.mock.calls = [];
      setState11({ foo: 30 });
      expect(testValue11).toBe(30);
      expect(testValue12).toBe(40);
      expect(testValue2).toBe(120);
      expect(testValue3).toBe(80);
      expect(testValue4).toBe(780);
      expect(selector11.mock.calls).toHaveLength(1);
      expect(selector12.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(selector3.mock.calls).toHaveLength(1);
      expect(selector4.mock.calls).toHaveLength(1);
      expect(subscription11.mock.calls).toHaveLength(1);
      expect(subscription12.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(1);
      expect(subscription3.mock.calls).toHaveLength(1);
      expect(subscription4.mock.calls).toHaveLength(1);

      selector11.mock.calls = [];
      selector12.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      selector4.mock.calls = [];
      subscription11.mock.calls = [];
      subscription12.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      subscription4.mock.calls = [];
      setState2({ b: { bar: 80 } });
      expect(testValue11).toBe(30);
      expect(testValue12).toBe(80);
      expect(testValue2).toBe(160);
      expect(testValue3).toBe(80);
      expect(testValue4).toBe(780);
      expect(selector11.mock.calls).toHaveLength(0);
      expect(selector12.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(selector3.mock.calls).toHaveLength(0);
      expect(selector4.mock.calls).toHaveLength(0);
      expect(subscription11.mock.calls).toHaveLength(0);
      expect(subscription12.mock.calls).toHaveLength(1);
      expect(subscription2.mock.calls).toHaveLength(1);
      expect(subscription3.mock.calls).toHaveLength(0);
      expect(subscription4.mock.calls).toHaveLength(0);

      selector11.mock.calls = [];
      selector12.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      selector4.mock.calls = [];
      subscription11.mock.calls = [];
      subscription12.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      subscription4.mock.calls = [];
      setState3({ c: { baz: 100 } });
      expect(testValue11).toBe(30);
      expect(testValue12).toBe(80);
      expect(testValue2).toBe(210);
      expect(testValue3).toBe(130);
      expect(testValue4).toBe(830);
      expect(selector11.mock.calls).toHaveLength(0);
      expect(selector12.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(selector3.mock.calls).toHaveLength(1);
      expect(selector4.mock.calls).toHaveLength(1);
      expect(subscription11.mock.calls).toHaveLength(0);
      expect(subscription12.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(1);
      expect(subscription3.mock.calls).toHaveLength(1);
      expect(subscription4.mock.calls).toHaveLength(1);

      selector11.mock.calls = [];
      selector12.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      selector4.mock.calls = [];
      subscription11.mock.calls = [];
      subscription12.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      subscription4.mock.calls = [];
      setState4({ d: { qux: 900 } });
      expect(testValue11).toBe(30);
      expect(testValue12).toBe(80);
      expect(testValue2).toBe(210);
      expect(testValue3).toBe(130);
      expect(testValue4).toBe(1030);
      expect(selector11.mock.calls).toHaveLength(0);
      expect(selector12.mock.calls).toHaveLength(0);
      expect(selector2.mock.calls).toHaveLength(0);
      expect(selector3.mock.calls).toHaveLength(0);
      expect(selector4.mock.calls).toHaveLength(1);
      expect(subscription11.mock.calls).toHaveLength(0);
      expect(subscription12.mock.calls).toHaveLength(0);
      expect(subscription2.mock.calls).toHaveLength(0);
      expect(subscription3.mock.calls).toHaveLength(0);
      expect(subscription4.mock.calls).toHaveLength(1);

      selector11.mock.calls = [];
      selector12.mock.calls = [];
      selector2.mock.calls = [];
      selector3.mock.calls = [];
      selector4.mock.calls = [];
      subscription11.mock.calls = [];
      subscription12.mock.calls = [];
      subscription2.mock.calls = [];
      subscription3.mock.calls = [];
      subscription4.mock.calls = [];
      setState12({ bar: 110 });
      expect(testValue11).toBe(30);
      expect(testValue12).toBe(110);
      expect(testValue2).toBe(240);
      expect(testValue3).toBe(130);
      expect(testValue4).toBe(1030);
      expect(selector11.mock.calls).toHaveLength(0);
      expect(selector12.mock.calls).toHaveLength(1);
      expect(selector2.mock.calls).toHaveLength(1);
      expect(selector3.mock.calls).toHaveLength(0);
      expect(selector4.mock.calls).toHaveLength(0);
      expect(subscription11.mock.calls).toHaveLength(0);
      expect(subscription12.mock.calls).toHaveLength(1);
      expect(subscription2.mock.calls).toHaveLength(1);
      expect(subscription3.mock.calls).toHaveLength(0);
      expect(subscription4.mock.calls).toHaveLength(0);
    });
  });
};
