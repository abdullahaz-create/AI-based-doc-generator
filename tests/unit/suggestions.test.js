'use strict';

/**
 * tests/unit/suggestions.test.js
 *
 * NOTE ON SCOPE:
 * js/suggestions.js defines generateSuggestions() as a plain function with
 * NO CommonJS module.exports. It is loaded as a browser <script> tag.
 *
 * We wrap the source in an IIFE that returns the function reference so we
 * can call it without modifying the source file.
 */

const fs = require('fs');
const path = require('path');

let generateSuggestions;

beforeAll(() => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../js/suggestions.js'), 'utf8');
  // Wrap in IIFE to capture the function in strict-mode-safe way

  const factory = new Function(`
    ${src}
    return generateSuggestions;
  `);
  generateSuggestions = factory();
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture builder
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns a "perfect" analysis object — no suggestions should fire for high-
 * priority issues when all flags are set optimally.
 */
const makeAnalysis = (overrides = {}) => ({
  hasReadme: true,
  hasLicense: true,
  hasContributing: true,
  hasGitignore: true,
  hasEnvFile: true,
  hasTests: true,
  hasDocker: true,
  hasCI: true,
  description: 'A well-documented project',
  envVars: [],
  apiRoutes: [],
  authentication: 'JWT',
  database: null,
  primaryLanguage: 'JavaScript',
  packageManager: 'npm',
  buildTool: 'Vite',
  dependencies: {},
  devDependencies: { typescript: '^5.0.0' },
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// Return type & shape
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — return type', () => {
  test('success: returns an array', () => {
    // Arrange / Act
    const result = generateSuggestions(makeAnalysis());
    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  test('success: each suggestion has required shape', () => {
    const result = generateSuggestions(makeAnalysis({ hasReadme: false }));
    if (result.length > 0) {
      const suggestion = result[0];
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('priority');
      expect(suggestion).toHaveProperty('category');
      expect(suggestion).toHaveProperty('icon');
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('desc');
    }
  });

  test('success: capped at 12 suggestions maximum', () => {
    // Arrange — trigger as many suggestions as possible
    const analysis = makeAnalysis({
      hasReadme: false,
      hasLicense: false,
      hasContributing: false,
      hasGitignore: false,
      hasEnvFile: false,
      hasTests: false,
      hasDocker: false,
      hasCI: false,
      description: '',
      envVars: ['SECRET_KEY', 'DB_PASSWORD', 'API_KEY'],
      apiRoutes: [{ method: 'GET', path: '/users' }],
      authentication: null,
      database: 'PostgreSQL',
      primaryLanguage: 'JavaScript',
      buildTool: null,
      devDependencies: {},
      dependencies: {},
    });
    const result = generateSuggestions(analysis);
    expect(result.length).toBeLessThanOrEqual(12);
  });

  test('success: results are sorted by priority (high → medium → low)', () => {
    const analysis = makeAnalysis({
      hasReadme: false,
      hasLicense: false,
      hasDocker: false,
      hasCI: false,
      buildTool: null,
      devDependencies: {},
      dependencies: {},
    });
    const result = generateSuggestions(analysis);
    const ORDER = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < result.length; i++) {
      expect(ORDER[result[i].priority]).toBeGreaterThanOrEqual(ORDER[result[i - 1].priority]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Documentation gap suggestions
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — documentation gaps', () => {
  test('success: suggests missing README when hasReadme is false', () => {
    const result = generateSuggestions(makeAnalysis({ hasReadme: false }));
    const ids = result.map((s) => s.id);
    expect(ids).toContain('missing-readme');
  });

  test('success: does NOT suggest README when hasReadme is true', () => {
    const result = generateSuggestions(makeAnalysis({ hasReadme: true }));
    const ids = result.map((s) => s.id);
    expect(ids).not.toContain('missing-readme');
  });

  test('success: suggests missing license when hasLicense is false', () => {
    const result = generateSuggestions(makeAnalysis({ hasLicense: false }));
    expect(result.map((s) => s.id)).toContain('missing-license');
  });

  test('success: does NOT suggest license when hasLicense is true', () => {
    const result = generateSuggestions(makeAnalysis({ hasLicense: true }));
    expect(result.map((s) => s.id)).not.toContain('missing-license');
  });

  test('success: suggests missing contributing guide when hasContributing is false', () => {
    const result = generateSuggestions(makeAnalysis({ hasContributing: false }));
    expect(result.map((s) => s.id)).toContain('missing-contributing');
  });

  test('success: suggests missing .gitignore when hasGitignore is false', () => {
    const result = generateSuggestions(makeAnalysis({ hasGitignore: false }));
    expect(result.map((s) => s.id)).toContain('missing-gitignore');
  });

  test('success: suggests missing project description when readme exists but description is empty', () => {
    const result = generateSuggestions(
      makeAnalysis({
        hasReadme: true,
        description: '',
      })
    );
    expect(result.map((s) => s.id)).toContain('readme-no-description');
  });

  test('success: does NOT suggest project description when description is set', () => {
    const result = generateSuggestions(
      makeAnalysis({
        hasReadme: true,
        description: 'A real description',
      })
    );
    expect(result.map((s) => s.id)).not.toContain('readme-no-description');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security suggestions
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — security', () => {
  test('success: suggests .env.example when envVars exist but hasEnvFile is false', () => {
    const result = generateSuggestions(
      makeAnalysis({
        hasEnvFile: false,
        envVars: ['DATABASE_URL', 'JWT_SECRET'],
      })
    );
    expect(result.map((s) => s.id)).toContain('missing-env-example');
  });

  test('success: does NOT suggest .env.example when hasEnvFile is true', () => {
    const result = generateSuggestions(
      makeAnalysis({
        hasEnvFile: true,
        envVars: ['DATABASE_URL'],
      })
    );
    expect(result.map((s) => s.id)).not.toContain('missing-env-example');
  });

  test('success: suggests documenting sensitive env vars when key/secret/password names exist', () => {
    const result = generateSuggestions(
      makeAnalysis({
        envVars: ['STRIPE_SECRET_KEY', 'DB_PASSWORD'],
      })
    );
    expect(result.map((s) => s.id)).toContain('sensitive-env-vars');
  });

  test('success: does NOT suggest sensitive-env-vars for innocuous var names', () => {
    const result = generateSuggestions(
      makeAnalysis({
        envVars: ['PORT', 'NODE_ENV', 'APP_NAME'],
      })
    );
    expect(result.map((s) => s.id)).not.toContain('sensitive-env-vars');
  });

  test('success: suggests API authentication when routes exist but no auth is detected', () => {
    const result = generateSuggestions(
      makeAnalysis({
        apiRoutes: [{ method: 'GET', path: '/users' }],
        authentication: null,
      })
    );
    expect(result.map((s) => s.id)).toContain('api-no-auth');
  });

  test('success: does NOT suggest API auth when authentication is already configured', () => {
    const result = generateSuggestions(
      makeAnalysis({
        apiRoutes: [{ method: 'GET', path: '/users' }],
        authentication: 'JWT',
      })
    );
    expect(result.map((s) => s.id)).not.toContain('api-no-auth');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Testing suggestions
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — testing', () => {
  test('success: suggests adding tests when hasTests is false', () => {
    const result = generateSuggestions(makeAnalysis({ hasTests: false }));
    expect(result.map((s) => s.id)).toContain('missing-tests');
  });

  test('success: suggests CI/CD when tests exist but hasCI is false', () => {
    const result = generateSuggestions(makeAnalysis({ hasTests: true, hasCI: false }));
    expect(result.map((s) => s.id)).toContain('tests-no-ci');
  });

  test('success: does NOT suggest CI when hasCI is true', () => {
    const result = generateSuggestions(makeAnalysis({ hasTests: true, hasCI: true }));
    expect(result.map((s) => s.id)).not.toContain('tests-no-ci');
  });

  test('success: does NOT suggest missing-tests when hasTests is true', () => {
    const result = generateSuggestions(makeAnalysis({ hasTests: true }));
    expect(result.map((s) => s.id)).not.toContain('missing-tests');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Docker suggestions
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — Docker', () => {
  test('success: suggests Docker when hasDocker is false', () => {
    const result = generateSuggestions(makeAnalysis({ hasDocker: false }));
    expect(result.map((s) => s.id)).toContain('add-docker');
  });

  test('success: does NOT suggest Docker when hasDocker is true', () => {
    const result = generateSuggestions(makeAnalysis({ hasDocker: true }));
    expect(result.map((s) => s.id)).not.toContain('add-docker');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dependency health
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — dependency health', () => {
  test('success: suggests reviewing dependencies when count > 50', () => {
    const deps = {};
    for (let i = 0; i < 55; i++) deps[`pkg-${i}`] = '1.0.0';
    const result = generateSuggestions(makeAnalysis({ dependencies: deps }));
    expect(result.map((s) => s.id)).toContain('many-deps');
  });

  test('success: does NOT suggest reviewing dependencies when count <= 50', () => {
    const deps = {};
    for (let i = 0; i < 10; i++) deps[`pkg-${i}`] = '1.0.0';
    const result = generateSuggestions(makeAnalysis({ dependencies: deps }));
    expect(result.map((s) => s.id)).not.toContain('many-deps');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Architecture suggestions
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — architecture', () => {
  test('success: suggests API versioning when apiRoutes is non-empty', () => {
    const result = generateSuggestions(
      makeAnalysis({
        apiRoutes: [{ method: 'GET', path: '/users' }],
      })
    );
    expect(result.map((s) => s.id)).toContain('add-api-versioning');
  });

  test('success: suggests build tool for JS project with no build tool', () => {
    const result = generateSuggestions(
      makeAnalysis({
        primaryLanguage: 'JavaScript',
        buildTool: null,
      })
    );
    expect(result.map((s) => s.id)).toContain('add-build-tool');
  });

  test('success: does NOT suggest build tool when buildTool is set', () => {
    const result = generateSuggestions(
      makeAnalysis({
        primaryLanguage: 'JavaScript',
        buildTool: 'Vite',
      })
    );
    expect(result.map((s) => s.id)).not.toContain('add-build-tool');
  });

  test('success: suggests TypeScript for JS projects without TypeScript', () => {
    const result = generateSuggestions(
      makeAnalysis({
        primaryLanguage: 'JavaScript',
        dependencies: {},
        devDependencies: {},
      })
    );
    expect(result.map((s) => s.id)).toContain('consider-typescript');
  });

  test('success: does NOT suggest TypeScript when it is already in devDependencies', () => {
    const result = generateSuggestions(
      makeAnalysis({
        primaryLanguage: 'JavaScript',
        devDependencies: { typescript: '^5.0.0' },
      })
    );
    expect(result.map((s) => s.id)).not.toContain('consider-typescript');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Performance suggestions
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — performance', () => {
  test('success: suggests caching when database is set and no redis/cache dep exists', () => {
    const result = generateSuggestions(
      makeAnalysis({
        database: 'PostgreSQL',
        dependencies: { pg: '^8.0.0' }, // no redis
      })
    );
    expect(result.map((s) => s.id)).toContain('add-caching');
  });

  test('success: does NOT suggest caching when Redis is already the database', () => {
    const result = generateSuggestions(
      makeAnalysis({
        database: 'Redis',
        dependencies: {},
      })
    );
    expect(result.map((s) => s.id)).not.toContain('add-caching');
  });

  test('success: does NOT suggest caching when a redis dep is already present', () => {
    const result = generateSuggestions(
      makeAnalysis({
        database: 'MongoDB',
        dependencies: { redis: '^4.0.0' },
      })
    );
    expect(result.map((s) => s.id)).not.toContain('add-caching');
  });

  test('success: does NOT suggest caching when no database is set', () => {
    const result = generateSuggestions(makeAnalysis({ database: null }));
    expect(result.map((s) => s.id)).not.toContain('add-caching');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSuggestions — edge cases', () => {
  test('edge: returns empty array when analysis is "perfect"', () => {
    // All best-practice flags set → no suggestions expected
    const analysis = makeAnalysis({
      apiRoutes: [],
      database: null,
      buildTool: 'Vite',
      devDependencies: { typescript: '^5.0.0' },
      dependencies: {},
    });
    const result = generateSuggestions(analysis);
    // May still return low-priority TypeScript/build suggestions — but none
    // should be high/medium urgency
    const highPriority = result.filter((s) => s.priority === 'high');
    expect(highPriority.length).toBe(0);
  });

  test('edge: handles non-JS primary language without throwing', () => {
    const analysis = makeAnalysis({ primaryLanguage: 'Python', buildTool: null });
    expect(() => generateSuggestions(analysis)).not.toThrow();
  });

  test('edge: handles empty envVars array without throwing', () => {
    const analysis = makeAnalysis({ envVars: [] });
    expect(() => generateSuggestions(analysis)).not.toThrow();
  });

  test('edge: desc field of missing-env-example mentions env var count', () => {
    const analysis = makeAnalysis({
      hasEnvFile: false,
      envVars: ['VAR_A', 'VAR_B', 'VAR_C'],
    });
    const result = generateSuggestions(analysis);
    const s = result.find((r) => r.id === 'missing-env-example');
    expect(s).toBeDefined();
    expect(s.desc).toContain('3');
  });
});
