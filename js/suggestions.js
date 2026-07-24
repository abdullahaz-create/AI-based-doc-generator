function generateSuggestions(analysis) {
  const s = [];

  // ── Documentation Gaps ──
  if (!analysis.hasReadme) {
    s.push({
      id: 'missing-readme',
      priority: 'high',
      category: 'Documentation',
      icon: '📋',
      title: 'Add a README file',
      desc: "Your project is missing a README.md. A good README is the first thing visitors see and dramatically improves discoverability and adoption. We've generated one for you!",
    });
  }
  if (!analysis.hasLicense) {
    s.push({
      id: 'missing-license',
      priority: 'high',
      category: 'Legal',
      icon: '⚖️',
      title: 'Add an open source license',
      desc: 'No LICENSE file detected. Without a license, your code is technically "all rights reserved" by default. Consider adding an MIT, Apache-2.0, or GPL license to clarify how others can use your work.',
    });
  }
  if (!analysis.hasContributing) {
    s.push({
      id: 'missing-contributing',
      priority: 'medium',
      category: 'Documentation',
      icon: '🤝',
      title: 'Add a CONTRIBUTING guide',
      desc: "A CONTRIBUTING.md file helps new contributors understand how to participate in your project. We've generated one that includes branch naming, commit conventions, and PR guidelines.",
    });
  }
  if (!analysis.hasGitignore) {
    s.push({
      id: 'missing-gitignore',
      priority: 'high',
      category: 'Security',
      icon: '🔒',
      title: 'Add a .gitignore file',
      desc: 'No .gitignore detected. Without it, you risk accidentally committing sensitive files (node_modules, .env, credentials, build artifacts) to your repository.',
    });
  }

  // ── Security Issues ──
  if (!analysis.hasEnvFile && analysis.envVars.length > 0) {
    s.push({
      id: 'missing-env-example',
      priority: 'high',
      category: 'Security',
      icon: '🔑',
      title: 'Create a .env.example file',
      desc: `Your code references ${analysis.envVars.length} environment variable${analysis.envVars.length > 1 ? 's' : ''} (${analysis.envVars.slice(0, 3).join(', ')}${analysis.envVars.length > 3 ? '...' : ''}) but no .env.example template exists. Add one to help other developers configure the project without exposing real secrets.`,
    });
  }
  if (
    analysis.envVars.some(
      (v) =>
        v.toLowerCase().includes('secret') ||
        v.toLowerCase().includes('key') ||
        v.toLowerCase().includes('password')
    )
  ) {
    s.push({
      id: 'sensitive-env-vars',
      priority: 'medium',
      category: 'Security',
      icon: '🛡️',
      title: 'Document sensitive environment variables',
      desc: 'Your project uses environment variables for secrets (API keys, passwords, tokens). Ensure these are never committed to version control, are rotated regularly, and are documented with placeholder values in .env.example.',
    });
  }

  // ── Testing ──
  if (!analysis.hasTests) {
    s.push({
      id: 'missing-tests',
      priority: 'high',
      category: 'Testing',
      icon: '🧪',
      title: 'Add automated tests',
      desc: 'No test files detected. Automated tests prevent regressions, improve code confidence, and are essential for CI/CD. Consider adding unit tests, integration tests, or end-to-end tests.',
    });
  } else if (analysis.hasTests && !analysis.hasCI) {
    s.push({
      id: 'tests-no-ci',
      priority: 'medium',
      category: 'CI/CD',
      icon: '⚙️',
      title: 'Set up a CI/CD pipeline',
      desc: 'You have tests but no CI/CD configuration detected. Adding GitHub Actions, GitLab CI, or similar will automatically run your tests on every commit and pull request.',
    });
  }

  // ── Docker & Deployment ──
  if (!analysis.hasDocker) {
    s.push({
      id: 'add-docker',
      priority: 'low',
      category: 'DevOps',
      icon: '🐳',
      title: 'Add Docker support',
      desc: 'No Dockerfile detected. Containerizing your application with Docker makes deployment consistent across environments and simplifies onboarding for new developers.',
    });
  }

  // ── Missing Documentation Sections ──
  if (analysis.hasReadme && !analysis.description) {
    s.push({
      id: 'readme-no-description',
      priority: 'medium',
      category: 'Documentation',
      icon: '✍️',
      title: 'Add a project description',
      desc: "Your project has a README but no description in package.json (or equivalent). A clear, concise description helps developers understand your project's purpose at a glance.",
    });
  }

  // ── Dependency Health ──
  const depCount = Object.keys(analysis.dependencies).length;
  if (depCount > 50) {
    s.push({
      id: 'many-deps',
      priority: 'medium',
      category: 'Performance',
      icon: '📦',
      title: 'Review your dependency tree',
      desc: `Your project has ${depCount} production dependencies. Large dependency trees increase bundle size, security surface area, and maintenance burden. Consider auditing for unused packages with \`${analysis.packageManager === 'npm' ? 'npx depcheck' : 'npx depcheck'}\`.`,
    });
  }

  // ── API-specific ──
  if (analysis.apiRoutes.length > 0 && !analysis.authentication) {
    s.push({
      id: 'api-no-auth',
      priority: 'high',
      category: 'Security',
      icon: '🔐',
      title: 'Add authentication to your API',
      desc: `Your project has ${analysis.apiRoutes.length} API endpoints but no authentication mechanism was detected. Unprotected API routes can be a serious security vulnerability in production.`,
    });
  }

  if (analysis.apiRoutes.length > 0) {
    s.push({
      id: 'add-api-versioning',
      priority: 'low',
      category: 'Architecture',
      icon: '🔢',
      title: 'Consider API versioning',
      desc: 'Prefix your API routes with a version number (e.g., /api/v1/...) to allow future breaking changes without disrupting existing clients.',
    });
  }

  // ── Code Organization ──
  if (!analysis.buildTool && analysis.primaryLanguage === 'JavaScript') {
    s.push({
      id: 'add-build-tool',
      priority: 'low',
      category: 'Developer Experience',
      icon: '⚡',
      title: 'Add a build tool',
      desc: 'No build tool detected. Adding Vite, esbuild, or similar can dramatically improve development experience with hot reloading, TypeScript support, and optimized production bundles.',
    });
  }

  if (
    analysis.primaryLanguage === 'JavaScript' &&
    !analysis.devDependencies['typescript'] &&
    !analysis.dependencies['typescript']
  ) {
    s.push({
      id: 'consider-typescript',
      priority: 'low',
      category: 'Code Quality',
      icon: '🔷',
      title: 'Consider migrating to TypeScript',
      desc: 'TypeScript adds static type checking to JavaScript, catching bugs at compile time instead of runtime. It significantly improves IDE support, refactoring safety, and team collaboration.',
    });
  }

  // ── Performance ──
  if (
    analysis.database &&
    analysis.database !== 'Redis' &&
    !Object.keys(analysis.dependencies).some((d) => d.includes('redis') || d.includes('cache'))
  ) {
    s.push({
      id: 'add-caching',
      priority: 'low',
      category: 'Performance',
      icon: '⚡',
      title: 'Add a caching layer',
      desc: `Your project uses ${analysis.database} but no caching layer was detected. Adding Redis or an in-memory cache can reduce database load and dramatically improve response times for frequent queries.`,
    });
  }

  // ── README Sections ──
  if (analysis.envVars.length > 0 && !analysis.hasEnvFile) {
    s.push({
      id: 'document-env-vars',
      priority: 'medium',
      category: 'Documentation',
      icon: '📝',
      title: 'Document all environment variables',
      desc: `Found ${analysis.envVars.length} environment variable references in your code. Create a comprehensive .env.example file documenting each variable's purpose, type, and default value.`,
    });
  }

  // Limit to 12 suggestions, sort by priority
  const order = { high: 0, medium: 1, low: 2 };
  return s.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 12);
}

/* ─────────────────────────────────────────────
   Expose globals for cross-file access via <script> tags
───────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.generateSuggestions = generateSuggestions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSuggestions,
  };
}
