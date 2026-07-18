/**
 * generator.js — Documentation template engine
 * Generates 6 documentation types from project analysis.
 */

/* ── Helpers ── */
function titleCase(s) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function year() {
  return new Date().getFullYear();
}

/* ── Badge Helpers ── */
function shieldBadge(label, msg, color, logo = '') {
  const logoStr = logo ? `&logo=${encodeURIComponent(logo)}` : '';
  return `![${label}](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(msg)}-${color}?style=flat-square${logoStr}&logoColor=white)`;
}

function getStackBadges(a) {
  const badges = [];
  // Meta-frameworks take priority
  if (a.metaFramework === 'Next.js')    badges.push(shieldBadge('Next.js', '14.x', '000000', 'nextdotjs'));
  if (a.metaFramework === 'Nuxt.js')    badges.push(shieldBadge('Nuxt', '3.x', '00DC82', 'nuxtdotjs'));
  if (a.metaFramework === 'SvelteKit')  badges.push(shieldBadge('SvelteKit', '2.x', 'FF3E00', 'svelte'));
  if (a.metaFramework === 'Gatsby')     badges.push(shieldBadge('Gatsby', '5.x', '663399', 'gatsby'));
  if (a.metaFramework === 'Remix')      badges.push(shieldBadge('Remix', '2.x', '000000', 'remix'));
  if (a.metaFramework === 'Astro')      badges.push(shieldBadge('Astro', '4.x', 'FF5D01', 'astro'));
  // UI frameworks
  if (!a.metaFramework) {
    if (a.framework === 'React')    badges.push(shieldBadge('React', '18.x', '61dafb', 'react'));
    if (a.framework === 'Vue')  badges.push(shieldBadge('Vue.js', '3.x', '4FC08D', 'vuedotjs'));
    if (a.framework === 'Angular')  badges.push(shieldBadge('Angular', '17.x', 'DD0031', 'angular'));
    if (a.framework === 'Svelte')   badges.push(shieldBadge('Svelte', '5.x', 'FF3E00', 'svelte'));
  }
  // Backend frameworks
  if (a.backendFramework === 'Express')      badges.push(shieldBadge('Express', '4.x', '000000', 'express'));
  if (a.backendFramework === 'NestJS')       badges.push(shieldBadge('NestJS', '10.x', 'E0234E', 'nestjs'));
  if (a.backendFramework === 'Django')       badges.push(shieldBadge('Django', '5.x', '092E20', 'django'));
  if (a.backendFramework === 'FastAPI')      badges.push(shieldBadge('FastAPI', '0.x', '009688', 'fastapi'));
  if (a.backendFramework === 'Flask')        badges.push(shieldBadge('Flask', '3.x', '000000', 'flask'));
  if (a.backendFramework === 'Spring Boot')  badges.push(shieldBadge('Spring Boot', '3.x', '6DB33F', 'springboot'));
  if (a.backendFramework === 'Fastify')      badges.push(shieldBadge('Fastify', '4.x', '000000', 'fastify'));
  if (a.backendFramework === 'Gin')          badges.push(shieldBadge('Gin', 'latest', '00ADD8', 'go'));
  if (a.backendFramework === 'Actix')        badges.push(shieldBadge('Actix', 'latest', 'dea584', 'rust'));
  // Database
  if (a.database === 'MongoDB')     badges.push(shieldBadge('MongoDB', '7.x', '47A248', 'mongodb'));
  if (a.database === 'PostgreSQL')  badges.push(shieldBadge('PostgreSQL', '16.x', '4169E1', 'postgresql'));
  if (a.database === 'MySQL')       badges.push(shieldBadge('MySQL', '8.x', '4479A1', 'mysql'));
  if (a.database === 'Redis')       badges.push(shieldBadge('Redis', '7.x', 'DC382D', 'redis'));
  if (a.database === 'Firebase')    badges.push(shieldBadge('Firebase', 'latest', 'FFCA28', 'firebase'));
  if (a.database === 'SQLite')      badges.push(shieldBadge('SQLite', '3.x', '003B57', 'sqlite'));
  // Language
  if (a.primaryLanguage === 'TypeScript') badges.push(shieldBadge('TypeScript', '5.x', '3178C6', 'typescript'));
  if (a.primaryLanguage === 'JavaScript') badges.push(shieldBadge('JavaScript', 'ES2024', 'F7DF1E', 'javascript'));
  if (a.primaryLanguage === 'Python')     badges.push(shieldBadge('Python', '3.11+', '3572A5', 'python'));
  if (a.primaryLanguage === 'Java')       badges.push(shieldBadge('Java', '21+', 'ED8B00', 'openjdk'));
  if (a.primaryLanguage === 'Go')         badges.push(shieldBadge('Go', '1.22+', '00ADD8', 'go'));
  if (a.primaryLanguage === 'Rust')       badges.push(shieldBadge('Rust', 'latest', 'dea584', 'rust'));
  if (a.primaryLanguage === 'Kotlin')     badges.push(shieldBadge('Kotlin', '1.9+', 'A97BFF', 'kotlin'));
  if (a.primaryLanguage === 'C#')         badges.push(shieldBadge('C%23', 'latest', '178600', 'dotnet'));
  if (a.license) badges.push(shieldBadge('License', a.license, 'green'));
  return badges.join('\n');
}

/* ── Install Commands ── */
function getInstallCmds(a) {
  switch (a.packageManager) {
    case 'npm':    return { install: 'npm install',     dev: 'npm run dev',     build: 'npm run build',     test: 'npm test',       start: 'npm start' };
    case 'yarn':   return { install: 'yarn install',    dev: 'yarn dev',        build: 'yarn build',        test: 'yarn test',      start: 'yarn start' };
    case 'pnpm':   return { install: 'pnpm install',    dev: 'pnpm dev',        build: 'pnpm build',        test: 'pnpm test',      start: 'pnpm start' };
    case 'bun':    return { install: 'bun install',     dev: 'bun dev',         build: 'bun run build',     test: 'bun test',       start: 'bun start' };
    case 'pip':    return { install: 'pip install -r requirements.txt', dev: 'python app.py', build: '', test: 'python -m pytest', start: 'python app.py' };
    case 'poetry': return { install: 'poetry install',  dev: 'poetry run python app.py', build: '', test: 'poetry run pytest',   start: 'poetry run python app.py' };
    case 'pipenv': return { install: 'pipenv install',  dev: 'pipenv run python app.py', build: '', test: 'pipenv run pytest',   start: 'pipenv run python app.py' };
    case 'maven':  return { install: 'mvn install',     dev: 'mvn spring-boot:run',      build: 'mvn package', test: 'mvn test',  start: 'java -jar target/*.jar' };
    case 'gradle': return { install: './gradlew build', dev: './gradlew bootRun',         build: './gradlew build', test: './gradlew test', start: 'java -jar build/libs/*.jar' };
    case 'composer': return { install: 'composer install', dev: 'php artisan serve', build: '', test: 'php artisan test', start: 'php artisan serve' };
    case 'bundler': return { install: 'bundle install', dev: 'rails server',            build: 'rake assets:precompile', test: 'bundle exec rspec', start: 'rails server' };
    case 'go mod': return { install: 'go mod download', dev: 'go run .',               build: 'go build -o app .', test: 'go test ./...', start: './app' };
    case 'cargo':  return { install: 'cargo build',     dev: 'cargo run',               build: 'cargo build --release', test: 'cargo test', start: './target/release/app' };
    default:       return { install: 'npm install',     dev: 'npm run dev',             build: 'npm run build', test: 'npm test',      start: 'npm start' };
  }
}

function getDevServerDesc(a) {
  if (a.metaFramework === 'Next.js') return 'Open http://localhost:3000 in your browser';
  if (a.backendFramework === 'Django') return 'Open http://127.0.0.1:8000 in your browser';
  if (a.backendFramework === 'FastAPI') return 'Open http://127.0.0.1:8000/docs for interactive API docs';
  if (a.backendFramework === 'Flask') return 'Open http://127.0.0.1:5000 in your browser';
  if (a.backendFramework === 'Spring Boot') return 'Open http://localhost:8080 in your browser';
  if (a.backendFramework === 'Laravel') return 'Open http://localhost:8000 in your browser';
  return 'Open http://localhost:3000 in your browser';
}

