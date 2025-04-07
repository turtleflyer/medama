/* eslint-disable @typescript-eslint/no-unused-vars */
import { createMedama, type Pupil } from '..';
import type { IsEqual, IsTrue } from '../IsEqual';

const symbKey = Symbol('symbKey');

describe('medama types tests', () => {
  test('createMedama with implicitly defined state and no init part works correctly', () => {
    () => {
      const { pupil } = createMedama<{ a: boolean; 1: string; [symbKey]: number }>();

      type TestCase = IsTrue<
        IsEqual<typeof pupil, Pupil<{ a: boolean; 1: string; [symbKey]: number }>>
      >;
    };
  });

  test('createMedama with implicitly defined state and full init part works correctly', () => {
    () => {
      const { pupil } = createMedama<{ a: boolean; 1: string; [symbKey]: number }>({
        a: true,
        1: 'go',
        [symbKey]: 100,
      });

      type TestCase = IsTrue<
        IsEqual<typeof pupil, Pupil<{ a: boolean; 1: string; [symbKey]: number }>>
      >;
    };

    () =>
      createMedama<{ a: boolean; 1: string; [symbKey]: number }>({
        //@ts-expect-error a: boolean
        a: -1,
        1: 'go',
        [symbKey]: 100,
      });
  });

  test('createMedama with implicitly defined state and partial init part works correctly', () => {
    () => {
      const { pupil } = createMedama<{ a: boolean; 1: string; [symbKey]: number }>({
        a: true,
        [symbKey]: 100,
      });

      type TestCase = IsTrue<
        IsEqual<typeof pupil, Pupil<{ a: boolean; 1: string; [symbKey]: number }>>
      >;
    };

    () =>
      createMedama<{ a: boolean; 1: string; [symbKey]: number }>({
        //@ts-expect-error a: boolean
        a: -1,
        [symbKey]: 100,
      });
  });

  test('createMedama with implied state and no init part works correctly', () => {
    () => {
      const { pupil } = createMedama();

      type TestCase = IsTrue<IsEqual<typeof pupil, Pupil<object>>>;
    };
  });

  test('createMedama with implied state and init part works correctly', () => {
    () => {
      const { pupil } = createMedama({
        a: true,
        1: 'go',
        [symbKey]: 100,
      });

      type TestCase = IsTrue<
        IsEqual<typeof pupil, Pupil<{ a: boolean; 1: string; [symbKey]: number }>>
      >;
    };
  });
});
