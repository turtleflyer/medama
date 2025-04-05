import { composeMedama, isComposite } from '../composeMedama';
import { compositeMedamaSpecificTest } from './composeMedamaSpecific.testcases';
import { medamaGuarantiesTest } from './medamaGuaranties.testcases';
import { compositeMedamaWithNestedLayers } from './nestedLayers.testcases';

medamaGuarantiesTest(composeMedama);
compositeMedamaSpecificTest(composeMedama);
compositeMedamaWithNestedLayers(composeMedama, isComposite);