function getProjectType(a) {
  if (a.metaFramework) return `${a.metaFramework} Application`;
  if (a.framework && a.backendFramework) return `Full-Stack ${a.framework} + ${a.backendFramework} Application`;
  if (a.framework) return `${a.framework} Frontend Application`;
  if (a.backendFramework) return `${a.backendFramework} Backend Application`;
  if (a.primaryLanguage === 'Python') return 'Python Application';
  if (a.primaryLanguage === 'Java')   return 'Java Application';
  if (a.primaryLanguage === 'Go')     return 'Go Application';
  if (a.primaryLanguage === 'Rust')   return 'Rust Application';
  if (a.primaryLanguage === 'Kotlin') return 'Kotlin Application';
  if (a.primaryLanguage === 'C#')     return 'C# Application';
  if (a.primaryLanguage === 'Ruby')   return 'Ruby Application';
  if (a.primaryLanguage === 'PHP')    return 'PHP Application';
  return 'Software Project';
}

/* ── README.md ── */
function generateReadme(a) {
  const cmd = getInstallCmds(a);
  const badges = getStackBadges(a);
  const name = titleCase(a.projectName);
  const primaryTech = a.metaFramework || a.backendFramework || a.framework || a.primaryLanguage || 'modern technologies';
  const dbPart = a.database ? ` with ${a.database}` : '';
  const desc = a.description || `A ${getProjectType(a)} built with ${primaryTech}${dbPart}.`;

  /* ── Build real tech stack table ── */
  const stackRows = [];
  if (a.metaFramework)     stackRows.push(['Framework', a.metaFramework]);
  else if (a.framework)    stackRows.push(['Frontend', a.framework]);
  if (a.backendFramework)  stackRows.push(['Backend', a.backendFramework]);
  if (a.primaryLanguage)   stackRows.push(['Language', a.primaryLanguage]);
  if (a.database)          stackRows.push(['Database', a.database + (a.orm ? ` via ${a.orm}` : '')]);
  if (a.authentication)    stackRows.push(['Authentication', a.authentication]);
  if (a.buildTool)         stackRows.push(['Build Tool', a.buildTool]);
  if (a.testFramework)     stackRows.push(['Testing', a.testFramework]);
  if (a.hasDocker)         stackRows.push(['Containerization', 'Docker']);
  if (a.hasCI)             stackRows.push(['CI/CD', 'GitHub Actions / CI Pipeline']);

  // Add top production dependencies with real versions
  const prodDeps = Object.entries(a.dependencies || {}).slice(0, 6);
  const depRows = prodDeps.length > 0
    ? '\n### Key Dependencies\n\n| Package | Version |\n|---------|---------|' +
      prodDeps.map(([pkg, ver]) => `\n| \`${pkg}\` | \`${ver}\` |`).join('')
    : '';

  /* ── Build features from REAL analysis data ── */
  const featureBullets = [];

  // From detected API routes — group by resource
  if (a.apiRoutes.length > 0) {
    const resources = [...new Set(a.apiRoutes.map(r => {
      const segs = r.path.split('/').filter(Boolean);
      return titleCase(segs[1] || segs[0] || 'api');
    }).filter(r => r && r !== 'Api'))];
    const resourceStr = resources.slice(0, 4).join(', ');
    featureBullets.push(`🔌 **REST API** — ${a.apiRoutes.length} endpoints across ${resources.length > 0 ? resources.length + ' resources (' + resourceStr + ')' : 'multiple resources'}`);
  }

  // From detected entities / features
  const detectedFeatures = (a.features || []).filter(f => f.confidence >= 70).slice(0, 6);
  for (const feat of detectedFeatures) {
    const types = feat.types || [];
    let icon = '⚙️';
    if (types.some(t => t.includes('controller'))) icon = '🔗';
    else if (types.some(t => t.includes('entity') || t.includes('database'))) icon = '🗃️';
    else if (types.some(t => t.includes('service'))) icon = '⚙️';
    const layerDesc = types.length > 0
      ? ' (' + [...new Set(types.map(t => titleCase(t.replace('-', ' '))))].slice(0, 2).join(', ') + ')'
      : '';
    const methodStr = feat.methodExamples?.length > 0
      ? ` — operations: \`${feat.methodExamples.slice(0, 2).join('`, `')}\``
      : '';
    featureBullets.push(`${icon} **${feat.name}**${layerDesc}${methodStr}`);
  }

  // SQL tables as data entities
  if (a.sqlTables?.length > 0 && detectedFeatures.length === 0) {
    featureBullets.push(`🗄️ **Data Models** — ${a.sqlTables.slice(0, 5).join(', ')} tables`);
  }

  // Auth
  if (a.authentication) {
    featureBullets.push(`🔐 **${a.authentication}** — Secure authentication and authorization`);
  } else if (a.apiRoutes.length > 0) {
    featureBullets.push('🔐 **Access Control** — Route-level access management');
  }

  // Database / ORM
  if (a.database) {
    featureBullets.push(`📊 **${a.database}** — ${a.orm ? `Data access via ${a.orm}` : 'Persistent data storage'}`);
  }

  // Testing
  if (a.testFramework) {
    featureBullets.push(`🧪 **${a.testFramework}** — Automated test suite`);
  } else if (a.hasTests) {
    featureBullets.push('🧪 **Automated Tests** — Unit and integration test coverage');
  }

  // Docker / CI
  if (a.hasDocker) featureBullets.push('🐳 **Docker** — Containerized for consistent deployment');
  if (a.hasCI)     featureBullets.push('⚙️ **CI/CD** — Automated build and test pipeline');

  // Architecture pattern
  if (a.architecture?.pattern) {
    featureBullets.push(`🏛️ **${a.architecture.pattern}** — Structured, maintainable code organization`);
  }

  // Design patterns
  if ((a.designPatterns || []).length > 0) {
    const patternNames = a.designPatterns.slice(0, 3).map(p => p.name).join(', ');
    featureBullets.push(`🔧 **Design Patterns** — ${patternNames}`);
  }

  // Only show a note if truly nothing was detected — no fake bullets
  if (featureBullets.length === 0) {
    featureBullets.push('📂 **Source Code Detected** — Upload a project with recognised config files (package.json, pom.xml, requirements.txt, etc.) and source code to generate feature-specific documentation.');
  }

  /* ── API Quick Reference table (real routes, first 12) ── */
  let apiSection = '';
  if (a.apiRoutes.length > 0) {
    const methodBadge = { GET: '🔵', POST: '🟢', PUT: '🟡', PATCH: '🟠', DELETE: '🔴', ANY: '⚪', HTTP: '⚪' };
    const routeRows = a.apiRoutes.slice(0, 12).map(r =>
      `| ${methodBadge[r.method] || '⚪'} \`${r.method}\` | \`${r.path}\` | ${titleCase((r.path.split('/').filter(Boolean)[1] || r.path.split('/').filter(Boolean)[0] || 'General').replace(/[{}:]/g, ''))} |`
    ).join('\n');
    apiSection = `\n\n## 🔌 API Endpoints\n\n| Method | Path | Resource |\n|--------|------|----------|\n${routeRows}\n\n> See [API_DOCS.md](API_DOCS.md) for full request/response documentation.`;
  }

  /* ── Key modules / entities section ── */
  let modulesSection = '';
  const allModules = [];

  // Java layers
  if (a.architecture?.layers) {
    const { controllers, services, repositories, entities } = a.architecture.layers;
    if (controllers?.length)   allModules.push(`**Controllers** (${controllers.length}) — ${controllers.slice(0,3).map(c=>c.filename).join(', ')}`);
    if (services?.length)      allModules.push(`**Services** (${services.length}) — ${services.slice(0,3).map(s=>s.filename).join(', ')}`);
    if (repositories?.length)  allModules.push(`**Repositories** (${repositories.length}) — ${repositories.slice(0,3).map(r=>r.filename).join(', ')}`);
    if (entities?.length)      allModules.push(`**Entities** (${entities.length}) — ${entities.slice(0,3).map(e=>e.filename).join(', ')}`);
  }

  // Python classes
  if ((a.pythonEntities || []).length > 0) {
    const pyClasses = a.pythonEntities.flatMap(e => e.classes || []).slice(0, 6);
    if (pyClasses.length > 0) allModules.push(`**Classes** — ${pyClasses.join(', ')}`);
    const pyFuncs  = a.pythonEntities.flatMap(e => (e.functions || []).filter(f => !f.startsWith('_'))).slice(0, 5);
    if (pyFuncs.length > 0)   allModules.push(`**Functions** — ${pyFuncs.join(', ')}`);
  }

  // JS components
  const jsComponents = (a.jsModules || []).flatMap(m => m.reactComponents || []).filter(Boolean).slice(0, 6);
  if (jsComponents.length > 0) allModules.push(`**Components** — ${jsComponents.join(', ')}`);
  const jsHooks = (a.jsModules || []).flatMap(m => m.hooks || []).filter(Boolean).slice(0, 4);
  if (jsHooks.length > 0) allModules.push(`**Hooks** — ${jsHooks.join(', ')}`);

  // SQL tables
  if ((a.sqlTables || []).length > 0) allModules.push(`**Database Tables** — ${a.sqlTables.slice(0, 6).join(', ')}`);

  // Entry point
  if (a.architecture?.entryPoint) allModules.push(`**Entry Point** — \`${a.architecture.entryPoint}\``);

  if (allModules.length > 0) {
    modulesSection = `\n\n## 🧩 Key Modules\n\n${allModules.map(m => `- ${m}`).join('\n')}`;
  }

  /* ── Environment variables table with auto-descriptions ── */
  function describeEnvVar(name) {
    const n = name.toLowerCase();
    if (n.includes('database_url') || n.includes('db_url') || n.includes('mongodb_uri') || n === 'database_url') return 'Database connection string';
    if (n.includes('db_host') || n.includes('database_host')) return 'Database server hostname';
    if (n.includes('db_port') || n.includes('database_port')) return 'Database server port';
    if (n.includes('db_name') || n.includes('database_name')) return 'Database name';
    if (n.includes('db_user') || n.includes('database_user')) return 'Database username';
    if (n.includes('db_pass') || n.includes('database_pass')) return 'Database password';
    if (n.includes('jwt_secret') || n.includes('jwt_key')) return 'Secret key for signing JWT tokens';
    if (n.includes('jwt_expires') || n.includes('jwt_expiry')) return 'JWT token expiration duration (e.g. 7d)';
    if (n.includes('secret_key') || n.includes('app_secret')) return 'Application secret key for sessions/encryption';
    if (n.includes('api_key'))  return 'External service API key';
    if (n.includes('password')) return 'Service or account password';
    if (n.includes('token'))    return 'Authentication or access token';
    if (n === 'port' || n.includes('server_port') || n.includes('app_port')) return `Server port (default: ${a.configData?.serverPort || '3000'})`;
    if (n === 'host' || n === 'app_host') return 'Server host address';
    if (n.includes('node_env') || n.includes('app_env') || n.includes('environment')) return 'Runtime environment (development / production)';
    if (n.includes('cors_origin') || n.includes('allowed_origin')) return 'Allowed CORS origin URL(s)';
    if (n.includes('smtp') || n.includes('mail') || n.includes('email_host')) return 'Email / SMTP server configuration';
    if (n.includes('redis')) return 'Redis connection URL or config';
    if (n.includes('aws') || n.includes('s3')) return 'AWS / S3 cloud storage configuration';
    if (n.includes('stripe')) return 'Stripe payment gateway key';
    if (n.includes('sendgrid') || n.includes('mailgun')) return 'Email delivery service API key';
    if (n.includes('log_level') || n.includes('debug')) return 'Logging verbosity level';
    if (n.includes('base_url') || n.includes('app_url')) return 'Public base URL of the application';
    return 'Application configuration variable';
  }

  const envTable = a.envVars.length > 0
    ? `\n\n| Variable | Description | Required |\n|----------|-------------|----------|\n${a.envVars.map(v => `| \`${v}\` | ${describeEnvVar(v)} | ✅ |`).join('\n')}`
    : '';

  /* ── Deployment platforms based on detected stack only ── */
  const deployPlatforms = [];
  if (a.metaFramework === 'Next.js' || a.metaFramework === 'Astro' || a.metaFramework === 'SvelteKit' || a.metaFramework === 'Gatsby') {
    deployPlatforms.push('- **[Vercel](https://vercel.com)** — Ideal for this stack: `npx vercel deploy`');
    deployPlatforms.push('- **[Netlify](https://netlify.com)** — Drag-and-drop or Git-integrated deploy');
  } else if (a.framework === 'React' || a.framework === 'Vue' || a.framework === 'Svelte') {
    deployPlatforms.push('- **[Vercel](https://vercel.com)** — Optimised static/SSR hosting');
    deployPlatforms.push('- **[Netlify](https://netlify.com)** — Drag-and-drop or Git-integrated deploy');
  }
  if (a.backendFramework || a.database) {
    deployPlatforms.push('- **[Railway](https://railway.app)** — Full-stack deployment with managed databases');
    deployPlatforms.push('- **[Render](https://render.com)** — Free tier with auto-deploys from GitHub');
  }
  if (a.primaryLanguage === 'Java' || a.backendFramework === 'Spring Boot') {
    deployPlatforms.push('- **[AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/)** — Managed Java/Spring Boot deployment');
  }
  if (a.primaryLanguage === 'Python') {
    deployPlatforms.push('- **[PythonAnywhere](https://www.pythonanywhere.com)** — Simple Python hosting');
  }
  if (a.primaryLanguage === 'Go') {
    deployPlatforms.push('- **[Fly.io](https://fly.io)** — Fast Go app deployment');
  }
  if (a.primaryLanguage === 'Rust') {
    deployPlatforms.push('- **[Fly.io](https://fly.io)** — Efficient Rust binary deployment');
  }
  if (a.hasDocker) {
    deployPlatforms.push('- **[AWS ECS / GCP Cloud Run](https://aws.amazon.com/ecs/)** — Container-based cloud deployment');
  }
  // Only add generic cloud if no specific options exist
  if (deployPlatforms.length === 0) {
    deployPlatforms.push('- **[Railway](https://railway.app)** — Simple cloud deployment');
    deployPlatforms.push('- **[Render](https://render.com)** — Free tier with auto-deploys from GitHub');
  }

  /* ── Prerequisites ── */
  const prereqs = [];
  if (a.packageManager === 'pip' || a.packageManager === 'poetry' || a.packageManager === 'pipenv') {
    prereqs.push('- **Python** >= 3.11 — [Download](https://www.python.org/downloads/)');
    prereqs.push(`- **${a.packageManager}** — \`pip install ${a.packageManager === 'poetry' ? 'poetry' : a.packageManager}\``);
  } else if (a.packageManager === 'maven') {
    const jv = a.configData?.javaVersion || '21';
    prereqs.push(`- **Java JDK** >= ${jv} — [Download](https://adoptium.net/)`);
    prereqs.push('- **Maven** — [Download](https://maven.apache.org/)');
  } else if (a.packageManager === 'gradle') {
    prereqs.push('- **Java JDK** >= 21 — [Download](https://adoptium.net/)');
    prereqs.push('- **Gradle** — [Download](https://gradle.org/install/)');
  } else if (a.packageManager === 'cargo') {
    prereqs.push('- **Rust** >= 1.75 — [Install via rustup](https://rustup.rs/)');
    prereqs.push('- **Cargo** — Included with Rust');
  } else if (a.packageManager === 'go mod') {
    const gv = a.configData?.goVersion || '1.22';
    prereqs.push(`- **Go** >= ${gv} — [Download](https://go.dev/dl/)`);
  } else {
    const pm = a.packageManager || 'npm';
    const pmVer = pm === 'pnpm' ? '8' : pm === 'yarn' ? '3' : '9';
    prereqs.push('- **Node.js** >= 18.0.0 — [Download](https://nodejs.org/)');
    prereqs.push(`- **${pm}** >= ${pmVer}.0.0 — \`npm install -g ${pm}\``);
  }
  if (a.database === 'MongoDB')    prereqs.push('- **MongoDB** >= 7.0 — [Download](https://www.mongodb.com/try/download) or use [Atlas](https://www.mongodb.com/atlas)');
  if (a.database === 'PostgreSQL') prereqs.push('- **PostgreSQL** >= 16 — [Download](https://www.postgresql.org/download/)');
  if (a.database === 'MySQL')      prereqs.push('- **MySQL** >= 8.0 — [Download](https://dev.mysql.com/downloads/)');
  if (a.database === 'Redis')      prereqs.push('- **Redis** >= 7.0 — [Download](https://redis.io/download/)');
  prereqs.push('- **Git** — [Download](https://git-scm.com/)');

  /* ── About paragraph ── */
  const aboutParts = [desc];
  if (a.architecture?.pattern) aboutParts.push(`It follows the **${a.architecture.pattern}** architectural pattern.`);
  if (a.features?.length > 0 && a.features.filter(f => f.confidence >= 70).length > 0) {
    const topEntities = a.features.filter(f => f.confidence >= 70).slice(0, 4).map(f => f.entityName).join(', ');
    aboutParts.push(`Core domain entities include: **${topEntities}**.`);
  }
  if (a.configData?.springBootVersion) aboutParts.push(`Uses Spring Boot **${a.configData.springBootVersion}**.`);
  if (a.configData?.serverPort)        aboutParts.push(`Runs on port **${a.configData.serverPort}** by default.`);
  const aboutParagraph = aboutParts.join(' ');

  /* ── Assemble the README ── */
  const folderSection = generateFolderTree(a.folderStructure);

  return `<div align="center">

# ${name}

${badges}

> ${desc}

[📖 Architecture](ARCHITECTURE.md) · [🔌 API Reference](API_DOCS.md) · [🔧 Installation](INSTALLATION.md) · [🤝 Contributing](CONTRIBUTING.md) · [📝 Changelog](CHANGELOG.md)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
${allModules.length > 0 ? '- [Key Modules](#key-modules)\n' : ''}${a.apiRoutes.length > 0 ? '- [API Endpoints](#api-endpoints)\n' : ''}${a.envVars.length > 0 ? '- [Environment Variables](#environment-variables)\n' : ''}- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About

${aboutParagraph}

${a.keywords?.length > 0 ? `**Keywords:** ${a.keywords.map(k => `\`${k}\``).join(' · ')}\n\n` : ''}${a.repository ? `**Repository:** ${a.repository}\n\n` : ''}${a.homepage ? `**Homepage:** [${a.homepage}](${a.homepage})\n\n` : ''}---

## ✨ Features

${featureBullets.map(b => `- ${b}`).join('\n')}

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
${stackRows.map(([cat, tech]) => `| ${cat} | ${tech} |`).join('\n')}
${depRows}

---

## 🚀 Getting Started

### Prerequisites

${prereqs.join('\n')}

### Installation

1. **Clone the repository**
\`\`\`bash
git clone https://github.com/your-username/${a.projectName}.git
cd ${a.projectName}
\`\`\`

2. **Install dependencies**
\`\`\`bash
${cmd.install}
\`\`\`

${a.hasEnvFile ? `3. **Configure environment variables**
\`\`\`bash
cp .env.example .env
\`\`\`
Edit \`.env\` and fill in your values (see [Environment Variables](#environment-variables) section).

4. **Start the development server**` : '3. **Start the development server**'}
\`\`\`bash
${cmd.dev}
\`\`\`

${getDevServerDesc(a)}

### Configuration

${a.envVars.length > 0
  ? `Copy \`.env.example\` to \`.env\` and configure:${envTable}`
  : 'No environment configuration is required to run this project in development mode.'}

