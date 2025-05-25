import { createMedama, selectStateEntriesChanged } from '..';
import { medamaTest } from './medama.testcases';

medamaTest(createMedama, selectStateEntriesChanged);
