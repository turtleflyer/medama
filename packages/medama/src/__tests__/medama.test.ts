import { createMedama, selectStateEntriesChanged } from '..';
import { medamaGuarantiesTest } from './medamaGuaranties.testcases';
import { medamaSpecificTest } from './medamaSpecific.testcases';

medamaGuarantiesTest(createMedama);
medamaSpecificTest(createMedama, selectStateEntriesChanged);
