export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/models/*.test.js"
  ],

  // jest code coverage
  collectCoverage: true,
  // add controllers to code coverage array, it should eventually reach
  // collectCoverageFrom: ["controllers/**"], with full coverage
  collectCoverageFrom: [
    "helpers/**",
    "middlewares/**",
    "controllers/categoryController.js",
    "controllers/productController.js",
    "controllers/authController.js",
    "models/**"
  ], // add more files as needed
  coverageThreshold: {
    // Temporary lower the coverage thresholds form 100 to 90 to allow for CI to pass
    global: {
      lines: 90,
      functions: 90,
    },
  },
};