---

## 💻 Usage

\`\`\`bash
# Development server
${cmd.dev}
${cmd.build ? `\n# Production build\n${cmd.build}\n` : ''}${cmd.test ? `\n# Run tests\n${cmd.test}\n` : ''}
# Start (production)
${cmd.start}
\`\`\`
${apiSection}
${modulesSection}

---

## 📁 Project Structure

\`\`\`
${folderSection}
\`\`\`
${a.envVars.length > 0 ? `
---

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
${a.envVars.map(v => `| \`${v}\` | ${describeEnvVar(v)} | ✅ |`).join('\n')}` : ''}

---

## 🚢 Deployment

${a.hasDocker ? `### Docker

\`\`\`bash
# Build image
docker build -t ${a.projectName} .

# Run container
docker run -p ${a.configData?.serverPort || '3000'}:${a.configData?.serverPort || '3000'} --env-file .env ${a.projectName}

# With Docker Compose
docker-compose up -d
\`\`\`

` : ''}### Cloud Platforms

${deployPlatforms.join('\n')}

### Manual Deployment

\`\`\`bash
${a.envVars.length > 0 ? '# 1. Set production environment variables\n# cp .env.example .env && nano .env\n\n' : ''}${cmd.build ? `# Build\n${cmd.build}\n\n` : ''}# Start
${cmd.start}
\`\`\`

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/your-feature\`
3. Commit your changes: \`git commit -m 'feat: add your feature'\`
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the **${a.license || 'MIT'}** License — see [LICENSE](LICENSE) for details.

## 👤 Author

${a.author ? `**${a.author}**` : '**Your Name**'}
${a.homepage ? `- Website: [${a.homepage}](${a.homepage})` : ''}- GitHub: [@your-username](https://github.com/your-username)

---

<div align="center">
Made with ❤️ · Generated by <a href="#">AI Doc Generator</a>
</div>
`;
}

