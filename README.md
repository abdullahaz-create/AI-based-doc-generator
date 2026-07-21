<div align="center">

# AI Doc Generator

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=flat-square&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> Upload a project ZIP (or paste a GitHub URL) and let **Google Gemini AI** instantly generate six professional Markdown documentation files — README, INSTALLATION, API Docs, Architecture Guide, Contributing Guide, and Changelog — powered by deep static code analysis and a real AI model.

[Architecture](#-architecture) · [Features](#-features) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [Tech Stack](#️-tech-stack)

</div>

---

## Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Running Locally](#running-locally)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [AI Provider](#-ai-provider)
- [Supported Languages & Frameworks](#-supported-languages--frameworks)
- [Contributing](#-contributing)

---

## About

**AI Doc Generator** accepts a project ZIP file or a public GitHub repository URL, performs deep static analysis on its source code, and then sends the analysis results to a **Google Gemini AI** backend to produce a complete documentation suite in seconds.

The tool works in two stages:

1. **Static Analysis** (`analyzer.js`) — runs entirely in the browser. Follows a strict evidence-based rule: every detected technology must be confirmed by actual file content. Confidence < 70% → the field is omitted rather than guessed.

2. **AI Generation** (`server.js` + Gemini API) — the structured analysis is sent to a lightweight Node.js/Express backend that calls Google Gemini 2.5 Flash to write the actual documentation. **The API key never reaches the browser.**

If the backend is unavailable, the app automatically falls back to the built-in template engine — so it always works.

---

## Features

- 📦 **ZIP Upload & GitHub Import** — Drag-and-drop a `.zip` file (up to 50 MB) or paste a public GitHub repository URL.

- 🤖 **Gemini AI Documentation** — All six documents are written by Google Gemini 2.5 Flash using rich context built from the project analysis. The AI understands your exact stack, routes, dependencies, and structure.

- 🔒 **Secure API Key Handling** — `GEMINI_API_KEY` lives only in `.env` on the server. It is never bundled with or sent to the browser.

- 🔄 **Automatic Fallback** — If the server is unreachable or the API call fails, the app silently falls back to the local template engine (`generator.js`). Documentation is always generated.

- 🔌 **Swappable AI Provider** — The provider is abstracted behind `src/ai/aiProvider.js`. Switching to OpenAI or Claude requires adding one file and changing one `.env` variable.

- 🔍 **Evidence-Based Static Analysis** — Multi-language parser covering Java, Python, JS/TS, SQL, and all major config formats. Detects frameworks, databases, auth, API routes, entities, and design patterns with confidence scoring.

- ✨ **Six Auto-Generated Documents**:
  - `README.md` — title, badges, description, features, tech stack, install steps
  - `INSTALLATION.md` — full step-by-step setup, env vars, troubleshooting
  - `API_DOCS.md` — all detected endpoints with request/response examples
  - `ARCHITECTURE.md` — data flow, folder structure, component breakdown
  - `CONTRIBUTING.md` — branch naming, commit format, PR checklist
  - `CHANGELOG.md` — initial release with detected features

- 💡 **AI Suggestions Panel** — Up to 12 prioritized, actionable recommendations across Documentation, Security, Testing, CI/CD, DevOps, Performance, and Architecture.

- 📊 **Quality & Health Scores** — Two 0–100 scores computed from project properties (README, tests, Docker, CI, etc.).

- 🔎 **In-Document Search** — Live search with `<mark>` highlighting inside every rendered doc panel.

- 🌗 **Light / Dark Theme** — Persisted via `localStorage`.

- 🎭 **Try Demo** — Synthesizes a complete `taskflow-api` project in-memory without any file upload.

---

## Tech Stack

### Frontend

| Layer               | Technology                  | Version |
| ------------------- | --------------------------- | ------- |
| Structure           | HTML5                       | —       |
| Styling             | Vanilla CSS                 | —       |
| Logic               | Vanilla JavaScript (ES2024) | —       |
| ZIP parsing         | **JSZip**                   | 3.10.1  |
| Markdown rendering  | **Marked.js**               | 9.1.2   |
| Syntax highlighting | **highlight.js**            | 11.9.0  |
| Fonts               | Sora + Inter + DM Mono      | —       |

### Backend

| Layer       | Technology                | Version               |
| ----------- | ------------------------- | --------------------- |
| Runtime     | **Node.js**               | ≥ 18.0.0              |
| Framework   | **Express**               | 4.x                   |
| AI SDK      | **@google/generative-ai** | 0.21.x                |
| Env loading | **dotenv**                | 16.x                  |
| CORS        | **cors**                  | 2.x                   |
| AI Model    | **Google Gemini Flash**   | `gemini-flash-latest` |

---

## Getting Started

### Prerequisites

- **Node.js 18+** and **npm**
- A **Google Gemini API key** — get one free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Running Locally

**1. Clone and install**

```bash
git clone https://github.com/abdullahaz-create/AI-based-doc-generator.git
cd "AI-based-doc-generator"
npm install
```

**2. Configure your API key**

```bash
cp .env.example .env
```

Open `.env` and set your key:

```env
GEMINI_API_KEY=AIza...your_real_key_here
GEMINI_MODEL_NAME=gemini-flash-latest
AI_PROVIDER=gemini
PORT=3001
```

**3. Start the server**

```bash
npm run dev
```

You should see:

```
  ┌─────────────────────────────────────────────┐
  │       AI Doc Generator — Backend Ready      │
  ├─────────────────────────────────────────────┤
  │  URL:       http://localhost:3001            │
  │  Provider:  GEMINI                          │
  │  API Key:   ✅ Configured                   │
  └─────────────────────────────────────────────┘
```

**4. Open the app**

Navigate to **http://localhost:3001** in your browser.

> ⚠️ **Do not open `index.html` directly** — the AI backend requires the server to be running.

---

## How It Works

The application runs through a linear pipeline orchestrated by `app.js`:

```
Phase 1: Upload  →  Phase 2: Analysis  →  AI Generation  →  Phase 3: Dashboard
```

### Phase 1 — Upload (`uploader.js`)

| Input Method         | Implementation                                             |
| -------------------- | ---------------------------------------------------------- |
| ZIP file (click)     | `<input type="file">` → `handleZipUpload()`                |
| ZIP file (drag-drop) | `drop` event → `handleZipUpload()`                         |
| GitHub URL           | Modal → `handleGithubImport()` via GitHub REST API         |
| Demo project         | `loadDemoProject()` — synthesizes `taskflow-api` in-memory |

### Phase 2 — Analysis (`analyzer.js`)

`analyzeProject(files)` runs a 13-step pipeline entirely in the browser:

1. Filter paths through `IGNORE_DIRS` (skips `node_modules`, `.git`, `dist`, etc.)
2. Partition files by extension
3. Parse config files (`package.json`, `pom.xml`, `requirements.txt`, etc.)
4. Scan source code for env var references
5. Deep-parse up to 120 Java / 80 Python / 80 JS files
6. Run all detectors: framework, database, auth, test, API routes, entities, patterns
7. Compute language stats (byte-weighted)
8. Extract project metadata
9. Set boolean flags: `hasReadme`, `hasDocker`, `hasCI`, `hasTests`, etc.
10. Determine package manager and build tool
11. Extract SQL table names
12. Identify large files
13. Assemble `analysis` object with quality/health scores

### AI Generation (`app.js` → `server.js` → Gemini)

```
Browser                          Server (localhost:3001)
──────                           ──────────────────────
_serializeAnalysis(analysis)
  → POST /api/generate × 6      src/routes/generate.js
    (concurrent)                  → src/prompts/docPrompts.js  (builds prompt)
                                  → src/ai/aiProvider.js       (factory)
                                  → src/ai/providers/
                                      geminiProvider.js        (Gemini SDK)
                                  → Google Gemini API
                                  ← Markdown string
  ← { success, content }
```

All 6 doc types are requested **concurrently** via `Promise.allSettled`. Individual failures fall back to the template engine without blocking the others.

### Phase 3 — Dashboard (`ui.js` + `suggestions.js`)

- **Overview tab** — SVG gauge charts, stats grid, tech badges, dependency list
- **Document tabs** — `initDocPanel()` renders toolbar + Markdown preview + source view
- **AI Suggestions tab** — filterable priority cards

---

## Project Structure

```
Ai doc generator/
├── server.js                    # Express server — serves frontend + proxies Gemini API
├── .env                         # 🔒 Local secrets (git-ignored)
├── .env.example                 # Committed template — copy to .env
├── .gitignore                   # Protects .env and node_modules
├── package.json                 # npm scripts + dependencies
│
├── src/                         # Backend source
│   ├── ai/
│   │   ├── aiProvider.js        # Provider factory — swap Gemini/OpenAI/Claude here
│   │   └── providers/
│   │       └── geminiProvider.js # Gemini 2.5 Flash SDK wrapper + error mapping
│   ├── prompts/
│   │   └── docPrompts.js        # Prompt builders for all 6 doc types
│   └── routes/
│       └── generate.js          # POST /api/generate handler
│
├── index.html                   # SPA shell — 3 phases + modals
├── css/
│   └── styles.css               # Full design system (light/dark, glassmorphism)
└── js/                          # Frontend modules (all unchanged from original)
    ├── aiClient.js              # Browser fetch client → /api/generate
    ├── analyzer.js              # Evidence-based static analysis engine
    ├── generator.js             # Template fallback engine
    ├── suggestions.js           # Rule-based suggestion generator
    ├── ui.js                    # DOM rendering, tabs, gauges, file tree
    ├── uploader.js              # ZIP + GitHub import
    ├── exporter.js              # Download, ZIP export, clipboard, toast
    └── app.js                   # Bootstrap, pipeline orchestrator, AI fallback
```

> **Script load order** in `index.html`: `analyzer.js` → `generator.js` → `suggestions.js` → `exporter.js` → `ui.js` → `uploader.js` → `aiClient.js` → `app.js`

---

## Architecture

```
Browser (index.html)
  │
  ├─ uploader.js    → handleZipUpload / handleGithubImport / loadDemoProject
  │
  ├─ analyzer.js    → analyzeProject(files) → analysis object (100% client-side)
  │
  ├─ aiClient.js    → POST /api/generate
  │       │
  │       └──────────────────────────────────────────────────────────┐
  │                                                                  ▼
  │                                                    server.js (Express)
  │                                                          │
  │                                               src/routes/generate.js
  │                                                          │
  │                                             src/prompts/docPrompts.js
  │                                                          │
  │                                              src/ai/aiProvider.js ← factory
  │                                                          │
  │                                         src/ai/providers/geminiProvider.js
  │                                                          │
  │                                              Google Gemini API  🔒
  │                                            (GEMINI_API_KEY in .env)
  │
  ├─ generator.js   → generateDocs(analysis) — fallback template engine
  ├─ suggestions.js → generateSuggestions(analysis)
  └─ ui.js          → renderOverview / renderFileTree / initDocPanel / ...
```

### Global State (`window._appState`)

```js
window._appState = {
  phase: 'upload', // 'upload' | 'analysis' | 'dashboard'
  files: [], // raw file objects from uploader
  analysis: null, // result of analyzeProject()
  docs: null, // AI-generated or template docs
  suggestions: [], // result of generateSuggestions()
  aiAvailable: false, // true once health probe confirms server + key
};
```

---

## AI Provider

The AI layer is fully abstracted. To switch providers in the future:

1. Create `src/ai/providers/openaiProvider.js` (export `{ generateDocumentation }`)
2. Register it in `src/ai/aiProvider.js`:
   ```js
   openai: () => require('./providers/openaiProvider'),
   ```
3. Update `.env`:
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

No other files need to change.

### Fallback Behaviour

| Scenario                         | Result                                      |
| -------------------------------- | ------------------------------------------- |
| Server running + key valid       | ✅ Full Gemini AI generation                |
| Server running + no key          | ⚠️ Template fallback + console warning      |
| Server not running               | ℹ️ Template fallback (probe fails silently) |
| Partial failure (some docs fail) | ⚠️ Toast shown; failed docs use templates   |
| Timeout (> 75 s)                 | ⚠️ Toast + template fallback                |
| Quota exceeded                   | ⚠️ User-friendly toast + template fallback  |

---

## Supported Languages & Frameworks

### Programming Languages

JavaScript · TypeScript · Python · Java · Kotlin · Scala · Go · Rust · Ruby · PHP · C# · C++ · C · Swift · Dart · Vue · Svelte · HTML · CSS/SCSS · SQL · Shell · R · Lua · Elixir

### Frameworks & Runtimes

| Category          | Detected                                                    |
| ----------------- | ----------------------------------------------------------- |
| Java Backend      | Spring Boot, Spring MVC, Core Java, Android                 |
| Java UI           | JavaFX (+ FXML), Java Swing                                 |
| Python            | Django, FastAPI, Flask, Tornado, Streamlit, Pygame, Tkinter |
| JS Meta-Framework | Next.js, Nuxt.js, SvelteKit, Gatsby, Remix, Astro           |
| JS UI             | React, Vue.js, Angular, Svelte                              |
| JS Backend        | NestJS, Express.js, Fastify, Koa.js, Hono                   |

### Databases & ORMs

| Databases                                                                                                              | ORMs                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| MySQL, PostgreSQL, MariaDB, MongoDB, Redis, SQLite, H2, Oracle, MS SQL Server, Cassandra, Firebase, Supabase, DynamoDB | JPA/Hibernate, Prisma, Mongoose, Sequelize, TypeORM, Drizzle ORM, SQLAlchemy, PyMongo, psycopg2, Peewee, MyBatis, JDBC |

### Authentication Libraries

Spring Security · JWT (jjwt/jose/PyJWT) · NextAuth.js · Clerk · Passport.js · Firebase Auth · Supabase Auth · Lucia · Better Auth · Auth0 · Django AllAuth · Django Simple JWT · Flask-Login · Apache Shiro

### Package Managers / Build Tools

npm · yarn · pnpm · bun · pip · poetry · pipenv · Maven · Gradle · Cargo · Go Modules · Composer · Bundler · Vite · Webpack

---

## Contributing

Contributions are welcome!

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test by running `npm run dev` and uploading a sample ZIP
5. Commit: `git commit -m 'feat: describe your change'`
6. Push and open a Pull Request

### Key Extension Points

| Goal                           | File to Edit                                                     |
| ------------------------------ | ---------------------------------------------------------------- |
| Add a new framework detector   | `js/analyzer.js` → `detectFramework()`                           |
| Add a new database detector    | `js/analyzer.js` → `detectDatabase()`                            |
| Modify a prompt for a doc type | `src/prompts/docPrompts.js` → `build*Prompt()`                   |
| Add a new AI provider          | `src/ai/providers/yourProvider.js` + register in `aiProvider.js` |
| Modify the template fallback   | `js/generator.js` → `generate*()` function                       |
| Add a new suggestion rule      | `js/suggestions.js` → `generateSuggestions()`                    |
| Change dashboard UI            | `js/ui.js` + `css/styles.css`                                    |

---

<div align="center">
Made with ❤️ — Powered by Google Gemini AI · Analyzes your code so you don't have to document it manually.
</div>
