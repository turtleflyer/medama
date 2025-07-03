// @ts-expect-error build package without type declarations
import { createMedama, selectStateEntriesChanged } from '../../dist/cjs';
import { medamaGuarantiesTest } from './medamaGuaranties.testcases';
import { medamaSpecificTest } from './medamaSpecific.testcases';

medamaGuarantiesTest(createMedama);
medamaSpecificTest(createMedama, selectStateEntriesChanged);
