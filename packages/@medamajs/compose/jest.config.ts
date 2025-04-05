import type { Config } from 'jest';
import rootConfig from '../../../jest.config';

const config: Config = {
  ...rootConfig,

  moduleNameMapper: {
    '^medama$': '<rootDir>/../../medama/src',
  },
};

export default config;
