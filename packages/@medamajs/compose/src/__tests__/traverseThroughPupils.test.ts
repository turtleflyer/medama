/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMedama, type SubscribeToState } from 'medama';
import { traverseThroughPupils } from '../traverseThroughPupils';

const symbKey = Symbol('symbKey');

describe('testing iterateThroughPupils', () => {
  test('simple test case covered correctly', () => {
    const resultStack: any[] = [];
    let resultStackFinal: any[] | undefined;

    const pupil1 = createMedama({ bar: 100 });
    const pupil2 = createMedama({ 100: 'no' });
    const pupil3 = createMedama({ [symbKey]: true });

    expect(
      traverseThroughPupils(
        [
          ['foo', pupil1],
          [10, pupil2],
          [symbKey, pupil3],
        ],

        (key, state, subscribeToState, selectorIdentity) => {
          resultStack.push([key, { ...state }, subscribeToState, selectorIdentity]);
        },

        () => {
          resultStackFinal = [...resultStack];

          return resultStackFinal.length;
        }
      )
    ).toBe(3);

    expect(resultStack).toHaveLength(3);
    expect(resultStack).toEqual(resultStackFinal);

    const [
      [key1, state1, subscribeToState1, selectorIdentity1],
      [key2, state2, subscribeToState2, selectorIdentity2],
      [key3, state3, subscribeToState3, selectorIdentity3],
    ] = resultStack;

    expect(key1).toBe('foo');
    expect(key2).toBe(10);
    expect(key3).toBe(symbKey);

    expect(state1).toEqual({ bar: 100 });
    expect(state2).toEqual({ 100: 'no' });
    expect(state3).toEqual({ [symbKey]: true });

    expect(subscribeToState1).toBe(pupil1.subscribeToState);
    expect(subscribeToState2).toBe(pupil2.subscribeToState);
    expect(subscribeToState3).toBe(pupil3.subscribeToState);

    let subscriptionResult1: any = false;
    let subscriptionResult2: any = false;
    let subscriptionResult3: any = false;

    const subscription1 = jest.fn((result: any) => {
      subscriptionResult1 = result;
    });

    const subscription2 = jest.fn((result: any) => {
      subscriptionResult2 = result;
    });

    const subscription3 = jest.fn((result: any) => {
      subscriptionResult3 = result;
    });

    subscribeToState1(selectorIdentity1, subscription1);
    subscribeToState2(selectorIdentity2, subscription2);
    subscribeToState3(selectorIdentity3, subscription3);

    expect(subscription1).toHaveBeenCalledTimes(1);
    expect(subscription2).toHaveBeenCalledTimes(1);
    expect(subscription3).toHaveBeenCalledTimes(1);
    expect(subscriptionResult1).toBe(3);
    expect(subscriptionResult2).toBe(3);
    expect(subscriptionResult3).toBe(3);

    subscription1.mock.calls = [];
    subscription2.mock.calls = [];
    subscription3.mock.calls = [];

    pupil1.setState({ bar: 200 });
    expect(subscription1).toHaveBeenCalledTimes(1);
    expect(subscriptionResult1).toBe(undefined);

    pupil2.setState({ 100: 'yes' });
    expect(subscription2).toHaveBeenCalledTimes(1);
    expect(subscriptionResult2).toBe(undefined);

    pupil3.setState({ [symbKey]: false });
    expect(subscription3).toHaveBeenCalledTimes(1);
    expect(subscriptionResult3).toBe(undefined);
  });

  test('final callback can iterate further', () => {
    const resultStack: any[] = [];
    let resultStackFinal: any[] | undefined;

    const pupil11 = createMedama({ bar: 100 });
    const pupil12 = createMedama({ 100: 'no' });
    const pupil21 = createMedama({ [symbKey]: true });
    const pupil22 = createMedama({ 777: -1 });

    const processLayer = (
      key: string | number | symbol,
      state: object,
      subscribeToState: SubscribeToState<object>,
      selectorIdentity: (state: object) => void
    ) => {
      resultStack.push([key, { ...state }, subscribeToState, selectorIdentity]);
    };

    expect(
      traverseThroughPupils(
        [
          ['foo', pupil11],
          [10, pupil12],
        ],

        processLayer,

        () =>
          traverseThroughPupils(
            [
              [symbKey, pupil21],
              ['baz', pupil22],
            ],

            processLayer,

            () => {
              resultStackFinal = [...resultStack];

              return resultStackFinal.length;
            }
          )
      )
    ).toBe(4);

    expect(resultStack).toHaveLength(4);
    expect(resultStack).toEqual(resultStackFinal);

    const [
      [key1, state1, subscribeToState1, selectorIdentity1],
      [key2, state2, subscribeToState2, selectorIdentity2],
      [key3, state3, subscribeToState3, selectorIdentity3],
      [key4, state4, subscribeToState4, selectorIdentity4],
    ] = resultStack;

    expect(key1).toBe('foo');
    expect(key2).toBe(10);
    expect(key3).toBe(symbKey);
    expect(key4).toBe('baz');

    expect(state1).toEqual({ bar: 100 });
    expect(state2).toEqual({ 100: 'no' });
    expect(state3).toEqual({ [symbKey]: true });
    expect(state4).toEqual({ 777: -1 });

    expect(subscribeToState1).toBe(pupil11.subscribeToState);
    expect(subscribeToState2).toBe(pupil12.subscribeToState);
    expect(subscribeToState3).toBe(pupil21.subscribeToState);
    expect(subscribeToState4).toBe(pupil22.subscribeToState);

    let subscriptionResult1: any = false;
    let subscriptionResult2: any = false;
    let subscriptionResult3: any = false;
    let subscriptionResult4: any = false;

    const subscription1 = jest.fn((result: any) => {
      subscriptionResult1 = result;
    });

    const subscription2 = jest.fn((result: any) => {
      subscriptionResult2 = result;
    });

    const subscription3 = jest.fn((result: any) => {
      subscriptionResult3 = result;
    });

    const subscription4 = jest.fn((result: any) => {
      subscriptionResult4 = result;
    });

    subscribeToState1(selectorIdentity1, subscription1);
    subscribeToState2(selectorIdentity2, subscription2);
    subscribeToState3(selectorIdentity3, subscription3);
    subscribeToState4(selectorIdentity4, subscription4);

    expect(subscription1).toHaveBeenCalledTimes(1);
    expect(subscription2).toHaveBeenCalledTimes(1);
    expect(subscription3).toHaveBeenCalledTimes(1);
    expect(subscription4).toHaveBeenCalledTimes(1);
    expect(subscriptionResult1).toBe(4);
    expect(subscriptionResult2).toBe(4);
    expect(subscriptionResult3).toBe(4);
    expect(subscriptionResult4).toBe(4);

    subscription1.mock.calls = [];
    subscription2.mock.calls = [];
    subscription3.mock.calls = [];
    subscription4.mock.calls = [];

    pupil11.setState({ bar: 200 });
    expect(subscription1).toHaveBeenCalledTimes(1);
    expect(subscriptionResult1).toBe(undefined);

    pupil12.setState({ 100: 'yes' });
    expect(subscription2).toHaveBeenCalledTimes(1);
    expect(subscriptionResult2).toBe(undefined);

    pupil21.setState({ [symbKey]: false });
    expect(subscription3).toHaveBeenCalledTimes(1);
    expect(subscriptionResult3).toBe(undefined);

    pupil22.setState({ 777: 1 });
    expect(subscription4).toHaveBeenCalledTimes(1);
    expect(subscriptionResult4).toBe(undefined);
  });
});
