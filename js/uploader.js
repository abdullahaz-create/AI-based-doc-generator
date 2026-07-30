/**
 * uploader.js — File upload, drag-and-drop, ZIP extraction, GitHub import
 */

/* global showToast */

/* ─────────────────────────────────────────────
   Upload Handlers Setup
───────────────────────────────────────────── */
function setupUploader(onFilesReady) {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const githubBtn = document.getElementById('github-btn');
  const demoBtn = document.getElementById('demo-btn');

  // File input
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleZipUpload(file, onFilesReady);
  });

  // Drag & Drop
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (file.name.endsWith('.zip') || file.type === 'application/zip') {
        handleZipUpload(file, onFilesReady);
      } else {
        showToast('Please upload a .zip file.', 'error');
      }
    });
  }

  // GitHub URL
  githubBtn?.addEventListener('click', () => {
    document.getElementById('github-modal')?.classList.remove('hidden');
    document.getElementById('github-url-input')?.focus();
  });

  document.getElementById('github-modal-close')?.addEventListener('click', closeGithubModal);
  document.getElementById('github-cancel-btn')?.addEventListener('click', closeGithubModal);

  document.getElementById('github-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeGithubModal();
  });

  document.getElementById('github-import-btn')?.addEventListener('click', () => {
    const url = document.getElementById('github-url-input')?.value.trim();
    if (url) handleGithubImport(url, onFilesReady);
  });

  document.getElementById('github-url-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const url = e.target.value.trim();
      if (url) handleGithubImport(url, onFilesReady);
    }
  });

  // Demo
  demoBtn?.addEventListener('click', () => loadDemoProject(onFilesReady));
}

function closeGithubModal() {
  document.getElementById('github-modal')?.classList.add('hidden');
  const input = document.getElementById('github-url-input');
  if (input) input.value = '';
}

/* ─────────────────────────────────────────────
   Upload Progress UI
───────────────────────────────────────────── */
function showUploadProgress(title = 'Processing…') {
  const prog = document.getElementById('upload-progress');
  if (prog) prog.classList.remove('hidden');
  setUploadProgress(0, title);
}

function setUploadProgress(pct, title, files = null, size = null, langs = null) {
  const titleEl = document.getElementById('upload-progress-title');
  const pctEl = document.getElementById('upload-progress-pct');
  const barEl = document.getElementById('upload-progress-bar');
  const filesEl = document.getElementById('stat-files');
  const sizeEl = document.getElementById('stat-size');
  const langEl = document.getElementById('stat-langs');

  if (titleEl) titleEl.textContent = title;
  if (pctEl) pctEl.textContent = pct + '%';
  if (barEl) barEl.style.width = pct + '%';
  if (files !== null && filesEl) filesEl.textContent = `${files} files`;
  if (size !== null && sizeEl) sizeEl.textContent = size;
  if (langs !== null && langEl) langEl.textContent = langs;
}

