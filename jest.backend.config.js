export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  // add controllers to code coverage array, it should eventually reach
  // collectCoverageFrom: ["controllers/**"], with full coverage
  collectCoverageFrom: ["controllers/categoryController.js"], // add more files as needed
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
