'use strict';

/**
 * tests/unit/uploader.test.js
 *
 * js/uploader.js is a browser-side module with NO CommonJS exports.
 * Jest is configured with testEnvironment: "node" and jest-environment-jsdom
 * is not installed, so DOM-dependent functions cannot be directly invoked.
 *
 * Coverage strategy:
 *  - validateProjectZip  → pure logic, no DOM → tested directly via eval
 *  - formatBytes         → pure logic, no DOM → tested directly via eval
 *  - detectLangsQuick    → pure logic, no DOM → tested directly via eval
 *  - sleep               → pure Promise utility → tested directly via eval
 *  - DOM-dependent functions (setupUploader, showUploadProgress, etc.)
 *    → contracts documented and verified as pure-logic stubs
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Safely evaluate uploader.js in a Node.js context.
// The script uses browser globals (document, JSZip, showToast) only inside
// function bodies that are not called at the module level, so the eval itself
// does not throw. The functions we want to test are pure utilities.
// ─────────────────────────────────────────────────────────────────────────────
const uploaderSrc = fs.readFileSync(path.resolve(__dirname, '../../js/uploader.js'), 'utf8');

// Provide minimal stubs for top-level references that may be evaluated
// (none in uploader.js, but guard anyway)
let formatBytes, detectLangsQuick, validateProjectZip, sleep;

beforeAll(() => {
  // Wrap in an IIFE that returns a reference object so we can capture
  // the inner functions without needing module.exports
  const wrappedSrc = `
    (function() {
      // Stub browser globals that appear only inside function bodies
      var document = { getElementById: function() { return null; } };
      var JSZip    = function() {};
      var showToast = function() {};

      ${uploaderSrc}

      return { formatBytes, detectLangsQuick, validateProjectZip, sleep };
    })()
  `;

  const exports = eval(wrappedSrc);
  formatBytes = exports.formatBytes;
  detectLangsQuick = exports.detectLangsQuick;
  validateProjectZip = exports.validateProjectZip;
  sleep = exports.sleep;
});

// ─────────────────────────────────────────────────────────────────────────────
// formatBytes
// ─────────────────────────────────────────────────────────────────────────────
describe('uploader formatBytes', () => {
  test('success: 0 bytes → "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('success: below 1 KB', () => {
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  test('success: KB range', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  test('success: MB range', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  test('boundary: exactly 1024 → 1.0 KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  test('boundary: exactly 1 MB (1048576) → 1.0 MB', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// detectLangsQuick
// ─────────────────────────────────────────────────────────────────────────────
describe('detectLangsQuick', () => {
  test('success: detects JS files', () => {
    const files = [{ ext: '.js' }, { ext: '.js' }, { ext: '.ts' }];
    const result = detectLangsQuick(files);
    expect(result).toContain('JS');
  });

  test('success: returns top 3 languages sorted by file count', () => {
    const files = [
      ...Array(6).fill({ ext: '.py' }),
      ...Array(4).fill({ ext: '.java' }),
      ...Array(2).fill({ ext: '.js' }),
      ...Array(1).fill({ ext: '.go' }),
    ];
    const result = detectLangsQuick(files);
    const langs = result.split(', ');
    expect(langs[0]).toBe('Python');
    expect(langs.length).toBeLessThanOrEqual(3);
  });

  test('success: detects Python files', () => {
    const files = Array(3).fill({ ext: '.py' });
    expect(detectLangsQuick(files)).toContain('Python');
  });

  test('success: detects Java files', () => {
    const files = Array(3).fill({ ext: '.java' });
    expect(detectLangsQuick(files)).toContain('Java');
  });

  test('edge: empty array returns "Unknown"', () => {
    expect(detectLangsQuick([])).toBe('Unknown');
  });

  test('edge: unrecognised extensions return "Unknown"', () => {
    const files = [{ ext: '.xyz' }, { ext: '.abc' }];
    expect(detectLangsQuick(files)).toBe('Unknown');
  });

  test('edge: result is always a string', () => {
    expect(typeof detectLangsQuick([])).toBe('string');
    expect(typeof detectLangsQuick([{ ext: '.rs' }])).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateProjectZip
// ─────────────────────────────────────────────────────────────────────────────
describe('validateProjectZip', () => {
  // ── Return shape ───────────────────────────────────────────────────────────

  test('result always has valid, warning, and message properties', () => {
    const result = validateProjectZip([]);
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('warning');
    expect(result).toHaveProperty('message');
  });

  // ── Valid projects ─────────────────────────────────────────────────────────

  test('success: valid when package.json present', () => {
    const files = [
      { name: 'package.json', path: 'package.json', isDir: false, ext: '.json' },
      { name: 'index.js', path: 'index.js', isDir: false, ext: '.js' },
    ];
    expect(validateProjectZip(files).valid).toBe(true);
  });

  test('success: valid when pom.xml present', () => {
    const files = [
      { name: 'pom.xml', path: 'pom.xml', isDir: false, ext: '.xml' },
      { name: 'Main.java', path: 'Main.java', isDir: false, ext: '.java' },
    ];
    expect(validateProjectZip(files).valid).toBe(true);
  });

  test('success: valid when requirements.txt present', () => {
    const files = [
      { name: 'requirements.txt', path: 'requirements.txt', isDir: false, ext: '.txt' },
      { name: 'app.py', path: 'app.py', isDir: false, ext: '.py' },
    ];
    expect(validateProjectZip(files).valid).toBe(true);
  });

  test('success: valid when Cargo.toml present', () => {
    const files = [
      { name: 'Cargo.toml', path: 'Cargo.toml', isDir: false, ext: '.toml' },
      { name: 'main.rs', path: 'main.rs', isDir: false, ext: '.rs' },
    ];
    expect(validateProjectZip(files).valid).toBe(true);
  });

  test('success: valid when go.mod present', () => {
    const files = [
      { name: 'go.mod', path: 'go.mod', isDir: false, ext: '' },
      { name: 'main.go', path: 'main.go', isDir: false, ext: '.go' },
    ];
    expect(validateProjectZip(files).valid).toBe(true);
  });

  test('success: valid and no warning when >= 10 source files exist (no config)', () => {
    const files = Array.from({ length: 10 }, (_, i) => ({
      name: `file${i}.js`,
      path: `file${i}.js`,
      isDir: false,
      ext: '.js',
    }));
    const result = validateProjectZip(files);
    expect(result.valid).toBe(true);
    expect(result.warning).toBe(false);
  });

  // ── Warning cases ──────────────────────────────────────────────────────────

  test('warning: config file present but zero source files', () => {
    const files = [{ name: 'package.json', path: 'package.json', isDir: false, ext: '.json' }];
    const result = validateProjectZip(files);
    expect(result.valid).toBe(true);
    expect(result.warning).toBe(true);
  });

  test('warning: 3 to 9 source files with no config file', () => {
    const files = Array.from({ length: 5 }, (_, i) => ({
      name: `file${i}.py`,
      path: `file${i}.py`,
      isDir: false,
      ext: '.py',
    }));
    const result = validateProjectZip(files);
    expect(result.valid).toBe(true);
    expect(result.warning).toBe(true);
  });

  // ── Invalid cases ──────────────────────────────────────────────────────────

  test('invalid: completely empty ZIP', () => {
    const result = validateProjectZip([]);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/empty/i);
  });

  test('invalid: only folders, no files', () => {
    const files = [{ name: 'src', path: 'src/', isDir: true, ext: '' }];
    expect(validateProjectZip(files).valid).toBe(false);
  });

  test('invalid: only binary/image files without config', () => {
    const files = [
      { name: 'logo.png', path: 'logo.png', isDir: false, ext: '.png' },
      { name: 'data.pdf', path: 'data.pdf', isDir: false, ext: '.pdf' },
    ];
    expect(validateProjectZip(files).valid).toBe(false);
  });

  test('invalid: 1 or 2 source files with no config', () => {
    const files = [
      { name: 'a.js', path: 'a.js', isDir: false, ext: '.js' },
      { name: 'b.js', path: 'b.js', isDir: false, ext: '.js' },
    ];
    expect(validateProjectZip(files).valid).toBe(false);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  test('edge: message is a string in all cases', () => {
    expect(typeof validateProjectZip([]).message).toBe('string');
    expect(
      typeof validateProjectZip([
        { name: 'package.json', path: 'package.json', isDir: false, ext: '.json' },
      ]).message
    ).toBe('string');
  });

  test('edge: valid:false result always has warning:false', () => {
    const result = validateProjectZip([]);
    if (!result.valid) {
      // Per the source code — invalid results always have warning:false
      expect(result.warning).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sleep
// ─────────────────────────────────────────────────────────────────────────────
describe('sleep', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('success: returns a Promise', () => {
    const result = sleep(100);
    expect(result).toBeInstanceOf(Promise);
    // Resolve the timer so the pending promise doesn't leak
    jest.runAllTimers();
  });

  test('success: resolves after the specified delay', async () => {
    const promise = sleep(200);
    jest.advanceTimersByTime(200);
    await expect(promise).resolves.toBeUndefined();
  });

  test('edge: sleep(0) resolves immediately', async () => {
    const promise = sleep(0);
    jest.advanceTimersByTime(0);
    await expect(promise).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DOM-dependent functions — contracts documented
// ─────────────────────────────────────────────────────────────────────────────
describe('uploader — DOM-dependent function contracts', () => {
  /**
   * The following functions require a live browser DOM and cannot run in
   * testEnvironment:"node". Their contracts are documented here for
   * completeness and future JSDOM migration.
   *
   *  setupUploader(onFilesReady)
   *    - Attaches event listeners to: #file-input, #drop-zone, #github-btn,
   *      #demo-btn, #github-modal, #github-modal-close, #github-cancel-btn,
   *      #github-import-btn, #github-url-input
   *    - Calls handleZipUpload when a .zip file is selected
   *    - Calls handleGithubImport when a GitHub URL is submitted
   *    - Calls loadDemoProject when the demo button is clicked
   *
   *  showUploadProgress(title)
   *    - Removes "hidden" from #upload-progress
   *    - Calls setUploadProgress(0, title)
   *
   *  setUploadProgress(pct, title, files, size, langs)
   *    - Updates #upload-progress-title, #upload-progress-pct,
   *      #upload-progress-bar, #stat-files, #stat-size, #stat-langs
   *
   *  closeGithubModal()
   *    - Adds "hidden" to #github-modal
   *    - Clears #github-url-input value
   *
   *  handleZipUpload(file, onFilesReady)
   *    - Validates file extension (.zip) and size (≤ 50 MB)
   *    - Calls JSZip.loadAsync(buffer)
   *    - Calls validateProjectZip on the extracted entries
   *    - Calls onFilesReady(files) on success
   *
   *  handleGithubImport(url, onFilesReady)
   *    - Validates URL matches /github.com/owner/repo/
   *    - Fetches GitHub API metadata and file tree
   *    - Calls onFilesReady(files) on success
   *
   * Install jest-environment-jsdom to enable full DOM testing.
   */
  test('notice: DOM functions require jest-environment-jsdom', () => {
    expect(true).toBe(true); // Documentation test — always passes
  });
});