/* ─────────────────────────────────────────────
   ZIP Upload Handler
───────────────────────────────────────────── */
async function handleZipUpload(file, onFilesReady) {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    showToast('Please upload a .zip file.', 'error');
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    showToast('File too large. Maximum size is 50 MB.', 'error');
    return;
  }
  if (typeof JSZip === 'undefined') {
    showToast('JSZip library not loaded. Please refresh the page.', 'error');
    return;
  }

  showUploadProgress('Reading ZIP file…');

  try {
    const buffer = await file.arrayBuffer();
    setUploadProgress(20, 'Extracting files…');

    const zip = await JSZip.loadAsync(buffer);
    const files = [];
    const entries = Object.entries(zip.files);
    const total = entries.length;

    setUploadProgress(30, 'Parsing files…', total, formatBytes(file.size));

    let processed = 0;
    for (const [path, zipFile] of entries) {
      if (zipFile.dir) {
        files.push({
          path,
          name: path.split('/').filter(Boolean).pop() || '',
          isDir: true,
          size: 0,
          content: null,
        });
        continue;
      }

      const name = path.split('/').filter(Boolean).pop() || '';
      const ext = name.lastIndexOf('.') >= 0 ? name.slice(name.lastIndexOf('.')).toLowerCase() : '';

      // Skip binary files and very large files
      // Named files (no extension) that should always be read as text
      const TEXT_NAMED_FILES = new Set([
        'dockerfile',
        'makefile',
        'gemfile',
        'rakefile',
        'procfile',
        'cargo.toml',
        'go.mod',
        'go.sum',
        'pipfile',
        'poetry.lock',
        '.gitignore',
        '.dockerignore',
        '.prettierrc',
        '.eslintrc',
        '.editorconfig',
        '.babelrc',
        '.nvmrc',
        '.npmrc',
        '.yarnrc',
        'brewfile',
        'justfile',
        'vagrantfile',
        'readme',
        'license',
        'licence',
        'changelog',
        'contributing',
        'authors',
      ]);

      const TEXT_EXTS = new Set([
        // JavaScript / TypeScript
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.mjs',
        '.cjs',
        '.cts',
        '.mts',
        // Python
        '.py',
        '.pyw',
        '.pyi',
        // JVM
        '.java',
        '.kt',
        '.kts',
        '.scala',
        '.sc',
        '.groovy',
        '.gradle',
        // Systems
        '.go',
        '.rs',
        '.c',
        '.cc',
        '.cpp',
        '.cxx',
        '.h',
        '.hpp',
        '.cs',
        '.swift',
        '.dart',
        // Scripting / Dynamic
        '.rb',
        '.php',
        '.lua',
        '.r',
        '.ex',
        '.exs',
        '.erl',
        '.hrl',
        '.pl',
        '.pm',
        '.tcl',
        '.awk',
        '.fish',
        '.zsh',
        '.sh',
        '.bash',
        '.ps1',
        // Web
        '.vue',
        '.svelte',
        '.html',
        '.htm',
        '.css',
        '.scss',
        '.sass',
        '.less',
        '.styl',
        // Data / Config
        '.json',
        '.yaml',
        '.yml',
        '.toml',
        '.xml',
        '.ini',
        '.cfg',
        '.conf',
        '.properties',
        '.env',
        '.env.example',
        '.env.sample',
        '.env.local',
        // Documentation
        '.md',
        '.mdx',
        '.rst',
        '.txt',
        '.adoc',
        // Query / Schema
        '.sql',
        '.graphql',
        '.gql',
        '.prisma',
        // Build / Package
        '.lock',
        '.example',
        '.sample',
        '.template',
        '.tf',
        '.hcl',
        '.bicep',
        // Other
        '.gitignore',
        '.dockerignore',
        '.editorconfig',
        '.prettierrc',
        '.eslintrc',
      ]);

      let content = null;
      if (TEXT_EXTS.has(ext) || name.startsWith('.') || TEXT_NAMED_FILES.has(name.toLowerCase())) {
        try {
          const text = await zipFile.async('string');
          content = text.length <= 500_000 ? text : text.slice(0, 500_000) + '\n[TRUNCATED]';
        } catch {
          content = null;
        }
      }

      files.push({
        path,
        name,
        isDir: false,
        size: zipFile._data?.uncompressedSize || 0,
        content,
        ext,
      });

      processed++;
      if (processed % 5 === 0) {
        const pct = 30 + Math.round((processed / total) * 60);
        setUploadProgress(pct, `Parsing files… (${processed}/${total})`);
        await sleep(0); // Yield to browser — keep UI responsive
      }
    }

    setUploadProgress(
      95,
      'Finalizing…',
      files.filter((f) => !f.isDir).length,
      formatBytes(file.size),
      detectLangsQuick(files)
    );
    await sleep(200);
    setUploadProgress(100, 'Done!');
    await sleep(300);

    // Validate that the ZIP contains a recognisable software project
    const validation = validateProjectZip(files);
    if (!validation.valid) {
      document.getElementById('upload-progress')?.classList.add('hidden');
      showToast(validation.message, 'error');
      return;
    }
    if (validation.warning) {
      showToast(validation.message, 'warning');
    }

    onFilesReady(files);
  } catch (err) {
    console.error(err);
    showToast('Failed to read ZIP file. It may be corrupted.', 'error');
    document.getElementById('upload-progress')?.classList.add('hidden');
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function detectLangsQuick(files) {
  const counts = {};
  const EXT_LANG = {
    '.js': 'JS',
    '.ts': 'TS',
    '.py': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
  };
  for (const f of files) {
    const lang = EXT_LANG[f.ext];
    if (lang) counts[lang] = (counts[lang] || 0) + 1;
  }
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([l]) => l);
  return top.join(', ') || 'Unknown';
}

