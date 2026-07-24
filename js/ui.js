/**
 * ui.js — UI rendering, tab navigation, file tree, gauges, search
 */

/* global copyToClipboard, downloadFile */

/* ─────────────────────────────────────────────
   Theme Toggle
───────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('aidocgen-theme', theme);

  // Update all theme toggle icons
  const moons = document.querySelectorAll('[id*="moon"]');
  const suns = document.querySelectorAll('[id*="sun"]');
  if (theme === 'dark') {
    moons.forEach((el) => el.classList.remove('hidden'));
    suns.forEach((el) => el.classList.add('hidden'));
  } else {
    moons.forEach((el) => el.classList.add('hidden'));
    suns.forEach((el) => el.classList.remove('hidden'));
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ─────────────────────────────────────────────
   Phase Transitions
───────────────────────────────────────────── */
function showPhase(phase) {
  document.querySelectorAll('.phase').forEach((el) => {
    el.classList.remove('active');
    el.classList.add('hidden');
  });
  const target = document.getElementById(`${phase}-phase`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }
}

/* ─────────────────────────────────────────────
   Analysis Steps Animator
───────────────────────────────────────────── */
const STEPS = ['scanning', 'framework', 'deps', 'api', 'arch', 'generating'];
const STEP_PCT = [15, 30, 50, 65, 80, 100];

async function animateAnalysis(analysis) {
  const bar = document.getElementById('analysis-bar');
  const pct = document.getElementById('analysis-pct');

  const stepMessages = {
    scanning: `Found ${analysis.fileCount} files (${analysis.formatBytes(analysis.totalSize)})`,
    framework:
      analysis.framework || analysis.backendFramework || analysis.metaFramework
        ? `Detected: ${[analysis.metaFramework, analysis.framework, analysis.backendFramework].filter(Boolean).join(' + ')}`
        : `Primary language: ${analysis.primaryLanguage}`,
    deps: Object.keys(analysis.dependencies).length
      ? `${Object.keys(analysis.dependencies).length} prod, ${Object.keys(analysis.devDependencies).length} dev dependencies`
      : 'No package manager detected',
    api:
      analysis.apiRoutes.length > 0
        ? `Found ${analysis.apiRoutes.length} API endpoint${analysis.apiRoutes.length > 1 ? 's' : ''}`
        : 'No API routes found',
    arch: analysis.folderStructure.children?.length
      ? `Mapped ${analysis.folderStructure.children.length} top-level directories`
      : 'Architecture mapped',
    generating: 'README, API docs, Architecture, Contributing, Changelog',
  };

  for (let i = 0; i < STEPS.length; i++) {
    const stepId = `step-${STEPS[i]}`;
    const stepEl = document.getElementById(stepId);
    const detailEl = document.getElementById(`${stepId}-detail`);

    if (stepEl) stepEl.classList.add('running');
    await sleep(400 + Math.random() * 300);

    if (bar) bar.style.width = STEP_PCT[i] + '%';
    if (pct) pct.textContent = STEP_PCT[i] + '%';
    if (detailEl) detailEl.textContent = stepMessages[STEPS[i]] || 'Done';
    if (stepEl) stepEl.classList.replace('running', 'done');

    await sleep(200);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ─────────────────────────────────────────────
   Tab Navigation
───────────────────────────────────────────── */
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
    btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach((el) => {
    el.classList.toggle('active', el.id === `tab-${tabId}`);
  });

  // Initialize doc panel on first visit
  const docPanel = document.querySelector(`#tab-${tabId} .doc-panel`);
  if (docPanel && !docPanel.dataset.initialized) {
    initDocPanel(docPanel);
  }
}

/* ─────────────────────────────────────────────
   Doc Panel Builder
───────────────────────────────────────────── */
const DOC_META = {
  readme: { title: '📋 README.md', filename: 'README.md' },
  installation: { title: '🔧 INSTALLATION.md', filename: 'INSTALLATION.md' },
  api: { title: '🔌 API_DOCS.md', filename: 'API_DOCS.md' },
  architecture: { title: '🏗️ ARCHITECTURE.md', filename: 'ARCHITECTURE.md' },
  contributing: { title: '🤝 CONTRIBUTING.md', filename: 'CONTRIBUTING.md' },
  changelog: { title: '📝 CHANGELOG.md', filename: 'CHANGELOG.md' },
};

function initDocPanel(panel) {
  const docKey = panel.dataset.doc;
  const filename = panel.dataset.filename;
  const meta = DOC_META[docKey] || { title: docKey, filename };
  const markdown = (window._appState?.docs || {})[docKey] || '';

  panel.innerHTML = `
    <div class="doc-toolbar">
      <div class="doc-toolbar-left">
        <h2 class="doc-title">${meta.title}</h2>
        <div class="view-toggle">
          <button class="view-btn active" data-view="preview" id="${docKey}-preview-btn">Preview</button>
          <button class="view-btn" data-view="source" id="${docKey}-source-btn">Source</button>
        </div>
      </div>
      <div class="doc-toolbar-right">
        <div class="search-box">
          <input type="search" class="search-input" id="${docKey}-search" placeholder="Search…" aria-label="Search in ${meta.filename}">
        </div>
        <button class="btn btn-ghost btn-sm" id="${docKey}-copy-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
        <button class="btn btn-primary btn-sm" id="${docKey}-download-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        </button>
      </div>
    </div>
    <div class="doc-content">
      <div id="${docKey}-preview" class="markdown-preview"></div>
      <div id="${docKey}-source" class="source-view hidden">
        <pre><code id="${docKey}-code" class="language-markdown"></code></pre>
      </div>
    </div>
  `;

  renderMarkdownPreview(docKey, markdown);
  setupDocPanelEvents(docKey, filename, markdown);
  panel.dataset.initialized = 'true';
}

function renderMarkdownPreview(docKey, markdown) {
  const preview = document.getElementById(`${docKey}-preview`);
  const code = document.getElementById(`${docKey}-code`);

  if (preview && typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: (code, lang) => {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return code;
      },
    });
    preview.innerHTML = marked.parse(markdown || '*No content generated.*');

    // Apply syntax highlighting to code blocks
    if (typeof hljs !== 'undefined') {
      preview.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
      });
    }
  }

  if (code) {
    code.textContent = markdown || '';
    if (typeof hljs !== 'undefined') {
      hljs.highlightElement(code);
    }
  }
}

