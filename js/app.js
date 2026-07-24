/**
 * app.js — Main application bootstrap and orchestrator
 *
 * Generation strategy (chosen at runtime):
 *   1. AI-powered  — calls POST /api/generate via window._aiClient
 *                    (requires the Node.js server to be running)
 *   2. Template    — falls back to the local generateDocs() engine
 *                    (always works, works offline / without the server)
 *
 * The strategy is selected automatically. The rest of the application
 * (upload, analysis, UI, export) is completely unchanged.
 */

/* global applyTheme, toggleTheme, setupTabs, setupUploader, showToast,
          showPhase, switchTab, analyzeProject, animateAnalysis,
          generateSuggestions, populateDashboardHeader, renderFileTree,
          renderOverview, renderSuggestions, generateDocs, downloadAllAsZip */

/* ─────────────────────────────────────────────
   Global App State
───────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window._appState = {
    phase: 'upload',
    files: [],
    analysis: null,
    docs: null,
    suggestions: [],
    /** true once we've confirmed the AI backend is reachable + configured */
    aiAvailable: false,
  };
}

/* ─────────────────────────────────────────────
   Bootstrap
───────────────────────────────────────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Restore theme
    const savedTheme = localStorage.getItem('aidocgen-theme') || 'dark';
    applyTheme(savedTheme);

    // Theme toggles
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('dash-theme-toggle')?.addEventListener('click', toggleTheme);

    // Tab navigation
    setupTabs();

    // Upload module
    setupUploader(onFilesReady);

    // Dashboard action buttons
    document.getElementById('download-all-btn')?.addEventListener('click', () => {
      const { docs, analysis } = window._appState;
      if (docs && analysis) {
        downloadAllAsZip(docs, analysis.projectName);
      } else {
        showToast('No documentation generated yet.', 'error');
      }
    });

    document.getElementById('new-project-btn')?.addEventListener('click', () => {
      resetApp();
    });

    // Probe the AI backend on startup (non-blocking — doesn't delay the UI)
    _probeAIService();
  });
}

/* ─────────────────────────────────────────────
   AI Service Health Probe
   Runs once on page load to decide the generation strategy.
───────────────────────────────────────────── */
async function _probeAIService() {
  if (!window._aiClient) return; // aiClient.js not loaded (shouldn't happen)

  try {
    const health = await window._aiClient.checkAIServiceHealth();
    window._appState.aiAvailable = health.available && health.keyConfigured;

    if (health.available && !health.keyConfigured) {
      console.warn(
        '[AI] Server is running but GEMINI_API_KEY is not configured. ' +
          'Falling back to template-based generation.'
      );
    } else if (!health.available) {
      console.info(
        '[AI] Backend server not detected. ' +
          'Using template-based generation. ' +
          'Run `npm run dev` to enable AI-powered docs.'
      );
    } else {
      console.info(`[AI] ✅ AI service ready (provider: ${health.provider})`);
    }
  } catch {
    window._appState.aiAvailable = false;
  }
}

/* ─────────────────────────────────────────────
   Main Pipeline: Files → Analysis → Docs → Dashboard
───────────────────────────────────────────── */
async function onFilesReady(files) {
  window._appState.files = files;

  if (!files || files.length === 0) {
    showToast('No files found in the uploaded project.', 'error');
    return;
  }

  // Transition to analysis phase
  showPhase('analysis');

  // Give the browser time to paint the analysis screen
  await sleep(100);

  try {
    // ── Step 1: Static analysis (always runs, unchanged) ──────────────
    const analysis = analyzeProject(files);
    window._appState.analysis = analysis;

    // ── Step 2: Animate the analysis steps UI ─────────────────────────
    await animateAnalysis(analysis);

    // ── Step 3: Generate documentation ───────────────────────────────
    const docs = await _generateDocsWithFallback(analysis);
    window._appState.docs = docs;

    // ── Step 4: Generate suggestions (unchanged) ─────────────────────
    const suggestions = generateSuggestions(analysis);
    window._appState.suggestions = suggestions;

    // Small pause before showing dashboard
    await sleep(400);

    // ── Step 5: Render dashboard (unchanged) ─────────────────────────
    showPhase('dashboard');
    populateDashboardHeader(analysis);
    renderFileTree(analysis.folderStructure, document.getElementById('file-tree'));
    renderOverview(analysis, docs, suggestions);
    renderSuggestions(suggestions);

    // Update file tree stats
    const treeStats = document.getElementById('tree-stats');
    if (treeStats) {
      treeStats.textContent = `${analysis.fileCount} files · ${analysis.formatBytes(analysis.totalSize)}`;
    }
  } catch (err) {
    console.error('Analysis failed:', err);
    showToast('Analysis failed: ' + (err.message || 'Unknown error'), 'error');
    showPhase('upload');
  }
}

