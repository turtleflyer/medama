import type { Config } from 'jest';
import rootConfig from '../../../jest.config';

const config: Config = {
  ...rootConfig,

  moduleNameMapper: {
    '^medama$': '<rootDir>/../../medama/src',

    '^medama/queue-and-selector-management$':
      '<rootDir>/../../medama/src/queue-and-selector-management',
  },
};

export default config;
