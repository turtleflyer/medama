// @ts-expect-error build package without type declarations
import { createMedama } from '../../dist/cjs';

test('@medama/medama', () => {
  expect(createMedama).not.toBeUndefined();
});
