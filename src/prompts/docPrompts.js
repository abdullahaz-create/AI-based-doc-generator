/**
 * src/prompts/docPrompts.js
 *
 * Builds structured, context-rich prompts for each documentation type.
 * Each exported function accepts a serialized analysis object and returns
 * a fully-formed prompt string ready to send to any AI provider.
 *
 * Design principle: prompts are provider-agnostic — they work equally
 * well with Gemini, OpenAI, or Claude.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────────
   Shared context serializer
   Converts the analysis object into a compact, readable context block
   that gives the AI enough information to write precise documentation.
───────────────────────────────────────────────────────────────────── */
function buildContextBlock(analysis) {
  const lines = [];

  lines.push(`Project name: ${analysis.projectName || 'Unknown'}`);
  lines.push(`Primary language: ${analysis.primaryLanguage || 'Unknown'}`);

  if (analysis.metaFramework) lines.push(`Meta-framework: ${analysis.metaFramework}`);
  if (analysis.framework) lines.push(`Frontend framework: ${analysis.framework}`);
  if (analysis.backendFramework) lines.push(`Backend framework: ${analysis.backendFramework}`);
  if (analysis.database)
    lines.push(`Database: ${analysis.database}${analysis.orm ? ` (ORM: ${analysis.orm})` : ''}`);
  if (analysis.authentication) lines.push(`Authentication: ${analysis.authentication}`);
  if (analysis.packageManager) lines.push(`Package manager: ${analysis.packageManager}`);
  if (analysis.buildTool) lines.push(`Build tool: ${analysis.buildTool}`);
  if (analysis.testFramework) lines.push(`Test framework: ${analysis.testFramework}`);
  if (analysis.license) lines.push(`License: ${analysis.license}`);
  if (analysis.version) lines.push(`Version: ${analysis.version}`);
  if (analysis.description) lines.push(`Description: ${analysis.description}`);

  lines.push(`File count: ${analysis.fileCount || 0}`);
  lines.push(`Has Docker: ${analysis.hasDocker ? 'Yes' : 'No'}`);
  lines.push(`Has CI/CD: ${analysis.hasCI ? 'Yes' : 'No'}`);
  lines.push(`Has tests: ${analysis.hasTests ? 'Yes' : 'No'}`);
  lines.push(`Has README: ${analysis.hasReadme ? 'Yes' : 'No'}`);
  lines.push(`Has .env file: ${analysis.hasEnvFile ? 'Yes' : 'No'}`);

  // Dependencies
  const prodDeps = Object.entries(analysis.dependencies || {});
  if (prodDeps.length > 0) {
    lines.push(`\nProduction dependencies (${prodDeps.length} total):`);
    prodDeps.slice(0, 20).forEach(([pkg, ver]) => lines.push(`  - ${pkg}: ${ver}`));
  }

  const devDeps = Object.entries(analysis.devDependencies || {});
  if (devDeps.length > 0) {
    lines.push(`\nDev dependencies (${devDeps.length} total):`);
    devDeps.slice(0, 10).forEach(([pkg, ver]) => lines.push(`  - ${pkg}: ${ver}`));
  }

  // API Routes
  if (analysis.apiRoutes && analysis.apiRoutes.length > 0) {
    lines.push(`\nDetected API routes (${analysis.apiRoutes.length} total):`);
    analysis.apiRoutes.slice(0, 30).forEach((r) => {
      lines.push(`  ${r.method ? r.method.toUpperCase() : 'GET'} ${r.path}`);
    });
  }

  // Folder structure (top level only)
  if (analysis.folderStructure) {
    const topLevel = (analysis.folderStructure.children || []).map((c) => c.name);
    if (topLevel.length > 0) {
      lines.push(`\nTop-level structure: ${topLevel.join(', ')}`);
    }
  }

  // Detected features / entities
  const features = (analysis.features || []).filter((f) => f.confidence >= 70).slice(0, 10);
  if (features.length > 0) {
    lines.push('\nDetected application modules / entities:');
    features.forEach((f) => lines.push(`  - ${f.name} (${(f.types || []).join(', ')})`));
  }

  // SQL tables
  if (analysis.sqlTables && analysis.sqlTables.length > 0) {
    lines.push(`\nSQL tables: ${analysis.sqlTables.slice(0, 10).join(', ')}`);
  }

  // Environment variables referenced in code
  if (analysis.envVars && analysis.envVars.length > 0) {
    lines.push(`\nEnvironment variables used: ${analysis.envVars.slice(0, 15).join(', ')}`);
  }

  // Scripts
  if (analysis.scripts && Object.keys(analysis.scripts).length > 0) {
    lines.push('\nNpm/build scripts:');
    Object.entries(analysis.scripts).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
  }

  return lines.join('\n');
}

