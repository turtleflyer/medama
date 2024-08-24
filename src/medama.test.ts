import { createMedama, type CreateMedama } from '.';

const symbKey = Symbol('symbKey');

describe('methods identity', () => {
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
])('medama pupil (%s)', (_name, createMedama) => {
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

    expect(setState(({ [symbKey]: symb }) => ({ [symbKey]: symb * 3 }))).toEqual({ [symbKey]: 90 });
    expect(readState((state) => ({ ...state }))).toEqual({ a: 16, 1: 14, [symbKey]: 90 });

    expect(setState((state) => ({ [symbKey]: state[symbKey] * 3 }))).toEqual({ [symbKey]: 270 });
    expect(readState((state) => ({ ...state }))).toEqual({ a: 16, 1: 14, [symbKey]: 270 });

    expect(
      setState(({ a, 1: one, [symbKey]: symb }) => ({ a: a * 2, 1: one + 2, [symbKey]: symb / 9 }))
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

    expect(setState(() => ({ b: 20 }))).toEqual({
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
    let testValue: any;
    const { subscribeToState } = createMedama();

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
    let testValue: any;
    const { subscribeToState } = createMedama({ a: 10, 1: 20, [symbKey]: 30 });

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
    let testValue: any;
    const { subscribeToState } = createMedama({ a: 10, b: 20, c: 30 });

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
    let testValue: number | undefined;
    let getRun = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
      a: 10,
      b: 20,
      c: 30,
    });

    expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

    subscribeToState(
      (state) => state.a,

      (value) => {
        getRun++;
        testValue = value + 3;
      }
    );

    expect(getRun).toBe(1);
    expect(testValue).toBe(13);

    getRun = 0;
    setState(() => ({ a: 100 }));
    expect(getRun).toBe(1);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(() => ({ b: 2 }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ a, b }) => ({ a: 100, b: a + b }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ a, c }) => ({ d: a + c }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ d }) => ({ a: d }));
    expect(getRun).toBe(1);
    expect(testValue).toBe(133);

    getRun = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRun).toBe(1);
    expect(testValue).toBe(118);
  });

  test('subscribed tasks with init part works correctly', () => {
    let testValue: number | undefined;
    let getRunOnInit = 0;
    let getRunOnStateChange = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
      a: 10,
      b: 20,
      c: 30,
    });

    expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

    subscribeToState(
      (state) => state.a,

      (value) => {
        getRunOnInit++;
        testValue = value - 10;

        return (value) => {
          getRunOnStateChange++;
          testValue = value + 3;
        };
      }
    );

    expect(getRunOnInit).toBe(1);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 100 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ b: 2 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, b }) => ({ a: 100, b: a + b }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, c }) => ({ d: a + c }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ d }) => ({ a: d }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
    expect(testValue).toBe(133);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
    expect(testValue).toBe(118);
  });

  test('subscribed tasks with no separate init part works correctly after resubscribing', () => {
    let testValue: number | undefined;
    let getRun = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
      a: 10,
      b: 20,
      c: 30,
    });

    expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

    const { resubscribe } = subscribeToState(
      (state) => state.a,

      (value) => {
        getRun++;
        testValue = value * 3;
      }
    );

    expect(getRun).toBe(1);
    expect(testValue).toBe(30);

    getRun = 0;

    resubscribe((value) => {
      getRun++;
      testValue = value + 3;
    });

    expect(getRun).toBe(1);
    expect(testValue).toBe(13);

    getRun = 0;
    setState(() => ({ a: 100 }));
    expect(getRun).toBe(1);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(() => ({ b: 2 }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ a, b }) => ({ a: 100, b: a + b }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ a, c }) => ({ d: a + c }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRun).toBe(0);
    expect(testValue).toBe(103);

    getRun = 0;
    setState(({ d }) => ({ a: d }));
    expect(getRun).toBe(1);
    expect(testValue).toBe(133);

    getRun = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRun).toBe(1);
    expect(testValue).toBe(118);
  });

  test('subscribed tasks with init part works correctly after resubscribing', () => {
    let testValue: number | undefined;
    let getRunOnInit = 0;
    let getRunOnStateChange = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
      a: 100,
      b: 20,
      c: 30,
    });

    expect(readState((state) => ({ ...state }))).toEqual({ a: 100, b: 20, c: 30 });

    const { resubscribe } = subscribeToState(
      (state) => state.a,

      (value) => {
        getRunOnInit++;
        testValue = value * 10;

        return (value) => {
          getRunOnStateChange++;
          testValue = value * 3;
        };
      }
    );

    expect(getRunOnInit).toBe(1);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(1000);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 10 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
    expect(testValue).toBe(30);

    getRunOnInit = 0;
    getRunOnStateChange = 0;

    resubscribe((value) => {
      getRunOnInit++;
      testValue = value - 10;

      return (value) => {
        getRunOnStateChange++;
        testValue = value + 3;
      };
    });

    expect(getRunOnInit).toBe(1);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 100 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ b: 2 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, b }) => ({ a: 100, b: a + b }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, c }) => ({ d: a + c }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
    expect(testValue).toBe(103);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ d }) => ({ a: d }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
    expect(testValue).toBe(133);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(({ a, b, c }) => ({ a: (a + b - c / 15) / 2 }));
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
    expect(testValue).toBe(118);
  });

  test('unsubscribing works correctly', () => {
    let testValue: number | undefined;
    let getRunOnInit = 0;
    let getRunOnStateChange = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
      a: 10,
      b: 20,
    });

    expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20 });

    const { unsubscribe } = subscribeToState(
      ({ a, b }) => a + b,

      (value) => {
        testValue = value;
        getRunOnInit++;

        return (value) => {
          testValue = value + 3;
          getRunOnStateChange++;
        };
      }
    );

    expect(testValue).toBe(30);
    expect(getRunOnInit).toBe(1);
    expect(getRunOnStateChange).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 100 }));
    expect(testValue).toBe(123);
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);

    unsubscribe();

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    expect(testValue).toBe(123);
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 50 }));
    expect(testValue).toBe(123);
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);
  });

  test('resubscribing after unsubscribing works correctly', () => {
    let testValue: number | undefined;
    let getRunOnInit = 0;
    let getRunOnStateChange = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
      a: 10,
      b: 20,
    });

    expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20 });

    const { unsubscribe, resubscribe } = subscribeToState(
      ({ a, b }) => a + b,

      (value) => {
        testValue = value;
        getRunOnInit++;

        return (value) => {
          testValue = value + 3;
          getRunOnStateChange++;
        };
      }
    );

    expect(testValue).toBe(30);
    expect(getRunOnInit).toBe(1);
    expect(getRunOnStateChange).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 100 }));
    expect(testValue).toBe(123);
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);

    unsubscribe();

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    expect(testValue).toBe(123);
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 50 }));
    expect(testValue).toBe(123);
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;

    resubscribe((value) => {
      testValue = value * 2;
      getRunOnInit++;

      return (value) => {
        testValue = value * 3;
        getRunOnStateChange++;
      };
    });

    expect(testValue).toBe(140);
    expect(getRunOnInit).toBe(1);
    expect(getRunOnStateChange).toBe(0);

    getRunOnInit = 0;
    getRunOnStateChange = 0;
    setState(() => ({ a: 25 }));
    expect(testValue).toBe(135);
    expect(getRunOnInit).toBe(0);
    expect(getRunOnStateChange).toBe(1);
  });

  test('multiple subscriptions with different selectors work correctly', () => {
    let testValue1: number | undefined;
    let getRunOnInit1 = 0;
    let getRunOnStateChange1 = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, number>>({
      a: 10,
      b: 20,
      c: 30,
    });

    expect(readState((state) => ({ ...state }))).toEqual({ a: 10, b: 20, c: 30 });

    const subscribeReturn1 = subscribeToState(
      (state) => state.a,

      (value) => {
        testValue1 = value;
        getRunOnInit1++;

        return (value) => {
          testValue1 = value + 3;
          getRunOnStateChange1++;
        };
      }
    );

    expect(testValue1).toBe(10);
    expect(getRunOnInit1).toBe(1);
    expect(getRunOnStateChange1).toBe(0);

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;
    setState(() => ({ a: 100 }));
    expect(testValue1).toBe(103);
    expect(getRunOnInit1).toBe(0);
    expect(getRunOnStateChange1).toBe(1);

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;

    subscribeReturn1.resubscribe((value) => {
      testValue1 = value - 10;
      getRunOnInit1++;

      return (value) => {
        testValue1 = value * 2;
        getRunOnStateChange1++;
      };
    });

    expect(testValue1).toBe(90);
    expect(getRunOnInit1).toBe(1);
    expect(getRunOnStateChange1).toBe(0);

    let testValue2: number | undefined;
    let getRunOnInit2 = 0;
    let getRunOnStateChange2 = 0;

    const subscribeReturn2 = subscribeToState(
      ({ a, b, c }) => a + b + c,

      (value) => {
        testValue2 = value - 3;
        getRunOnInit2++;

        return (value) => {
          testValue2 = value + 5;
          getRunOnStateChange2++;
        };
      }
    );

    expect(testValue2).toBe(147);
    expect(getRunOnInit2).toBe(1);
    expect(getRunOnStateChange2).toBe(0);

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;
    getRunOnInit2 = 0;
    getRunOnStateChange2 = 0;
    setState(() => ({ a: 15, b: 25, d: 2 }));
    expect(testValue1).toBe(30);
    expect(testValue2).toBe(75);
    expect(getRunOnInit1).toBe(0);
    expect(getRunOnStateChange1).toBe(1);
    expect(getRunOnInit2).toBe(0);
    expect(getRunOnStateChange2).toBe(1);

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;
    getRunOnInit2 = 0;
    getRunOnStateChange2 = 0;
    setState(() => ({ d: 12 }));
    expect(testValue1).toBe(30);
    expect(testValue2).toBe(75);
    expect(getRunOnInit1).toBe(0);
    expect(getRunOnStateChange1).toBe(0);
    expect(getRunOnInit2).toBe(0);
    expect(getRunOnStateChange2).toBe(0);

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;
    getRunOnInit2 = 0;
    getRunOnStateChange2 = 0;
    setState(() => ({ c: 4 }));
    expect(testValue1).toBe(30);
    expect(testValue2).toBe(49);
    expect(getRunOnInit1).toBe(0);
    expect(getRunOnStateChange1).toBe(0);
    expect(getRunOnInit2).toBe(0);
    expect(getRunOnStateChange2).toBe(1);

    subscribeReturn2.unsubscribe();

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;
    getRunOnInit2 = 0;
    getRunOnStateChange2 = 0;
    setState(() => ({ c: 50 }));
    expect(testValue1).toBe(30);
    expect(testValue2).toBe(49);
    expect(getRunOnInit1).toBe(0);
    expect(getRunOnStateChange1).toBe(0);
    expect(getRunOnInit2).toBe(0);
    expect(getRunOnStateChange2).toBe(0);

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;
    getRunOnInit2 = 0;
    getRunOnStateChange2 = 0;
    setState(() => ({ a: 8 }));
    expect(testValue1).toBe(16);
    expect(testValue2).toBe(49);
    expect(getRunOnInit1).toBe(0);
    expect(getRunOnStateChange1).toBe(1);
    expect(getRunOnInit2).toBe(0);
    expect(getRunOnStateChange2).toBe(0);

    subscribeReturn1.unsubscribe();

    getRunOnInit1 = 0;
    getRunOnStateChange1 = 0;
    getRunOnInit2 = 0;
    getRunOnStateChange2 = 0;
    setState(() => ({ a: 1, b: 2, c: 3, d: 4 }));
    expect(testValue1).toBe(16);
    expect(testValue2).toBe(49);
    expect(getRunOnInit1).toBe(0);
    expect(getRunOnStateChange1).toBe(0);
    expect(getRunOnInit2).toBe(0);
    expect(getRunOnStateChange2).toBe(0);
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
    expect(subscription1.mock.calls).toHaveLength(1);

    subscription1.mock.calls = [];
    setState({ a: 1, 3: { foo: 3 }, [symbKey]: 'abc' });
    expect(subscription1.mock.calls).toHaveLength(1);

    subscription1.mock.calls = [];
    setState({ a: 2, 3: {}, [symbKey]: 'xyz' });
    expect(subscription1.mock.calls).toHaveLength(1);

    subscription1.mock.calls = [];
    const subscription2 = jest.fn(() => {});
    resubscribe(subscription2);
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2.mock.calls).toHaveLength(1);

    subscription1.mock.calls = [];
    subscription2.mock.calls = [];
    setState({ a: 8, 3: { bar: 'ty' }, [symbKey]: 'no' });
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2.mock.calls).toHaveLength(1);

    subscription1.mock.calls = [];
    subscription2.mock.calls = [];
    unsubscribe();
    setState({ a: 66, 3: {}, [symbKey]: 'yes' });
    expect(subscription1.mock.calls).toHaveLength(0);
    expect(subscription2.mock.calls).toHaveLength(0);
  });

  test('change of the state with identical primitives does not trigger subscriber', () => {
    let testValue = 0;
    let getRun = 0;

    const { subscribeToState, readState, setState } = createMedama<Record<any, any>>({ a: 1 });

    subscribeToState(
      (s) => ({ ...s }),

      () => () => {
        getRun++;
        testValue++;
      }
    );

    expect(getRun).toBe(0);
    expect(testValue).toBe(0);

    getRun = 0;
    setState(() => ({ a: 2 }));
    expect(readState((state) => ({ ...state }))).toEqual({ a: 2 });
    expect(getRun).toBe(1);
    expect(testValue).toBe(1);

    getRun = 0;
    setState(() => ({ a: 2 }));
    expect(readState((state) => ({ ...state }))).toEqual({ a: 2 });
    expect(getRun).toBe(0);
    expect(testValue).toBe(1);

    getRun = 0;
    setState(() => ({ a: {} }));
    expect(readState((state) => ({ ...state }))).toEqual({ a: {} });
    expect(getRun).toBe(1);
    expect(testValue).toBe(2);

    getRun = 0;
    setState(() => ({ a: {} }));
    expect(readState((state) => ({ ...state }))).toEqual({ a: {} });
    expect(getRun).toBe(1);
    expect(testValue).toBe(3);
  });

  test('extracted state object will not allow to read state outside the selector', () => {
    const { readState, setState, subscribeToState } = createMedama({ a: 1 });

    setState(() => ({ a: 100 }));
    expect(readState((s) => s.a)).toBe(100);

    const stateHandler1 = readState((s) => s);
    expect(() => stateHandler1.a).toThrow(/Medama Error/);

    let stateHandler2: { a: number } | undefined;
    let state: { a: number };

    expect(stateHandler2).toBeUndefined();
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
    let getRunInSelector = 0;

    const { setState, subscribeToState } = createMedama({ a: 1 });

    const { unsubscribe, resubscribe } = subscribeToState(
      ({ a }) => {
        getRunInSelector++;

        return a;
      },

      () => {}
    );

    expect(getRunInSelector).toBe(1);

    getRunInSelector = 0;
    setState(() => ({ a: 100 }));

    expect(getRunInSelector).toBe(1);

    getRunInSelector = 0;
    setState(() => ({ a: 100 }));

    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    setState(() => ({ a: 200 }));
    expect(getRunInSelector).toBe(1);

    getRunInSelector = 0;
    resubscribe(() => {});
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    unsubscribe();
    setState(() => ({ a: 300 }));
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    resubscribe(() => {});
    expect(getRunInSelector).toBe(1);

    getRunInSelector = 0;
    setState(() => ({ a: 400 }));
    expect(getRunInSelector).toBe(1);
  });

  test('multiple subscriptions to one selector will run it once', () => {
    let getRunInSelector = 0;

    const { setState, subscribeToState } = createMedama({ a: 1 });

    const selector = ({ a }: { a: number }) => {
      getRunInSelector++;

      return { newA: a };
    };

    let testValue1!: { newA: number };
    let testValue2!: { newA: number };

    const { unsubscribe: unsubscribe1 } = subscribeToState(selector, (v) => {
      testValue1 = v;
    });
    expect(getRunInSelector).toBe(1);
    expect(testValue1).toEqual({ newA: 1 });

    getRunInSelector = 0;
    const { unsubscribe: unsubscribe2, resubscribe } = subscribeToState(selector, (v) => {
      testValue2 = v;
    });
    expect(getRunInSelector).toBe(0);
    expect(testValue2).toEqual({ newA: 1 });
    expect(testValue2).toBe(testValue1);

    getRunInSelector = 0;
    setState(() => ({ a: 100 }));
    expect(getRunInSelector).toBe(1);
    expect(testValue1).toEqual({ newA: 100 });
    expect(testValue1).toBe(testValue2);

    getRunInSelector = 0;
    unsubscribe1();
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    setState(() => ({ a: 200 }));
    expect(getRunInSelector).toBe(1);
    expect(testValue1).toEqual({ newA: 100 });
    expect(testValue2).toEqual({ newA: 200 });

    getRunInSelector = 0;
    unsubscribe2();
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    setState(() => ({ a: 300 }));
    expect(getRunInSelector).toBe(0);
    expect(testValue1).toEqual({ newA: 100 });
    expect(testValue2).toEqual({ newA: 200 });

    getRunInSelector = 0;
    resubscribe((v) => {
      testValue1 = v;
    });
    expect(getRunInSelector).toBe(1);
    expect(testValue1).toEqual({ newA: 300 });

    getRunInSelector = 0;
    resubscribe((v) => {
      testValue2 = v;
    });
    expect(getRunInSelector).toBe(0);
    expect(testValue2).toEqual({ newA: 300 });
    expect(testValue2).toBe(testValue1);

    getRunInSelector = 0;
    setState(() => ({ a: 400 }));
    expect(getRunInSelector).toBe(1);
    expect(testValue1).toEqual({ newA: 300 });
    expect(testValue2).toEqual({ newA: 400 });
  });

  test('`readState` will not recalculate known selector', () => {
    let getRunInSelector = 0;

    const { readState, setState, subscribeToState } = createMedama({ a: 1 });

    const selector = ({ a }: { a: number }) => {
      getRunInSelector++;

      return { newA: a };
    };

    let testValue: { newA: number } | undefined;

    const { unsubscribe, resubscribe } = subscribeToState(selector, (v) => {
      testValue = v;
    });
    expect(getRunInSelector).toBe(1);
    expect(testValue).toEqual({ newA: 1 });

    getRunInSelector = 0;
    expect(readState(selector)).toEqual({ newA: 1 });
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    setState(() => ({ a: 100 }));
    expect(getRunInSelector).toBe(1);
    expect(testValue).toEqual({ newA: 100 });

    getRunInSelector = 0;
    expect(readState(selector)).toEqual({ newA: 100 });
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    unsubscribe();
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    expect(readState(selector)).toEqual({ newA: 100 });
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    setState(() => ({ a: 200 }));
    expect(getRunInSelector).toBe(0);

    getRunInSelector = 0;
    expect(readState(selector)).toEqual({ newA: 200 });
    expect(getRunInSelector).toBe(1);

    getRunInSelector = 0;
    testValue = undefined;
    resubscribe((v) => {
      testValue = v;
    });

    expect(getRunInSelector).toBe(0);
    expect(testValue).toEqual({ newA: 200 });

    getRunInSelector = 0;
    expect(readState(selector)).toEqual({ newA: 200 });
    expect(getRunInSelector).toBe(0);
  });
});
