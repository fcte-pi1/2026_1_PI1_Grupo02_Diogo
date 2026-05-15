/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/integration/**/*.test.ts"
  ],
  clearMocks: true,
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }]
  }
};
