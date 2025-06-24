import type { Config } from 'jest';
import rootConfig from '../../jest.config';

const config: Config = {
  ...rootConfig,
  testMatch: ['**/__tests__/**/*.build.test.ts'],
};

export default config;
