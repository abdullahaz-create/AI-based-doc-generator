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
    files: ['server.js', 'src/**/*.js', 'scripts/**/*.js', 'test/**/*.js'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
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
      },
      sourceType: 'script',
    },
  },
]);
