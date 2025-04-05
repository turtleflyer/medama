// @ts-expect-error build package without type declarations
import { composeMedama, isComposite } from '../../dist/cjs';
import { compositeMedamaSpecificTest } from './composeMedamaSpecific.testcases';
import { medamaGuarantiesTest } from './medamaGuaranties.testcases';
import { compositeMedamaWithNestedLayers } from './nestedLayers.testcases';

medamaGuarantiesTest(composeMedama);
compositeMedamaSpecificTest(composeMedama);
compositeMedamaWithNestedLayers(composeMedama, isComposite);
