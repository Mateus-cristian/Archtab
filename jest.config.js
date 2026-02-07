const dotenv = require("dotenv");

dotenv.config({
  path: ".env.development",
});

console.log(process.env.NODE_ENV);

const nextJest = require("next/jest");

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  dir: ".",
});

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testTimeout: 60000,
});

module.exports = jestConfig;
