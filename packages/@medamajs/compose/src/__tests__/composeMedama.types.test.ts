/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createMedama } from 'medama';
import { composeMedama, type CompositePupil, type CompositeState, type DeleteLayers } from '..';
import type { IsEqual, IsTrue } from '../IsEqual';

const symbKey = Symbol('symbKey');

describe('types for medama layer', () => {
  test('`composeMedama` with implicitly defined composite state containing shallow layers and no init part works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>({ a: createMedama(), 22: createMedama(), [symbKey]: createMedama() });

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: { aa: boolean; 3: object };
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        // @ts-expect-error missing 22
        { a: createMedama(), [symbKey]: createMedama() }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing shallow layers and full init part works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      { a: createMedama(), 22: createMedama(), [symbKey]: createMedama() },

      {
        a: { 1: 'go', [symbKey]: 100 },
        22: { aa: false, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: { aa: boolean; 3: object };
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        { a: createMedama(), 22: createMedama(), [symbKey]: createMedama() },

        {
          // @ts-expect-error 1: string
          a: { 1: true, [symbKey]: 100 },
          22: { aa: false, 3: { foo: 4 } },

          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing shallow layers and partial init part works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      { a: createMedama(), 22: createMedama(), [symbKey]: createMedama() },

      {
        a: { 1: 'go' },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: { aa: boolean; 3: object };
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        { a: createMedama(), 22: createMedama(), [symbKey]: createMedama() },

        {
          // @ts-expect-error 1: string
          a: { 1: true },

          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing shallow layers, partial init part, and implicitly defined `createMedama` works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),
        22: createMedama<{ aa: boolean; 3: object }>(),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go' },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: { aa: boolean; 3: object };
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        {
          // @ts-expect-error missing [symbKey]
          a: createMedama<{ 1: string }>(),

          // @ts-expect-error 3: object
          22: createMedama<{ aa: boolean; 3: { foo: 2 } }>(),

          // @ts-expect-error wrong type
          [symbKey]: createMedama<{ foo: 2 }>(),
        },

        {
          a: { 1: 'go' },
          [symbKey]: { bb: { 44: 200, cc: true } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing shallow layers, partial init part, and some implicitly defined `createMedama` works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),
        22: createMedama(),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go' },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;
  });

  test('`composeMedama` with implied composite state containing shallow layers and no init part works correctly', () => {
    const { pupil } = composeMedama({
      a: createMedama(),
      22: createMedama(),
      [symbKey]: createMedama(),
    });

    type TestCase = IsTrue<
      IsEqual<typeof pupil, CompositePupil<{ a: object; 22: object; [symbKey]: object }>>
    >;
  });

  test('`composeMedama` with implied composite state containing shallow layers and init part works correctly', () => {
    const { pupil: pupil1 } = composeMedama(
      { a: createMedama(), 22: createMedama(), [symbKey]: createMedama() },

      {
        a: { 1: 'go', [symbKey]: 100 },
        22: { aa: false, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: { foo: number } };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama(
      { a: createMedama(), 22: createMedama(), [symbKey]: createMedama() },

      {
        a: { 1: 'go', [symbKey]: 100 },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: object;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;
  });

  test('`composeMedama` with implied composite state containing shallow layers, no init part, and implicitly defined `createMedama` works correctly', () => {
    const { pupil } = composeMedama({
      a: createMedama<{ 1: string; [symbKey]: number }>(),
      22: createMedama<{ aa: boolean; 3: object }>(),
      [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
    });

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;
  });

  test('`composeMedama` with implied composite state containing shallow layers, init part, and implicitly defined `createMedama` works correctly', () => {
    const { pupil } = composeMedama(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),
        22: createMedama<{ aa: boolean; 3: object }>(),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go', [symbKey]: 100 },
        22: { aa: false, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: { foo: number } };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),
          22: createMedama<{ aa: boolean; 3: object }>(),
          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          // @ts-expect-error 1: string
          a: { 1: true, [symbKey]: 100 },
          22: { aa: false, 3: { foo: 4 } },
          [symbKey]: { bb: { 44: 200, cc: true } },
        }
      );

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),
          22: createMedama<{ aa: boolean; 3: object }>(),
          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          a: { 1: 'go', [symbKey]: 100 },
          22: { aa: false, 3: { foo: 4 } },

          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implied composite state containing shallow layers, partial init part, and some implicitly defined `createMedama` works correctly', () => {
    const { pupil: pupil1 } = composeMedama(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),
        22: createMedama(),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go' },
        22: { aa: false, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: { foo: number } };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),
        22: createMedama(),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: object;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),
          22: createMedama(),
          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          // @ts-expect-error 1: string
          a: { 1: true, [symbKey]: 100 },
          [symbKey]: { bb: { 44: 200, cc: true } },
        }
      );

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),
          22: createMedama(),
          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing nested layers and no init part works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: CompositeState<{ aa: { foo: number }; 3: object }>;
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>({
      a: createMedama(),
      22: composeMedama({ aa: createMedama(), 3: createMedama() }),
      [symbKey]: createMedama(),
    });

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: object }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: object }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        // @ts-expect-error missing 22
        { a: createMedama(), [symbKey]: createMedama() }
      );

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: object }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        // @ts-expect-error missing [symbKey]
        {
          a: createMedama(),
          22: composeMedama({ aa: createMedama(), 3: createMedama() }),
        }
      );

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: object }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>({
        a: createMedama(),

        // @ts-expect-error missing 3
        22: composeMedama({ aa: createMedama() }),
        [symbKey]: createMedama(),
      });
  });

  test('`composeMedama` with implicitly defined composite state containing nested layers and full init part works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: CompositeState<{ aa: { foo: number }; 3: object }>;
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      {
        a: createMedama(),
        22: composeMedama({ aa: createMedama(), 3: createMedama() }),
        [symbKey]: createMedama(),
      },

      {
        a: { 1: 'go', [symbKey]: 100 },
        22: { aa: { foo: 7 }, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: object }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: object }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        {
          a: createMedama(),
          22: composeMedama({ aa: createMedama(), 3: createMedama() }),
          [symbKey]: createMedama(),
        },

        {
          // @ts-expect-error 1: string
          a: { 1: true, [symbKey]: 100 },

          // @ts-expect-error aa: { foo: number }
          22: { aa: false, 3: { foo: 4 } },

          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing nested layers and partial init part works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      {
        a: createMedama(),
        22: composeMedama({ aa: createMedama(), 3: createMedama() }),
        [symbKey]: createMedama(),
      },

      {
        a: { 1: 'go' },
        22: { 3: { foo: 1 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        {
          a: createMedama(),
          22: composeMedama({ aa: createMedama(), 3: createMedama() }),
          [symbKey]: createMedama(),
        },

        {
          // @ts-expect-error 1: string
          a: { 1: true },

          // @ts-expect-error bar: string
          22: { 3: { bar: 1 } },

          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing nested layers, partial init part, and implicitly defined `createMedama` and nested `composeMedama` works correctly', () => {
    const { pupil } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),

        22: composeMedama<{ aa: { foo: number }; 3: { foo: number; bar: string } }>({
          aa: createMedama(),
          3: createMedama(),
        }),

        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go' },
        22: { 3: { foo: 1 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>({
        a: createMedama<{ 1: string; [symbKey]: number }>(),

        // @ts-expect-error composite state
        22: createMedama<{ aa: { foo: number }; 3: { foo: number; bar: string } }>(),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      });

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: object }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>({
        a: createMedama<{ 1: string; [symbKey]: number }>(),

        22: composeMedama<{ aa: { foo: number }; 3: { foo: number; bar: string } }>({
          aa: createMedama(),
          3: createMedama(),
        }),

        // it is allowed to use a state with layers instead of a plain state
        [symbKey]: composeMedama<{ bb: { 44: number; cc: boolean } }>({ bb: createMedama() }),
      });

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        {
          // @ts-expect-error missing [symbKey]
          a: createMedama<{ 1: string }>(),

          // @ts-expect-error bar: string
          22: composeMedama<{ aa: { foo: number }; 3: { foo: number; bar: number } }>({
            aa: createMedama(),
            3: createMedama(),
          }),

          // @ts-expect-error wrong type
          [symbKey]: createMedama<{ foo: 2 }>(),
        },

        {
          a: { 1: 'go' },
          [symbKey]: { bb: { 44: 200, cc: true } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing nested layers, partial init part, and some implicitly defined `createMedama` and nested `composeMedama` works correctly', () => {
    const { pupil: pupil1 } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),

        22: composeMedama<{ aa: { foo: number }; 3: { foo: number; bar: string } }>({
          aa: createMedama(),
          3: createMedama(),
        }),

        [symbKey]: createMedama(),
      },

      {
        a: { 1: 'go' },
        22: { 3: { foo: 1 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama<{
      a: { 1: string; [symbKey]: number };
      22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),
        22: composeMedama({ aa: createMedama(), 3: createMedama() }),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go' },
        22: { 3: { foo: 1 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: { 1: string; [symbKey]: number };
        22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),

          // @ts-expect-error missing 3
          22: composeMedama({ aa: createMedama() }),
          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          a: { 1: 'go' },
          22: { 3: { foo: 1 } },
          [symbKey]: { bb: { 44: 200, cc: true } },
        }
      );
  });

  test('`composeMedama` with implied composite state containing nested layers and no init part works correctly', () => {
    const { pupil } = composeMedama({
      a: createMedama(),
      22: composeMedama({ aa: createMedama(), 3: createMedama() }),
      [symbKey]: createMedama(),
    });

    type TestCase = IsTrue<
      IsEqual<
        typeof pupil,
        CompositePupil<{
          a: object;
          22: CompositeState<{ aa: object; 3: object }>;
          [symbKey]: object;
        }>
      >
    >;
  });

  test('`composeMedama` with implied composite state containing nested layers and init part works correctly', () => {
    const { pupil: pupil1 } = composeMedama(
      {
        a: createMedama(),
        22: composeMedama({ aa: createMedama(), 3: createMedama() }),
        [symbKey]: createMedama(),
      },

      {
        a: { 1: 'go', [symbKey]: 100 },
        22: { aa: { foo: 7 }, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { foo: number } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama(
      {
        a: createMedama(),
        22: composeMedama({ aa: createMedama(), 3: createMedama() }),
        [symbKey]: createMedama(),
      },

      {
        a: { 1: 'go', [symbKey]: 100 },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: object; 3: object }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;
  });

  test('`composeMedama` with implied composite state containing nested layers, no init part, and implicitly defined `createMedama` and nested `composeMedama` works correctly', () => {
    const { pupil: pupil1 } = composeMedama({
      a: createMedama<{ 1: string; [symbKey]: number }>(),

      22: composeMedama<{ aa: { foo: number }; 3: object }>({
        aa: createMedama(),
        3: createMedama(),
      }),

      [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
    });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: object }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama({
      a: createMedama<{ 1: string; [symbKey]: number }>(),

      22: composeMedama({
        aa: createMedama<{ foo: number }>(),
        3: createMedama<{ bar: string }>(),
      }),

      [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
    });

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { bar: string } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;
  });

  test('`composeMedama` with implied composite state containing nested layers, init part, and implicitly defined `createMedama` and nested `composeMedama` works correctly', () => {
    const { pupil: pupil1 } = composeMedama(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),

        22: composeMedama<{ aa: { foo: number }; 3: object }>({
          aa: createMedama(),
          3: createMedama(),
        }),

        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go', [symbKey]: 100 },
        22: { aa: { foo: 7 }, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { foo: number } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;
    const { pupil: pupil2 } = composeMedama(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),

        22: composeMedama({
          aa: createMedama<{ foo: number }>(),
          3: createMedama<{ bar: string }>(),
        }),

        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go', [symbKey]: 100 },
        22: { aa: { foo: 7 }, 3: { bar: 'ah' } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { bar: string } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),

          22: composeMedama<{ aa: { foo: number }; 3: object }>({
            aa: createMedama(),
            3: createMedama(),
          }),

          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          // @ts-expect-error 1: string
          a: { 1: true, [symbKey]: 100 },
          22: { aa: { foo: 7 }, 3: { foo: 4 } },
          [symbKey]: { bb: { 44: 200, cc: true } },
        }
      );

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),

          22: composeMedama<{ aa: { foo: number }; 3: object }>({
            aa: createMedama(),
            3: createMedama(),
          }),

          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          a: { 1: 'go', [symbKey]: 100 },
          22: { aa: { foo: 7 }, 3: { foo: 4 } },

          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implied composite state containing nested layers, partial init part, and some implicitly defined `createMedama` and nested `composeMedama` works correctly', () => {
    const { pupil: pupil1 } = composeMedama(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),

        22: composeMedama<{ aa: { foo: number }; 3: { foo: number; bar: string } }>({
          aa: createMedama(),
          3: createMedama(),
        }),

        [symbKey]: createMedama(),
      },

      {
        a: { 1: 'go' },
        22: { 3: { foo: 1 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: { foo: number }; 3: { foo: number; bar: string } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama(
      {
        a: createMedama<{ 1: string; [symbKey]: number }>(),
        22: composeMedama({ aa: createMedama(), 3: createMedama() }),
        [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
      },

      {
        a: { 1: 'go' },
        22: { 3: { foo: 1 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: CompositeState<{ aa: object; 3: { foo: number } }>;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),

          22: composeMedama<{ aa: { foo: number }; 3: { foo: number; bar: string } }>({
            aa: createMedama(),
            3: createMedama(),
          }),

          [symbKey]: createMedama(),
        },

        {
          // @ts-expect-error 1: string
          a: { 1: true, [symbKey]: 100 },
          [symbKey]: { bb: { 44: 200, cc: true } },
        }
      );

    () =>
      composeMedama(
        {
          a: createMedama<{ 1: string; [symbKey]: number }>(),
          22: composeMedama({ aa: createMedama(), 3: createMedama() }),
          [symbKey]: createMedama<{ bb: { 44: number; cc: boolean } }>(),
        },

        {
          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('`composeMedama` with implicitly defined composite state containing multi-level nested layers and no init part works correctly', () => {
    const { pupil: pupil1 } = composeMedama<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
      22: { bar: number };
    }>({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
      }),

      22: createMedama(),
    });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
      22: { bar: number };
    }>({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>({
          bb: createMedama(),
          cc: createMedama(),
        }),
      }),

      22: createMedama(),
    });

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: CompositeState<{
          1: { foo: string };
          [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
        }>;
        22: { bar: number };
      }>({
        // @ts-expect-error missing cc
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama() }),
        }),

        22: createMedama(),
      });

    () =>
      composeMedama<{
        a: CompositeState<{
          1: { foo: string };
          [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
        }>;
        22: { bar: number };
      }>({
        // @ts-expect-error qux: string
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama<{ bb: { baz: boolean; qux: boolean }; cc: { quux: number } }>({
            bb: createMedama(),
            cc: createMedama(),
          }),
        }),

        22: createMedama(),
      });
  });

  test('`composeMedama` with implicitly defined composite state containing multi-level nested layers and init part works correctly', () => {
    const { pupil: pupil1 } = composeMedama<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
      22: { bar: number };
    }>(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),

        22: createMedama(),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { bb: { baz: true, qux: 'no' }, cc: { quux: 7 } } },
        22: { bar: 100 },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
      22: { bar: number };
    }>(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),

        22: createMedama(),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { cc: { quux: 7 } } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    () =>
      composeMedama<{
        a: CompositeState<{
          1: { foo: string };
          [symbKey]: CompositeState<{
            bb: { baz: boolean; qux: string };
            cc: { quux: { 33: number; dd: boolean } };
          }>;
        }>;
        22: { bar: number };
      }>(
        {
          a: composeMedama({
            1: createMedama(),
            [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
          }),

          22: createMedama(),
        },

        {
          a: {
            [symbKey]: {
              cc: {
                // @ts-expect-error 33 missing
                quux: { dd: false },
              },
            },
          },
        }
      );
  });

  test('`composeMedama` with implied composite state containing multi-level nested layers and no init part works correctly', () => {
    const { pupil: pupil1 } = composeMedama({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
      }),

      22: createMedama(),
    });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: CompositeState<{ 1: object; [symbKey]: CompositeState<{ bb: object; cc: object }> }>;
          22: object;
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>({
          bb: createMedama(),
          cc: createMedama(),
        }),
      }),

      22: createMedama(),
    });

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: object;
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
          22: object;
        }>
      >
    >;
  });

  test('`composeMedama` with implied composite state containing multi-level nested layers and init part works correctly', () => {
    const { pupil: pupil1 } = composeMedama(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),

        22: createMedama(),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { bb: { baz: true, qux: 'no' }, cc: { quux: 7 } } },
        22: { bar: 100 },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil2 } = composeMedama(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),

        22: createMedama(),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { cc: { quux: 7 } } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: object; cc: { quux: number } }>;
          }>;
          22: object;
        }>
      >
    >;

    const { pupil: pupil3 } = composeMedama(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),

        22: createMedama<{ bar: number }>(),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { cc: { quux: 7 } } },
      }
    );

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil3,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: object; cc: { quux: number } }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    () =>
      composeMedama(
        {
          a: composeMedama<{
            1: { foo: string };
            [symbKey]: CompositeState<{
              bb: { baz: boolean; qux: string };
              cc: { quux: { 33: number; dd: boolean } };
            }>;
          }>({
            1: createMedama(),
            [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
          }),

          22: createMedama(),
        },

        {
          a: {
            [symbKey]: {
              cc: {
                // @ts-expect-error 33 missing
                quux: { dd: false },
              },
            },
          },
        }
      );

    () =>
      composeMedama(
        {
          a: composeMedama({
            1: createMedama(),
            [symbKey]: composeMedama<{
              bb: { baz: boolean; qux: string };
              cc: { quux: { 33: number; dd: boolean } };
            }>({ bb: createMedama(), cc: createMedama() }),
          }),

          22: createMedama(),
        },

        {
          a: {
            [symbKey]: {
              cc: {
                // @ts-expect-error 33 missing
                quux: { dd: false },
              },
            },
          },
        }
      );
  });

  test('adding implicitly defined shallow layers with no init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama<{
      a: { 1: string; [symbKey]: number };
    }>({ a: createMedama() });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil_o,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
        }>
      >
    >;

    const { pupil: pupil_a } = addLayers<{
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>({ 22: createMedama(), [symbKey]: createMedama() });

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      addLayers<{
        22: { aa: boolean; 3: object };
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        // @ts-expect-error missing 22
        { [symbKey]: createMedama() }
      );
  });

  test('adding implicitly defined shallow layers with init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama<{
      a: { 1: string; [symbKey]: number };
    }>({ a: createMedama() });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil_o,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
        }>
      >
    >;

    const { pupil: pupil_a1 } = addLayers<{
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      { 22: createMedama(), [symbKey]: createMedama() },

      {
        22: { aa: false, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil_a2 } = addLayers<{
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      { 22: createMedama(), [symbKey]: createMedama() },

      {
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil_a2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil_a3 } = addLayers<{
      22: { aa: boolean; 3: object };
      [symbKey]: { bb: { 44: number; cc: boolean } };
    }>(
      { 22: createMedama<{ aa: boolean; 3: object }>(), [symbKey]: createMedama() },

      {
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase4 = IsTrue<
      IsEqual<
        typeof pupil_a3,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      addLayers<{
        22: { aa: boolean; 3: object };
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        { 22: createMedama(), [symbKey]: createMedama() },

        {
          // @ts-expect-error aa: boolean
          22: { aa: 3, 3: { foo: 4 } },

          // @ts-expect-error bb: Required
          [symbKey]: { bb: { 44: 200 } },
        }
      );

    () =>
      addLayers<{
        22: { aa: boolean; 3: object };
        [symbKey]: { bb: { 44: number; cc: boolean } };
      }>(
        {
          // @ts-expect-error 3: object
          22: createMedama<{ aa: boolean; 3: { foo: 2 } }>(),

          // @ts-expect-error wrong type
          [symbKey]: createMedama<{ foo: 2 }>(),
        },

        { [symbKey]: { bb: { 44: 200, cc: true } } }
      );
  });

  test('adding implied shallow layers with no init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama<{
      a: { 1: string; [symbKey]: number };
    }>({ a: createMedama() });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil_o,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
        }>
      >
    >;

    const { pupil: pupil_a } = addLayers({ 22: createMedama(), [symbKey]: createMedama() });

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: object;
          [symbKey]: object;
        }>
      >
    >;
  });

  test('adding implied shallow layers with init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama<{
      a: { 1: string; [symbKey]: number };
    }>({ a: createMedama() });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof pupil_o,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
        }>
      >
    >;

    const { pupil: pupil_a1 } = addLayers(
      { 22: createMedama(), [symbKey]: createMedama() },

      {
        22: { aa: false, 3: { foo: 4 } },
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a1,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: { foo: number } };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil_a2 } = addLayers(
      { 22: createMedama(), [symbKey]: createMedama() },

      {
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil_a2,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: object;
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    const { pupil: pupil_a3 } = addLayers(
      { 22: createMedama<{ aa: boolean; 3: object }>(), [symbKey]: createMedama() },

      {
        [symbKey]: { bb: { 44: 200, cc: true } },
      }
    );

    type TestCase4 = IsTrue<
      IsEqual<
        typeof pupil_a3,
        CompositePupil<{
          a: { 1: string; [symbKey]: number };
          22: { aa: boolean; 3: object };
          [symbKey]: { bb: { 44: number; cc: boolean } };
        }>
      >
    >;

    () =>
      // @ts-expect-error aa: boolean
      addLayers(
        { 22: createMedama<{ aa: boolean; 3: object }>(), [symbKey]: createMedama() },

        {
          22: { aa: 3, 3: { foo: 4 } },
          [symbKey]: { bb: { 44: 200 } },
        }
      );
  });

  test('adding implicitly defined multi-level nested layers with no init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama<{
      22: { bar: number };
    }>({ 22: createMedama() });

    type TestCase1 = IsTrue<IsEqual<typeof pupil_o, CompositePupil<{ 22: { bar: number } }>>>;

    const { pupil: pupil_a1 } = addLayers<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
    }>({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
      }),
    });

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a1,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil_a2 } = addLayers<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
    }>({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>({
          bb: createMedama(),
          cc: createMedama(),
        }),
      }),
    });

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil_a2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    () =>
      addLayers<{
        a: CompositeState<{
          1: { foo: string };
          [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
        }>;
      }>({
        // @ts-expect-error missing cc
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama() }),
        }),
      });

    () =>
      addLayers<{
        a: CompositeState<{
          1: { foo: string };
          [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
        }>;
      }>({
        // @ts-expect-error qux: string
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama<{ bb: { baz: boolean; qux: boolean }; cc: { quux: number } }>({
            bb: createMedama(),
            cc: createMedama(),
          }),
        }),
      });
  });

  test('adding implicitly defined multi-level nested layers with init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama<{
      22: { bar: number };
    }>({ 22: createMedama() });

    type TestCase1 = IsTrue<IsEqual<typeof pupil_o, CompositePupil<{ 22: { bar: number } }>>>;

    const { pupil: pupil_a1 } = addLayers<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
    }>(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { bb: { baz: true, qux: 'no' }, cc: { quux: 7 } } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a1,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil_a2 } = addLayers<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
    }>(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { cc: { quux: 7 } } },
      }
    );

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil_a2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    () =>
      addLayers<{
        a: CompositeState<{
          1: { foo: string };
          [symbKey]: CompositeState<{
            bb: { baz: boolean; qux: string };
            cc: { quux: { 33: number; dd: boolean } };
          }>;
        }>;
      }>(
        {
          a: composeMedama({
            1: createMedama(),
            [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
          }),
        },

        {
          a: {
            [symbKey]: {
              cc: {
                // @ts-expect-error 33 missing
                quux: { dd: false },
              },
            },
          },
        }
      );
  });

  test('adding implied multi-level nested layers with no init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama({ 22: createMedama() });

    type TestCase1 = IsTrue<IsEqual<typeof pupil_o, CompositePupil<{ 22: object }>>>;

    const { pupil: pupil_a1 } = addLayers({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
      }),
    });

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a1,
        CompositePupil<{
          a: CompositeState<{ 1: object; [symbKey]: CompositeState<{ bb: object; cc: object }> }>;
          22: object;
        }>
      >
    >;

    const { pupil: pupil_a2 } = addLayers({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>({
          bb: createMedama(),
          cc: createMedama(),
        }),
      }),
    });

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil_a2,
        CompositePupil<{
          a: CompositeState<{
            1: object;
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
          22: object;
        }>
      >
    >;
  });

  test('adding implied multi-level nested layers with init part works correctly', () => {
    const { pupil: pupil_o, addLayers } = composeMedama(
      { 22: createMedama() },
      { 22: { bar: 100 } }
    );

    type TestCase1 = IsTrue<IsEqual<typeof pupil_o, CompositePupil<{ 22: { bar: number } }>>>;

    const { pupil: pupil_a1 } = addLayers(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { cc: { quux: 7 } } },
      }
    );

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil_a1,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: object; cc: { quux: number } }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil_a2 } = addLayers(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama<{ bb: object; cc: { quux: number } }>({
            bb: createMedama(),
            cc: createMedama(),
          }),
        }),
      },

      {
        a: { 1: { foo: 'go' }, [symbKey]: { cc: { quux: 7 } } },
      }
    );

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil_a2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: object; cc: { quux: number } }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    () =>
      // @ts-expect-error 33 missing
      addLayers(
        {
          a: composeMedama<{
            1: { foo: string };
            [symbKey]: CompositeState<{
              bb: { baz: boolean; qux: string };
              cc: { quux: { 33: number; dd: boolean } };
            }>;
          }>({
            1: createMedama(),
            [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
          }),
        },

        {
          a: {
            [symbKey]: {
              cc: {
                quux: { dd: false },
              },
            },
          },
        }
      );

    () =>
      // @ts-expect-error 33 missing
      addLayers(
        {
          a: composeMedama({
            1: createMedama(),
            [symbKey]: composeMedama<{
              bb: { baz: boolean; qux: string };
              cc: { quux: { 33: number; dd: boolean } };
            }>({ bb: createMedama(), cc: createMedama() }),
          }),
        },

        {
          a: {
            [symbKey]: {
              cc: {
                quux: { dd: false },
              },
            },
          },
        }
      );
  });

  test('deleting individual layers in composite state created by `composeMedama` with implicitly defined state works correctly', () => {
    const { deleteLayers } = composeMedama<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
      [symbKey]: { quux: object };
      22: { bar: number };
    }>({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
      }),

      [symbKey]: createMedama(),
      22: createMedama(),
    });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof deleteLayers,
        DeleteLayers<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          [symbKey]: { quux: object };
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil1 } = deleteLayers('a');

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          [symbKey]: { quux: object };
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil2 } = deleteLayers(symbKey);

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil3 } = deleteLayers(22);

    type TestCase4 = IsTrue<
      IsEqual<
        typeof pupil3,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          [symbKey]: { quux: object };
        }>
      >
    >;
  });

  test('deleting group of layers in composite state created by `composeMedama` with implicitly defined state works correctly', () => {
    const { deleteLayers } = composeMedama<{
      a: CompositeState<{
        1: { foo: string };
        [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
      }>;
      [symbKey]: { quux: object };
      22: { bar: number };
    }>({
      a: composeMedama({
        1: createMedama(),
        [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
      }),

      [symbKey]: createMedama(),
      22: createMedama(),
    });

    type TestCase1 = IsTrue<
      IsEqual<
        typeof deleteLayers,
        DeleteLayers<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
          [symbKey]: { quux: object };
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil1 } = deleteLayers(['a', symbKey]);

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil2 } = deleteLayers([22, symbKey]);

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: object }>;
          }>;
        }>
      >
    >;
  });

  test('deleting individual layers in composite state created by `composeMedama` with implied state works correctly', () => {
    const { deleteLayers } = composeMedama(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),

        [symbKey]: createMedama(),
        22: createMedama(),
      },
      {
        a: { 1: { foo: 'go' }, [symbKey]: { bb: { baz: true, qux: 'no' }, cc: { quux: 7 } } },
        22: { bar: 100 },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof deleteLayers,
        DeleteLayers<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
          [symbKey]: object;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil1 } = deleteLayers('a');

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          [symbKey]: object;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil2 } = deleteLayers(symbKey);

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil3 } = deleteLayers(22);

    type TestCase4 = IsTrue<
      IsEqual<
        typeof pupil3,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
          [symbKey]: object;
        }>
      >
    >;
  });

  test('deleting group of layers in composite state created by `composeMedama` with implied state works correctly', () => {
    const { deleteLayers } = composeMedama(
      {
        a: composeMedama({
          1: createMedama(),
          [symbKey]: composeMedama({ bb: createMedama(), cc: createMedama() }),
        }),

        [symbKey]: createMedama(),
        22: createMedama(),
      },
      {
        a: { 1: { foo: 'go' }, [symbKey]: { bb: { baz: true, qux: 'no' }, cc: { quux: 7 } } },
        22: { bar: 100 },
      }
    );

    type TestCase1 = IsTrue<
      IsEqual<
        typeof deleteLayers,
        DeleteLayers<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
          [symbKey]: object;
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil1 } = deleteLayers(['a', symbKey]);

    type TestCase2 = IsTrue<
      IsEqual<
        typeof pupil1,
        CompositePupil<{
          22: { bar: number };
        }>
      >
    >;

    const { pupil: pupil2 } = deleteLayers([22, symbKey]);

    type TestCase3 = IsTrue<
      IsEqual<
        typeof pupil2,
        CompositePupil<{
          a: CompositeState<{
            1: { foo: string };
            [symbKey]: CompositeState<{ bb: { baz: boolean; qux: string }; cc: { quux: number } }>;
          }>;
        }>
      >
    >;
  });

  test('types work with state type going down from generic binding of function', () => {
    function testCase1<State extends object, Add extends object>() {
      const { addLayers, pupil } = composeMedama({ foo: createMedama<State>() });

      const v1 = pupil.readState((state) => state.foo);

      const { pupil: newPupil } = addLayers({ bar: createMedama<Add>() });

      const v2 = newPupil.readState((state) => state.bar);
    }

    function testCase2<
      State extends { a: 1; 22: string; [symbKey]: { go: true } },
      Add extends { 77: boolean },
    >() {
      const { addLayers, pupil } = composeMedama({ foo: createMedama<State>() });

      const v1 = pupil.readState((state) => state.foo[symbKey]);

      const { pupil: newPupil } = addLayers({ bar: createMedama<Add>() });

      const v2 = newPupil.readState((state) => state.bar[77]);
    }

    function testCase3<State extends { a: 1; 22: string; [symbKey]: object }>() {
      const { pupil } = composeMedama<{ foo: State }, {}>(
        { foo: createMedama() },
        { foo: { a: 1, 22: 'hi', [symbKey]: {} } }
      );
    }
  });
});