/* ─────────────────────────────────────────────
   Documentation Generation — AI with Template Fallback
   Preserves existing workflow; only swaps the generation back-end.
───────────────────────────────────────────── */

/** All six doc types the app supports */
const _DOC_TYPES = ['readme', 'installation', 'api', 'architecture', 'contributing', 'changelog'];

/**
 * Attempts AI generation for all doc types.
 * Falls back to the template engine (generateDocs) on any failure.
 *
 * @param {object} analysis — result of analyzeProject()
 * @returns {Promise<object>} — { readme, installation, api, architecture, contributing, changelog }
 */
async function _generateDocsWithFallback(analysis) {
  // If AI is not available, skip straight to templates
  if (!window._appState.aiAvailable || !window._aiClient) {
    console.info('[AI] Using template engine (AI not available).');
    return generateDocs(analysis);
  }

  // Update the generating step in the analysis UI to reflect AI work
  const generatingDetail = document.getElementById('step-generating-detail');
  if (generatingDetail) {
    generatingDetail.textContent = 'Asking Gemini AI to write your docs…';
  }

  // Sanitize the analysis object for JSON serialization
  // (the analysis object contains methods like formatBytes — strip those)
  const analysisContext = _serializeAnalysis(analysis);

  // Generate all doc types concurrently for maximum speed
  const results = await Promise.allSettled(
    _DOC_TYPES.map((docType) =>
      window._aiClient
        .requestAIDoc(docType, analysisContext)
        .then((content) => ({ docType, content, success: true }))
        .catch((err) => ({ docType, error: err, success: false }))
    )
  );

  // Build the docs object — mix AI content and template fallbacks
  const templateDocs = generateDocs(analysis); // always generate as fallback pool
  const docs = {};
  let aiSuccessCount = 0;
  let aiFailureCount = 0;

  for (const result of results) {
    // Promise.allSettled wraps in { status, value } — our inner handler already
    // resolves to { docType, content/error, success }, so value is always set.
    const { docType, content, error, success } = result.value;

    if (success && content) {
      docs[docType] = content;
      aiSuccessCount++;
    } else {
      // Use template fallback for this specific doc type
      docs[docType] = templateDocs[docType];
      aiFailureCount++;

      if (error) {
        const code = error.code || 'UNKNOWN';
        console.warn(`[AI] ${docType} fell back to template (${code}): ${error.message}`);
      }
    }
  }

  // User feedback
  if (aiSuccessCount === _DOC_TYPES.length) {
    if (generatingDetail) {
      generatingDetail.textContent = `${aiSuccessCount} documents generated by Gemini AI ✨`;
    }
  } else if (aiSuccessCount > 0) {
    showToast(
      `${aiSuccessCount}/${_DOC_TYPES.length} docs powered by AI — ` +
        `${aiFailureCount} used template fallback.`,
      'warning'
    );
    if (generatingDetail) {
      generatingDetail.textContent = `${aiSuccessCount} AI + ${aiFailureCount} template docs`;
    }
  } else {
    // All AI calls failed — notify but keep template content
    const firstError = results.find((r) => !r.value.success)?.value?.error;
    const msg = firstError?.message || 'AI service unavailable';
    showToast(`AI generation unavailable — using templates. (${msg})`, 'error');
    if (generatingDetail) {
      generatingDetail.textContent = 'Template-based (AI unavailable)';
    }
  }

  return docs;
}

