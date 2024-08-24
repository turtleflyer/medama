import type { Config } from 'jest';
import { defaults } from 'jest-config';

const config: Config = {
  ...defaults,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: 'ts-jest',
  resetMocks: true,
  resetModules: true,
  transform: { '.*.ts': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
};

export default config;
