/**
 * app.js — Main application bootstrap and orchestrator
 */

/* ─────────────────────────────────────────────
   Global App State
───────────────────────────────────────────── */
window._appState = {
  phase:       'upload',
  files:       [],
  analysis:    null,
  docs:        null,
  suggestions: [],
};

/* ─────────────────────────────────────────────
   Bootstrap
───────────────────────────────────────────── */
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
});

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
    // Run analysis
    const analysis = analyzeProject(files);
    window._appState.analysis = analysis;

    // Animate the steps (reads from analysis for realistic messages)
    await animateAnalysis(analysis);

    // Generate all docs
    const docs = generateDocs(analysis);
    window._appState.docs = docs;

    // Generate suggestions
    const suggestions = generateSuggestions(analysis);
    window._appState.suggestions = suggestions;

    // Small pause before showing dashboard
    await sleep(400);

    // Transition to dashboard
    showPhase('dashboard');

    // Populate dashboard
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
   Reset / New Project
───────────────────────────────────────────── */
function resetApp() {
  window._appState = {
    phase: 'upload', files: [], analysis: null, docs: null, suggestions: [],
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
  document.querySelectorAll('.analysis-step').forEach(s => {
    s.classList.remove('running', 'done');
  });
  document.querySelectorAll('.step-detail').forEach(d => {
    d.textContent = 'Pending…';
  });

  // Reset file tree
  const fileTree = document.getElementById('file-tree');
  if (fileTree) fileTree.innerHTML = '';

  // Reset doc panels
  document.querySelectorAll('.doc-panel').forEach(p => {
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
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
