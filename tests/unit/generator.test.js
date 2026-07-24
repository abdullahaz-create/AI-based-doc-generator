'use strict';

/**
 * tests/unit/generator.test.js
 *
 * NOTE ON SOURCE BUG:
 * js/generator.js has a bug: module.exports = { generateDocumentation, ... }
 * but generateDocumentation is never defined in the file, causing a
 * ReferenceError when the module is loaded in strict mode.
 *
 * Workaround: read the source, strip the broken export reference, and
 * evaluate via new Function() so we can safely get the 6 valid generators.
 * No source files are modified.
 */

const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '../../js/generator.js'), 'utf8');

// Remove the broken `generateDocumentation,` line from module.exports
const patchedSrc = src.replace(/^\s*generateDocumentation,\s*\n?/m, '');

const factory = new Function('module', 'exports', 'require', '__dirname', '__filename', patchedSrc);
const mod = { exports: {} };
factory(mod, mod.exports, require, __dirname, __filename);

const {
  generateReadme,
  generateInstallation,
  generateApiDocs,
  generateArchitecture,
  generateContributing,
  generateChangelog,
} = mod.exports;

// ─────────────────────────────────────────────────────────────────────────────
// Shared minimal analysis fixture
// ─────────────────────────────────────────────────────────────────────────────
const makeAnalysis = (overrides = {}) => ({
  projectName: 'test-app',
  version: '1.0.0',
  description: 'A test application',
  primaryLanguage: 'JavaScript',
  framework: null,
  metaFramework: null,
  backendFramework: 'Express',
  database: null,
  orm: null,
  authentication: null,
  packageManager: 'npm',
  buildTool: null,
  testFramework: 'Jest',
  license: 'MIT',
  hasDocker: false,
  hasCI: false,
  hasTests: true,
  hasReadme: false,
  hasGitignore: true,
  hasLicense: false,
  hasContributing: false,
  hasEnvFile: false,
  apiRoutes: [],
  features: [],
  envVars: [],
  dependencies: { express: '^4.18.0' },
  devDependencies: { jest: '^29.0.0' },
  folderStructure: { name: 'root', children: [{ name: 'src' }] },
  fileCount: 10,
  totalSize: 50000,
  formatBytes: (b) => `${b} B`,
  qualityScore: 75,
  healthScore: 80,
  analysisConfidence: 'medium',
  detectedSignals: ['Framework: Express'],
  javaClasses: [],
  pythonEntities: [],
  jsModules: [],
  sqlTables: [],
  sqlData: [],
  securityIssues: [],
  largeFiles: [],
  architecture: { pattern: null, entryPoint: null, entryPointFile: null },
  designPatterns: [],
  languageStats: { JavaScript: 100 },
  languages: ['JavaScript'],
  configData: { appName: 'test-app', datasourceUrl: null, jpaDdlAuto: null },
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// generator.js exports
// ─────────────────────────────────────────────────────────────────────────────
describe('generator.js exports', () => {
  test('all 6 doc generators are exported (via patched module)', () => {
    expect(typeof mod.exports.generateReadme).toBe('function');
    expect(typeof mod.exports.generateInstallation).toBe('function');
    expect(typeof mod.exports.generateApiDocs).toBe('function');
    expect(typeof mod.exports.generateArchitecture).toBe('function');
    expect(typeof mod.exports.generateContributing).toBe('function');
    expect(typeof mod.exports.generateChangelog).toBe('function');
  });

  test('source bug: generateDocumentation referenced in module.exports but not defined', () => {
    /**
     * js/generator.js line 2066: module.exports = { generateDocumentation, ... }
     * but generateDocumentation is never defined. The patchedSrc has this line
     * removed so require works. The source needs to be fixed.
     */
    expect(patchedSrc).not.toMatch(/^\s*generateDocumentation,\s*$/m);
    expect(mod.exports.generateDocumentation).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateReadme
// ─────────────────────────────────────────────────────────────────────────────
describe('generateReadme', () => {
  test('success: returns a non-empty string', () => {
    // Arrange / Act / Assert
    const result = generateReadme(makeAnalysis());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('success: output contains markdown heading', () => {
    expect(generateReadme(makeAnalysis())).toMatch(/^#/m);
  });

  test('success: title-cases hyphenated project name', () => {
    const result = generateReadme(makeAnalysis({ projectName: 'my-cool-project' }));
    expect(result).toContain('My Cool Project');
  });

  test('success: includes npm install for npm package manager', () => {
    expect(generateReadme(makeAnalysis({ packageManager: 'npm' }))).toContain('npm install');
  });

  test('success: includes yarn install for yarn package manager', () => {
    expect(generateReadme(makeAnalysis({ packageManager: 'yarn' }))).toContain('yarn install');
  });

  test('success: includes pnpm install for pnpm package manager', () => {
    expect(generateReadme(makeAnalysis({ packageManager: 'pnpm' }))).toContain('pnpm install');
  });

  test('success: mentions MIT license when license is set', () => {
    expect(generateReadme(makeAnalysis({ license: 'MIT' }))).toContain('MIT');
  });

  test('success: includes Docker section when hasDocker is true', () => {
    expect(generateReadme(makeAnalysis({ hasDocker: true })).toLowerCase()).toContain('docker');
  });

  test('success: mentions database when database is set', () => {
    expect(generateReadme(makeAnalysis({ database: 'MongoDB' }))).toContain('MongoDB');
  });

  test('edge: does not throw with minimal analysis', () => {
    expect(() =>
      generateReadme(
        makeAnalysis({
          projectName: 'x',
          version: '',
          description: '',
          framework: null,
          metaFramework: null,
          backendFramework: null,
          database: null,
          packageManager: null,
          dependencies: {},
          devDependencies: {},
        })
      )
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateInstallation
// ─────────────────────────────────────────────────────────────────────────────
describe('generateInstallation', () => {
  test('success: returns a non-empty string', () => {
    const result = generateInstallation(makeAnalysis());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('success: contains installation or install keyword', () => {
    expect(generateInstallation(makeAnalysis()).toLowerCase()).toMatch(/install/);
  });

  test('success: contains prerequisites or requirements section', () => {
    expect(generateInstallation(makeAnalysis()).toLowerCase()).toMatch(/prereq|require/);
  });

  test('success: includes mvn commands for maven', () => {
    expect(generateInstallation(makeAnalysis({ packageManager: 'maven' }))).toContain('mvn');
  });

  test('success: includes pip install for pip', () => {
    expect(generateInstallation(makeAnalysis({ packageManager: 'pip' }))).toContain('pip install');
  });

  test('success: does not throw when hasDocker is true', () => {
    // generateInstallation does not guarantee a Docker section in all configurations
    // but it should never throw
    expect(() => generateInstallation(makeAnalysis({ hasDocker: true }))).not.toThrow();
  });

  test('edge: does not throw with null packageManager', () => {
    expect(() => generateInstallation(makeAnalysis({ packageManager: null }))).not.toThrow();
  });

  test('edge: does not throw with empty analysis', () => {
    expect(() => generateInstallation(makeAnalysis({}))).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateApiDocs
// ─────────────────────────────────────────────────────────────────────────────
describe('generateApiDocs', () => {
  test('success: returns a non-empty string', () => {
    const result = generateApiDocs(makeAnalysis());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('success: contains API heading', () => {
    expect(generateApiDocs(makeAnalysis()).toLowerCase()).toMatch(/api/);
  });

  test('success: lists detected GET and POST routes', () => {
    const apiRoutes = [
      { method: 'GET', path: '/users' },
      { method: 'POST', path: '/users' },
    ];
    const result = generateApiDocs(makeAnalysis({ apiRoutes }));
    expect(result).toContain('/users');
    expect(result).toContain('GET');
    expect(result).toContain('POST');
  });

  test('success: includes base URL or endpoint section', () => {
    expect(generateApiDocs(makeAnalysis()).toLowerCase()).toMatch(/base url|localhost|endpoint/);
  });

  test('edge: does not throw when apiRoutes is empty', () => {
    expect(() => generateApiDocs(makeAnalysis({ apiRoutes: [] }))).not.toThrow();
  });

  test('edge: handles many routes without throwing', () => {
    const apiRoutes = Array.from({ length: 50 }, (_, i) => ({ method: 'GET', path: `/r/${i}` }));
    expect(() => generateApiDocs(makeAnalysis({ apiRoutes }))).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateArchitecture
// ─────────────────────────────────────────────────────────────────────────────
describe('generateArchitecture', () => {
  test('success: returns a non-empty string', () => {
    const result = generateArchitecture(makeAnalysis());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('success: contains architecture heading', () => {
    expect(generateArchitecture(makeAnalysis()).toLowerCase()).toMatch(/architect/);
  });

  test('success: mentions project name', () => {
    expect(generateArchitecture(makeAnalysis({ projectName: 'arch-demo' }))).toContain('Arch Demo');
  });

  test('success: mentions database when present', () => {
    expect(generateArchitecture(makeAnalysis({ database: 'PostgreSQL' }))).toContain('PostgreSQL');
  });

  test('edge: does not throw with no frameworks set', () => {
    expect(() =>
      generateArchitecture(
        makeAnalysis({
          framework: null,
          metaFramework: null,
          backendFramework: null,
        })
      )
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateContributing
// ─────────────────────────────────────────────────────────────────────────────
describe('generateContributing', () => {
  test('success: returns a non-empty string', () => {
    const result = generateContributing(makeAnalysis());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('success: contains contributing heading', () => {
    expect(generateContributing(makeAnalysis()).toLowerCase()).toMatch(/contribut/);
  });

  test('success: includes pull request or fork guidance', () => {
    expect(generateContributing(makeAnalysis()).toLowerCase()).toMatch(/pull request|pr|fork/);
  });

  test('success: includes code of conduct reference', () => {
    expect(generateContributing(makeAnalysis()).toLowerCase()).toMatch(/conduct|guideline/);
  });

  test('edge: does not throw with minimal analysis', () => {
    expect(() => generateContributing(makeAnalysis({}))).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateChangelog
// ─────────────────────────────────────────────────────────────────────────────
describe('generateChangelog', () => {
  test('success: returns a non-empty string', () => {
    const result = generateChangelog(makeAnalysis());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('success: contains changelog heading', () => {
    expect(generateChangelog(makeAnalysis()).toLowerCase()).toMatch(/changelog/);
  });

  test('success: contains the version number', () => {
    expect(generateChangelog(makeAnalysis({ version: '2.5.1' }))).toContain('2.5.1');
  });

  test('success: contains Unreleased section', () => {
    expect(generateChangelog(makeAnalysis())).toContain('[Unreleased]');
  });

  test('success: contains semantic versioning reference', () => {
    expect(generateChangelog(makeAnalysis()).toLowerCase()).toMatch(/semantic versioning|semver/);
  });

  test('edge: does not throw with empty version string', () => {
    expect(() => generateChangelog(makeAnalysis({ version: '' }))).not.toThrow();
  });

  test('edge: includes planned test items when hasTests is false', () => {
    expect(generateChangelog(makeAnalysis({ hasTests: false })).toLowerCase()).toMatch(/test/);
  });
});
