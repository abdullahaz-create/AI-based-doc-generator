<div align="center">

# AI Doc Generator

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JSZip](https://img.shields.io/badge/JSZip-3.10.1-blue?style=flat-square)
![Marked](https://img.shields.io/badge/marked-9.1.2-orange?style=flat-square)
![highlight.js](https://img.shields.io/badge/highlight.js-11.9.0-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> A fully client-side, zero-backend web application that analyzes any project ZIP archive or GitHub repository and instantly generates **six professional Markdown documentation files** — README, INSTALLATION, API Docs, Architecture Guide, Contributing Guide, and Changelog — using an evidence-based static code analysis engine.

[ Architecture](#-architecture) · [ Features](#-features) · [ Getting Started](#-getting-started) · [ Project Structure](#-project-structure) · [ Tech Stack](#️-tech-stack)

</div>

---

##  Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Running Locally](#running-locally)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Supported Languages & Frameworks](#-supported-languages--frameworks)


---

##  About

**AI Doc Generator** is a browser-only tool (no server, no API calls, no data leaves your machine) that accepts a project ZIP file or a public GitHub repository URL, performs deep static analysis on its source code, and produces a complete documentation suite in seconds.

The core analysis engine (`analyzer.js`) follows a strict evidence-based rule: **every detected technology must be confirmed by actual file content** — an import statement, a dependency entry, an annotation, or a config key. If confidence is below 70%, the field is omitted rather than guessed.

---

##  Features

- 📦 **ZIP Upload & GitHub Import** — Drag-and-drop a `.zip` file (up to 50 MB) or paste a public GitHub repository URL. The GitHub importer uses the GitHub REST API to fetch the tree and key config files (`package.json`, `requirements.txt`, `pom.xml`, etc.).

-  **Multi-Language Deep Static Analysis** — The `analyzeProject()` function in `analyzer.js` dispatches dedicated parsers for each language:
  - `analyzeJavaFile()` — extracts package names, class types, annotations (`@SpringBootApplication`, `@RestController`, `@Entity`), route mappings, method signatures, and inheritance
  - `analyzePythonFile()` — extracts imports, class definitions, function signatures, and Flask/FastAPI/Django route decorators
  - `analyzeJSFile()` — extracts ES6/CJS imports, Express `router.get/post/put/delete` routes, React component names, and custom hooks
  - `analyzeSqlFile()` — extracts `CREATE TABLE`, `CREATE PROCEDURE/FUNCTION`, and `CREATE VIEW` statements

-  **Evidence-Based Framework Detection** — `detectFramework()` identifies Spring Boot, Spring MVC, JavaFX, Java Swing, Android, Next.js, Nuxt.js, SvelteKit, Gatsby, Remix, Astro, React, Vue, Angular, Svelte, Express.js, NestJS, Fastify, Koa, Hono, Django, FastAPI, Flask, Tornado, Streamlit, and Pygame — each backed by explicit import/dependency evidence and assigned a confidence score (0–100).

-  **Database & ORM Detection** — `detectDatabase()` uses a 6-tier priority chain: Spring `application.properties` datasource URLs → `pom.xml` artifact IDs → `build.gradle` dependencies → `requirements.txt` → `package.json` → JDBC imports. Detected databases include MySQL, PostgreSQL, MariaDB, MongoDB, Redis, SQLite, H2, Oracle, MS SQL Server, Cassandra, Firebase, Supabase, and DynamoDB. ORM detection covers JPA/Hibernate, Prisma, Mongoose, Sequelize, TypeORM, Drizzle ORM, SQLAlchemy, PyMongo, psycopg2, and Peewee.

-  **Authentication Detection** — `detectAuthentication()` identifies Spring Security, JWT (jjwt / jose), NextAuth.js, Auth.js, Clerk, Passport.js, Firebase Auth, Supabase Auth, Lucia, Better Auth, Auth0, PyJWT, Django AllAuth, Django Simple JWT, and Flask-Login.

-  **Architecture Pattern Recognition** — `detectArchitecture()` classifies Java projects into four patterns: *Layered Architecture (Controller → Service → Repository)*, *MVC with Service Layer*, *Repository Pattern*, or *Controller-based (MVC)*, and locates the application entry point (e.g. the class annotated with `@SpringBootApplication`).

-  **Design Pattern Detection** — `detectDesignPatterns()` scans class names and Spring annotations for Factory, Builder, Observer, Strategy, Decorator, Adapter, Proxy, Command, Template Method, Singleton, Facade, Mediator, Repository, Scheduler (`@Scheduled`), Event-Driven (`@EventListener`), Async (`@Async`), and Cache-Aside (`@Cacheable`) patterns.

-  **Six Auto-Generated Documents** — `generator.js` produces:
  - `README.md` — project title, Shields.io badges, description, features, tech stack, installation steps, folder tree, environment variable table, deployment section
  - `INSTALLATION.md` — system requirements table, step-by-step setup guide, database-specific extras (Prisma migrate, Django migrations, MongoDB Atlas), troubleshooting section
  - `API_DOCS.md` — base URL table, authentication hint, all detected API routes grouped by resource with request/response examples
  - `ARCHITECTURE.md` — tech stack list, data flow diagram (ASCII), frontend/backend component breakdown, folder structure
  - `CONTRIBUTING.md` — branch naming conventions, commit format, PR checklist
  - `CHANGELOG.md` — initial release entry with detected features

-  **AI Suggestions Panel** — `generateSuggestions()` in `suggestions.js` produces up to 12 prioritized, actionable recommendation cards across categories: Documentation, Security, Testing, CI/CD, DevOps, Performance, Architecture, and Developer Experience (e.g. missing `.gitignore`, missing license, unprotected API endpoints, no test framework, no build tool, large dependency tree).

-  **Quality & Health Scores** — `calculateScores()` computes two 0–100 scores based on the presence of a README, LICENSE, CONTRIBUTING.md, `.gitignore`, `.env.example`, tests, Docker support, CI/CD configuration, API routes, and architecture pattern.

-  **In-Document Search** — Each document panel includes a live search input that walks the rendered Markdown DOM and highlights matching text with `<mark class="search-highlight">` elements.

- **Preview / Source Toggle** — Every document tab renders both a Marked.js Markdown preview (with highlight.js syntax highlighting via the `atom-one-dark` theme) and a raw Markdown source view.

-  **Export Options** — `exporter.js` provides:
  - Individual `.md` file download via the **Download** button on each tab
  - Copy raw Markdown to clipboard (with `execCommand` fallback)
  - **Download All** button that bundles all six `.md` files plus an `INDEX.md` into a ZIP via JSZip using `DEFLATE` compression

- **Light / Dark Theme** — Theme preference (`dark` | `light`) is persisted via `localStorage` under the key `aidocgen-theme`.

- **Try Demo** — The `loadDemoProject()` function in `uploader.js` synthesizes a complete `taskflow-api` project (Node.js + Express + MongoDB) with realistic routes (`/api/auth`, `/api/tasks`, `/api/users`, `/api/projects`), Mongoose models (`Task`, `User`, `Project`), JWT middleware, and a `.env.example`, without requiring any file upload.

- **Interactive File Tree** — `renderFileTree()` in `ui.js` renders a collapsible tree with language-specific emoji icons, auto-expands key directories (`src`, `lib`, `app`, `packages`, `api`), and shows formatted file sizes.

---

## Tech Stack

| Layer | Technology | Version | CDN |
|-------|-----------|---------|-----|
| Structure | HTML5 | — | `index.html` |
| Styling | Vanilla CSS | — | `css/styles.css` |
| Logic | Vanilla JavaScript (ES2024) | — | `js/*.js` |
| ZIP parsing | **JSZip** | 3.10.1 | `cdn.jsdelivr.net` |
| Markdown rendering | **Marked.js** | 9.1.2 | `cdn.jsdelivr.net` |
| Syntax highlighting | **highlight.js** | 11.9.0 | `cdnjs.cloudflare.com` |
| HL.js Theme | `atom-one-dark` | 11.9.0 | `cdnjs.cloudflare.com` |
| Fonts | Inter + JetBrains Mono | — | `fonts.googleapis.com` |
| GitHub data | GitHub REST API v3 | — | `api.github.com` |

> **No build step. No npm dependencies. No backend.** All analysis and generation happens 100% in the browser.

---

##  Getting Started

### Prerequisites

- Any modern web browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 15+)
- A local HTTP server *(optional but recommended — opening `index.html` directly via `file://` works in most browsers)*

### Running Locally

**Option 1 — No server needed (simplest)**

Just open `index.html` directly in your browser. All CDN resources load over HTTPS.

**Option 2 — VS Code Live Server**

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**

**Option 3 — Python HTTP server**

```bash
cd "Ai doc generator"
python -m http.server 8080
# Open http://localhost:8080
```

**Option 4 — Node.js**

```bash
cd "Ai doc generator"
npx serve .
# Open the printed URL
```

---

##  How It Works

The application runs through a linear 3-phase pipeline orchestrated by `app.js`:

```
Phase 1: Upload  →  Phase 2: Analysis  →  Phase 3: Dashboard
```

### Phase 1 — Upload (`uploader.js`)

| Input Method | Implementation |
|---|---|
| ZIP file (click) | `<input type="file" id="file-input" accept=".zip">` → `handleZipUpload()` |
| ZIP file (drag-drop) | `drop` event on `#drop-zone` → `handleZipUpload()` |
| GitHub URL | Modal `#github-modal` → `handleGithubImport()` via GitHub REST API |
| Demo project | `loadDemoProject()` — synthesizes `taskflow-api` in-memory |

`handleZipUpload()` uses **JSZip** to stream-extract entries. Text files matching the `TEXT_EXTS` set (`.js`, `.ts`, `.py`, `.java`, `.go`, `.rs`, `.rb`, `.php`, `.cs`, `.vue`, `.svelte`, `.html`, `.css`, `.sql`, `.json`, `.yaml`, `.md`, `.env`, etc.) are read as UTF-8 strings and truncated to 500,000 characters if necessary. Binary files are skipped.

### Phase 2 — Analysis (`analyzer.js` + animation in `ui.js`)

`analyzeProject(files)` runs these 13 steps in sequence:

1. Filter paths through `IGNORE_DIRS` (skips `node_modules`, `.git`, `target`, `dist`, `.next`, `vendor`, etc.)
2. Partition files by extension into `javaFiles`, `pythonFiles`, `jsFiles`, `sqlFiles`
3. Parse config files: `pom.xml` → `parsePomXml()`, `build.gradle` → `parseBuildGradle()`, `package.json` → `JSON.parse()`, `requirements.txt` → `parseRequirementsTxt()`, `application.properties` → `parseApplicationProperties()`, `application.yml` → `parseApplicationYml()`
4. Scan source code for `process.env.*`, `System.getenv()`, and `os.environ` references to collect env var names
5. Deep-parse sources: up to 120 Java files, 80 Python files, 80 JS/TS files
6. Run all detectors: `detectFramework()`, `detectDatabase()`, `detectAuthentication()`, `detectTestFramework()`, `extractFeatures()`, `detectArchitecture()`, `collectApiRoutes()`, `detectDesignPatterns()`, `scanSecurityIssues()`
7. Compute `computeLanguageStats()` using byte-weighted file counts
8. Extract project metadata from `package.json` / `pom.xml` / directory name
9. Set boolean flags: `hasReadme`, `hasLicense`, `hasContributing`, `hasGitignore`, `hasEnvFile`, `hasDocker`, `hasCI`, `hasTests`
10. Determine `packageManager` and `buildTool` (Maven, Gradle, npm, yarn, pnpm, bun, pip, poetry, pipenv, cargo, go mod, composer, bundler) + detect Vite/Webpack overrides
11. Extract SQL table names from `CREATE TABLE` statements
12. Identify large files (> 300 lines)
13. Assemble the final `analysis` object and compute `qualityScore` / `healthScore`

While analysis runs, `animateAnalysis()` in `ui.js` drives a 6-step progress animation (Scanning → Framework → Dependencies → API → Architecture → Generating) with real values from the `analysis` object.

### Phase 3 — Dashboard (`ui.js` + `generator.js` + `suggestions.js`)

`generateDocs(analysis)` in `generator.js` renders all six Markdown documents as template strings. `generateSuggestions(analysis)` evaluates 14 rules and returns up to 12 priority-sorted cards. The dashboard renders:

- **Overview tab** — two SVG gauge charts (`quality-gauge`, `health-gauge`) animated by `animateGauge()`, a stats grid, tech badges with language color dots, a dependency list, and a generated-docs list
- **Document tabs** — `initDocPanel()` builds a toolbar (preview/source toggle, search, copy, download buttons), renders Markdown via `marked.parse()`, and applies `hljs.highlightElement()` to code blocks
- **AI Suggestions tab** — `renderSuggestions()` renders filterable cards by `high` / `medium` / `low` priority

---

## Project Structure

```
Ai doc generator/
├── index.html              # Single-page app shell — defines 3 phases (upload, analysis, dashboard)
│                           #   and all modals. Loads CDN scripts then local JS in dependency order.
├── css/
│   └── styles.css          # ~39 KB — full design system: CSS custom properties for light/dark
│                           #   themes, glassmorphism effects, gauge animations, file tree styles,
│                           #   suggestion cards, responsive layout, and all component states
└── js/
    ├── analyzer.js         # ~72 KB — core analysis engine (1,466 lines). Contains all parsers
    │                       #   (Java, Python, JS, SQL, pom.xml, build.gradle, .env, requirements.txt),
    │                       #   all detectors, and the main analyzeProject() orchestrator
    ├── generator.js        # ~46 KB — documentation template engine (1,337 lines). Generates
    │                       #   README, INSTALLATION, API_DOCS, ARCHITECTURE, CONTRIBUTING,
    │                       #   CHANGELOG as Markdown strings via generateDocs()
    ├── ui.js               # ~25 KB — all DOM rendering: phase transitions, tab navigation,
    │                       #   doc panel builder (initDocPanel), file tree, gauge animator,
    │                       #   overview/suggestions renderers, theme toggle, in-doc search
    ├── uploader.js         # ~20 KB — file ingestion: ZIP parsing (JSZip), drag-and-drop,
    │                       #   GitHub REST API import, demo project synthesis (loadDemoProject)
    ├── suggestions.js      # ~8 KB — 14 rule-based suggestion generators sorted by priority
    ├── exporter.js         # ~4 KB — downloadFile(), downloadAllAsZip(), copyToClipboard(),
    │                       #   showToast() notification system
    └── app.js              # ~6 KB — bootstrap, global _appState, main pipeline (onFilesReady),
    │                       #   tab setup, resetApp()
```

> **Script load order in `index.html`** (lines 453–459): `analyzer.js` → `generator.js` → `suggestions.js` → `exporter.js` → `ui.js` → `uploader.js` → `app.js`. Each file exposes functions to the global scope; `app.js` is the entry point that wires everything together.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     index.html (SPA Shell)              │
│  Phase 1: #upload-phase  │  Phase 2: #analysis-phase   │
│  Phase 3: #dashboard-phase (tabs + file tree + panels)  │
└───────────────────────────┬─────────────────────────────┘
                            │ DOMContentLoaded
                            ▼
                    ┌───────────────┐
                    │    app.js     │  ← Global _appState
                    │  bootstrap()  │     { phase, files,
                    │ onFilesReady()│       analysis, docs,
                    └──────┬────────┘       suggestions }
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐
  │ uploader.js │  │ analyzer.js  │  │ generator.js  │
  │             │  │              │  │               │
  │ handleZip   │  │analyzeProject│  │generateDocs() │
  │ Upload()    │──▶ (files)      │──▶               │
  │ handleGithub│  │              │  │ generateReadme│
  │ Import()    │  │  13-step     │  │ generateInst. │
  │ loadDemo    │  │  pipeline    │  │ generateApi   │
  │ Project()   │  │              │  │ generateArch  │
  └─────────────┘  └──────┬───────┘  │ generateContr │
                          │          │ generateChang │
                          │          └───────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌──────────────────┐   ┌───────────────────┐
    │  suggestions.js  │   │      ui.js         │
    │                  │   │                   │
    │generateSuggestions│  │ renderOverview()  │
    │  (14 rule checks)│   │ renderFileTree()  │
    └──────────────────┘   │ initDocPanel()    │
                           │ animateGauge()    │
                           │ renderSuggestions │
                           └────────┬──────────┘
                                    │
                           ┌────────▼──────────┐
                           │   exporter.js     │
                           │                   │
                           │ downloadFile()    │
                           │ downloadAllAsZip()│
                           │ copyToClipboard() │
                           │ showToast()       │
                           └───────────────────┘
```

### Global State (`window._appState`)

`app.js` declares a single global object on `window`:

```js
window._appState = {
  phase:       'upload',   // 'upload' | 'analysis' | 'dashboard'
  files:       [],         // raw file objects from uploader
  analysis:    null,       // result of analyzeProject()
  docs:        null,       // result of generateDocs()
  suggestions: [],         // result of generateSuggestions()
};
```

---

## Supported Languages & Frameworks

### Programming Languages (auto-detected by file extension)

JavaScript · TypeScript · Python · Java · Kotlin · Scala · Go · Rust · Ruby · PHP · C# · C++ · C · Swift · Dart · Vue · Svelte · HTML · CSS/SCSS · SQL · Shell · R · Lua · Elixir

### Frameworks & Runtimes

| Category | Detected |
|---|---|
| Java Backend | Spring Boot, Spring MVC, Core Java, Android |
| Java UI | JavaFX (+ FXML), Java Swing |
| Python | Django, FastAPI, Flask, Tornado, Streamlit, Pygame, Tkinter |
| JS Meta-Framework | Next.js, Nuxt.js, SvelteKit, Gatsby, Remix, Astro |
| JS UI | React, Vue.js, Angular, Svelte |
| JS Backend | NestJS, Express.js, Fastify, Koa.js, Hono |

### Databases & ORMs

| Databases | ORMs |
|---|---|
| MySQL, PostgreSQL, MariaDB, MongoDB, Redis, SQLite, H2, Oracle, MS SQL Server, Cassandra, Firebase, Supabase, DynamoDB | JPA/Hibernate, Prisma, Mongoose, Sequelize, TypeORM, Drizzle ORM, SQLAlchemy, PyMongo, psycopg2, Peewee, MyBatis, JDBC |

### Authentication Libraries

Spring Security · JWT (jjwt/jose/PyJWT) · NextAuth.js · Clerk · Passport.js · Firebase Auth · Supabase Auth · Lucia · Better Auth · Auth0 · Django AllAuth · Django Simple JWT · Flask-Login · Apache Shiro

### Package Managers / Build Tools

npm · yarn · pnpm · bun · pip · poetry · pipenv · Maven · Gradle · Cargo · Go Modules · Composer · Bundler · Vite · Webpack

---

## Contributing

Contributions are welcome! Since there is no build step, development is straightforward.

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes in the relevant file(s) under `js/` or `css/`
4. Test by opening `index.html` in a browser and uploading a sample project ZIP
5. Commit your changes: `git commit -m 'feat: describe your change'`
6. Push and open a Pull Request

### Key Extension Points

| Goal | File to Edit |
|---|---|
| Add a new framework detector | `js/analyzer.js` → `detectFramework()` |
| Add a new database detector | `js/analyzer.js` → `detectDatabase()` |
| Modify a generated document template | `js/generator.js` → `generate*()` function |
| Add a new AI suggestion rule | `js/suggestions.js` → `generateSuggestions()` |
| Change dashboard UI | `js/ui.js` + `css/styles.css` |

---





<div align="center">
Made with ❤️ — Analyzes your code so you don't have to document it manually.
</div>