function setupDocPanelEvents(docKey, filename, markdown) {
  // View toggle
  const previewBtn = document.getElementById(`${docKey}-preview-btn`);
  const sourceBtn = document.getElementById(`${docKey}-source-btn`);
  const previewEl = document.getElementById(`${docKey}-preview`);
  const sourceEl = document.getElementById(`${docKey}-source`);

  previewBtn?.addEventListener('click', () => {
    previewBtn.classList.add('active');
    sourceBtn.classList.remove('active');
    previewEl.classList.remove('hidden');
    sourceEl.classList.add('hidden');
  });

  sourceBtn?.addEventListener('click', () => {
    sourceBtn.classList.add('active');
    previewBtn.classList.remove('active');
    sourceEl.classList.remove('hidden');
    previewEl.classList.add('hidden');
  });

  // Copy
  document.getElementById(`${docKey}-copy-btn`)?.addEventListener('click', () => {
    copyToClipboard(markdown);
  });

  // Download
  document.getElementById(`${docKey}-download-btn`)?.addEventListener('click', () => {
    downloadFile(filename, markdown);
  });

  // Search
  document.getElementById(`${docKey}-search`)?.addEventListener('input', (e) => {
    searchInPreview(previewEl, e.target.value);
  });
}

function searchInPreview(previewEl, query) {
  if (!previewEl) return;
  // Remove existing highlights
  previewEl.querySelectorAll('mark.search-highlight').forEach((m) => {
    m.replaceWith(m.textContent);
  });
  if (!query.trim() || query.length < 2) return;

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx >= 0) {
        const span = document.createElement('span');
        span.appendChild(document.createTextNode(text.slice(0, idx)));
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.style.cssText = 'background:rgba(124,58,237,0.4);border-radius:2px;';
        mark.textContent = text.slice(idx, idx + query.length);
        span.appendChild(mark);
        span.appendChild(document.createTextNode(text.slice(idx + query.length)));
        node.parentNode.replaceChild(span, node);
      }
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      !['SCRIPT', 'STYLE', 'PRE', 'CODE'].includes(node.tagName)
    ) {
      [...node.childNodes].forEach(walk);
    }
  };
  walk(previewEl);

  const firstMark = previewEl.querySelector('mark.search-highlight');
  firstMark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ─────────────────────────────────────────────
   File Tree