/* ── Folder Tree String ── */
function generateFolderTree(node, prefix = '', isLast = true, depth = 0) {
  if (depth > 4) return '';
  const lines = [];
  if (depth === 0) {
    lines.push(titleCase(node.name.replace('root', 'project')) + '/');
  }
  const children = (node.children || [])
    .filter(c => !['node_modules', '.git', '__pycache__', '.next', 'dist', 'build', '.cache'].includes(c.name))
    .slice(0, 20);

  children.forEach((child, idx) => {
    const last = idx === children.length - 1;
    const connector = last ? '└── ' : '├── ';
    const childPrefix = prefix + (last ? '    ' : '│   ');
    const icon = child.type === 'dir' ? '📁 ' : '';
    lines.push(prefix + connector + icon + child.name + (child.type === 'dir' ? '/' : ''));
    if (child.type === 'dir' && child.children) {
      lines.push(generateFolderTree(child, childPrefix, last, depth + 1));
    }
  });
  return lines.join('\n');
}

/* ── INSTALLATION.md ── */
function generateInstallation(a) {
  const cmd = getInstallCmds(a);
  const name = titleCase(a.projectName);
  const isPython = ['pip', 'poetry', 'pipenv'].includes(a.packageManager);
  const isJava = ['maven', 'gradle'].includes(a.packageManager);

  const djangoExtra = a.backendFramework === 'Django' ? `
## 🗄️ Database Setup

\`\`\`bash
# Apply database migrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Load sample data (if available)
python manage.py loaddata fixtures/initial_data.json
\`\`\`` : '';

  const prismaExtra = a.orm === 'Prisma' ? `
## 🗄️ Database Setup

\`\`\`bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run migrations (production)
npx prisma migrate deploy

# Seed the database (if seed file exists)
npx prisma db seed
\`\`\`` : '';

  const mongoExtra = (a.database === 'MongoDB' && a.orm !== 'Prisma') ? `
## 🗄️ Database Setup

Ensure MongoDB is running locally or provide a **MongoDB Atlas** connection string.

\`\`\`bash
# Local MongoDB
mongod --dbpath /data/db

# Or use MongoDB Atlas (recommended for production)
# Set MONGODB_URI in your .env file to your Atlas connection string
\`\`\`` : '';

  return `# 🔧 Installation Guide

This guide provides step-by-step instructions to set up **${name}** in your local development environment.

---

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Clone the Repository](#clone-the-repository)
- [Install Dependencies](#install-dependencies)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Run Development Server](#run-development-server)
- [Build for Production](#build-for-production)
- [Troubleshooting](#troubleshooting)

---

## 💻 System Requirements

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
${isPython ? `| Python | >= 3.11 | [python.org](https://www.python.org/downloads/) |
| pip | >= 23.0 | Included with Python |` : isJava ? `| Java (JDK) | >= 21 | [adoptium.net](https://adoptium.net/) |
| ${titleCase(a.packageManager || 'Maven')} | Latest | [maven.apache.org](https://maven.apache.org/) |` : `| Node.js | >= 18.0.0 | [nodejs.org](https://nodejs.org/) |
| ${a.packageManager || 'npm'} | >= ${a.packageManager === 'pnpm' ? '8' : a.packageManager === 'yarn' ? '3' : '9'}.0.0 | Included with Node.js |`}
${a.database === 'MongoDB' ? '| MongoDB | >= 7.0 | [mongodb.com](https://www.mongodb.com/try/download) |' : ''}
${a.database === 'PostgreSQL' ? '| PostgreSQL | >= 16 | [postgresql.org](https://www.postgresql.org/download/) |' : ''}
${a.database === 'Redis' ? '| Redis | >= 7.0 | [redis.io](https://redis.io/download/) |' : ''}
| Git | Latest | [git-scm.com](https://git-scm.com/) |

---

## 1️⃣ Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/${a.projectName}.git
cd ${a.projectName}
\`\`\`

Alternatively, download the ZIP from GitHub and extract it.

---

## 2️⃣ Install Dependencies

\`\`\`bash
${cmd.install}
\`\`\`

${isPython && a.packageManager === 'pip' ? `> 💡 **Tip**: Use a virtual environment to isolate dependencies:
>
> \`\`\`bash
> python -m venv venv
> source venv/bin/activate  # Windows: venv\\Scripts\\activate
> pip install -r requirements.txt
> \`\`\`` : ''}

This will install all required dependencies listed in \`${a.packageManager === 'maven' ? 'pom.xml' : a.packageManager === 'gradle' ? 'build.gradle' : a.packageManager === 'pip' ? 'requirements.txt' : 'package.json'}\`.

---

## 3️⃣ Environment Configuration

\`\`\`bash
cp .env.example .env
\`\`\`

Open the \`.env\` file and configure:

\`\`\`env
${a.envVars.length > 0 ? a.envVars.map(v => `${v}=your_${v.toLowerCase()}_here`).join('\n') : '# Add your environment variables here\nPORT=3000\nNODE_ENV=development'}
\`\`\`

> ⚠️ **Never** commit your \`.env\` file to version control!

---

${djangoExtra || prismaExtra || mongoExtra || `## 4️⃣ Database Setup

${a.database ? `Ensure your **${a.database}** instance is running and the connection string in \`.env\` is correct.` : 'No database setup required for development.'}`}

---

## 5️⃣ Run Development Server

\`\`\`bash
${cmd.dev}
\`\`\`

**${getDevServerDesc(a)}**

The application will automatically reload when you make code changes.

---

## 6️⃣ Build for Production

${cmd.build ? `\`\`\`bash
${cmd.build}
\`\`\`

The production build will be output to the \`${a.backendFramework === 'Django' ? 'staticfiles' : a.packageManager === 'maven' ? 'target' : a.packageManager === 'gradle' ? 'build/libs' : 'dist'}/\` directory.

Start the production server:
\`\`\`bash
${cmd.start}
\`\`\`` : `This project doesn't require a separate build step. Start it directly with:
\`\`\`bash
${cmd.start}
\`\`\``}

---

## 🧪 Running Tests

\`\`\`bash
${cmd.test || '# No test command configured'}
\`\`\`

${a.testFramework ? `This project uses **${a.testFramework}** for testing. Tests are located in the \`test\` / \`__tests__\` directory.` : ''}

---

## 🛠️ Troubleshooting

### Common Issues

**Port already in use**
\`\`\`bash
# Find and kill the process using the port
${isPython ? 'lsof -ti:8000 | xargs kill -9' : 'lsof -ti:3000 | xargs kill -9'}
# Windows:
netstat -ano | findstr :${isPython ? '8000' : '3000'}
taskkill /PID <PID> /F
\`\`\`

**Dependency installation fails**
\`\`\`bash
# Clear cache and reinstall
${a.packageManager === 'npm' ? 'rm -rf node_modules package-lock.json\nnpm install' : a.packageManager === 'yarn' ? 'rm -rf node_modules yarn.lock\nyarn install' : a.packageManager === 'pnpm' ? 'rm -rf node_modules\npnpm install' : a.packageManager === 'pip' ? 'pip install --upgrade pip\npip install -r requirements.txt' : 'Clean and reinstall dependencies'}
\`\`\`

**Environment variables not loading**
- Ensure \`.env\` file exists in the project root
- Check for typos in variable names
- Restart the development server after changes

**Database connection failed**
- Verify the database server is running
- Check connection string format in \`.env\`
- Ensure the database user has proper permissions

---

## 📚 Additional Resources

- [README](README.md) — Project overview
- [API Documentation](API_DOCS.md) — Endpoint reference
- [Architecture Guide](ARCHITECTURE.md) — System design
- [Contributing Guide](CONTRIBUTING.md) — How to contribute
`;
}

