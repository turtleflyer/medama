import { createMedama } from 'medama';

test('@medama/medama', () => {
  expect(createMedama).not.toBeUndefined();
});
