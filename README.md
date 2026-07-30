<div align="center">

# 🤖 AI Doc Generator

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=flat-square&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![SonarCloud](https://img.shields.io/badge/SonarCloud-F3702A?style=flat-square&logo=sonarcloud&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

> Upload a project ZIP or paste a GitHub URL and let **Google Gemini 2.5 Flash** instantly generate six professional Markdown documentation files — README, Installation Guide, API Docs, Architecture Guide, Contributing Guide, and Changelog — powered by deep static code analysis and a real AI model. Fully containerised, production-grade, and CI/CD-ready.

[Overview](#-project-overview) · [Features](#-features) · [Tech Stack](#️-tech-stack) · [Installation](#-installation) · [Docker](#-docker-setup) · [Kubernetes](#-kubernetes-deployment) · [Monitoring](#-prometheus--grafana-monitoring) · [API](#-api-endpoints)

</div>

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)
- [Docker Setup](#-docker-setup)
- [Docker Compose](#-docker-compose)
- [Kubernetes Deployment](#-kubernetes-deployment)
- [GitHub Actions CI Pipeline](#-github-actions-ci-pipeline)
- [SonarCloud Integration](#-sonarcloud-integration)
- [Trivy Security Scanning](#-trivy-security-scanning)
- [Prometheus & Grafana Monitoring](#-prometheus--grafana-monitoring)
- [Testing](#-testing)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Future Improvements](#-future-improvements)
- [Contributors](#-contributors)
- [License](#-license)

---

## 📖 Project Overview

**AI Doc Generator** is a full-stack, production-ready web application that eliminates the documentation bottleneck in software development. It accepts a project ZIP file or a public GitHub repository URL, performs deep evidence-based static analysis on the source code entirely in the browser, then sends the structured results to a lightweight **Node.js / Express** backend that calls **Google Gemini 2.5 Flash** to produce a complete documentation suite in seconds.

The project is designed around a **two-stage pipeline**:

1. **Static Analysis** (`js/analyzer.js`) — runs 100% client-side. Every detected technology must be confirmed by actual file content. Confidence < 70% means the field is omitted rather than guessed.
2. **AI Generation** (`server.js` → Gemini API) — the structured analysis is proxied through the Express backend so the API key **never reaches the browser**.

If the backend is unavailable, the app automatically falls back to a local template engine — **documentation is always generated**.

The repository is production-hardened with:

- 🐳 **Docker** containerisation
- ☸️ **Kubernetes** manifests (Deployment, Service, HPA, ConfigMap, Secret, Namespace)
- 🔁 **GitHub Actions** CI/CD pipeline
- 🔍 **SonarCloud** static code analysis
- 🔒 **Trivy** container and filesystem security scanning
- 📊 **Prometheus + Grafana** runtime monitoring

---

## ✨ Features

| Feature | Description |
|---|---|
| 📦 ZIP Upload & GitHub Import | Drag-and-drop `.zip` (up to 50 MB) or paste a public GitHub URL |
| 🤖 Gemini AI Documentation | All six documents written by Gemini 2.5 Flash with rich project context |
| 🔒 Secure API Key Handling | `GEMINI_API_KEY` lives only in `.env` on the server — never sent to the browser |
| 🔄 Automatic Fallback | Silently falls back to local template engine when server is unreachable |
| 🔌 Swappable AI Provider | Provider abstracted behind `src/ai/aiProvider.js` — swap to OpenAI or Claude with one env var |
| 🔍 Evidence-Based Static Analysis | Multi-language parser covering 20+ languages, 30+ frameworks, 15+ databases |
| ✨ Six Auto-Generated Documents | README, Installation, API Docs, Architecture, Contributing, Changelog |
| 💡 AI Suggestions Panel | Up to 12 prioritised actionable recommendations |
| 📊 Quality & Health Scores | Two 0-100 computed scores from project properties |
| 🔎 In-Document Search | Live search with mark highlighting across all doc panels |
| 🌗 Light / Dark Theme | Persisted via `localStorage` |
| 🎭 Try Demo | Synthesizes a complete `taskflow-api` project in-memory — no file upload needed |
| 📈 Prometheus Metrics | HTTP request count, duration, and active request gauges on `/metrics` |
| 🏥 Health Check Endpoint | `/api/health` returns provider + key status in JSON |

---

## 🛠️ Tech Stack

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Structure | HTML5 | — |
| Styling | Vanilla CSS | — |
| Logic | Vanilla JavaScript (ES2024) | — |
| ZIP parsing | JSZip | 3.10.1 |
| Markdown rendering | Marked.js | 9.1.2 |
| Syntax highlighting | highlight.js | 11.9.0 |
| XSS sanitisation | DOMPurify | 3.1.6 |
| Fonts | Sora + Inter + DM Mono | — |

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.0.0 |
| Framework | Express | 4.x |
| AI SDK | @google/generative-ai | 0.21.x |
| Env loading | dotenv | 16.x |
| CORS | cors | 2.x |
| Metrics | prom-client | 15.x |
| AI Model | Google Gemini 2.5 Flash | `gemini-flash-latest` |

### DevOps & Infrastructure

| Tool | Role |
|---|---|
| Docker | Containerisation — Alpine-based production image |
| Docker Compose | Local multi-service orchestration |
| Kubernetes | Production-grade container orchestration |
| GitHub Actions | CI/CD pipeline (lint → test → build → scan → push) |
| SonarCloud | Continuous static code quality & vulnerability analysis |
| Trivy | Filesystem and Docker image vulnerability scanning |
| Prometheus | Runtime metrics collection |
| Grafana | Metrics visualisation and alerting |

---

## 📁 Project Structure

```
ai-doc-generator/
├── server.js                    # Entry point — starts Express on PORT
├── .env                         # Local secrets (git-ignored)
├── .env.example                 # Committed template — copy to .env
├── .gitignore
├── package.json
├── jest.config.js
├── sonar-project.properties     # SonarCloud project config
│
├── src/                         # Backend source
│   ├── app.js                   # Express app factory (routes, middleware, metrics)
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
└── js/                          # Frontend modules
    ├── analyzer.js              # Evidence-based static analysis engine
    ├── generator.js             # Template fallback engine
    ├── suggestions.js           # Rule-based suggestion generator
    ├── explorer.js              # Download, ZIP export, clipboard, toast
    ├── ui.js                    # DOM rendering, tabs, gauges, file tree
    ├── uploader.js              # ZIP + GitHub import + demo project loader
    ├── aiClient.js              # Browser fetch client → /api/generate
    └── app.js                   # Bootstrap, pipeline orchestrator, AI fallback

├── docker/
│   ├── Dockerfile               # Production Docker image (node:22-alpine)
│   └── docker-compose.yml       # Single-service app compose file
│
├── docker-compose.monitoring.yml # Prometheus + Grafana monitoring stack
│
├── kubernetes/
│   ├── namespace.yaml           # ai-doc-generator namespace
│   ├── configmap.yaml           # Non-secret configuration
│   ├── secret.yaml              # GEMINI_API_KEY (base64-encoded)
│   ├── deployment.yaml          # App Deployment (2 replicas)
│   ├── service.yaml             # ClusterIP + NodePort service
│   └── hpa.yaml                 # Horizontal Pod Autoscaler
│
├── monitoring/
│   └── prometheus.yml           # Prometheus scrape config
│
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
│
└── tests/
    └── unit/                    # Jest unit tests
```

> **Script load order** in `index.html`: `analyzer.js` → `generator.js` → `suggestions.js` → `explorer.js` → `ui.js` → `uploader.js` → `aiClient.js` → `app.js`

---

## ⚙️ Installation

### Prerequisites

- **Node.js 18+** and **npm** — [download](https://nodejs.org)
- A **Google Gemini API key** — get one free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Docker** (optional, for containerised deployment) — [download](https://www.docker.com)
- **kubectl** (optional, for Kubernetes deployment) — [download](https://kubernetes.io/docs/tasks/tools/)

### Clone & Install

```bash
git clone https://github.com/abdullahaz-create/AI-based-doc-generator.git
cd "AI-based-doc-generator"
npm install
```

---

## 🔐 Environment Variables

Copy the example file and set your values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Your Google Gemini API key |
| `GEMINI_MODEL_NAME` | No | `gemini-flash-latest` | Gemini model to use |
| `AI_PROVIDER` | No | `gemini` | AI provider (`gemini`) |
| `PORT` | No | `3001` | Port the Express server listens on |
| `NODE_ENV` | No | `development` | Node environment |

Example `.env`:

```env
GEMINI_API_KEY=AIza...your_real_key_here
GEMINI_MODEL_NAME=gemini-flash-latest
AI_PROVIDER=gemini
PORT=3001
NODE_ENV=production
```

> **Never commit your `.env` file.** It is included in `.gitignore` by default.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or with auto-reload during development
npm run dev
```

On successful start you will see:

```
  ┌─────────────────────────────────────────────┐
  │       AI Doc Generator — Backend Ready      │
  ├─────────────────────────────────────────────┤
  │  URL:       http://localhost:3001            │
  │  Provider:  GEMINI                          │
  │  API Key:   Configured                      │
  └─────────────────────────────────────────────┘
```

Then open **http://localhost:3001** in your browser.

> **Do not open `index.html` directly** — the AI backend requires the Express server to be running.

### Other npm Scripts

```bash
npm test               # Run Jest test suite
npm run coverage       # Run tests with coverage report
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format
npm run format:check   # Prettier format check (used in CI)
```

---

## 🐳 Docker Setup

The project ships a production-optimised Docker image based on `node:22-alpine`.

### Build the Image

```bash
docker build -f docker/Dockerfile -t ai-doc-generator .
```

### Run the Container

```bash
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key_here \
  -e NODE_ENV=production \
  ai-doc-generator
```

### Dockerfile Overview

```dockerfile
FROM node:22-alpine        # Minimal, secure base image
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev      # Production deps only — no devDependencies
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

The image uses `--omit=dev` to keep the final image lean and excludes development dependencies from the production bundle.

---

## 🐙 Docker Compose

### Application Stack

```bash
# Start the application
docker compose -f docker/docker-compose.yml up -d

# Stop the application
docker compose -f docker/docker-compose.yml down
```

`docker/docker-compose.yml` maps port `3001:3001`, reads the `.env` file from the project root, and restarts automatically unless manually stopped.

### Monitoring Stack

```bash
# Start Prometheus + Grafana
docker compose -f docker-compose.monitoring.yml up -d
```

| Service | URL |
|---|---|
| Application | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

---

## ☸️ Kubernetes Deployment

All Kubernetes manifests live in the `kubernetes/` directory.

### Apply All Manifests

```bash
kubectl apply -f kubernetes/
```

### Apply Individually (in dependency order)

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/hpa.yaml
```

### Verify Deployment

```bash
kubectl get pods -n ai-doc-generator
kubectl get svc  -n ai-doc-generator
kubectl get hpa  -n ai-doc-generator
```

### Kubernetes Manifests Explained

| File | Resource | Description |
|---|---|---|
| `namespace.yaml` | Namespace | Isolates the app in its own `ai-doc-generator` namespace |
| `configmap.yaml` | ConfigMap | Non-secret env vars (port, provider name) |
| `secret.yaml` | Secret | Base64-encoded `GEMINI_API_KEY` — never in source |
| `deployment.yaml` | Deployment | 2 replicas, rolling update, liveness/readiness probes on `/api/health` |
| `service.yaml` | Service | Exposes the app via ClusterIP and NodePort |
| `hpa.yaml` | HorizontalPodAutoscaler | Auto-scales between 2-10 pods based on CPU utilisation |

### Kubernetes Architecture Diagram

```
                          Internet / Ingress
                                |
                         +------+------+
                         |   Service   |  NodePort / LoadBalancer
                         |  (port 3001)|
                         +------+------+
                                |
               +----------------+----------------+
               |                |                |
        +------+------+  +------+------+  +------+------+
        |    Pod 1    |  |    Pod 2    |  |    Pod N    |  <- HPA scales
        |  (Express)  |  |  (Express)  |  |  (Express)  |    2-10 pods
        +------+------+  +------+------+  +------+------+
               |                |                |
               +----------------+----------------+
                                |
                   +------------+------------+
                   |                         |
           +-------+-------+     +-----------+----------+
           |   ConfigMap   |     |        Secret         |
           |  (non-secret  |     |  (GEMINI_API_KEY -    |
           |   config)     |     |   base64-encoded)     |
           +---------------+     +----------------------+

Namespace: ai-doc-generator
HPA Target: 60% avg CPU -> scale out; idle -> scale in
```

---

## 🔁 GitHub Actions CI Pipeline

The CI pipeline is defined in `.github/workflows/ci.yml` and runs automatically on every `push` to `main`, `develop`, or any `feature/**` branch, and on all pull requests targeting `main` or `develop`.

### Pipeline Stages

```
push / pull_request
       |
       v
+----------------------------------------------+
|             Job: build-test                  |
|              (ubuntu-latest)                 |
|                                              |
|  1. Checkout Repository                      |
|  2. Setup Node.js 22 (with npm cache)        |
|  3. npm ci  (install dependencies)           |
|  4. ESLint  (npm run lint)                   |
|  5. Prettier (npm run format:check)          |
|  6. Jest Tests (npm test)                    |
|  7. Coverage Report (npm run coverage)       |
|  8. SonarCloud Scan                          |
|  9. Docker Build (docker/Dockerfile)         |
| 10. Trivy Filesystem Scan                    |
| 11. Trivy Docker Image Scan                  |
+----------------------------------------------+
```

### What Each Stage Does

| Stage | Tool | Purpose |
|---|---|---|
| Install | `npm ci` | Reproducible, locked dependency installation |
| Lint | ESLint | Enforces code style and catches common JS errors |
| Format | Prettier | Ensures consistent formatting across all files |
| Test | Jest | Runs unit tests and validates business logic |
| Coverage | Jest `--coverage` | Generates LCOV report consumed by SonarCloud |
| Code Quality | SonarCloud | Static analysis — bugs, vulnerabilities, code smells |
| Build | Docker | Validates the production image builds correctly |
| Security | Trivy (fs) | Scans source and deps for known CVEs |
| Security | Trivy (image) | Scans the built Docker image for OS-level CVEs |

---

## 🔍 SonarCloud Integration

[SonarCloud](https://sonarcloud.io) provides continuous code quality inspection, tracking:

- **Bugs** — logic errors and runtime issues
- **Vulnerabilities** — security weaknesses (OWASP categories)
- **Code Smells** — maintainability anti-patterns
- **Coverage** — test coverage via LCOV report from Jest
- **Duplications** — copy-paste code detection

### Configuration

`sonar-project.properties` (project root):

```properties
sonar.projectKey=abdullahaz-create_AI-based-doc-generator
sonar.organization=abdullahaz-create
sonar.sources=js,src
sonar.tests=tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.sourceEncoding=UTF-8
```

The scan is triggered automatically in the CI pipeline. The `SONAR_TOKEN` secret is stored in the GitHub repository's **Settings → Secrets and Variables → Actions**.

---

## 🔒 Trivy Security Scanning

[Trivy](https://trivy.dev) by Aqua Security is an all-in-one open-source vulnerability scanner integrated into the CI pipeline.

### Two Scan Modes

| Mode | What it Scans | Trigger |
|---|---|---|
| **Filesystem scan** | Source files + `node_modules` | After every `npm ci` |
| **Docker image scan** | Built container layers + OS packages | After `docker build` |

Both scans run on every CI push/PR. Results are printed to the Actions log in table format. Any `CRITICAL` or `HIGH` CVE will surface immediately, enabling the team to patch or update dependencies before merging.

### Running Trivy Locally

```bash
# Scan the project filesystem
trivy fs .

# Scan the built Docker image
trivy image ai-doc-generator
```

---

## 📊 Prometheus & Grafana Monitoring

The Express backend exposes a `/metrics` endpoint powered by the [prom-client](https://github.com/siimon/prom-client) library. Prometheus scrapes this endpoint and Grafana visualises the data.

### Exposed Metrics

| Metric | Type | Description |
|---|---|---|
| `http_request_duration_seconds` | Histogram | Latency of all HTTP requests by method, route, status code |
| `http_requests_total` | Counter | Total HTTP requests served |
| `http_active_requests` | Gauge | Concurrently in-flight HTTP requests |
| Node.js defaults | Various | Event loop lag, GC, heap, CPU, memory (via `collectDefaultMetrics`) |

### Start the Monitoring Stack

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

| Service | URL | Credentials |
|---|---|---|
| Prometheus | http://localhost:9090 | None |
| Grafana | http://localhost:3000 | `admin / admin` (default) |

### Add Prometheus as a Grafana Data Source

1. Open Grafana → **Connections → Data Sources → Add data source**
2. Select **Prometheus**
3. URL: `http://prometheus:9090`
4. Click **Save & Test**

### Suggested Grafana Panels

- **Request Rate** — `rate(http_requests_total[1m])`
- **Error Rate** — `rate(http_requests_total{status_code=~"5.."}[1m])`
- **P95 Latency** — `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Active Requests** — `http_active_requests`

---

## 🧪 Testing

Tests are written with **Jest** and **Supertest**.

```bash
# Run tests (pass even with no tests — suitable for CI)
npm test

# Run tests with coverage report
npm run coverage
```

Test files live under `tests/unit/`. The Jest config is in `jest.config.js`.

### Coverage Report

After running `npm run coverage`, an HTML report is generated at:

```
coverage/lcov-report/index.html
```

The LCOV data file (`coverage/lcov.info`) is automatically consumed by SonarCloud in CI.

---

## 🌐 API Endpoints

The Express backend exposes the following HTTP endpoints:

### `POST /api/generate`

Generates a single documentation file using the Gemini AI model.

**Request Body**

```json
{
  "docType": "readme",
  "analysisContext": {
    "projectName": "my-app",
    "primaryLanguage": "JavaScript",
    "framework": "Express",
    "dependencies": { "express": "^4.19.2" },
    "fileCount": 42,
    "hasDocker": true,
    "hasCI": true
  }
}
```

**Supported `docType` values:** `readme` | `installation` | `api` | `architecture` | `contributing` | `changelog`

**Success Response `200`**

```json
{
  "success": true,
  "content": "# My App\n\n..."
}
```

**Error Response `4xx / 5xx`**

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "QUOTA_EXCEEDED"
}
```

---

### `GET /api/health`

Returns the current health status of the backend and AI provider configuration.

**Response `200`**

```json
{
  "status": "ok",
  "provider": "gemini",
  "keyConfigured": true,
  "timestamp": "2026-07-30T08:00:00.000Z"
}
```

---

### `GET /metrics`

Exposes Prometheus-format metrics for scraping.

**Response `200`** — `text/plain; version=0.0.4` (Prometheus exposition format)

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",route="/api/generate",status_code="200"} 42
...
```

---

### `GET *`

All other routes serve `index.html` (SPA fallback). Static assets (`css/`, `js/`) are served from the project root via `express.static`.

---

## 🖼️ Screenshots

> _Screenshots will be added here after the first live deployment._

| View | Description |
|---|---|
| Upload Phase | Drag-and-drop zone, GitHub URL modal, Try Demo button |
| Analysis Phase | Animated step-by-step progress with real-time stats |
| Dashboard — Overview | Quality/health gauges, tech badges, dependency list |
| Dashboard — Document Tabs | Rendered Markdown with copy, download, and search |
| Dashboard — AI Suggestions | Prioritised recommendations with category filters |

---

## 🔮 Future Improvements

| Priority | Improvement |
|---|---|
| High | OpenAI GPT-4o and Claude 3.5 provider support |
| High | Rate limiting and request queue for the `/api/generate` endpoint |
| Medium | Ingress resource with TLS termination for the Kubernetes deployment |
| Medium | Helm chart for parameterised Kubernetes rollouts |
| Medium | Persistent Grafana dashboards stored as ConfigMaps |
| Low | Support for private GitHub repositories via OAuth |
| Low | Webhook integration to auto-regenerate docs on `git push` |
| Low | CLI tool (`npx ai-doc-gen <path>`) for terminal-first workflows |
| Low | Export docs directly to Confluence or Notion |
| Low | Multi-language documentation output (Spanish, French, Arabic) |

---

## 👥 Contributors

| Name | Role |
|---|---|
| **Abdullah Az** | Creator & Maintainer |

Contributions are welcome!

### Contributing Guide

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the existing code style
4. Run lint and tests: `npm run lint && npm test`
5. Commit using conventional commits: `git commit -m "feat: describe your change"`
6. Push and open a Pull Request against `develop`

### Key Extension Points

| Goal | File to Edit |
|---|---|
| Add a new framework detector | `js/analyzer.js` → `detectFramework()` |
| Add a new database detector | `js/analyzer.js` → `detectDatabase()` |
| Modify a prompt for a doc type | `src/prompts/docPrompts.js` → `build*Prompt()` |
| Add a new AI provider | `src/ai/providers/yourProvider.js` + register in `aiProvider.js` |
| Modify the template fallback | `js/generator.js` → `generate*()` function |
| Add a new suggestion rule | `js/suggestions.js` → `generateSuggestions()` |
| Change dashboard UI | `js/ui.js` + `css/styles.css` |

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Abdullah Az

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🔄 DevOps Workflow Diagram

```
Developer Workstation
        |
        |  git push / pull request
        v
+-------------------------------------------------------------------+
|                    GitHub Repository                              |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |               GitHub Actions CI Pipeline                    |  |
|  |                   (.github/workflows/ci.yml)                |  |
|  |                                                             |  |
|  |   Checkout -> Node 22 Setup -> npm ci                      |  |
|  |        |                                                    |  |
|  |        +-> ESLint (code style)                              |  |
|  |        +-> Prettier (formatting)                            |  |
|  |        +-> Jest Tests + Coverage                            |  |
|  |        |                                                    |  |
|  |        +-> SonarCloud (sonar-project.properties) ---------->|  |
|  |        |                                    SonarCloud      |  |
|  |        |                                    Dashboard       |  |
|  |        |                                                    |  |
|  |        +-> Docker Build (docker/Dockerfile)                 |  |
|  |        |                                                    |  |
|  |        +-> Trivy FS Scan (filesystem vulnerabilities)       |  |
|  |        +-> Trivy Image Scan (container CVEs)               |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
        |
        |  Deploy (manual / CD extension)
        v
+-------------------------------------------------------------------+
|                    Kubernetes Cluster                             |
|                                                                   |
|   Namespace: ai-doc-generator                                     |
|                                                                   |
|   ConfigMap --+                                                   |
|   Secret -----+--> Deployment (2-10 Pods via HPA)                |
|               |        |                                         |
|               |        +-> Pod: Express App :3001                |
|               |                  |                               |
|               |                  +-> GET /api/health   (probe)   |
|               |                  +-> POST /api/generate          |
|               |                  +-> GET /metrics  ----------+   |
|               |                                             |   |
|   Service ----+                                             |   |
|   (NodePort :3001)                              +-----------+--+ |
|                                                 |  Prometheus  | |
|                                                 |  :9090       | |
|                                                 +-------+------+ |
|                                                         |        |
|                                                 +-------+------+ |
|                                                 |   Grafana    | |
|                                                 |   :3000      | |
|                                                 +--------------+ |
+-------------------------------------------------------------------+
```

---

<div align="center">

Made with love — Powered by **Google Gemini AI** · Analyses your code so you do not have to document it manually.

</div>