/* ─────────────────────────────────────────────────────────────────────
   Shared system preamble
───────────────────────────────────────────────────────────────────── */
const SYSTEM_PREAMBLE = `You are an expert technical writer specializing in open-source software documentation.
You produce professional, precise, developer-friendly Markdown documentation.

Rules you must follow:
- Output ONLY valid Markdown. Do not include any explanation, preamble, or code fences around the whole document.
- Use only facts from the project context provided. Do not invent features, dependencies, or routes.
- Use shield.io badges where appropriate (for README).
- Use correct Markdown heading hierarchy (h1 at the top, h2 for sections, h3 for subsections).
- Keep language concise, technical, and free of marketing fluff.
- Use actual project names, versions, and commands from the context — never use placeholders like "your-project-name".
- For code blocks always specify the language identifier (e.g. \`\`\`bash, \`\`\`json).
`;

/* ─────────────────────────────────────────────────────────────────────
   README.md
───────────────────────────────────────────────────────────────────── */
function buildReadmePrompt(analysis) {
  const ctx = buildContextBlock(analysis);
  const name = analysis.projectName || 'project';

  return `${SYSTEM_PREAMBLE}

## Task
Generate a complete, professional README.md for the project described below.

## Required Sections (in order)
1. H1 project title
2. Short one-paragraph description
3. Shield.io badges (language, license, version if known)
4. ✨ Features — bullet list using ONLY detected features from the context
5. 🛠 Tech Stack — table with Category | Technology columns
6. 📦 Installation — step-by-step commands
7. 🚀 Usage / Quick Start — practical code examples
8. 🔌 API Overview — only if API routes are detected; list the endpoints in a table
9. 🧪 Testing — only if tests or a test framework is detected
10. 🐳 Docker — only if Docker is detected
11. 🤝 Contributing — brief contribution guide
12. 📄 License

## Project Context
\`\`\`
${ctx}
\`\`\`

Generate the README.md now:`;
}

/* ─────────────────────────────────────────────────────────────────────
   INSTALLATION.md
───────────────────────────────────────────────────────────────────── */
function buildInstallationPrompt(analysis) {
  const ctx = buildContextBlock(analysis);

  return `${SYSTEM_PREAMBLE}

## Task
Generate a thorough INSTALLATION.md for the project described below.
This is a standalone installation guide, NOT a summary — include every step a developer needs.

## Required Sections (in order)
1. H1 "Installation Guide"
2. Prerequisites — OS, runtime versions (Node.js, Python, Java, etc.), tools needed
3. Clone the Repository — git clone command using the actual project name
4. Environment Variables — list every env var from the context, explain each one, include a .env.example snippet
5. Install Dependencies — exact commands for the detected package manager
6. Database Setup — only if a database is detected; include migration/seed commands if detectable
7. Running the Development Server — exact command and the URL to open
8. Building for Production — only if a build tool / build script is detected
9. Docker Setup — only if Docker is detected; include docker-compose commands
10. Troubleshooting — 3-5 common issues relevant to this stack with solutions

## Project Context
\`\`\`
${ctx}
\`\`\`

Generate the INSTALLATION.md now:`;
}

/* ─────────────────────────────────────────────────────────────────────
   API_DOCS.md
───────────────────────────────────────────────────────────────────── */
function buildApiDocsPrompt(analysis) {
  const ctx = buildContextBlock(analysis);
  const hasRoutes = (analysis.apiRoutes || []).length > 0;

  if (!hasRoutes) {
    return `${SYSTEM_PREAMBLE}

## Task
Generate an API_DOCS.md for the project described below.
No API routes were auto-detected, so provide a general API documentation template
appropriate for the detected stack (${analysis.backendFramework || analysis.framework || analysis.primaryLanguage}).
Include sections for Authentication, Base URL, Error Codes, and Rate Limiting.

## Project Context
\`\`\`
${ctx}
\`\`\`

Generate the API_DOCS.md now:`;
  }

  return `${SYSTEM_PREAMBLE}

## Task
Generate a complete API_DOCS.md for the project described below.
Document EVERY detected API route in detail.

## Required Sections (in order)
1. H1 "API Documentation"
2. Base URL and versioning info
3. Authentication — describe the detected auth method or note "Bearer token required"
4. Common Headers — Content-Type, Authorization
5. Error Codes — standard HTTP error codes table (400, 401, 403, 404, 422, 500)
6. Rate Limiting — if detectable, otherwise note "not configured"
7. Endpoints — one H2 section per resource group, then one H3 per endpoint:
   - Method + Path as a code span
   - Description
   - Request Headers table
   - Path Parameters table (if any)
   - Query Parameters table (if any)
   - Request Body (JSON schema or example if inferrable)
   - Response example (200 JSON)
   - Error responses

## Project Context
\`\`\`
${ctx}
\`\`\`

Generate the API_DOCS.md now:`;
}