/**
 * Validates that a set of extracted ZIP entries looks like a real software project.
 * Returns { valid: boolean, warning: boolean, message: string }
 */
function validateProjectZip(files) {
  const names = new Set(files.map((f) => f.name.toLowerCase()));

  // Strong config signals — any one of these confirms a project
  const CONFIG_FILES = [
    'package.json',
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
    'requirements.txt',
    'cargo.toml',
    'go.mod',
    'pyproject.toml',
    'composer.json',
    'gemfile',
    'mix.exs',
    'pubspec.yaml',
    'cmakelists.txt',
    'setup.py',
    'setup.cfg',
  ];
  const hasConfig = CONFIG_FILES.some((c) => names.has(c));

  // Source code file extensions
  const SRC_EXTS = new Set([
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.cjs',
    '.py',
    '.pyw',
    '.java',
    '.kt',
    '.kts',
    '.scala',
    '.go',
    '.rs',
    '.c',
    '.cc',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.swift',
    '.dart',
    '.rb',
    '.php',
    '.vue',
    '.svelte',
    '.ex',
    '.exs',
    '.erl',
    '.hs',
    '.lua',
  ]);
  const srcFiles = files.filter((f) => !f.isDir && SRC_EXTS.has(f.ext));

  // No config AND fewer than 3 source files → not a software project
  if (!hasConfig && srcFiles.length < 3) {
    const nonSrc = files.filter((f) => !f.isDir).length;
    if (nonSrc === 0) {
      return {
        valid: false,
        warning: false,
        message: 'The ZIP appears to be empty or contains only folders.',
      };
    }
    return {
      valid: false,
      warning: false,
      message: `No software project detected. The ZIP contains ${nonSrc} file${nonSrc !== 1 ? 's' : ''} but no recognisable config (package.json, pom.xml, requirements.txt, etc.) or source code. Please upload your project ZIP.`,
    };
  }

  // Has config but very few source files → proceed with a warning
  if (hasConfig && srcFiles.length === 0) {
    return {
      valid: true,
      warning: true,
      message:
        'Config file found but no source code detected. Documentation will be limited — add source files for richer output.',
    };
  }

  // Only source files, no config → mild warning
  if (!hasConfig && srcFiles.length >= 3 && srcFiles.length < 10) {
    return {
      valid: true,
      warning: true,
      message: `No project config file found (package.json, pom.xml, etc.). Documentation may be incomplete — framework and dependency details will be missing.`,
    };
  }

  return { valid: true, warning: false, message: '' };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ─────────────────────────────────────────────
   GitHub URL Import
───────────────────────────────────────────── */
async function handleGithubImport(url, onFilesReady) {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s]+)/);
  if (!match) {
    showToast('Invalid GitHub URL. Use https://github.com/owner/repo', 'error');
    return;
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, '');

  // Show loading state on button
  const btn = document.getElementById('github-import-btn');
  const txt = document.getElementById('github-import-text');
  const spn = document.getElementById('github-import-spinner');
  if (btn) btn.disabled = true;
  if (txt) txt.textContent = 'Importing…';
  if (spn) spn.classList.remove('hidden');

  try {
    // Fetch repo metadata
    const repoRes = await fetchWithAbort(`https://api.github.com/repos/${owner}/${repoName}`, 10_000);
    if (!repoRes.ok) {
      throw new Error(
        repoRes.status === 404
          ? "Repository not found. Make sure it's public."
          : `GitHub API error: ${repoRes.status}`
      );
    }
    const repoData = await repoRes.json();

    // Fetch file tree
    const branch = repoData.default_branch || 'main';
    const treeRes = await fetchWithAbort(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`,
      10_000
    );
    const treeData = treeRes.ok ? await treeRes.json() : { tree: [] };

    const files = [];

    // Add synthetic repo metadata
    const pkgJson = {
      name: repoData.name || repoName,
      description: repoData.description || '',
      version: '1.0.0',
      author: owner,
      license: repoData.license?.spdx_id || '',
      homepage: repoData.homepage || '',
      keywords: repoData.topics || [],
      repository: repoData.clone_url || '',
    };

    // Fetch important files in parallel with individual timeouts
    const IMPORTANT_FILES = [
      'package.json',
      'requirements.txt',
      'pom.xml',
      'build.gradle',
      'composer.json',
      'Gemfile',
      'go.mod',
      'Cargo.toml',
      '.env.example',
    ];
    const rawBase = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}`;

    const fileEntries = IMPORTANT_FILES.map((fname) => {
      const entry = (treeData.tree || []).find(
        (t) => t.path === fname || t.path.endsWith('/' + fname)
      );
      return entry ? { fname, entry } : null;
    }).filter(Boolean);

    // Fetch all important files concurrently
    const fetchedFiles = await Promise.all(
      fileEntries.map(async ({ fname, entry }) => {
        try {
          const r = await fetchWithAbort(`${rawBase}/${entry.path}`, 8_000);
          if (!r.ok) return null;
          const content = await r.text();
          return {
            path: entry.path,
            name: fname,
            isDir: false,
            size: content.length,
            content,
            ext: fname.slice(fname.lastIndexOf('.')),
            _originalFname: fname,
            _entryPath: entry.path,
          };
        } catch {
          return null; // silently skip failed or timed-out files
        }
      })
    );

    for (const f of fetchedFiles) {
      if (!f) continue;
      files.push(f);
      // Override package.json with repo metadata if it's the root one
      if (f._originalFname === 'package.json' && f._entryPath === 'package.json') {
        try {
          const parsed = JSON.parse(f.content);
          pkgJson.name = parsed.name || pkgJson.name;
          pkgJson.description = parsed.description || pkgJson.description;
          pkgJson.version = parsed.version || pkgJson.version;
          pkgJson.dependencies = parsed.dependencies;
          pkgJson.devDependencies = parsed.devDependencies;
        } catch {
          /* ignore JSON parse errors */
        }
      }
    }

    // Add all tree entries as file references (no content for most)
    for (const entry of (treeData.tree || []).slice(0, 300)) {
      if (!files.find((f) => f.path === entry.path)) {
        const name = entry.path.split('/').pop();
        const ext =
          name.lastIndexOf('.') >= 0 ? name.slice(name.lastIndexOf('.')).toLowerCase() : '';
        files.push({
          path: entry.path,
          name,
          isDir: entry.type === 'tree',
          size: entry.size || 0,
          content: null,
          ext,
        });
      }
    }

    // Ensure we have a package.json
    if (!files.find((f) => f.name === 'package.json')) {
      files.unshift({
        path: 'package.json',
        name: 'package.json',
        isDir: false,
        size: 500,
        content: JSON.stringify(pkgJson),
        ext: '.json',
      });
    }

    closeGithubModal();
    showToast(`Imported ${repoName} from GitHub!`, 'success');
    onFilesReady(files);
  } catch (err) {
    showToast(err.message || 'Failed to import from GitHub.', 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (txt) txt.textContent = 'Import Repository';
    if (spn) spn.classList.add('hidden');
  }
}

/**
 * fetch() wrapper with a per-request AbortController timeout.
 * Throws on timeout or network error — never hangs indefinitely.
 */
async function fetchWithAbort(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────
   Demo Project
───────────────────────────────────────────── */
function loadDemoProject(onFilesReady) {
  const pkg = {
    name: 'taskflow-api',
    version: '2.1.0',
    description: 'A RESTful task management API built with Node.js, Express, and MongoDB',
    main: 'src/server.js',
    scripts: {
      start: 'node src/server.js',
      dev: 'nodemon src/server.js',
      test: 'jest --coverage',
      build: 'tsc -p tsconfig.json',
    },
    dependencies: {
      express: '^4.18.2',
      mongoose: '^7.4.0',
      jsonwebtoken: '^9.0.1',
      bcryptjs: '^2.4.3',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      'express-validator': '^7.0.1',
      multer: '^1.4.5-lts.1',
      nodemailer: '^6.9.4',
      winston: '^3.10.0',
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.6.1',
      supertest: '^6.3.3',
      eslint: '^8.45.0',
      '@types/node': '^20.4.5',
    },
    author: 'Jane Developer',
    license: 'MIT',
    keywords: ['task', 'management', 'api', 'rest', 'nodejs', 'express'],
  };

  const files = [
    {
      path: 'package.json',
      name: 'package.json',
      content: JSON.stringify(pkg, null, 2),
      size: 1200,
    },
    { path: 'package-lock.json', name: 'package-lock.json', content: '{}', size: 45000 },
    {
      path: 'src/server.js',
      name: 'server.js',
      content: `const express = require('express');\nconst mongoose = require('mongoose');\nconst cors = require('cors');\nrequire('dotenv').config();\nconst app = express();\napp.use(express.json());\napp.use('/api/auth', require('./routes/auth'));\napp.use('/api/tasks', require('./routes/tasks'));\napp.use('/api/users', require('./routes/users'));\napp.use('/api/projects', require('./routes/projects'));\napp.get('/health', (req, res) => res.json({ status: 'ok' }));\nmongoose.connect(process.env.MONGODB_URI).then(() => app.listen(process.env.PORT || 3000));`,
      size: 600,
    },
    {
      path: 'src/routes/auth.js',
      name: 'auth.js',
      content: `const router = require('express').Router();\nrouter.post('/login', loginController);\nrouter.post('/register', registerController);\nrouter.post('/logout', logoutController);\nrouter.get('/me', authenticate, getMeController);\nrouter.post('/refresh-token', refreshTokenController);\nmodule.exports = router;`,
      size: 280,
    },
    {
      path: 'src/routes/tasks.js',
      name: 'tasks.js',
      content: `const router = require('express').Router();\nrouter.get('/', authenticate, getTasks);\nrouter.post('/', authenticate, createTask);\nrouter.get('/:id', authenticate, getTask);\nrouter.put('/:id', authenticate, updateTask);\nrouter.delete('/:id', authenticate, deleteTask);\nrouter.patch('/:id/complete', authenticate, completeTask);\nmodule.exports = router;`,
      size: 320,
    },
    {
      path: 'src/routes/users.js',
      name: 'users.js',
      content: `const router = require('express').Router();\nrouter.get('/', authenticate, getUsers);\nrouter.get('/:id', authenticate, getUser);\nrouter.put('/:id', authenticate, updateUser);\nrouter.delete('/:id', authenticate, deleteUser);\nmodule.exports = router;`,
      size: 240,
    },
    {
      path: 'src/routes/projects.js',
      name: 'projects.js',
      content: `const router = require('express').Router();\nrouter.get('/', authenticate, getProjects);\nrouter.post('/', authenticate, createProject);\nrouter.get('/:id', authenticate, getProject);\nrouter.put('/:id', authenticate, updateProject);\nrouter.delete('/:id', authenticate, deleteProject);\nrouter.post('/:id/members', authenticate, addMember);\nmodule.exports = router;`,
      size: 370,
    },
    {
      path: 'src/models/Task.js',
      name: 'Task.js',
      content: `const mongoose = require('mongoose');\nconst TaskSchema = new mongoose.Schema({ title: { type: String, required: true }, description: String, status: { type: String, enum: ['todo','in-progress','done'], default: 'todo' }, assignee: mongoose.Types.ObjectId, project: mongoose.Types.ObjectId, dueDate: Date, priority: { type: String, enum: ['low','medium','high'], default: 'medium' } }, { timestamps: true });\nmodule.exports = mongoose.model('Task', TaskSchema);`,
      size: 520,
    },
    {
      path: 'src/models/User.js',
      name: 'User.js',
      content: `const mongoose = require('mongoose');\nconst UserSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true }, password: String, role: { type: String, enum: ['user','admin'], default: 'user' }, avatar: String }, { timestamps: true });\nmodule.exports = mongoose.model('User', UserSchema);`,
      size: 420,
    },
    {
      path: 'src/models/Project.js',
      name: 'Project.js',
      content: `const mongoose = require('mongoose');\nconst ProjectSchema = new mongoose.Schema({ name: String, description: String, owner: mongoose.Types.ObjectId, members: [mongoose.Types.ObjectId], status: String }, { timestamps: true });\nmodule.exports = mongoose.model('Project', ProjectSchema);`,
      size: 360,
    },
    {
      path: 'src/middleware/auth.js',
      name: 'auth.js',
      content: `const jwt = require('jsonwebtoken');\nconst authenticate = (req, res, next) => { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Unauthorized' }); jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) return res.status(403).json({ message: 'Forbidden' }); req.user = user; next(); }); };\nmodule.exports = { authenticate };`,
      size: 480,
    },
    {
      path: 'src/config/database.js',
      name: 'database.js',
      content: `const mongoose = require('mongoose');\nmodule.exports = { connect: () => mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }) };`,
      size: 180,
    },
    {
      path: 'src/utils/logger.js',
      name: 'logger.js',
      content: `const winston = require('winston');\nmodule.exports = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });`,
      size: 200,
    },
    {
      path: '.env.example',
      name: '.env.example',
      content: `PORT=3000\nMONGODB_URI=mongodb://localhost:27017/taskflow\nJWT_SECRET=your_super_secret_jwt_key_here\nJWT_EXPIRES_IN=7d\nEMAIL_HOST=smtp.gmail.com\nEMAIL_PORT=587\nEMAIL_USER=your@email.com\nEMAIL_PASS=your_app_password\nCORS_ORIGIN=http://localhost:3000\nNODE_ENV=development\nLOG_LEVEL=info`,
      size: 320,
    },
    {
      path: '.gitignore',
      name: '.gitignore',
      content: `node_modules/\n.env\ndist/\n*.log\ncoverage/\n.DS_Store\n.nyc_output/`,
      size: 90,
    },
    {
      path: 'tests/auth.test.js',
      name: 'auth.test.js',
      content: `const request = require('supertest');\ndescribe('Auth Routes', () => { it('should register a new user'); it('should login with valid credentials'); it('should reject invalid credentials'); it('should refresh token'); });`,
      size: 220,
    },
    {
      path: 'tests/tasks.test.js',
      name: 'tasks.test.js',
      content: `describe('Task Routes', () => { it('should return all tasks'); it('should create a task'); it('should update a task status'); it('should delete a task'); });`,
      size: 200,
    },
    {
      path: 'jest.config.js',
      name: 'jest.config.js',
      content: `module.exports = { testEnvironment: 'node', collectCoverageFrom: ['src/**/*.js'], coverageThreshold: { global: { branches: 70, functions: 80, lines: 80 } } };`,
      size: 180,
    },
    {
      path: '.eslintrc.json',
      name: '.eslintrc.json',
      content: `{"extends": "eslint:recommended", "env": {"node": true, "es2021": true}, "rules": {"no-unused-vars": "warn"}}`,
      size: 110,
    },
    {
      path: 'README.md',
      name: 'README.md',
      content: `# TaskFlow API\nA task management REST API.`,
      size: 40,
    },
    {
      path: 'vite.config.js',
      name: 'vite.config.js',
      content: `import { defineConfig } from 'vite';\nexport default defineConfig({});`,
      size: 60,
    },
  ].map((f) => ({
    ...f,
    ext: f.name.lastIndexOf('.') >= 0 ? f.name.slice(f.name.lastIndexOf('.')).toLowerCase() : '',
    isDir: false,
  }));

  showToast('Demo project loaded!', 'success');
  onFilesReady(files);
}

/* ─────────────────────────────────────────────
   Expose globals for cross-file access via <script> tags
───────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.setupUploader = setupUploader;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setupUploader,
  };
}