/**
 * Serializes the analysis object to a plain JSON-safe object.
 * Strips methods (formatBytes etc.) and very large arrays to keep
 * the request payload within a reasonable size.
 *
 * @param {object} analysis
 * @returns {object}
 */
function _serializeAnalysis(analysis) {
  return {
    projectName: analysis.projectName,
    description: analysis.description,
    primaryLanguage: analysis.primaryLanguage,
    languages: analysis.languages,
    framework: analysis.framework,
    metaFramework: analysis.metaFramework,
    backendFramework: analysis.backendFramework,
    database: analysis.database,
    orm: analysis.orm,
    authentication: analysis.authentication,
    packageManager: analysis.packageManager,
    buildTool: analysis.buildTool,
    testFramework: analysis.testFramework,
    license: analysis.license,
    version: analysis.version,
    fileCount: analysis.fileCount,
    totalSize: analysis.totalSize,
    hasDocker: analysis.hasDocker,
    hasCI: analysis.hasCI,
    hasTests: analysis.hasTests,
    hasReadme: analysis.hasReadme,
    hasLicense: analysis.hasLicense,
    hasContributing: analysis.hasContributing,
    hasGitignore: analysis.hasGitignore,
    hasEnvFile: analysis.hasEnvFile,
    // Limit large arrays to avoid huge payloads
    dependencies: analysis.dependencies || {},
    devDependencies: analysis.devDependencies || {},
    scripts: analysis.scripts || {},
    apiRoutes: (analysis.apiRoutes || []).slice(0, 50),
    features: (analysis.features || []).slice(0, 20),
    sqlTables: (analysis.sqlTables || []).slice(0, 20),
    envVars: (analysis.envVars || []).slice(0, 30),
    folderStructure: analysis.folderStructure
      ? {
          name: analysis.folderStructure.name,
          children: (analysis.folderStructure.children || []).slice(0, 30),
        }
      : null,
  };
}

/* ─────────────────────────────────────────────
   Reset / New Project
───────────────────────────────────────────── */
function resetApp() {
  window._appState = {
    phase: 'upload',
    files: [],
    analysis: null,
    docs: null,
    suggestions: [],
    aiAvailable: window._appState.aiAvailable, // preserve probe result
  };

  // Reset file input
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';

  // Reset upload progress
  const prog = document.getElementById('upload-progress');
  if (prog) prog.classList.add('hidden');

  // Reset GitHub input
  const ghInput = document.getElementById('github-url-input');
  if (ghInput) ghInput.value = '';

  // Reset analysis bar
  const bar = document.getElementById('analysis-bar');
  if (bar) bar.style.width = '0%';

  const pct = document.getElementById('analysis-pct');
  if (pct) pct.textContent = '0%';

  // Reset steps
  document.querySelectorAll('.analysis-step').forEach((s) => {
    s.classList.remove('running', 'done');
  });
  document.querySelectorAll('.step-detail').forEach((d) => {
    d.textContent = 'Pending…';
  });

  // Reset file tree
  const fileTree = document.getElementById('file-tree');
  if (fileTree) fileTree.innerHTML = '';

  // Reset doc panels
  document.querySelectorAll('.doc-panel').forEach((p) => {
    p.innerHTML = '';
    p.removeAttribute('data-initialized');
  });

  // Reset suggestions
  const suggList = document.getElementById('suggestions-list');
  if (suggList) suggList.innerHTML = '';

  const badge = document.getElementById('suggestions-badge');
  if (badge) badge.classList.add('hidden');

  // Reset tabs to overview
  switchTab('overview');

  // Go back to upload
  showPhase('upload');
}

/* ─────────────────────────────────────────────
   Utility
───────────────────────────────────────────── */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    onFilesReady,
    resetApp,
    sleep,
  };
}