/* ─────────────────────────────────────────────────────────────────────
   ARCHITECTURE.md
───────────────────────────────────────────────────────────────────── */
function buildArchitecturePrompt(analysis) {
  const ctx = buildContextBlock(analysis);

  return `${SYSTEM_PREAMBLE}

## Task
Generate a comprehensive ARCHITECTURE.md for the project described below.

## Required Sections (in order)
1. H1 "Architecture Overview"
2. Project Type & Goals — one paragraph
3. High-Level Architecture Diagram — ASCII art or Mermaid diagram showing main components and data flow
4. Tech Stack Rationale — why each major technology was likely chosen (infer from context)
5. Folder Structure — annotated directory tree using the detected structure, explaining each folder's role
6. Core Components / Modules — describe each detected module/entity and its responsibility
7. Data Flow — describe how a typical request flows through the system
8. Data Layer — only if a database is detected; describe models, ORM usage, migration strategy
9. Authentication & Security — describe the auth mechanism if detected
10. API Design — only if API routes detected; describe the API conventions
11. Testing Strategy — only if tests detected
12. Deployment — Docker / CI/CD / cloud considerations if detected
13. Future Considerations — 3-5 architectural improvements appropriate for this stack

## Project Context
\`\`\`
${ctx}
\`\`\`

Generate the ARCHITECTURE.md now:`;
}

/* ─────────────────────────────────────────────────────────────────────
   CONTRIBUTING.md
───────────────────────────────────────────────────────────────────── */
function buildContributingPrompt(analysis) {
  const ctx = buildContextBlock(analysis);

  return `${SYSTEM_PREAMBLE}

## Task
Generate a CONTRIBUTING.md that makes it easy for new developers to contribute to this project.

## Required Sections (in order)
1. H1 "Contributing to ${analysis.projectName || 'This Project'}"
2. Code of Conduct — brief professional conduct statement
3. Getting Started — link to INSTALLATION.md, fork & clone steps
4. Development Workflow:
   - Branch naming convention (feat/, fix/, docs/, chore/)
   - Commit message format (Conventional Commits style)
   - How to run tests (use exact commands from the context)
   - Linting / formatting (if detectable from devDependencies)
5. Pull Request Process — checklist before submitting a PR
6. Reporting Bugs — issue template instructions
7. Suggesting Features — feature request process
8. Style Guide — language-specific conventions for the detected stack

## Project Context
\`\`\`
${ctx}
\`\`\`

Generate the CONTRIBUTING.md now:`;
}

/* ─────────────────────────────────────────────────────────────────────
   CHANGELOG.md
───────────────────────────────────────────────────────────────────── */
function buildChangelogPrompt(analysis) {
  const ctx = buildContextBlock(analysis);
  const today = new Date().toISOString().split('T')[0];
  const version = analysis.version || '1.0.0';

  return `${SYSTEM_PREAMBLE}

## Task
Generate a CHANGELOG.md following the "Keep a Changelog" format (https://keepachangelog.com).

## Required Sections (in order)
1. H1 "Changelog"
2. Brief intro: "All notable changes to ${analysis.projectName || 'this project'} will be documented in this file."
3. [Unreleased] section — list plausible upcoming improvements based on the tech stack gaps
4. [${version}] — ${today} — Initial release section listing features inferred from the project context:
   - Added: list real features and capabilities detected
   - Notes on the tech stack chosen
5. Versioning Guide at the bottom — SemVer explanation + change type legend

Use exactly this date format: YYYY-MM-DD. Use ${today} as the release date.

## Project Context
\`\`\`
${ctx}
\`\`\`

Generate the CHANGELOG.md now:`;
}

/* ─────────────────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────────────────── */
const PROMPT_BUILDERS = {
  readme: buildReadmePrompt,
  installation: buildInstallationPrompt,
  api: buildApiDocsPrompt,
  architecture: buildArchitecturePrompt,
  contributing: buildContributingPrompt,
  changelog: buildChangelogPrompt,
};

/**
 * Build a prompt for the given document type.
 * @param {string} docType  — one of: readme | installation | api | architecture | contributing | changelog
 * @param {object} analysis — serialized analysis object from analyzer.js
 * @returns {string} prompt string
 * @throws {Error} if docType is unsupported
 */
function buildPrompt(docType, analysis) {
  const builder = PROMPT_BUILDERS[docType];
  if (!builder) {
    throw new Error(
      `Unknown doc type: "${docType}". Supported: ${Object.keys(PROMPT_BUILDERS).join(', ')}`
    );
  }
  return builder(analysis);
}

module.exports = { buildPrompt, SUPPORTED_DOC_TYPES: Object.keys(PROMPT_BUILDERS) };
