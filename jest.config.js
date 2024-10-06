const { createDefaultPreset, pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

const defaultPreset = createDefaultPreset();

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  ...defaultPreset,
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  roots: ["<rootDir>"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  // setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  // globalSetup: "<rootDir>/test/setup.ts",
};