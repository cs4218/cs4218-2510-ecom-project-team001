export default {
  displayName: "frontend:integration",
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],
  // Place any integration-like frontend tests here if you want to separate
  testMatch: [
    "<rootDir>/client/src/**/*.int.test.js",
    "<rootDir>/client/src/**/*.integration.test.js",
  ],
  // TODO: re-introduce coverage
  collectCoverage: false,
  passWithNoTests: true,
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
  verbose: true,
};
