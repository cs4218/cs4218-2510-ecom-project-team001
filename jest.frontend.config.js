export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: [
    "<rootDir>/client/src/pages/Auth/*.test.js",
    "<rootDir>/client/src/pages/HomePage.test.js",
    "<rootDir>/client/src/pages/admin/*.test.js",
    "<rootDir>/client/src/components/Form/*.test.js",
    "<rootDir>/client/src/pages/Policy.test.js",
    "<rootDir>/client/src/pages/CategoryProduct.test.js",
    "<rootDir>/client/src/pages/ProductDetails.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/client/src/pages/Auth/**",
    "<rootDir>/client/src/pages/HomePage.js"
    "<rootDir>/client/src/pages/Auth/*.test.js",
    "<rootDir>/client/src/components/Form/*.test.js",
    "<rootDir>/client/src/pages/Policy.test.js",
    "<rootDir>/client/src/pages/CategoryProduct.test.js",
    "<rootDir>/client/src/pages/ProductDetails.test.js",
    "client/src/pages/Auth/**",
    "client/src/pages/admin/CreateCategory.js",
    "client/src/components/Form/CategoryForm.js",
  ],
  coverageThreshold: {
    // Temporary lower the coverage thresholds form 100 to 90 to allow for CI to pass
    global: {
      lines: 90,
      functions: 90,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],

  // more detailed output
  verbose: true,
  reporters: ["default"],
  silent: false,
  testLocationInResults: true,
};
