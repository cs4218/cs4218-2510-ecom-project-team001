import js from "@eslint/js";
import globals from "globals";
import playwright from "eslint-plugin-playwright";

const cleanGlobals = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.trim(), v]));

// Add eslint rules to instantly catch static errors e.g. typos
export default [
  // Ignore common output folders
  { ignores: ["node_modules/", "dist/", "build/", "coverage/"] },

  // Base JS recommended rules
  js.configs.recommended,

  {
    files: [
      "**/*.{js,mjs,cjs,jsx}",
      "**/*.test.{js,mjs,cjs,jsx}",
      "**/*.spec.{js,mjs,cjs,jsx}",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...cleanGlobals(globals.node),
        ...cleanGlobals(globals.browser),
        ...cleanGlobals(globals.jest),
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
    },
  },

  // Playwright-specific
  {
    files: [
      "tests/ui/**/*.spec.{js,mjs,cjs,jsx}",
      "tests/ui/**/*.test.{js,mjs,cjs,jsx}",
    ],
    ...playwright.configs["flat/recommended"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...cleanGlobals(globals.node) },
    },
  },
];
