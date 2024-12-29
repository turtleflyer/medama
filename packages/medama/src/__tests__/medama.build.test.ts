// @ts-expect-error build package without type declarations
import { createMedama } from '../../dist/cjs';
import type { CreateMedama } from '../../dist/types/medama.types';
import { medamaTest } from './medama.testcases';

medamaTest(createMedama as CreateMedama);
