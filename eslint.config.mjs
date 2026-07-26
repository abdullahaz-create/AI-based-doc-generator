import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Ignore dependencies and generated files
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**'],
  },

  // Backend (Node.js)
  {
    files: ['server.js', 'src/**/*.js', 'scripts/**/*.js', 'tests/**/*.js'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Frontend (Browser)
  {
    files: ['public/**/*.js', 'js/**/*.js', '**/*.client.js'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,

        // Allow CommonJS export for tests
        module: 'readonly',

        JSZip: 'readonly',
        marked: 'readonly',
        hljs: 'readonly',
      },
      sourceType: 'script',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
