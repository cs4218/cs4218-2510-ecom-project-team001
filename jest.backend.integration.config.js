export default {
  displayName: "backend:integration",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/tests/integration/controllers/productController.integration.test.js",
    "<rootDir>/tests/integration/controllers/categoryController.integration.test.js",
    "<rootDir>/tests/integration/controllers/authController.integration.test.js",
  ],
  // TODO: re-introduce coverage
  collectCoverage: false,
  // Do not fail the run if no integration tests are present
  passWithNoTests: true,
  verbose: true,
};