/* ── API_DOCS.md ── */
function generateApiDocs(a) {
  const name = titleCase(a.projectName);
  const routes = a.apiRoutes;
  const baseUrl = a.backendFramework === 'Django' ? 'http://127.0.0.1:8000' :
                  a.backendFramework === 'Flask' ? 'http://127.0.0.1:5000' :
                  a.backendFramework === 'Spring Boot' ? 'http://localhost:8080' :
                  'http://localhost:3000';

  const methodColor = { GET: '`GET`', POST: '`POST`', PUT: '`PUT`', DELETE: '`DELETE`', PATCH: '`PATCH`', HEAD: '`HEAD`' };

  // Group routes by resource
  const groups = {};
  for (const r of routes) {
    const segments = r.path.split('/').filter(Boolean);
    const resource = segments[1] || segments[0] || 'general';
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(r);
  }

  const hasSections = Object.keys(groups).length > 0;
  const authHint = a.authentication
    ? `All protected endpoints require a valid **${a.authentication}** token.\n\n\`\`\`\nAuthorization: Bearer <your_token>\n\`\`\``
    : 'Endpoints marked with 🔒 require authentication.';

  const endpointDocs = hasSections ? Object.entries(groups).map(([resource, endpoints]) => {
    const resourceTitle = titleCase(resource);
    const epDocs = endpoints.map(ep => {
      const isAuth = ['users', 'profile', 'admin', 'orders', 'cart'].includes(resource);
      const hasId = ep.path.includes(':id') || ep.path.includes('{id}');
      const method = ep.method;

      const reqBody = ['POST', 'PUT', 'PATCH'].includes(method) ? `
**Request Body:**
\`\`\`json
{
  ${resource === 'auth' ? '"email": "user@example.com",\n  "password": "securePassword123"' :
    `"name": "Example ${resourceTitle}",\n  "description": "Optional description",\n  "status": "active"`}
}
\`\`\`` : '';

      const response = method === 'DELETE' ? `
**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "${resourceTitle} deleted successfully"
}
\`\`\`` : `
**Response (${method === 'POST' ? '201' : '200'}):**
\`\`\`json
{
  ${hasId ? `"id": "64a7f2c3d5e6b7a8c9d0e1f2",\n  "name": "Example ${resourceTitle}",\n  "status": "active",\n  "createdAt": "2024-01-15T10:30:00Z",\n  "updatedAt": "2024-01-15T10:30:00Z"` :
    method === 'GET' ? `"data": [...],\n  "total": 42,\n  "page": 1,\n  "perPage": 20` :
    `"success": true,\n  "id": "64a7f2c3d5e6b7a8c9d0e1f2",\n  "message": "Created successfully"`}
}
\`\`\``;

      return `### ${method === 'GET' ? '🔵' : method === 'POST' ? '🟢' : method === 'DELETE' ? '🔴' : '🟡'} ${method} \`${ep.path}\`

${isAuth ? '🔒 **Authentication Required**\n' : ''}${method === 'GET' && !hasId ? `Returns a paginated list of ${resource}.` : method === 'GET' && hasId ? `Returns a single ${resource} by ID.` : method === 'POST' ? `Creates a new ${resource}.` : method === 'PUT' || method === 'PATCH' ? `Updates an existing ${resource}.` : `Deletes a ${resource} by ID.`}

${hasId ? `**Path Parameters:**\n| Parameter | Type | Description |\n|-----------|------|-------------|\n| \`id\` | string | Unique identifier of the ${resource} |\n` : ''}${method === 'GET' && !hasId ? `**Query Parameters:**\n| Parameter | Type | Default | Description |\n|-----------|------|---------|-------------|\n| \`page\` | number | 1 | Page number |\n| \`limit\` | number | 20 | Items per page |\n| \`sort\` | string | \`-createdAt\` | Sort field |\n| \`filter\` | string | — | Filter query |\n` : ''}${reqBody}${response}

**Error Responses:**
| Status | Description |
|--------|-------------|
| \`400\` | Bad Request — Invalid input data |
| \`401\` | Unauthorized — Missing or invalid token |
| \`404\` | Not Found — Resource doesn't exist |
| \`500\` | Internal Server Error |

---
`;
    }).join('\n');

    return `## ${resourceTitle}\n\n${epDocs}`;
  }).join('\n') : `## General Endpoints

### 🔵 GET \`/health\`

Health check endpoint.

**Response (200):**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "${a.version}"
}
\`\`\`
`;

  return `# 🔌 API Documentation

Complete API reference for **${name}** v${a.version}.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | \`${baseUrl}\` |
| Staging | \`https://staging-api.your-domain.com\` |
| Production | \`https://api.your-domain.com\` |

---

## Authentication

${authHint}

${a.authentication === 'JWT' || a.authentication === 'Passport.js' ? `### Login