───────────────────────────────────────────── */
function renderFileTree(node, container, depth = 0) {
  const items = (node.children || [])
    .filter((c) => !['node_modules', '.git', '__pycache__'].includes(c.name))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  for (const item of items) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'tree-node';

    const row = document.createElement('div');
    row.className = 'tree-node-row';
    row.style.paddingLeft = `${depth * 14 + 6}px`;

    if (item.type === 'dir') {
      const toggle = document.createElement('span');
      toggle.className = 'tree-toggle';
      toggle.innerHTML = '▶';

      const icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.textContent = getFolderIcon(item.name);

      const label = document.createElement('span');
      label.className = 'tree-label';
      label.textContent = item.name;

      row.append(toggle, icon, label);
      nodeEl.appendChild(row);

      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';
      childContainer.style.display = 'none';
      nodeEl.appendChild(childContainer);

      row.addEventListener('click', () => {
        const isOpen = childContainer.style.display !== 'none';
        childContainer.style.display = isOpen ? 'none' : 'block';
        toggle.textContent = isOpen ? '▶' : '▼';
        toggle.classList.toggle('open', !isOpen);
      });

      if (item.children?.length) {
        renderFileTree(item, childContainer, depth + 1);
      }

      // Auto-expand important directories at top level
      if (
        depth === 0 &&
        ['src', 'lib', 'app', 'packages', 'api'].includes(item.name.toLowerCase())
      ) {
        row.click();
      }
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'tree-toggle';
      spacer.innerHTML = '&nbsp;';

      const icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.textContent = getFileIcon(item.ext, item.name);

      const label = document.createElement('span');
      label.className = 'tree-label';
      label.textContent = item.name;
      label.title = item.path;

      const size = document.createElement('span');
      size.className = 'tree-size';
      size.textContent = formatFileSize(item.size);

      row.append(spacer, icon, label, size);
      nodeEl.appendChild(row);
    }

    container.appendChild(nodeEl);
  }
}

function getFolderIcon(name) {
  const icons = {
    src: '📁',
    app: '📁',
    lib: '📚',
    test: '🧪',
    tests: '🧪',
    __tests__: '🧪',
    public: '🌐',
    assets: '🖼️',
    components: '🧩',
    pages: '📄',
    api: '🔌',
    routes: '🛣️',
    models: '🗃️',
    controllers: '🎮',
    services: '⚙️',
    middleware: '🔀',
    config: '⚙️',
    styles: '🎨',
    css: '🎨',
    hooks: '🪝',
    utils: '🔧',
    helpers: '🔧',
    types: '🔷',
    docs: '📖',
    scripts: '📜',
    migrations: '🔄',
    seeds: '🌱',
    '.github': '🐱',
    workflows: '⚙️',
    docker: '🐳',
  };
  return icons[name.toLowerCase()] || '📁';
}

