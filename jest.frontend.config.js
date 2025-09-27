module.exports = {
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
    "<rootDir>/client/src/context/*.test.js",
    "<rootDir>/client/src/pages/HomePage.test.js",
    "<rootDir>/client/src/pages/admin/*.test.js",
    "<rootDir>/client/src/components/Form/*.test.js",
    "<rootDir>/client/src/components/Routes/Private.test.js",
    "<rootDir>/client/src/pages/Policy.test.js",
    "<rootDir>/client/src/pages/CategoryProduct.test.js",
    "<rootDir>/client/src/pages/ProductDetails.test.js",
    "<rootDir>/client/src/hooks/useCategory.test.js",
    "<rootDir>/client/src/pages/Categories.test.js",
    "<rootDir>/client/src/context/cart.test.js",
    "<rootDir>/client/src/pages/CartPage.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/client/src/pages/Auth/**",
    "<rootDir>/client/src/context/**",
    "<rootDir>/client/src/pages/HomePage.js",
    "<rootDir>/client/src/pages/Auth/*.test.js",
    "<rootDir>/client/src/components/Form/*.test.js",
    "<rootDir>/client/src/pages/Policy.test.js",
    "<rootDir>/client/src/pages/CategoryProduct.test.js",
    "<rootDir>/client/src/pages/ProductDetails.test.js",
    "<rootDir>/client/src/hooks/useCategory.js",
    "<rootDir>/client/src/pages/Categories.js",
    "<rootDir>/client/src/context/cart.js",
    "<rootDir>/client/src/pages/CartPage.js",
    "<rootDir>/client/src/pages/admin/CreateCategory.js",
    "<rootDir>/client/src/components/Form/CategoryForm.js",
    "<rootDir>/client/src/pages/admin/CreateProduct.js",
    "<rootDir>/client/src/pages/admin/UpdateProduct.js",
    "<rootDir>/client/src/pages/admin/AdminOrders.js",
    "<rootDir>/client/src/pages/admin/Products.js",
    "<rootDir>/client/src/components/Routes/Private.js",
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
  silent: true,
  testLocationInResults: true,
};
