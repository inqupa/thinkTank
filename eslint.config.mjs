import js from "@eslint/js";

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "dev-dist/",
      ".vite/",
      ".wrangler/",
      "playwright-report/",
      "test-results/",
      "blob-report/",
      "playwright/.cache/",
      "playwright/.auth/"
    ]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn"
    }
  }
];