**POST** \`/api/auth/login\`

\`\`\`json
{
  "email": "user@example.com",
  "password": "your_password"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "expiresIn": 604800,
  "user": {
    "id": "64a7f2c3d5e6b7a8c9d0e1f2",
    "email": "user@example.com",
    "role": "user"
  }
}
\`\`\`

Include the token in subsequent requests:
\`\`\`bash
curl -H "Authorization: Bearer <token>" ${baseUrl}/api/users
\`\`\`` : ''}

---

## Response Format

All API responses follow this structure:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "errors": null
}
\`\`\`

---

## Error Codes

| Code | Meaning |
|------|---------|
| \`400\` | Bad Request |
| \`401\` | Unauthorized |
| \`403\` | Forbidden |
| \`404\` | Not Found |
| \`409\` | Conflict |
| \`422\` | Unprocessable Entity |
| \`429\` | Too Many Requests |
| \`500\` | Internal Server Error |

---

## Endpoints

${endpointDocs}

---

*API documentation generated on ${today()} for ${name} v${a.version}*
`;
}

/* ── ARCHITECTURE.md ── */
function generateArchitecture(a) {
  const name = titleCase(a.projectName);
  const desc = a.description || `A ${getProjectType(a)}`;

  const techList = [
    a.metaFramework    ? `- **${a.metaFramework}** — Meta-framework powering the application` : null,
    a.framework        ? `- **${a.framework}** — Frontend UI framework` : null,
    a.backendFramework ? `- **${a.backendFramework}** — Backend web framework` : null,
    a.database         ? `- **${a.database}** — Primary data store${a.orm ? ` via ${a.orm}` : ''}` : null,
    a.authentication   ? `- **${a.authentication}** — Authentication mechanism` : null,
    a.buildTool        ? `- **${a.buildTool}** — Build and bundling tool` : null,
    a.testFramework    ? `- **${a.testFramework}** — Testing framework` : null,
    a.hasDocker        ? '- **Docker** — Containerization' : null,
    a.hasCI            ? '- **CI/CD** — Automated testing and deployment pipeline' : null,
  ].filter(Boolean).join('\n');

  const folderSection = generateFolderTree(a.folderStructure);

  const dataFlow = a.backendFramework ? `
## 🔄 Data Flow

\`\`\`
Client Request
     │
     ▼
[HTTP Layer / Router]
     │
     ├── Middleware (Auth, Validation, Logging)
     │
     ▼
[Controller / Handler]
     │
     ├── Business Logic (Services)
     │
     ▼
[Data Layer${a.orm ? ` / ${a.orm}` : ''}]
     │
     ▼
[${a.database || 'Database'}]
     │
     ▼
[Response Serializer]
     │
     ▼
JSON Response → Client
\`\`\`` : '';

  const componentSection = a.framework ? `
## 🧩 Frontend Architecture

The frontend uses **${a.framework}** with a component-based architecture:

\`\`\`
App
├── Layout
│   ├── Header / Navbar
│   ├── Sidebar (if applicable)
│   └── Footer
├── Pages / Routes
│   ├── Public Pages (login, landing)
│   └── Protected Pages (dashboard, profile)
├── Shared Components
│   ├── UI primitives (Button, Input, Modal)
│   └── Domain components
└── Services / Hooks
    ├── API calls (fetch / axios)
    ├── State management
    └── Custom hooks
\`\`\`

### State Management
${a.primaryLanguage === 'TypeScript' ? 'Fully typed with TypeScript for compile-time safety.' : 'Component state managed with hooks and context.'}
` : '';

  return `# 🏗️ Architecture Guide

A comprehensive overview of **${name}**'s architecture, design patterns, and codebase organization.

---

## 📖 Overview

${desc}

This is a **${getProjectType(a)}** using the following technology stack:

${techList || '- See README.md for the full tech stack'}

---

## 📁 Folder Structure

\`\`\`
${folderSection}
\`\`\`

### Key Directories

| Directory | Purpose |
|-----------|---------|
${(() => {
  // Build from actual folder tree children
  const rows = [];
  const topDirs = (a.folderStructure?.children || [])
    .filter(c => c.type === 'dir' && !['node_modules','.git','__pycache__','dist','build','.next','.cache','target','out'].includes(c.name))
    .slice(0, 12);
  const DIR_PURPOSES = {
    src: 'Main source code',
    source: 'Main source code',
    lib: 'Shared library code',
    app: 'Application core',
    api: 'API layer',
    routes: 'Route definitions',
    controllers: 'Request handlers',
    services: 'Business logic',
    models: 'Data models / schemas',
    middleware: 'Middleware functions',
    config: 'Configuration files',
    utils: 'Utility / helper functions',
    helpers: 'Helper functions',
    components: 'UI components',
    pages: 'Page-level views',
    views: 'View templates',
    hooks: 'Custom hooks',
    store: 'State management',
    context: 'React context providers',
    assets: 'Static assets (images, fonts)',
    static: 'Static files',
    public: 'Publicly served files',
    styles: 'CSS / style files',
    css: 'CSS stylesheets',
    templates: 'HTML/template files',
    tests: 'Automated tests',
    test: 'Automated tests',
    '__tests__': 'Automated tests',
    spec: 'Test specifications',
    docs: 'Documentation',
    scripts: 'Build / utility scripts',
    migrations: 'Database migrations',
    seeds: 'Database seed data',
    fixtures: 'Test fixtures',
    types: 'TypeScript type definitions',
    interfaces: 'TypeScript interfaces',
    dto: 'Data Transfer Objects',
    entities: 'Domain entities',
    repository: 'Data repository layer',
    repositories: 'Data repository layer',
    domain: 'Domain layer',
    infrastructure: 'Infrastructure layer',
    presentation: 'Presentation / UI layer',
  };
  for (const dir of topDirs) {
    const purpose = DIR_PURPOSES[dir.name.toLowerCase()] || `${dir.name.charAt(0).toUpperCase() + dir.name.slice(1)} files`;
    rows.push(`| \`${dir.name}/\` | ${purpose} |`);
    // Also check one level deeper inside 'src'
    if (dir.name === 'src' && dir.children) {
      const subDirs = dir.children.filter(c => c.type === 'dir').slice(0, 6);
      for (const sub of subDirs) {
        const subPurpose = DIR_PURPOSES[sub.name.toLowerCase()] || `${sub.name.charAt(0).toUpperCase() + sub.name.slice(1)} files`;
        rows.push(`| \`src/${sub.name}/\` | ${subPurpose} |`);
      }
    }
  }
  return rows.length > 0 ? rows.join('\n') : '| `./` | Project root |';
})()}