function getFileIcon(ext, name) {
  if (name === 'package.json') return '📦';
  if (name === '.env' || name === '.env.example') return '🔐';
  if (name === 'Dockerfile') return '🐳';
  if (name === 'docker-compose.yml') return '🐳';
  if (name === 'README.md') return '📖';
  if (name === 'LICENSE') return '⚖️';
  if (name === '.gitignore') return '🔒';

  const icons = {
    '.js': '🟨',
    '.jsx': '⚛️',
    '.ts': '🔷',
    '.tsx': '⚛️',
    '.py': '🐍',
    '.java': '☕',
    '.go': '🐹',
    '.rs': '🦀',
    '.rb': '💎',
    '.php': '🐘',
    '.cs': '🔵',
    '.swift': '🍎',
    '.html': '🌐',
    '.css': '🎨',
    '.scss': '🎨',
    '.json': '📋',
    '.yaml': '📋',
    '.yml': '📋',
    '.toml': '📋',
    '.md': '📝',
    '.txt': '📄',
    '.sh': '⚡',
    '.bash': '⚡',
    '.sql': '🗄️',
    '.graphql': '◉',
    '.vue': '💚',
    '.svelte': '🔥',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.svg': '🖼️',
    '.test.js': '🧪',
    '.spec.js': '🧪',
    '.test.ts': '🧪',
  };
  return icons[ext] || '📄';
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'K';
  return (bytes / (1024 * 1024)).toFixed(1) + 'M';
}

/* ─────────────────────────────────────────────
   Score Gauges
───────────────────────────────────────────── */
function animateGauge(gaugeId, numId, labelId, score) {
  const gauge = document.getElementById(gaugeId);
  const num = document.getElementById(numId);
  const label = document.getElementById(labelId);

  if (!gauge) return;

  const circumference = 2 * Math.PI * 50; // 314.16
  const offset = circumference * (1 - score / 100);

  setTimeout(() => {
    gauge.style.strokeDashoffset = offset;
  }, 200);

  // Animate number
  let current = 0;
  const step = score / 60;
  const timer = setInterval(() => {
    current = Math.min(current + step, score);
    if (num) num.textContent = Math.round(current);
    if (current >= score) {
      clearInterval(timer);
      if (num) num.textContent = score;
    }
  }, 1000 / 60);

  if (label) {
    if (score >= 80) label.textContent = '⭐ Excellent';
    else if (score >= 60) label.textContent = '✅ Good';
    else if (score >= 40) label.textContent = '⚠️ Needs Work';
    else label.textContent = '❌ Poor';
  }
}

