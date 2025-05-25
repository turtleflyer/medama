// @ts-expect-error build package without type declarations
import { createMedama, selectStateEntriesChanged } from '../../dist/cjs';
import { medamaTest } from './medama.testcases';

medamaTest(createMedama, selectStateEntriesChanged);