---

## 🏛️ Architecture Pattern

${a.architecture?.pattern ?
`This project follows the **${a.architecture.pattern}**.

${a.architecture.patternEvidence?.length ? a.architecture.patternEvidence.map(e => `- ${e}`).join('\n') : ''}

${a.architecture.layers ? (() => {
  const lines = [];
  if (a.architecture.layers.controllers?.length) lines.push(`- **Controllers** (${a.architecture.layers.controllers.length}) — Handle incoming HTTP requests and return responses`);
  if (a.architecture.layers.services?.length)    lines.push(`- **Services** (${a.architecture.layers.services.length}) — Contain business logic, isolated and testable`);
  if (a.architecture.layers.repositories?.length) lines.push(`- **Repositories** (${a.architecture.layers.repositories.length}) — Data access layer abstracting database operations`);
  if (a.architecture.layers.entities?.length)    lines.push(`- **Entities** (${a.architecture.layers.entities.length}) — Domain data models mapped to the database`);
  if (a.architecture.layers.configs?.length)     lines.push(`- **Config** (${a.architecture.layers.configs.length}) — Application configuration and bean definitions`);
  return lines.join('\n');
})() : ''}` :
a.backendFramework ?
`Framework **${a.backendFramework}** is detected. No specific architectural pattern was identified from the source — the codebase may use a flat or custom structure.` :
`No specific architectural pattern was identified from the source code.`}

${dataFlow}

${componentSection}

## 🔐 Security Architecture

${a.authentication ? `### Authentication Flow

1. User submits credentials
2. Server validates credentials against ${a.database || 'the data store'}
3. On success, server generates a **${a.authentication}** token
4. Client stores token securely (HTTP-only cookie recommended)
5. Token is sent in subsequent API requests
6. Protected routes validate the token via middleware

` : ''}
### Detected Security Measures

${(() => {
  const bullets = [];
  if (a.authentication)                        bullets.push(`- **${a.authentication}** — Authentication mechanism detected in source`);
  if (a.detectedFramework?.data === 'JPA / Hibernate' || a.orm) bullets.push(`- **${a.orm || 'ORM'}** — Parameterised queries prevent SQL injection`);
  if (a.hasEnvFile)                            bullets.push('- **Environment variables** — Secrets managed via `.env` (not committed to source control)');
  if (a.securityIssues?.length === 0 && (a.javaClasses?.length || a.jsModules?.length || a.pythonEntities?.length)) bullets.push('- No hardcoded secrets detected in scanned source files');
  if (a.securityIssues?.length > 0)            bullets.push(`- ⚠️ **${a.securityIssues.length} potential hardcoded secret(s)** detected — review before committing`);
  return bullets.length > 0 ? bullets.join('\n') : '- No specific security patterns detected from source analysis.';
})()}

---

## 🗄️ Database Design

${a.database ? `The application uses **${a.database}** as the primary data store${a.orm ? ` with **${a.orm}**` : ''}.

${(() => {
  const entityRows = [];
  // Use detected features (confidence >= 70) as entities
  const strongFeatures = (a.features || []).filter(f => f.confidence >= 70).slice(0, 8);
  if (strongFeatures.length > 0) {
    return `### Detected Entities\n\n| Entity | Confidence | Layers |\n|--------|-----------|--------| \n${strongFeatures.map(f => `| **${f.entityName}** | ${f.confidence}% | ${f.types.slice(0,2).join(', ')} |`).join('\n')}`;
  }
  // Fallback: SQL tables
  if (a.sqlTables?.length > 0) {
    return `### Database Tables\n\n| Table | Purpose |\n|-------|---------|\n${a.sqlTables.slice(0,8).map(t => `| \`${t}\` | ${t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} data |`).join('\n')}`;
  }
  // Fallback: routes as resources
  const resources = [...new Set(a.apiRoutes.slice(0,6).map(r => { const seg = r.path.split('/').filter(Boolean); return seg[1] || seg[0]; }).filter(r => r && r !== 'api' && !r.startsWith(':')))];
  if (resources.length > 0) {
    return `### Inferred Resources (from API routes)\n\n| Resource | Description |\n|----------|-------------|\n${resources.map(r => `| ${titleCase(r)} | ${titleCase(r)} data |`).join('\n')}`;
  }
  return '_No specific entities detected. Add source code with database models for entity documentation._';
})()}

${a.orm ? `### Data Access Pattern\n\nData access is abstracted through **${a.orm}** — models define the schema and the ORM handles query generation, migrations, and connection pooling.` : ''}` : 'No database detected in this project.'}

---

## 🧪 Testing Strategy

${a.testFramework ? `Testing is implemented with **${a.testFramework}**:

- **Unit Tests** — Individual functions and utilities
- **Integration Tests** — API endpoints and database interactions
- **E2E Tests** — Full user flows (if applicable)

Run the test suite:
\`\`\`bash
${getInstallCmds(a).test}
\`\`\`` : 'Testing framework not detected. Consider adding tests to improve code quality.'}

---

## ⚡ Performance Considerations

${(() => {
  const bullets = [];
  if (a.database === 'Redis')  bullets.push('- **Redis** — Used for response and session caching');
  if (a.database && a.database !== 'Redis') bullets.push(`- **Caching** — Consider adding Redis alongside ${a.database} to cache frequent queries`);
  if (a.apiRoutes.length > 0) bullets.push('- **Pagination** — Implement paginated list endpoints to limit response payload size');
  if (a.database)             bullets.push('- **Indexing** — Ensure frequently queried fields have database indexes');
  if (a.framework === 'React' || a.framework === 'Vue') bullets.push('- **Code Splitting** — Use lazy imports to reduce initial bundle size');
  if (a.hasDocker)            bullets.push('- **Containerisation** — Docker ensures consistent performance across environments');
  return bullets.length > 0 ? bullets.join('\n') : '- No performance-specific patterns detected from source analysis.';
})()}

---

## 📈 Scalability

${(() => {
  const bullets = [];
  if (a.authentication)  bullets.push(`1. **Stateless API** — ${a.authentication} tokens enable stateless request handling, simplifying horizontal scaling`);
  if (a.database === 'MongoDB')    bullets.push('2. **MongoDB** — Supports sharding and replica sets for horizontal scaling');
  else if (a.database === 'PostgreSQL') bullets.push('2. **PostgreSQL** — Supports read replicas and connection pooling');
  else if (a.database)             bullets.push(`2. **${a.database}** — Configure for your scaling needs`);
  if (a.hasDocker)       bullets.push('3. **Docker** — Containers enable consistent multi-instance deployments');
  if (a.hasCI)           bullets.push('4. **CI/CD** — Automated pipeline for reliable deployments at scale');
  return bullets.length > 0 ? bullets.join('\n') : '_No scalability-specific patterns detected from source analysis._';
})()}

---

*Architecture documentation generated on ${today()} for ${name} v${a.version}*
`;
}

/* ── CONTRIBUTING.md ── */
function generateContributing(a) {
  const name = titleCase(a.projectName);
  return `# 🤝 Contributing to ${name}

First off, thank you for considering contributing to **${name}**! It's people like you that make open source software great. 🎉

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## 📜 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what is best for the community

---