/* ─────────────────────────────────────────────
   Overview Tab
───────────────────────────────────────────── */
function renderOverview(analysis, docs, _suggestions) {
  // ── Confidence warning banner ──
  const bannerContainer = document.getElementById('confidence-banner');
  if (bannerContainer) {
    if (analysis.analysisConfidence === 'low') {
      bannerContainer.innerHTML = `
        <div class="confidence-banner confidence-low">
          <div class="confidence-banner-icon">⚠️</div>
          <div class="confidence-banner-body">
            <strong>Limited project signals detected</strong>
            <p>Documentation may be incomplete or generic. For best results, ensure your ZIP includes source code and a config file (package.json, pom.xml, requirements.txt, Cargo.toml, etc.).</p>
            ${analysis.detectedSignals?.length ? `<p class="confidence-signals">Detected: ${analysis.detectedSignals.join(' · ')}</p>` : ''}
          </div>
          <button class="confidence-banner-close" onclick="this.closest('.confidence-banner').remove()" aria-label="Dismiss">✕</button>
        </div>`;
    } else if (analysis.analysisConfidence === 'medium') {
      bannerContainer.innerHTML = `
        <div class="confidence-banner confidence-medium">
          <div class="confidence-banner-icon">ℹ️</div>
          <div class="confidence-banner-body">
            <strong>Partial analysis</strong>
            <p>Some project signals were detected. Documentation covers what was found — add more source files or a config file to unlock deeper analysis.</p>
            ${analysis.detectedSignals?.length ? `<p class="confidence-signals">Detected: ${analysis.detectedSignals.join(' · ')}</p>` : ''}
          </div>
          <button class="confidence-banner-close" onclick="this.closest('.confidence-banner').remove()" aria-label="Dismiss">✕</button>
        </div>`;
    } else {
      bannerContainer.innerHTML = ''; // high confidence — no banner needed
    }
  }

  // Scores
  animateGauge('quality-gauge', 'quality-num', 'quality-label', analysis.qualityScore);
  animateGauge('health-gauge', 'health-num', 'health-label', analysis.healthScore);

  // Project stats
  const statsGrid = document.getElementById('project-stats-grid');
  if (statsGrid) {
    const stats = [
      { key: 'Project Name', val: analysis.projectName },
      { key: 'Version', val: analysis.version || '—' },
      { key: 'Language', val: analysis.primaryLanguage },
      {
        key: 'Framework',
        val:
          [analysis.metaFramework, analysis.framework, analysis.backendFramework].filter(
            Boolean
          )[0] || '—',
      },
      { key: 'Database', val: analysis.database || '—' },
      { key: 'Package Manager', val: analysis.packageManager || '—' },
      { key: 'Files', val: analysis.fileCount + ' files' },
      { key: 'Project Size', val: analysis.formatBytes(analysis.totalSize) },
      { key: 'Auth', val: analysis.authentication || '—' },
      { key: 'Build Tool', val: analysis.buildTool || '—' },
      { key: 'Tests', val: analysis.hasTests ? analysis.testFramework || 'Yes' : 'Not found' },
      { key: 'License', val: analysis.license || 'Not specified' },
    ];

    statsGrid.innerHTML = stats
      .map(
        (s) => `
      <div class="stat-item">
        <span class="stat-key">${s.key}</span>
        <span class="stat-val">${s.val}</span>
      </div>
    `
      )
      .join('');
  }

  // Tech badges
  const techWrap = document.getElementById('tech-badges-wrap');
  if (techWrap) {
    const techItems = [
      { label: analysis.metaFramework, color: '' },
      { label: analysis.framework, color: 'sky' },
      { label: analysis.backendFramework, color: '' },
      { label: analysis.database, color: 'green' },
      { label: analysis.orm, color: 'green' },
      { label: analysis.authentication, color: 'amber' },
      { label: analysis.buildTool, color: 'sky' },
      { label: analysis.testFramework, color: 'green' },
      { label: analysis.packageManager, color: '' },
      ...analysis.languages.slice(0, 4).map((l) => ({
        label: l,
        color: '',
        isLang: true,
        langColor: (analysis.langColors || {})[l],
      })),
    ].filter((t) => t.label);

    techWrap.innerHTML = techItems
      .map(
        (t) => `
      <span class="tech-badge ${t.color}">
        ${t.isLang && t.langColor ? `<span class="lang-dot" style="background:${t.langColor}"></span>` : ''}
        ${t.label}
      </span>
    `
      )
      .join('');
  }

  // Dependencies
  const depsList = document.getElementById('deps-list');
  if (depsList) {
    const allDeps = [
      ...Object.entries(analysis.dependencies).map(([n, v]) => ({ name: n, ver: v, type: 'prod' })),
      ...Object.entries(analysis.devDependencies)
        .slice(0, 5)
        .map(([n, v]) => ({ name: n, ver: v, type: 'dev' })),
    ].slice(0, 14);

    depsList.innerHTML =
      allDeps.length > 0
        ? allDeps
            .map(
              (d) => `
      <div class="dep-item">
        <span class="dep-name">${d.name}</span>
        <span class="dep-ver">${d.ver}</span>
        <span class="dep-type">${d.type}</span>
      </div>
    `
            )
            .join('')
        : '<p style="color:var(--text-3);font-size:0.8rem;text-align:center;padding:12px;">No dependencies found</p>';
  }

  // Generated docs list
  const docsList = document.getElementById('generated-docs-list');
  if (docsList && docs) {
    const docItems = [
      { key: 'readme', icon: '📋', name: 'README.md', tab: 'readme' },
      { key: 'installation', icon: '🔧', name: 'INSTALLATION.md', tab: 'installation' },
      { key: 'api', icon: '🔌', name: 'API_DOCS.md', tab: 'api' },
      { key: 'architecture', icon: '🏗️', name: 'ARCHITECTURE.md', tab: 'architecture' },
      { key: 'contributing', icon: '🤝', name: 'CONTRIBUTING.md', tab: 'contributing' },
      { key: 'changelog', icon: '📝', name: 'CHANGELOG.md', tab: 'changelog' },
    ];
    docsList.innerHTML = docItems
      .map((d) => {
        const size = docs[d.key] ? formatFileSize(new Blob([docs[d.key]]).size) : '—';
        return `
        <div class="gen-doc-item" onclick="switchTab('${d.tab}')" role="button" tabindex="0" aria-label="View ${d.name}">
          <span class="gen-doc-icon">${d.icon}</span>
          <span class="gen-doc-name">${d.name}</span>
          <span class="gen-doc-size">${size}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-3)"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      `;
      })
      .join('');
  }
}

