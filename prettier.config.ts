import type { Config } from 'prettier';

const config: Config = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: true,
  parser: 'typescript',
  requirePragma: false,
  insertPragma: false,
  proseWrap: 'always',
  arrowParens: 'always',
  htmlWhitespaceSensitivity: 'css',
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  embeddedLanguageFormatting: 'auto',
  singleAttributePerLine: false,
  experimentalTernaries: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
};

export default config;