## 🚀 Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   \`\`\`bash
   git clone https://github.com/YOUR-USERNAME/${a.projectName}.git
   cd ${a.projectName}
   \`\`\`
3. **Add the upstream remote**:
   \`\`\`bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/${a.projectName}.git
   \`\`\`
4. **Install dependencies** and follow the [Installation Guide](INSTALLATION.md)
5. **Create a branch** for your changes

---

## 🔄 Development Workflow

1. Sync your fork with the upstream:
   \`\`\`bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   \`\`\`
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Ensure all tests pass
6. Submit a pull request

---

## 🌿 Branch Naming

Use descriptive branch names following this pattern:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | \`feature/short-description\` | \`feature/user-authentication\` |
| Bug fix | \`fix/short-description\` | \`fix/login-redirect-loop\` |
| Documentation | \`docs/short-description\` | \`docs/api-reference-update\` |
| Refactor | \`refactor/short-description\` | \`refactor/database-service\` |
| Hotfix | \`hotfix/short-description\` | \`hotfix/critical-security-patch\` |
| Test | \`test/short-description\` | \`test/auth-coverage\` |

---

## 📝 Commit Guidelines

This project follows **Conventional Commits**:

\`\`\`
<type>(<scope>): <subject>

[optional body]
[optional footer]
\`\`\`

### Types

| Type | Description |
|------|-------------|
| \`feat\` | A new feature |
| \`fix\` | A bug fix |
| \`docs\` | Documentation only changes |
| \`style\` | Code formatting (no logic changes) |
| \`refactor\` | Code change that neither fixes a bug nor adds a feature |
| \`test\` | Adding or modifying tests |
| \`chore\` | Build process, dependency updates |
| \`perf\` | Performance improvement |
| \`ci\` | Changes to CI/CD configuration |

### Examples

\`\`\`bash
git commit -m "feat(auth): add refresh token rotation"
git commit -m "fix(api): resolve pagination offset bug"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(users): add unit tests for user service"
\`\`\`

---

## 🔍 Pull Request Process

1. **Ensure your branch is up to date** with \`main\`
2. **Write clear PR descriptions**:
   - What problem does this solve?
   - What changes were made?
   - Screenshots for UI changes
3. **Link relevant issues**: Use "Closes #123" in the PR description
4. **Ensure CI passes**: All tests must pass before review
5. **Request a review** from maintainers
6. **Address review feedback** promptly
7. **Squash commits** if requested before merging

### PR Template

\`\`\`markdown
## Summary
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added / updated
- [ ] All tests pass locally
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
\`\`\`

---

## 🎨 Coding Standards

${a.primaryLanguage === 'TypeScript' || a.primaryLanguage === 'JavaScript' ? `### JavaScript / TypeScript

- Follow **ESLint** rules (run \`npm run lint\`)
- Use **Prettier** for formatting (run \`npm run format\`)
- Prefer \`const\` over \`let\`, avoid \`var\`
- Use arrow functions for callbacks
- Write self-documenting code with clear variable names
- Add JSDoc comments for public functions
- Max line length: **100 characters**
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and components
- Use **SCREAMING_SNAKE_CASE** for constants` :
a.primaryLanguage === 'Python' ? `### Python

- Follow **PEP 8** style guide
- Use **Black** for formatting
- Use **flake8** / **ruff** for linting
- Type hints are encouraged
- Docstrings for all public functions
- Max line length: **88 characters** (Black default)
- Use **snake_case** for functions and variables
- Use **PascalCase** for classes
- Use **SCREAMING_SNAKE_CASE** for constants` :
`### General Guidelines

- Write clean, readable code
- Follow language-specific conventions
- Document public APIs
- Keep functions small and focused
- DRY (Don't Repeat Yourself) principle`}

---

## 🧪 Testing Requirements

- **All new features** must include appropriate tests
- **Bug fixes** should include a regression test
- Maintain or improve the existing code coverage
- Run the full test suite before submitting:
  \`\`\`bash
  ${getInstallCmds(a).test}
  \`\`\`

${a.testFramework ? `We use **${a.testFramework}** for testing. Follow the existing test patterns.` : ''}

---

## 🐛 Reporting Bugs

Before creating a bug report:
- Check the [issue tracker](../../issues) for existing reports
- Ensure you're on the latest version

When filing a bug report, include:

1. **Description** — Clear and concise description
2. **Steps to reproduce** — Step-by-step instructions
3. **Expected behavior** — What you expected
4. **Actual behavior** — What actually happened
5. **Environment** — OS, runtime version, package versions
6. **Screenshots** — If applicable

---

## 💡 Suggesting Features

We love new ideas! To suggest a feature:

1. Check if it's already been [requested](../../issues?q=label%3Aenhancement)
2. Open a new issue with the label **\`enhancement\`**
3. Describe the feature clearly
4. Explain the use case and benefits
5. If possible, suggest an implementation approach

---

## 🏆 Recognition

Contributors are recognized in:
- The [README.md](README.md) contributors section
- The [CHANGELOG.md](CHANGELOG.md) for significant contributions
- Release notes

Thank you for contributing! 🚀
`;
}

/* ── CHANGELOG.md ── */
function generateChangelog(a) {
  const name = titleCase(a.projectName);
  const date = today();
  const features = [
    a.framework ? `- Initial ${a.framework} frontend setup` : null,
    a.backendFramework ? `- ${a.backendFramework} API server implementation` : null,
    a.database ? `- ${a.database} database integration${a.orm ? ` with ${a.orm}` : ''}` : null,
    a.authentication ? `- ${a.authentication} authentication system` : null,
    a.apiRoutes.length ? `- REST API with ${a.apiRoutes.length} endpoints` : null,
    a.hasDocker ? '- Docker containerization' : null,
    a.hasCI ? '- CI/CD pipeline configuration' : null,
    a.testFramework ? `- ${a.testFramework} test suite` : null,
  ].filter(Boolean);

  return `# Changelog

All notable changes to **${name}** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

${(() => {
  // Only list improvements that are actually relevant to THIS project's detected state
  const items = [];
  if (!a.hasTests)     items.push('- Add automated test coverage');
  if (!a.hasDocker)    items.push('- Add Docker and Docker Compose configuration');
  if (!a.hasCI)        items.push('- Set up CI/CD pipeline (GitHub Actions or similar)');
  if (!a.hasLicense)   items.push('- Add an open-source license');
  if (a.database && !a.database.includes('Redis')) items.push(`- Add Redis caching layer for ${a.database} query results`);
  if (!a.hasEnvFile && a.envVars.length > 0) items.push('- Create `.env.example` documenting required environment variables');
  if (a.apiRoutes.length > 0 && !a.authentication) items.push('- Add authentication and authorisation to API endpoints');
  return items.length > 0 ? `### Planned\n\n${items.join('\n')}` : '> _No pending items identified from source analysis._';
})()}
---

## [${a.version}] — ${date}

### Added
${(features.length > 0 ? features : ['- Initial project setup', '- Core application structure', '- Basic configuration']).map(f => f).join('\n')}
- Project documentation (README, API docs, architecture guide)
- Environment variable configuration
${a.hasGitignore ? '- `.gitignore` with sensible defaults\n' : ''}- Contribution guidelines and code of conduct
- MIT license

### Infrastructure
- Project scaffolding and directory structure
${a.buildTool ? `- ${a.buildTool} build configuration\n` : ''}- Development environment setup
${a.hasEnvFile ? '- Environment variable templates (`.env.example`)\n' : ''}${a.hasDocker ? '- Docker and Docker Compose configuration\n' : ''}

---

## [0.1.0] — ${date}

### Added
- Initial commit
- Project initialization

---

## Versioning Guide

This project uses **Semantic Versioning** (SemVer):

- **MAJOR** version — Incompatible API changes
- **MINOR** version — New backward-compatible functionality
- **PATCH** version — Backward-compatible bug fixes

### Types of Changes

- \`Added\` — New features
- \`Changed\` — Changes in existing functionality
- \`Deprecated\` — Soon-to-be removed features
- \`Removed\` — Removed features
- \`Fixed\` — Bug fixes
- \`Security\` — Security vulnerability patches

---

[Unreleased]: https://github.com/your-username/${a.projectName}/compare/v${a.version}...HEAD
[${a.version}]: https://github.com/your-username/${a.projectName}/releases/tag/v${a.version}
[0.1.0]: https://github.com/your-username/${a.projectName}/releases/tag/v0.1.0
`;
}

/* ── Main Export ── */
function generateDocs(analysis) {
  return {
    readme:       generateReadme(analysis),
    installation: generateInstallation(analysis),
    api:          generateApiDocs(analysis),
    architecture: generateArchitecture(analysis),
    contributing: generateContributing(analysis),
    changelog:    generateChangelog(analysis),
  };
}