/* ─────────────────────────────────────────────
   Suggestions Tab
───────────────────────────────────────────── */
function renderSuggestions(suggestions) {
  const list = document.getElementById('suggestions-list');
  const badge = document.getElementById('suggestions-badge');

  if (badge) {
    badge.textContent = suggestions.length;
    badge.classList.toggle('hidden', suggestions.length === 0);
  }

  if (!list) return;

  if (suggestions.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px 24px;color:var(--text-2);">
        <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
        <h3 style="font-weight:700;margin-bottom:8px;">Excellent project health!</h3>
        <p style="font-size:0.88rem;">No major issues found. Your project follows best practices.</p>
      </div>`;
    return;
  }

  list.innerHTML = suggestions
    .map(
      (s) => `
    <div class="suggestion-card ${s.priority}" role="listitem" data-priority="${s.priority}">
      <div class="suggestion-icon">${s.icon}</div>
      <div class="suggestion-body">
        <p class="suggestion-title">${s.title}</p>
        <p class="suggestion-desc">${s.desc}</p>
        <div class="suggestion-meta">
          <span class="priority-badge ${s.priority}">${s.priority.charAt(0).toUpperCase() + s.priority.slice(1)} Priority</span>
          <span class="category-badge">${s.category}</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      list.querySelectorAll('.suggestion-card').forEach((card) => {
        card.style.display = filter === 'all' || card.dataset.priority === filter ? 'flex' : 'none';
      });
    });
  });
}

/* ─────────────────────────────────────────────
   Dashboard Header Population
───────────────────────────────────────────── */
function populateDashboardHeader(analysis) {
  const nameEl = document.getElementById('dash-project-name');
  const badgesEl = document.getElementById('dash-lang-badges');

  if (nameEl) nameEl.textContent = analysis.projectName;
  if (badgesEl) {
    const langs = analysis.languages.slice(0, 3);
    badgesEl.innerHTML = langs
      .map((l) => {
        const color = (analysis.langColors || {})[l] || '#888';
        return `<span class="lang-badge">
        <span class="lang-dot" style="background:${color}"></span>
        ${l}
      </span>`;
      })
      .join('');
  }
}

/* ─────────────────────────────────────────────
   Expose globals for cross-file access via <script> tags
───────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;
  window.showPhase = showPhase;
  window.animateAnalysis = animateAnalysis;
  window.setupTabs = setupTabs;
  window.switchTab = switchTab;
  window.renderFileTree = renderFileTree;
  window.renderOverview = renderOverview;
  window.renderSuggestions = renderSuggestions;
  window.populateDashboardHeader = populateDashboardHeader;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    applyTheme,
    toggleTheme,
    showPhase,
    animateAnalysis,
    setupTabs,
    switchTab,
    renderFileTree,
    renderOverview,
    renderSuggestions,
    populateDashboardHeader,
  };
}
