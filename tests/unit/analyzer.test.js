'use strict';

const { analyzeProject, formatBytes, countLines, getExt, isIgnored } = require('../../js/analyzer');

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper
// ─────────────────────────────────────────────────────────────────────────────
const makeFile = (overrides = {}) => ({
  path: 'src/index.js',
  name: 'index.js',
  isDir: false,
  size: 100,
  content: 'const x = 1;\nmodule.exports = x;\n',
  ext: '.js',
  ...overrides,
});

const minimalPkgJson = JSON.stringify({
  name: 'my-project',
  version: '1.2.3',
  description: 'A test project',
  dependencies: { express: '^4.18.0' },
  devDependencies: { jest: '^29.0.0' },
});

// ─────────────────────────────────────────────────────────────────────────────
// getExt
// ─────────────────────────────────────────────────────────────────────────────
describe('getExt', () => {
  test('success: returns lowercase extension', () => {
    // Arrange / Act / Assert
    expect(getExt('index.JS')).toBe('.js');
  });

  test('success: handles files with multiple dots', () => {
    expect(getExt('my.config.js')).toBe('.js');
  });

  test('success: handles full path strings', () => {
    expect(getExt('src/routes/generate.ts')).toBe('.ts');
  });

  test('edge: returns empty string when there is no extension', () => {
    expect(getExt('Makefile')).toBe('');
  });

  test('edge: dotfile returns the dot-prefixed name as extension', () => {
    // ".gitignore" → lastIndexOf('.') === 0, so returns ".gitignore"
    expect(getExt('.gitignore')).toBe('.gitignore');
  });

  test('edge: empty string returns empty string', () => {
    expect(getExt('')).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatBytes
// ─────────────────────────────────────────────────────────────────────────────
describe('formatBytes', () => {
  test('success: formats bytes below 1 KB', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  test('success: formats values in KB range', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  test('success: formats values in MB range', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  test('edge: 0 returns "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('edge: null returns "0 B"', () => {
    expect(formatBytes(null)).toBe('0 B');
  });

  test('edge: undefined returns "0 B"', () => {
    expect(formatBytes(undefined)).toBe('0 B');
  });

  test('boundary: exactly 1024 bytes → 1.0 KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  test('boundary: exactly 1 MB (1048576 bytes) → 1.0 MB', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// countLines
// ─────────────────────────────────────────────────────────────────────────────
describe('countLines', () => {
  test('success: counts newline-separated lines correctly', () => {
    expect(countLines('line1\nline2\nline3')).toBe(3);
  });

  test('success: single-line content returns 1', () => {
    expect(countLines('hello')).toBe(1);
  });

  test('edge: empty string returns 1 (split always yields one element)', () => {
    expect(countLines('')).toBe(1);
  });

  test('edge: null returns 1', () => {
    expect(countLines(null)).toBe(1);
  });

  test('edge: undefined returns 1', () => {
    expect(countLines(undefined)).toBe(1);
  });

  test('edge: trailing newline counts as an extra empty line', () => {
    expect(countLines('a\nb\n')).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isIgnored
// ─────────────────────────────────────────────────────────────────────────────
describe('isIgnored', () => {
  test('success: ignores node_modules paths', () => {
    expect(isIgnored('node_modules/express/index.js')).toBe(true);
  });

  test('success: ignores .git paths', () => {
    expect(isIgnored('.git/config')).toBe(true);
  });

  test('success: ignores build directory', () => {
    expect(isIgnored('build/main.js')).toBe(true);
  });

  test('success: ignores coverage directory', () => {
    expect(isIgnored('coverage/lcov-report/index.html')).toBe(true);
  });

  test('success: ignores .vscode in a nested path', () => {
    expect(isIgnored('myproject/.vscode/settings.json')).toBe(true);
  });

  test('invalid: normal source paths are NOT ignored', () => {
    expect(isIgnored('src/app.js')).toBe(false);
  });

  test('edge: empty string returns false', () => {
    expect(isIgnored('')).toBe(false);
  });

  test('edge: null returns false', () => {
    expect(isIgnored(null)).toBe(false);
  });

  test('edge: "builds" is NOT in the ignore list (partial name should not match)', () => {
    // Only the exact segment "build" is ignored, not "builds"
    expect(isIgnored('builds/output.js')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// analyzeProject
// ─────────────────────────────────────────────────────────────────────────────
describe('analyzeProject', () => {
  // ── Return shape ───────────────────────────────────────────────────────────

  test('success: returns a valid analysis object for empty file array', () => {
    // Arrange
    const files = [];
    // Act
    const result = analyzeProject(files);
    // Assert
    expect(result).toBeDefined();
    expect(result.projectName).toBeDefined();
    expect(result.primaryLanguage).toBeDefined();
    expect(Array.isArray(result.apiRoutes)).toBe(true);
    expect(Array.isArray(result.features)).toBe(true);
    expect(Array.isArray(result.detectedSignals)).toBe(true);
  });

  test('success: qualityScore and healthScore are numbers', () => {
    const result = analyzeProject([makeFile()]);
    expect(typeof result.qualityScore).toBe('number');
    expect(typeof result.healthScore).toBe('number');
  });

  test('success: analysisConfidence is one of high | medium | low', () => {
    const result = analyzeProject([makeFile()]);
    expect(['high', 'medium', 'low']).toContain(result.analysisConfidence);
  });

  test('success: dependencies and devDependencies are objects', () => {
    const pkgFile = {
      path: 'package.json',
      name: 'package.json',
      isDir: false,
      size: 200,
      content: minimalPkgJson,
      ext: '.json',
    };
    const result = analyzeProject([pkgFile]);
    expect(typeof result.dependencies).toBe('object');
    expect(typeof result.devDependencies).toBe('object');
    expect(result.dependencies.express).toBeDefined();
    expect(result.devDependencies.jest).toBeDefined();
  });

  // ── Ignored paths ──────────────────────────────────────────────────────────

  test('success: files inside ignored dirs contribute 0 to fileCount', () => {
    // Arrange
    const files = [
      makeFile({ path: 'node_modules/express/index.js', name: 'index.js' }),
      makeFile({ path: '.git/COMMIT_EDITMSG', name: 'COMMIT_EDITMSG', ext: '' }),
    ];
    // Act
    const result = analyzeProject(files);
    // Assert
    expect(result.fileCount).toBe(0);
  });

  // ── Language detection ─────────────────────────────────────────────────────

  test('success: detects JavaScript as primary language from .js files', () => {
    const files = [
      makeFile({ path: 'index.js', name: 'index.js', size: 500 }),
      makeFile({ path: 'utils.js', name: 'utils.js', size: 200 }),
      {
        path: 'package.json',
        name: 'package.json',
        isDir: false,
        size: 200,
        content: minimalPkgJson,
        ext: '.json',
      },
    ];
    const result = analyzeProject(files);
    expect(result.primaryLanguage).toBe('JavaScript');
  });

  test('success: detects Python as primary language from .py files', () => {
    const files = [
      {
        path: 'app.py',
        name: 'app.py',
        isDir: false,
        size: 300,
        content: 'from flask import Flask\napp = Flask(__name__)\n',
        ext: '.py',
      },
      {
        path: 'requirements.txt',
        name: 'requirements.txt',
        isDir: false,
        size: 50,
        content: 'flask==2.3.0\n',
        ext: '.txt',
      },
    ];
    const result = analyzeProject(files);
    expect(result.primaryLanguage).toBe('Python');
  });

  // ── Package.json extraction ────────────────────────────────────────────────

  test('success: extracts projectName from package.json', () => {
    const files = [
      {
        path: 'package.json',
        name: 'package.json',
        isDir: false,
        size: 200,
        content: minimalPkgJson,
        ext: '.json',
      },
    ];
    const result = analyzeProject(files);
    expect(result.projectName).toBe('my-project');
  });

  test('success: extracts version from package.json', () => {
    const files = [
      {
        path: 'package.json',
        name: 'package.json',
        isDir: false,
        size: 200,
        content: minimalPkgJson,
        ext: '.json',
      },
    ];
    const result = analyzeProject(files);
    expect(result.version).toBe('1.2.3');
  });

  test('success: detects npm as package manager when package-lock.json exists', () => {
    const files = [
      {
        path: 'package.json',
        name: 'package.json',
        isDir: false,
        size: 200,
        content: minimalPkgJson,
        ext: '.json',
      },
      {
        path: 'package-lock.json',
        name: 'package-lock.json',
        isDir: false,
        size: 100,
        content: '{}',
        ext: '.json',
      },
    ];
    const result = analyzeProject(files);
    expect(result.packageManager).toBe('npm');
  });

  // ── Flag detection ────────────────────────────────────────────────────────

  test('success: sets hasReadme true when README.md is present', () => {
    const files = [
      {
        path: 'README.md',
        name: 'README.md',
        isDir: false,
        size: 100,
        content: '# My Project\nA great project.',
        ext: '.md',
      },
    ];
    const result = analyzeProject(files);
    expect(result.hasReadme).toBe(true);
  });

  test('success: sets hasReadme false when README.md is absent', () => {
    const result = analyzeProject([makeFile()]);
    expect(result.hasReadme).toBe(false);
  });

  test('success: sets hasTests true when a .test.js file is present', () => {
    const files = [makeFile({ path: 'tests/app.test.js', name: 'app.test.js' })];
    const result = analyzeProject(files);
    expect(result.hasTests).toBe(true);
  });

  test('success: sets hasDocker true when Dockerfile is present', () => {
    const files = [
      {
        path: 'Dockerfile',
        name: 'Dockerfile',
        isDir: false,
        size: 200,
        content: 'FROM node:18\nWORKDIR /app\n',
        ext: '',
      },
    ];
    const result = analyzeProject(files);
    expect(result.hasDocker).toBe(true);
  });

  test('success: sets hasGitignore true when .gitignore is present', () => {
    const files = [
      {
        path: '.gitignore',
        name: '.gitignore',
        isDir: false,
        size: 80,
        content: 'node_modules/\n.env\n',
        ext: '.gitignore',
      },
    ];
    const result = analyzeProject(files);
    expect(result.hasGitignore).toBe(true);
  });

  // ── API route detection ────────────────────────────────────────────────────

  test('success: detects Express GET and POST routes', () => {
    const content = `
const express = require('express');
const router = express.Router();
router.get('/users', (req, res) => res.json([]));
router.post('/users', (req, res) => res.json({}));
module.exports = router;
`;
    const files = [makeFile({ path: 'routes/users.js', name: 'users.js', content })];
    const result = analyzeProject(files);
    expect(result.apiRoutes.length).toBeGreaterThanOrEqual(2);
    const methods = result.apiRoutes.map((r) => r.method);
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
  });

  // ── File count ────────────────────────────────────────────────────────────

  test('success: fileCount excludes directory entries', () => {
    const files = [
      { path: 'src/', name: 'src', isDir: true, size: 0, content: null, ext: '' },
      makeFile({ path: 'src/index.js', name: 'index.js' }),
      makeFile({ path: 'src/utils.js', name: 'utils.js' }),
    ];
    const result = analyzeProject(files);
    expect(result.fileCount).toBe(2);
  });

  // ── SQL tables ────────────────────────────────────────────────────────────

  test('success: detects SQL table names from a .sql file', () => {
    const files = [
      {
        path: 'schema.sql',
        name: 'schema.sql',
        isDir: false,
        size: 200,
        content: 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));\n',
        ext: '.sql',
      },
    ];
    const result = analyzeProject(files);
    expect(result.sqlTables).toContain('users');
  });

  // ── Security issues ───────────────────────────────────────────────────────

  test('success: securityIssues is an array', () => {
    const result = analyzeProject([makeFile()]);
    expect(Array.isArray(result.securityIssues)).toBe(true);
  });

  // ── Invalid / edge inputs ─────────────────────────────────────────────────

  test('edge: handles files with null content without throwing', () => {
    const files = [
      {
        path: 'binary.png',
        name: 'binary.png',
        isDir: false,
        size: 5000,
        content: null,
        ext: '.png',
      },
    ];
    expect(() => analyzeProject(files)).not.toThrow();
  });

  test('edge: handles very large fileCount without throwing', () => {
    const files = Array.from({ length: 500 }, (_, i) =>
      makeFile({ path: `src/file${i}.js`, name: `file${i}.js` })
    );
    expect(() => analyzeProject(files)).not.toThrow();
  });

  test('edge: project name falls back to "unnamed-project" when no config files exist', () => {
    // Arrange — files with no recognisable path root segment other than IGNORE_DIRS
    const result = analyzeProject([]);
    expect(result.projectName).toBe('unnamed-project');
  });
});
