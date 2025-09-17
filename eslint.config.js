import js from "@eslint/js";
import globals from "globals";

// Add eslint rules to instantly catch static errors e.g. typos
export default [
  // Ignore common output folders
  { ignores: ["node_modules/", "dist/", "build/", "coverage/"] },

  // Base JS recommended rules
  js.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,jsx}", "**/*.test.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
