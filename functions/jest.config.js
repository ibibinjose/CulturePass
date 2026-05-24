/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  testMatch: [
    "**/src/**/*.test.ts",
    "**/shared/schema/**/*.test.ts"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/lib/",
    "/shared/dist/",
    "\\.d\\.ts$"
  ],
  modulePathIgnorePatterns: [
    "/dist/",
    "/lib/",
    "/shared/dist/"
  ],
};
