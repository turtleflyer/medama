/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CreateMedama } from '..';
import type { SelectStateEntriesChanged } from '../selectStateEntriesChanged';

export const medamaSpecificTest = (
  createMedama: CreateMedama,
  selectStateEntriesChanged: SelectStateEntriesChanged
) => {
  const symbKey = Symbol('symbKey');

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
  ])('medama pupil specific test cases (%s)', (_name, createMedama) => {
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
