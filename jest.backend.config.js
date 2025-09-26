module.exports = {
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
    "models/**"
  ], // add more files as needed
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 60,
    },
  },

  silent: true,
};
