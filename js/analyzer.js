/**
 * analyzer.js — Evidence-Based Deep Code Analysis Engine v2.0
 *
 * RULE: Every detection is backed by explicit evidence from source code.
 * RULE: Never assume a technology that cannot be confirmed from file content.
 * RULE: Confidence < 70% → the field is omitted from generated documentation.
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */

const JAVA_ENTITY_SUFFIXES = [
  'Controller',
  'RestController',
  'Service',
  'ServiceImpl',
  'Repository',
  'RepositoryImpl',
  'DAO',
  'DAOImpl',
  'DAOImpl',
  'Manager',
  'ManagerImpl',
  'Handler',
  'Processor',
  'Listener',
  'EventListener',
  'Factory',
  'Builder',
  'Validator',
  'Converter',
  'Mapper',
  'Adapter',
  'Provider',
  'Client',
  'Consumer',
  'Producer',
  'Worker',
  'Runner',
  'Helper',
  'Util',
  'Utils',
  'Impl',
  'Event',
  'Request',
  'Response',
  'DTO',
  'Bean',
  'Config',
  'Configuration',
  'Exception',
  'Facade',
  'Proxy',
  'Observer',
  'Strategy',
  'Decorator',
  'Command',
  'Template',
  'Visitor',
  'Mediator',
  'Iterator',
  'Singleton',
  'State',
  'Chain',
];

const SKIP_ENTITY_NAMES = new Set([
  'Main',
  'App',
  'Application',
  'Config',
  'Security',
  'Exception',
  'Error',
  'Base',
  'Abstract',
  'Generic',
  'Common',
  'Util',
  'Utils',
  'Helper',
  'Constants',
  'Test',
  'Tests',
  'Spec',
  'Mock',
  'Stub',
  'Fake',
  'Dummy',
  'Index',
  'Home',
  'Default',
  'Root',
  'Global',
]);

/* ── Language extension map ── */
const EXT_LANG = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.py': 'Python',
  '.pyw': 'Python',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.kts': 'Kotlin',
  '.scala': 'Scala',
  '.sc': 'Scala',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.c': 'C',
  '.swift': 'Swift',
  '.dart': 'Dart',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'SCSS',
  '.less': 'CSS',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.r': 'R',
  '.lua': 'Lua',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
};

const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Scala: '#c22d40',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  Swift: '#fa7343',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  SQL: '#e38c00',
  Shell: '#89e051',
};

/* Directories to always ignore */
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '__pycache__',
  'target',
  'build',
  'out',
  'dist',
  '.idea',
  '.vscode',
  'coverage',
  '.cache',
  'bin',
  'obj',
  '.gradle',
  '.mvn',
  'venv',
  'env',
  '.next',
  '.nuxt',
  'vendor',
  '.DS_Store',
  '__MACOSX',
  'logs',
  'tmp',
  'temp',
]);

/* ══════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════ */

function getExt(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileName(path) {
  return (path || '').replace(/\\/g, '/').split('/').pop();
}

function isIgnored(path) {
  const parts = (path || '').replace(/\\/g, '/').split('/');
  return parts.some((p) => IGNORE_DIRS.has(p));
}

function countLines(content) {
  return (content || '').split('\n').length;
}

/* ══════════════════════════════════════════════════════════
   LANGUAGE STATISTICS
══════════════════════════════════════════════════════════ */

function computeLanguageStats(files) {
  const counts = {};
  for (const f of files) {
    if (f.isDir || isIgnored(f.path)) continue;
    const lang = EXT_LANG[getExt(f.name)];
    if (lang) counts[lang] = (counts[lang] || 0) + (f.size || 100);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const stats = {};
  for (const [l, c] of Object.entries(counts))
    stats[l] = Math.max(1, Math.round((c / total) * 100));

  // Primary language = highest byte-weight, skipping markup/style
  const NON_PRIMARY = new Set(['HTML', 'CSS', 'SCSS', 'SQL', 'Shell', 'R', 'Lua']);
  const sorted = Object.keys(counts)
    .filter((l) => !NON_PRIMARY.has(l))
    .sort((a, b) => counts[b] - counts[a]);
  const allSorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  return {
    primaryLanguage: sorted[0] || allSorted[0] || 'Unknown',
    languages: allSorted,
    languageStats: stats,
  };
}

/* ══════════════════════════════════════════════════════════
   JAVA SOURCE ANALYSIS
══════════════════════════════════════════════════════════ */

function analyzeJavaFile(content, filepath) {
  if (!content) return null;
  const filename = getFileName(filepath);

  const entity = {
    filepath,
    filename,
    packageName: null,
    className: null,
    classType: 'class', // class | interface | enum | abstract
    isAbstract: false,
    annotations: [], // ALL unique annotation names found in file
    imports: [], // ALL import statements
    methods: [], // public/protected method names
    fields: [],
    extendsClass: null,
    implementsInterfaces: [],
    isMainClass: false, // has public static void main
    routeMappings: [], // [{annotation, path}]
    baseMapping: null, // class-level @RequestMapping path
    lineCount: countLines(content),
  };

  // Package declaration
  const pkgM = content.match(/^\s*package\s+([\w.]+)\s*;/m);
  if (pkgM) entity.packageName = pkgM[1];

  // Import statements
  const importRx = /^\s*import\s+(?:static\s+)?([\w.*]+)\s*;/gm;
  entity.imports = [...content.matchAll(importRx)].map((m) => m[1]);

  // Class / interface / enum declaration
  // Handles: public abstract class Foo<T> extends Bar implements Baz, Qux {
  const classRx =
    /(?:^|\n)\s*(?:@[\w]+(?:\s*\([^)]*\))?\s*\n?\s*)*(?:public\s+|protected\s+|private\s+)?(?:(abstract)\s+)?(?:final\s+)?(?:sealed\s+)?(class|interface|@interface|enum|record)\s+(\w+)/m;
  const classM = content.match(classRx);
  if (classM) {
    entity.isAbstract = !!classM[1];
    entity.classType = classM[2].replace('@', '');
    entity.className = classM[3];
  }

  // extends / implements (separate match for clarity)
  if (entity.className) {
    const extRx = new RegExp(
      `class\\s+${entity.className}[\\w<>,\\s]*\\s+extends\\s+([\\w<>,\\s.]+?)(?:\\s+implements|\\s*\\{)`
    );
    const implRx = new RegExp(
      `class\\s+${entity.className}[\\w<>,\\s]*(?:\\s+extends[\\w<>,\\s.]+)?\\s+implements\\s+([\\w<>,\\s.]+?)\\s*\\{`
    );
    const extM = content.match(extRx);
    const implM = content.match(implRx);
    if (extM) entity.extendsClass = extM[1].trim().split(/[<\s]/)[0];
    if (implM)
      entity.implementsInterfaces = implM[1].split(',').map((s) => s.trim().split(/[<\s]/)[0]);
  }

  // All annotation names (unique)
  const annRx = /@([A-Z]\w*)/g;
  entity.annotations = [...new Set([...content.matchAll(annRx)].map((m) => m[1]))];

  // Entry point
  entity.isMainClass = /public\s+static\s+void\s+main\s*\(\s*String/.test(content);

  // Public / protected method names (avoid false positives)
  const methodRx =
    /(?:public|protected)\s+(?:static\s+)?(?:(?:final|synchronized|abstract|native|default)\s+)*(?:[\w<>\[\]?,\s]+?)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*[{;]/gm;
  const BAD_NAMES = new Set([
    'if',
    'while',
    'for',
    'switch',
    'try',
    'catch',
    'return',
    'class',
    'interface',
    'new',
    'void',
    'else',
  ]);
  entity.methods = [
    ...new Set(
      [...content.matchAll(methodRx)].map((m) => m[1]).filter((n) => n && !BAD_NAMES.has(n))
    ),
  ];

  // Route mappings (@GetMapping, @PostMapping, etc.)
  const routeRx =
    /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*(?:\(\s*(?:value\s*=\s*)?(?:\{?\s*["']([^"']*)["']\}?)?)?/g;
  entity.routeMappings = [...content.matchAll(routeRx)].map((m) => ({
    annotation: m[1],
    path: m[2] || '',
  }));

  // Class-level @RequestMapping base path
  const baseM = content.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']*)["']/);
  entity.baseMapping = baseM ? baseM[1] : null;

  // Field declarations
  const fieldRx =
    /(?:private|protected|public)\s+(?:static\s+)?(?:final\s+)?(?:[\w<>\[\]?]+)\s+(\w+)\s*[=;]/gm;
  entity.fields = [
    ...new Set(
      [...content.matchAll(fieldRx)].map((m) => m[1]).filter((n) => n !== 'serialVersionUID')
    ),
  ];

  return entity;
}

/* ══════════════════════════════════════════════════════════
   PYTHON SOURCE ANALYSIS
══════════════════════════════════════════════════════════ */

function analyzePythonFile(content, filepath) {
  if (!content) return null;
  const filename = getFileName(filepath);

  const entity = {
    filepath,
    filename,
    directImports: [], // import X
    fromImports: [], // from X import Y  (X stored)
    classes: [],
    functions: [],
    routes: [],
    isEntryPoint: false,
    lineCount: countLines(content),
  };

  entity.directImports = [...content.matchAll(/^import\s+([\w.]+)/gm)].map((m) => m[1]);
  entity.fromImports = [...content.matchAll(/^from\s+([\w.]+)\s+import/gm)].map((m) => m[1]);

  entity.classes = [...content.matchAll(/^class\s+(\w+)/gm)].map((m) => m[1]);
  entity.functions = [...content.matchAll(/^(?:async\s+)?def\s+(\w+)\s*\(/gm)].map((m) => m[1]);

  // Flask / FastAPI / Starlette route decorators
  const flaskRx =
    /@(?:app|router|blueprint|bp|api)\.(?:route|get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/gm;
  const djRx = /(?:path|re_path|url)\s*\(\s*["']([^"']+)["']/gm;
  entity.routes = [
    ...[...content.matchAll(flaskRx)].map((m) => m[1]),
    ...[...content.matchAll(djRx)].map((m) => m[1]),
  ];

  entity.isEntryPoint =
    content.includes("if __name__ == '__main__'") || content.includes('if __name__ == "__main__"');

  return entity;
}

/* ══════════════════════════════════════════════════════════
   JAVASCRIPT / TYPESCRIPT ANALYSIS
══════════════════════════════════════════════════════════ */

function analyzeJSFile(content, filepath) {
  if (!content) return null;
  const filename = getFileName(filepath);

  const entity = {
    filepath,
    filename,
    imports: [], // resolved package names (no relative paths)
    classes: [],
    reactComponents: [],
    hooks: [],
    routes: [], // [{method, path}]
    isEntryPoint: false,
    lineCount: countLines(content),
  };

  // ES6 imports
  const es6Rx = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/gm;
  // CJS require
  const cjsRx = /(?:const|let|var)\s+[\w{}]+\s*=\s*require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/gm;
  entity.imports = [
    ...new Set([
      ...[...content.matchAll(es6Rx)].map((m) => m[1]),
      ...[...content.matchAll(cjsRx)].map((m) => m[1]),
    ]),
  ];

  entity.classes = [...content.matchAll(/class\s+([A-Za-z]\w*)/gm)].map((m) => m[1]);

  // React components (capitalized function/const starting with capital letter)
  const compRx =
    /(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][A-Za-z0-9_]*)\s*(?:=\s*(?:\([^)]*\)|[\w]+)\s*=>|\()/gm;
  entity.reactComponents = [...content.matchAll(compRx)]
    .map((m) => m[1])
    .filter((n) => !['Promise', 'Array', 'Object', 'String', 'Number', 'Boolean'].includes(n));

  // Custom hooks
  entity.hooks = [...content.matchAll(/(?:const|function)\s+(use[A-Z]\w*)\s*(?:=|\()/gm)].map(
    (m) => m[1]
  );

  // Express routes
  const routeRx =
    /(?:router|app)\.(get|post|put|delete|patch|head|all)\s*\(\s*['"`]([^'"`]+)['"`]/gm;
  entity.routes = [...content.matchAll(routeRx)].map((m) => ({
    method: m[1].toUpperCase(),
    path: m[2],
  }));

  entity.isEntryPoint =
    /\.(listen|createServer)\s*\(/.test(content) ||
    /if\s*\(__name__/.test(content) ||
    ['index.js', 'main.js', 'app.js', 'server.js', 'index.ts', 'main.ts'].includes(filename);

  return entity;
}

/* ══════════════════════════════════════════════════════════
   CONFIG FILE PARSERS
══════════════════════════════════════════════════════════ */

function parsePomXml(content) {
  if (!content) return null;
  const r = {
    groupId: null,
    artifactId: null,
    version: null,
    name: null,
    description: null,
    packaging: null,
    javaVersion: null,
    springBootVersion: null,
    parentArtifact: null,
    dependencies: [],
    plugins: [],
  };

  const tag = (name, src) => {
    const m = (src || content).match(new RegExp(`<${name}>([^<]+)<\/${name}>`));
    return m ? m[1].trim() : null;
  };

  // Top-level fields (strip inner blocks first to avoid picking up dependency versions)
  const stripped = content
    .replace(/<dependencies>[\s\S]*?<\/dependencies>/g, '')
    .replace(/<build>[\s\S]*?<\/build>/g, '');

  r.groupId = tag('groupId', stripped);
  r.artifactId = tag('artifactId', stripped);
  r.version = tag('version', stripped);
  r.name = tag('name', stripped);
  r.description = tag('description', stripped);
  r.packaging = tag('packaging', stripped);

  // Java version
  const jvM =
    content.match(/<java\.version>([^<]+)<\/java\.version>/) ||
    content.match(/<maven\.compiler\.source>([^<]+)<\/maven\.compiler\.source>/) ||
    content.match(/<release>(\d+)<\/release>/);
  r.javaVersion = jvM ? jvM[1].trim() : null;

  // Parent (Spring Boot version)
  const parentM = content.match(/<parent>([\s\S]*?)<\/parent>/);
  if (parentM) {
    r.parentArtifact = tag('artifactId', parentM[1]);
    const parentVer = tag('version', parentM[1]);
    if (r.parentArtifact?.toLowerCase().includes('spring-boot')) r.springBootVersion = parentVer;
  }

  // All <dependency> blocks
  const depBlocks = [...content.matchAll(/<dependency>([\s\S]*?)<\/dependency>/g)];
  r.dependencies = depBlocks
    .map((m) => ({
      groupId: tag('groupId', m[1]),
      artifactId: tag('artifactId', m[1]),
      version: tag('version', m[1]),
      scope: tag('scope', m[1]),
    }))
    .filter((d) => d.artifactId);

  // Plugins
  const pluginBlocks = [...content.matchAll(/<plugin>([\s\S]*?)<\/plugin>/g)];
  r.plugins = pluginBlocks.map((m) => tag('artifactId', m[1])).filter(Boolean);

  return r;
}

function parseBuildGradle(content) {
  if (!content) return null;
  const r = {
    group: null,
    version: null,
    javaVersion: null,
    springBootVersion: null,
    dependencies: [],
    plugins: [],
  };

  const groupM = content.match(/^group\s*[=:]\s*['"]([^'"]+)['"]/m);
  r.group = groupM ? groupM[1] : null;

  const verM = content.match(/^version\s*[=:]\s*['"]([^'"]+)['"]/m);
  r.version = verM ? verM[1] : null;

  const jvM = content.match(/(?:sourceCompatibility|targetCompatibility)\s*[=:]\s*['"]?([^'"\n]+)/);
  r.javaVersion = jvM ? jvM[1].trim().replace(/JavaVersion\.VERSION_/, '') : null;

  const sbM = content.match(/id\s+['"]org\.springframework\.boot['"]\s+version\s+['"]([^'"]+)['"]/);
  r.springBootVersion = sbM ? sbM[1] : null;

  const depRx =
    /(?:implementation|compile|api|testImplementation|runtimeOnly|compileOnly|annotationProcessor)\s*[\("']([^)"'\n]+)["')]/g;
  r.dependencies = [...content.matchAll(depRx)].map((m) => m[1].trim());

  const pluginRx = /id\s+['"]([^'"]+)['"]/g;
  r.plugins = [...content.matchAll(pluginRx)].map((m) => m[1]);

  return r;
}

function parseApplicationProperties(content) {
  if (!content) return null;
  const props = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) props[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return {
    serverPort: props['server.port'] || null,
    contextPath: props['server.servlet.context-path'] || null,
    datasourceUrl: props['spring.datasource.url'] || null,
    datasourceDriver: props['spring.datasource.driver-class-name'] || null,
    appName: props['spring.application.name'] || null,
    jpaDdlAuto: props['spring.jpa.hibernate.ddl-auto'] || null,
    jpaShowSql: props['spring.jpa.show-sql'] || null,
    jpaDialect:
      props['spring.jpa.database-platform'] ||
      props['spring.jpa.properties.hibernate.dialect'] ||
      null,
    activeProfile: props['spring.profiles.active'] || null,
    securityEnabled:
      'spring.security.user.password' in props || 'spring.security.user.name' in props,
    raw: props,
  };
}

function parseApplicationYml(content) {
  if (!content) return null;
  // Targeted extraction — no full YAML parse needed
  const dsUrlM = content.match(/url\s*:\s*(jdbc:[^\n]+)/i);
  const portM = content.match(/port\s*:\s*(\d{2,5})/);
  const nameM = content.match(/name\s*:\s*([\w-]+)/);
  const ddlM = content.match(/ddl-auto\s*:\s*(\w+)/i);
  const profileM = content.match(/active\s*:\s*([\w,-]+)/i);
  return {
    datasourceUrl: dsUrlM ? dsUrlM[1].trim() : null,
    serverPort: portM ? portM[1] : null,
    appName: nameM ? nameM[1] : null,
    jpaDdlAuto: ddlM ? ddlM[1] : null,
    activeProfile: profileM ? profileM[1] : null,
  };
}

function parseRequirementsTxt(content) {
  if (!content) return [];
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('-r') && !l.startsWith('--'))
    .map((l) => ({ name: l.split(/[>=<!=\[;]/)[0].trim(), raw: l }))
    .filter((d) => d.name);
}

function parseEnvFile(content) {
  if (!content) return [];
  const vars = [];
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) {
      const key = t.split('=')[0].trim();
      if (key && /^[A-Z_][A-Z0-9_]*$/.test(key)) vars.push(key);
    }
  }
  return vars;
}

/* ── Cargo.toml (Rust) ── */
function parseCargoToml(content) {
  if (!content) return null;
  const r = {
    name: null,
    version: null,
    description: null,
    edition: null,
    authors: [],
    dependencies: [],
  };

  // [package] section values
  const nameM = content.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
  const verM = content.match(/^\s*version\s*=\s*["']([^"']+)["']/m);
  const descM = content.match(/^\s*description\s*=\s*["']([^"']+)["']/m);
  const edM = content.match(/^\s*edition\s*=\s*["']([^"']+)["']/m);
  const authM = content.match(/^\s*authors\s*=\s*\[([^\]]*)\]/m);

  r.name = nameM ? nameM[1] : null;
  r.version = verM ? verM[1] : null;
  r.description = descM ? descM[1] : null;
  r.edition = edM ? edM[1] : null;

  if (authM) {
    r.authors = [...authM[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  }

  // [dependencies] — extract crate names
  const depsSection = content.match(/\[dependencies\]([\s\S]*?)(?=^\[|\Z)/m);
  if (depsSection) {
    r.dependencies = [...depsSection[1].matchAll(/^\s*([\w-]+)\s*=/gm)].map((m) => m[1]);
  }
  return r;
}

/* ── go.mod (Go) ── */
function parseGoMod(content) {
  if (!content) return null;
  const r = { moduleName: null, goVersion: null, dependencies: [] };

  const modM = content.match(/^module\s+(\S+)/m);
  const goM = content.match(/^go\s+(\d[\d.]+)/m);

  r.moduleName = modM ? modM[1] : null;
  r.goVersion = goM ? goM[1] : null;

  // require block entries
  const reqBlock =
    content.match(/require\s*\(([^)]+)\)/s) || content.match(/require\s*\(([^)]+)\)/m);
  if (reqBlock) {
    r.dependencies = [...reqBlock[1].matchAll(/^\s*([\w./\-]+)\s+v/gm)].map((m) => m[1]);
  } else {
    // single-line requires
    r.dependencies = [...content.matchAll(/^require\s+([\w./\-]+)\s+v/gm)].map((m) => m[1]);
  }
  return r;
}

/* ── pyproject.toml (modern Python: Poetry, Hatch, PDM, Flit) ── */
function parsePyprojectToml(content) {
  if (!content) return null;
  const r = {
    name: null,
    version: null,
    description: null,
    authors: [],
    dependencies: [],
    buildBackend: null,
  };

  // [tool.poetry] or [project] section
  const nameM = content.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
  const verM = content.match(/^\s*version\s*=\s*["']([^"']+)["']/m);
  const descM = content.match(/^\s*description\s*=\s*["']([^"']+)["']/m);
  const bbM = content.match(/build-backend\s*=\s*["']([^"']+)["']/);

  r.name = nameM ? nameM[1] : null;
  r.version = verM ? verM[1] : null;
  r.description = descM ? descM[1] : null;
  r.buildBackend = bbM ? bbM[1] : null;

  // dependencies list under [tool.poetry.dependencies] or [project] dependencies
  const depSection =
    content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=^\[|\Z)/m) ||
    content.match(/\[project\][\s\S]*?dependencies\s*=\s*\[([^\]]*)\]/m);
  if (depSection) {
    r.dependencies = [...depSection[1].matchAll(/^\s*([\w-]+)\s*[=^~<>]/gm)]
      .map((m) => m[1])
      .filter((n) => n !== 'python');
  }
  return r;
}

function analyzeSqlFile(content, filepath) {
  if (!content) return null;
  const tables = [
    ...content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(/gi),
  ].map((m) => m[1]);
  const procs = [
    ...content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION)\s+[`"']?(\w+)/gi),
  ].map((m) => m[1]);
  const views = [...content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+[`"']?(\w+)/gi)].map(
    (m) => m[1]
  );
  const hasInsert = /INSERT\s+INTO/i.test(content);
  return { filepath, filename: getFileName(filepath), tables, procs, views, hasInsert };
}

/* ══════════════════════════════════════════════════════════
   FRAMEWORK DETECTION  (evidence-based, confidence-scored)
══════════════════════════════════════════════════════════ */

function detectFramework(
  javaClasses,
  pythonEntities,
  jsModules,
  pomData,
  gradleData,
  pkgJson,
  reqPackages
) {
  const out = {
    primary: null,
    primaryConfidence: 0,
    primaryEvidence: [],
    ui: null,
    uiConfidence: 0,
    uiEvidence: [],
    data: null,
    dataConfidence: 0,
    dataEvidence: [],
  };

  /* ── Java ── */
  if (javaClasses.length > 0) {
    const allAnnotations = javaClasses.flatMap((e) => e.annotations);
    const allImports = javaClasses.flatMap((e) => e.imports).join(' ');
    const pomDeps = (pomData?.dependencies || [])
      .map((d) => `${d.groupId || ''}:${d.artifactId || ''}`)
      .join(' ')
      .toLowerCase();
    const gradleDeps = (gradleData?.dependencies || []).join(' ').toLowerCase();
    const allDeps = pomDeps + ' ' + gradleDeps;

    // Spring Boot
    const hasSBAnnotation = allAnnotations.includes('SpringBootApplication');
    const hasSBParent = pomData?.parentArtifact?.toLowerCase().includes('spring-boot') || false;
    const hasSBDep =
      allDeps.includes('spring-boot-starter') ||
      gradleData?.plugins?.some((p) => p.includes('spring-boot'));
    const hasSBPlugin = (pomData?.plugins || []).some((p) => p.includes('spring-boot'));
    if (hasSBAnnotation || hasSBParent || hasSBDep || hasSBPlugin) {
      const ev = [];
      if (hasSBAnnotation) {
        const f = javaClasses.find((e) => e.annotations.includes('SpringBootApplication'));
        ev.push(`@SpringBootApplication in ${f?.filename || 'source file'}`);
      }
      if (hasSBParent) ev.push(`spring-boot-starter-parent in pom.xml`);
      if (hasSBDep)
        ev.push(`spring-boot-starter-* dependency in ${pomData ? 'pom.xml' : 'build.gradle'}`);
      if (hasSBPlugin && !hasSBParent && !hasSBDep)
        ev.push('Spring Boot Maven/Gradle plugin detected');
      out.primary = 'Spring Boot';
      out.primaryConfidence = hasSBAnnotation && (hasSBParent || hasSBDep) ? 100 : 90;
      out.primaryEvidence = ev;
    }

    // Spring MVC (no Spring Boot)
    if (!out.primary) {
      const hasMVC =
        allDeps.includes('spring-webmvc') ||
        allDeps.includes('spring-web') ||
        allDeps.includes('spring-framework');
      const hasCtrl = allAnnotations.some((a) => ['Controller', 'RestController'].includes(a));
      if (hasMVC && hasCtrl) {
        out.primary = 'Spring MVC';
        out.primaryConfidence = 88;
        out.primaryEvidence = [
          'spring-webmvc dependency detected',
          '@Controller or @RestController annotation found',
        ];
      }
    }

    // JavaFX
    const javafxImports = javaClasses.flatMap((e) =>
      e.imports.filter((i) => i.startsWith('javafx.'))
    );
    const javafxDep =
      allDeps.includes('javafx') ||
      (pomData?.dependencies || []).some((d) => (d.groupId || '').includes('javafx'));
    const hasFXML = javaClasses.some((e) => e.imports.some((i) => i.includes('javafx.fxml')));
    if (javafxImports.length > 0 || javafxDep) {
      out.ui = 'JavaFX';
      out.uiConfidence = Math.min(100, 70 + javafxImports.length * 5);
      out.uiEvidence = [...new Set(javafxImports.slice(0, 3).map((i) => `import ${i}`))];
      if (hasFXML) out.uiEvidence.push('FXML usage detected (Scene Builder layout)');
      if (javafxDep) out.uiEvidence.push('javafx dependency in pom.xml');
      if (!out.primary) {
        out.primary = 'JavaFX';
        out.primaryConfidence = out.uiConfidence;
        out.primaryEvidence = out.uiEvidence;
      }
    }

    // Java Swing
    if (!out.ui) {
      const swingImports = javaClasses.flatMap((e) =>
        e.imports.filter(
          (i) =>
            i.startsWith('javax.swing') ||
            (i.startsWith('java.awt') && !i.startsWith('java.awt.geom'))
        )
      );
      if (swingImports.length > 0) {
        out.ui = 'Java Swing';
        out.uiConfidence = Math.min(100, 65 + swingImports.length * 5);
        out.uiEvidence = [...new Set(swingImports.slice(0, 3).map((i) => `import ${i}`))];
        if (!out.primary) {
          out.primary = 'Java Swing';
          out.primaryConfidence = out.uiConfidence;
          out.primaryEvidence = out.uiEvidence;
        }
      }
    }

    // Android
    if (
      !out.primary &&
      (allImports.includes('android.app') ||
        allImports.includes('androidx') ||
        allDeps.includes('com.android'))
    ) {
      out.primary = 'Android';
      out.primaryConfidence = 92;
      out.primaryEvidence = ['android.* imports detected'];
    }

    // Core Java fallback
    if (!out.primary) {
      out.primary = 'Core Java';
      out.primaryConfidence = 85;
      out.primaryEvidence = ['No Spring Boot, JavaFX, Swing, or Android indicators found'];
    }

    // ORM / Data Access
    const hasJpaAnnot = allAnnotations.some((a) =>
      ['Entity', 'Table', 'Document', 'MappedSuperclass'].includes(a)
    );
    const hasJpaImport =
      allImports.includes('javax.persistence') ||
      allImports.includes('jakarta.persistence') ||
      allDeps.includes('spring-data-jpa') ||
      allDeps.includes('hibernate');
    const hasJdbc =
      allImports.includes('java.sql.Connection') ||
      allImports.includes('java.sql.DriverManager') ||
      allImports.includes('java.sql.PreparedStatement');
    const hasMyBatis = allDeps.includes('mybatis') || allImports.includes('org.mybatis');

    if (hasJpaAnnot || hasJpaImport) {
      out.data = 'JPA / Hibernate';
      out.dataConfidence = hasJpaAnnot && hasJpaImport ? 100 : 85;
      out.dataEvidence = [];
      if (hasJpaAnnot) {
        const ef = javaClasses.find((e) => e.annotations.includes('Entity'));
        if (ef) out.dataEvidence.push(`@Entity annotation in ${ef.filename}`);
      }
      if (allImports.includes('javax.persistence'))
        out.dataEvidence.push('import javax.persistence.*');
      if (allImports.includes('jakarta.persistence'))
        out.dataEvidence.push('import jakarta.persistence.*');
      if (allDeps.includes('spring-data-jpa'))
        out.dataEvidence.push('spring-boot-starter-data-jpa in pom.xml');
    } else if (hasMyBatis) {
      out.data = 'MyBatis';
      out.dataConfidence = 88;
      out.dataEvidence = ['mybatis dependency detected'];
    } else if (hasJdbc) {
      out.data = 'JDBC';
      out.dataConfidence = 85;
      out.dataEvidence = ['java.sql imports detected (direct JDBC access)'];
    }
  }

  /* ── Python ── */
  if (pythonEntities.length > 0 && !out.primary) {
    const allI = pythonEntities
      .flatMap((e) => [...e.directImports, ...e.fromImports])
      .map((s) => s.toLowerCase());
    const reqN = reqPackages.map((p) => p.name.toLowerCase());
    const has = (n) => allI.some((i) => i.startsWith(n)) || reqN.some((r) => r.startsWith(n));

    let pyFw = null;
    if (has('django')) {
      pyFw = 'Django';
      out.primaryConfidence = 95;
    } else if (has('fastapi')) {
      pyFw = 'FastAPI';
      out.primaryConfidence = 95;
    } else if (has('flask')) {
      pyFw = 'Flask';
      out.primaryConfidence = 95;
    } else if (has('tornado')) {
      pyFw = 'Tornado';
      out.primaryConfidence = 90;
    } else if (has('streamlit')) {
      pyFw = 'Streamlit';
      out.primaryConfidence = 90;
    } else if (has('pygame')) {
      pyFw = 'Pygame';
      out.primaryConfidence = 92;
    } else if (has('tkinter') || allI.some((i) => i === 'tkinter')) {
      pyFw = 'Python (Tkinter GUI)';
      out.primaryConfidence = 92;
      out.ui = 'Tkinter';
      out.uiConfidence = 95;
    }

    if (pyFw) {
      out.primary = pyFw;
      const ev = [];
      if (allI.some((i) => i.startsWith(pyFw.toLowerCase().split(' ')[0])))
        ev.push(`${pyFw.toLowerCase().split(' ')[0]} import in source code`);
      if (reqN.some((r) => r.startsWith(pyFw.toLowerCase().split(' ')[0])))
        ev.push(`${pyFw} in requirements.txt`);
      out.primaryEvidence = ev;
    }

    // Python ORM
    if (has('sqlalchemy')) {
      out.data = 'SQLAlchemy';
      out.dataConfidence = 95;
      out.dataEvidence = ['sqlalchemy import detected'];
    } else if (has('pymongo') || has('mongoengine')) {
      out.data = 'PyMongo/MongoEngine';
      out.dataConfidence = 92;
      out.dataEvidence = ['pymongo import detected'];
    } else if (has('psycopg') || has('psycopg2')) {
      out.data = 'psycopg2 (PostgreSQL)';
      out.dataConfidence = 92;
      out.dataEvidence = ['psycopg2 import detected'];
    } else if (has('peewee')) {
      out.data = 'Peewee ORM';
      out.dataConfidence = 90;
      out.dataEvidence = ['peewee import detected'];
    }
  }

  /* ── JavaScript / TypeScript ── */
  if (jsModules.length > 0 && !out.primary && pkgJson) {
    const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
    const hasDep = (n) => !!deps[n] || jsModules.some((m) => m.imports.includes(n));

    // Meta-frameworks first
    if (hasDep('next')) {
      out.primary = 'Next.js';
      out.primaryConfidence = 97;
    } else if (hasDep('nuxt') || hasDep('nuxt3')) {
      out.primary = 'Nuxt.js';
      out.primaryConfidence = 97;
    } else if (hasDep('@sveltejs/kit')) {
      out.primary = 'SvelteKit';
      out.primaryConfidence = 97;
    } else if (hasDep('gatsby')) {
      out.primary = 'Gatsby';
      out.primaryConfidence = 97;
    } else if (hasDep('@remix-run/react')) {
      out.primary = 'Remix';
      out.primaryConfidence = 97;
    } else if (hasDep('astro')) {
      out.primary = 'Astro';
      out.primaryConfidence = 97;
    }
    // UI frameworks
    else if (hasDep('react') || hasDep('react-dom')) {
      out.ui = 'React';
      out.uiConfidence = 97;
      out.uiEvidence = ['react in package.json'];
    } else if (hasDep('vue')) {
      out.ui = 'Vue.js';
      out.uiConfidence = 97;
      out.uiEvidence = ['vue in package.json'];
    } else if (hasDep('@angular/core')) {
      out.ui = 'Angular';
      out.uiConfidence = 97;
      out.uiEvidence = ['@angular/core in package.json'];
    } else if (hasDep('svelte')) {
      out.ui = 'Svelte';
      out.uiConfidence = 97;
      out.uiEvidence = ['svelte in package.json'];
    }

    // Backend frameworks
    if (!out.primary) {
      if (hasDep('@nestjs/core')) {
        out.primary = 'NestJS';
        out.primaryConfidence = 97;
      } else if (hasDep('express')) {
        out.primary = 'Express.js';
        out.primaryConfidence = 95;
      } else if (hasDep('fastify')) {
        out.primary = 'Fastify';
        out.primaryConfidence = 95;
      } else if (hasDep('koa')) {
        out.primary = 'Koa.js';
        out.primaryConfidence = 95;
      } else if (hasDep('hono')) {
        out.primary = 'Hono';
        out.primaryConfidence = 95;
      } else if (out.ui) {
        out.primary = out.ui;
        out.primaryConfidence = out.uiConfidence;
      }
    }
    if (out.primary) {
      out.primaryEvidence = [`${out.primary} found in package.json dependencies`];
    }

    // JS ORM
    if (!out.data) {
      if (hasDep('@prisma/client') || hasDep('prisma')) {
        out.data = 'Prisma';
        out.dataConfidence = 97;
        out.dataEvidence = ['@prisma/client in package.json'];
      } else if (hasDep('mongoose')) {
        out.data = 'Mongoose';
        out.dataConfidence = 97;
        out.dataEvidence = ['mongoose in package.json'];
      } else if (hasDep('sequelize')) {
        out.data = 'Sequelize';
        out.dataConfidence = 97;
        out.dataEvidence = ['sequelize in package.json'];
      } else if (hasDep('typeorm')) {
        out.data = 'TypeORM';
        out.dataConfidence = 97;
        out.dataEvidence = ['typeorm in package.json'];
      } else if (hasDep('drizzle-orm')) {
        out.data = 'Drizzle ORM';
        out.dataConfidence = 97;
        out.dataEvidence = ['drizzle-orm in package.json'];
      }
    }
  }

  return out;
}

/* ══════════════════════════════════════════════════════════
   DATABASE DETECTION
══════════════════════════════════════════════════════════ */

function detectDatabase(
  javaClasses,
  pythonEntities,
  jsModules,
  appProps,
  appYml,
  pomData,
  gradleData,
  pkgJson,
  reqPackages
) {
  const r = {
    type: null,
    confidence: 0,
    evidence: [],
    orm: null,
    ormEvidence: [],
    ormConfidence: 0,
  };

  // 1. Connection strings in config files (100% confidence)
  const dsUrl = appProps?.datasourceUrl || appYml?.datasourceUrl;
  if (dsUrl) {
    const url = dsUrl.toLowerCase();
    const DB_URL_MAP = [
      ['mysql', 'MySQL'],
      ['mariadb', 'MariaDB'],
      ['postgresql', 'PostgreSQL'],
      ['postgres', 'PostgreSQL'],
      [':h2:', 'H2 (In-Memory)'],
      ['oracle', 'Oracle DB'],
      ['sqlserver', 'Microsoft SQL Server'],
      ['mssql', 'Microsoft SQL Server'],
      ['sqlite', 'SQLite'],
      ['mongodb', 'MongoDB'],
      ['redis', 'Redis'],
    ];
    for (const [kw, name] of DB_URL_MAP) {
      if (url.includes(kw)) {
        r.type = name;
        r.confidence = 100;
        r.evidence.push(`spring.datasource.url = ${dsUrl.replace(/:[^:@]+@/, ':***@')}`);
        break;
      }
    }
  }

  // 2. pom.xml artifact IDs (90% confidence)
  if (!r.type && pomData) {
    const artifactStr = (pomData.dependencies || [])
      .map((d) => d.artifactId || '')
      .join(' ')
      .toLowerCase();
    const groupStr = (pomData.dependencies || [])
      .map((d) => d.groupId || '')
      .join(' ')
      .toLowerCase();
    const full = artifactStr + ' ' + groupStr;

    const POM_DB_MAP = [
      ['mysql-connector', 'MySQL'],
      ['postgresql', 'PostgreSQL'],
      ['mariadb', 'MariaDB'],
      [':h2', 'H2 (In-Memory)'],
      ['sqlite', 'SQLite'],
      ['ojdbc', 'Oracle DB'],
      ['mssql', 'Microsoft SQL Server'],
      ['sqlserver', 'Microsoft SQL Server'],
      ['data-mongodb', 'MongoDB'],
      ['mongodb-driver', 'MongoDB'],
      ['data-redis', 'Redis'],
      ['jedis', 'Redis'],
      ['cassandra', 'Cassandra'],
    ];
    for (const [kw, name] of POM_DB_MAP) {
      if (full.includes(kw)) {
        r.type = name;
        r.confidence = 90;
        r.evidence.push(`${kw} dependency detected in pom.xml`);
        break;
      }
    }
  }

  // 3. build.gradle dependencies (88%)
  if (!r.type && gradleData) {
    const deps = (gradleData.dependencies || []).join(' ').toLowerCase();
    const GRADLE_DB_MAP = [
      ['mysql', 'MySQL'],
      ['postgres', 'PostgreSQL'],
      ['mariadb', 'MariaDB'],
      ['mongodb', 'MongoDB'],
      ['redis', 'Redis'],
      ['h2', 'H2 (In-Memory)'],
      ['sqlite', 'SQLite'],
      ['oracle', 'Oracle DB'],
    ];
    for (const [kw, name] of GRADLE_DB_MAP) {
      if (deps.includes(kw)) {
        r.type = name;
        r.confidence = 88;
        r.evidence.push(`${kw} dependency in build.gradle`);
        break;
      }
    }
  }

  // 4. requirements.txt (90%)
  if (!r.type && reqPackages.length > 0) {
    const names = reqPackages.map((p) => p.name.toLowerCase()).join(' ');
    const REQ_DB_MAP = [
      ['psycopg', 'PostgreSQL'],
      ['pg8000', 'PostgreSQL'],
      ['pymysql', 'MySQL'],
      ['mysqlclient', 'MySQL'],
      ['pymongo', 'MongoDB'],
      ['mongoengine', 'MongoDB'],
      ['redis', 'Redis'],
      ['aioredis', 'Redis'],
      ['sqlite', 'SQLite'],
      ['aiosqlite', 'SQLite'],
      ['cx-oracle', 'Oracle DB'],
      ['pyodbc', 'MS SQL Server'],
      ['motor', 'MongoDB'],
      ['cassandra', 'Cassandra'],
    ];
    for (const [kw, name] of REQ_DB_MAP) {
      if (names.includes(kw)) {
        r.type = name;
        r.confidence = 90;
        r.evidence.push(`${kw} in requirements.txt`);
        break;
      }
    }
  }

  // 5. package.json (90%)
  if (!r.type && pkgJson) {
    const deps = Object.keys({
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
    })
      .join(' ')
      .toLowerCase();
    const PKG_DB_MAP = [
      ['mongoose', 'MongoDB'],
      ['mongodb', 'MongoDB'],
      ['pg', 'PostgreSQL'],
      ['mysql2', 'MySQL'],
      ['mysql', 'MySQL'],
      ['sqlite3', 'SQLite'],
      ['better-sqlite3', 'SQLite'],
      ['ioredis', 'Redis'],
      ['redis', 'Redis'],
      ['@supabase', 'PostgreSQL (Supabase)'],
      ['firebase-admin', 'Firebase (Firestore)'],
      ['dynamoose', 'DynamoDB'],
      ['cassandra-driver', 'Cassandra'],
    ];
    for (const [kw, name] of PKG_DB_MAP) {
      if (deps.includes(kw)) {
        r.type = name;
        r.confidence = 90;
        r.evidence.push(`${kw} in package.json`);
        break;
      }
    }
  }

  // 6. Java JDBC imports (70% — low confidence fallback)
  if (!r.type && javaClasses.length > 0) {
    const allImports = javaClasses
      .flatMap((e) => e.imports)
      .join(' ')
      .toLowerCase();
    const JDBC_MAP = [
      ['mysql', 'MySQL'],
      ['postgres', 'PostgreSQL'],
      ['oracle', 'Oracle DB'],
      ['sqlite', 'SQLite'],
      ['mariadb', 'MariaDB'],
    ];
    for (const [kw, name] of JDBC_MAP) {
      if (allImports.includes(kw)) {
        r.type = name;
        r.confidence = 70;
        r.evidence.push(`${kw} class imported in Java source`);
        break;
      }
    }
  }

  // ORM Detection (separate from DB type detection)
  if (javaClasses.length > 0) {
    const anns = javaClasses.flatMap((e) => e.annotations).join(' ');
    const imps = javaClasses.flatMap((e) => e.imports).join(' ');
    const pomDepStr = (pomData?.dependencies || [])
      .map((d) => d.artifactId || '')
      .join(' ')
      .toLowerCase();

    if (
      anns.includes('Entity') ||
      imps.includes('javax.persistence') ||
      imps.includes('jakarta.persistence') ||
      pomDepStr.includes('data-jpa') ||
      pomDepStr.includes('hibernate')
    ) {
      r.orm = 'JPA / Hibernate';
      r.ormConfidence = anns.includes('Entity') ? 98 : 85;
      r.ormEvidence = [];
      if (anns.includes('Entity'))
        r.ormEvidence.push(
          `@Entity annotation found in ${javaClasses.find((e) => e.annotations.includes('Entity'))?.filename}`
        );
      if (imps.includes('javax.persistence')) r.ormEvidence.push('import javax.persistence');
      if (imps.includes('jakarta.persistence')) r.ormEvidence.push('import jakarta.persistence');
      if (pomDepStr.includes('data-jpa'))
        r.ormEvidence.push('spring-boot-starter-data-jpa in pom.xml');
    }
  }
  if (!r.orm && pkgJson) {
    const deps = Object.keys({
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
    });
    const ORM_MAP = [
      ['@prisma/client', 'Prisma'],
      ['mongoose', 'Mongoose'],
      ['sequelize', 'Sequelize'],
      ['typeorm', 'TypeORM'],
      ['drizzle-orm', 'Drizzle ORM'],
    ];
    for (const [pkg, name] of ORM_MAP) {
      if (deps.includes(pkg)) {
        r.orm = name;
        r.ormConfidence = 97;
        r.ormEvidence = [`${pkg} in package.json`];
        break;
      }
    }
  }

  return r;
}

/* ══════════════════════════════════════════════════════════
   AUTHENTICATION DETECTION
══════════════════════════════════════════════════════════ */

function detectAuthentication(javaClasses, pkgJson, pomData, gradleData, reqPackages) {
  const anns = javaClasses.flatMap((e) => e.annotations);
  const imps = javaClasses
    .flatMap((e) => e.imports)
    .join(' ')
    .toLowerCase();
  const pomDeps =
    (pomData?.dependencies || [])
      .map((d) => d.artifactId || '')
      .join(' ')
      .toLowerCase() +
    ' ' +
    (pomData?.dependencies || [])
      .map((d) => d.groupId || '')
      .join(' ')
      .toLowerCase();
  const gradleDeps = (gradleData?.dependencies || []).join(' ').toLowerCase();
  const allJavaDeps = pomDeps + ' ' + gradleDeps;
  const pkgDeps = Object.keys({
    ...(pkgJson?.dependencies || {}),
    ...(pkgJson?.devDependencies || {}),
  });
  const reqNames = reqPackages.map((p) => p.name.toLowerCase());

  // Spring Security
  if (
    allJavaDeps.includes('spring-security') ||
    anns.includes('EnableWebSecurity') ||
    anns.includes('PreAuthorize') ||
    anns.includes('Secured')
  ) {
    const ev = [];
    if (anns.includes('EnableWebSecurity')) ev.push('@EnableWebSecurity annotation found');
    if (anns.includes('PreAuthorize')) ev.push('@PreAuthorize annotation found');
    if (allJavaDeps.includes('spring-security')) ev.push('spring-security dependency in pom.xml');
    return { name: 'Spring Security', confidence: 95, evidence: ev };
  }
  // Java JWT
  if (
    allJavaDeps.includes('jjwt') ||
    allJavaDeps.includes('java-jwt') ||
    imps.includes('io.jsonwebtoken')
  ) {
    return { name: 'JWT (jjwt)', confidence: 90, evidence: ['jjwt dependency detected'] };
  }
  // Shiro
  if (allJavaDeps.includes('shiro')) {
    return { name: 'Apache Shiro', confidence: 90, evidence: ['shiro dependency detected'] };
  }
  // JS/TS auth
  const JS_AUTH_MAP = [
    ['next-auth', 'NextAuth.js'],
    ['@auth/core', 'NextAuth.js (Auth.js)'],
    ['@clerk/nextjs', 'Clerk'],
    ['@clerk/clerk-react', 'Clerk'],
    ['passport', 'Passport.js'],
    ['jsonwebtoken', 'JWT'],
    ['jose', 'JWT (jose)'],
    ['firebase-admin', 'Firebase Auth'],
    ['@supabase/supabase-js', 'Supabase Auth'],
    ['lucia', 'Lucia Auth'],
    ['better-auth', 'Better Auth'],
  ];
  for (const [pkg, name] of JS_AUTH_MAP) {
    if (pkgDeps.includes(pkg))
      return { name, confidence: 95, evidence: [`${pkg} in package.json`] };
  }
  // Auth0 (namespaced)
  if (pkgDeps.some((d) => d.startsWith('@auth0/')))
    return { name: 'Auth0', confidence: 95, evidence: ['@auth0/* in package.json'] };
  // Python auth
  if (reqNames.some((r) => r.includes('pyjwt') || r.includes('python-jose')))
    return { name: 'JWT (PyJWT)', confidence: 88, evidence: ['PyJWT in requirements.txt'] };
  if (reqNames.some((r) => r.includes('django-allauth')))
    return {
      name: 'Django AllAuth',
      confidence: 90,
      evidence: ['django-allauth in requirements.txt'],
    };
  if (reqNames.some((r) => r.includes('simplejwt')))
    return {
      name: 'Django Simple JWT',
      confidence: 90,
      evidence: ['djangorestframework-simplejwt in requirements.txt'],
    };
  if (reqNames.some((r) => r.includes('flask-login')))
    return { name: 'Flask-Login', confidence: 90, evidence: ['Flask-Login in requirements.txt'] };

  return { name: null, confidence: 0, evidence: [] };
}

/* ══════════════════════════════════════════════════════════
   TEST FRAMEWORK DETECTION
══════════════════════════════════════════════════════════ */

function detectTestFramework(javaClasses, pkgJson, pomData, gradleData, reqPackages) {
  const anns = javaClasses.flatMap((e) => e.annotations);
  const imps = javaClasses.flatMap((e) => e.imports).join(' ');
  const pomDeps = (pomData?.dependencies || [])
    .map((d) => d.artifactId || '')
    .join(' ')
    .toLowerCase();
  const gradleDeps = (gradleData?.dependencies || []).join(' ').toLowerCase();
  const allJavaDeps = pomDeps + ' ' + gradleDeps;
  const pkgDeps = Object.keys({
    ...(pkgJson?.devDependencies || {}),
    ...(pkgJson?.dependencies || {}),
  });
  const reqNames = reqPackages.map((p) => p.name.toLowerCase());

  // Java
  if (allJavaDeps.includes('junit-jupiter') || allJavaDeps.includes('junit5'))
    return { name: 'JUnit 5', confidence: 97, evidence: ['junit-jupiter dependency'] };
  if (allJavaDeps.includes('testng'))
    return { name: 'TestNG', confidence: 97, evidence: ['testng dependency'] };
  if (allJavaDeps.includes('junit') && !allJavaDeps.includes('junit-jupiter')) {
    if (imps.includes('org.junit.jupiter'))
      return { name: 'JUnit 5', confidence: 92, evidence: ['@Test from JUnit 5 imports'] };
    return { name: 'JUnit 4', confidence: 90, evidence: ['junit dependency in pom.xml'] };
  }
  // Detect from @Test annotation + imports
  if (anns.includes('Test')) {
    if (imps.includes('org.junit.jupiter'))
      return { name: 'JUnit 5', confidence: 88, evidence: ['@Test + JUnit 5 import'] };
    if (imps.includes('org.testng'))
      return { name: 'TestNG', confidence: 88, evidence: ['@Test + TestNG import'] };
    return { name: 'JUnit', confidence: 70, evidence: ['@Test annotation found'] };
  }

  // JavaScript
  const JS_TEST_MAP = [
    ['vitest', 'Vitest'],
    ['jest', 'Jest'],
    ['@jest/core', 'Jest'],
    ['@playwright/test', 'Playwright'],
    ['playwright', 'Playwright'],
    ['cypress', 'Cypress'],
    ['mocha', 'Mocha'],
    ['jasmine', 'Jasmine'],
    ['@testing-library/jest-dom', 'Testing Library'],
  ];
  for (const [pkg, name] of JS_TEST_MAP) {
    if (pkgDeps.includes(pkg))
      return { name, confidence: 95, evidence: [`${pkg} in package.json`] };
  }

  // Python
  if (reqNames.some((r) => r.includes('pytest')))
    return { name: 'pytest', confidence: 95, evidence: ['pytest in requirements.txt'] };
  if (reqNames.some((r) => r.includes('unittest')))
    return { name: 'unittest', confidence: 90, evidence: ['unittest in requirements.txt'] };

  return { name: null, confidence: 0, evidence: [] };
}

/* ══════════════════════════════════════════════════════════
   FEATURE EXTRACTION (from actual class/entity names)
══════════════════════════════════════════════════════════ */

function extractFeatures(javaClasses, pythonEntities, jsModules, sqlData) {
  const map = new Map(); // entityName → { name, classes, types, evidence, methods }

  // ── Java ──
  for (const cls of javaClasses) {
    if (!cls.className) continue;

    let entityName = cls.className;
    let layerType = null;

    // Strip suffix to get entity name
    for (const suffix of JAVA_ENTITY_SUFFIXES) {
      if (cls.className.endsWith(suffix) && cls.className.length > suffix.length + 1) {
        entityName = cls.className.slice(0, -suffix.length);
        layerType = suffix.toLowerCase();
        break;
      }
    }

    // Override with annotations (more reliable)
    if (cls.annotations.some((a) => ['RestController', 'Controller'].includes(a)))
      layerType = 'controller';
    if (cls.annotations.includes('Service')) layerType = 'service';
    if (cls.annotations.includes('Repository')) layerType = 'repository';
    if (cls.annotations.some((a) => ['Entity', 'Table', 'Document'].includes(a))) {
      layerType = 'entity';
      entityName = cls.className;
    }

    if (SKIP_ENTITY_NAMES.has(entityName) || entityName.length < 2) continue;

    if (!map.has(entityName))
      map.set(entityName, {
        name: entityName,
        classes: [],
        types: new Set(),
        evidence: [],
        methods: [],
      });
    const entry = map.get(entityName);
    entry.classes.push(cls.filename);
    if (layerType) entry.types.add(layerType);
    entry.evidence.push(cls.filepath);
    entry.methods.push(...(cls.methods || []).slice(0, 4));
  }

  // ── Python classes ──
  for (const pyf of pythonEntities) {
    for (const cls of pyf.classes) {
      if (cls.length < 3) continue;
      let entityName = cls;
      for (const suffix of [
        'View',
        'ViewSet',
        'APIView',
        'Serializer',
        'Form',
        'Filter',
        'Admin',
        'Model',
        'Manager',
        'Schema',
      ]) {
        if (cls.endsWith(suffix) && cls.length > suffix.length + 1) {
          entityName = cls.slice(0, -suffix.length);
          break;
        }
      }
      if (SKIP_ENTITY_NAMES.has(entityName) || entityName.length < 2) continue;
      if (!map.has(entityName))
        map.set(entityName, {
          name: entityName,
          classes: [],
          types: new Set(),
          evidence: [],
          methods: [],
        });
      const entry = map.get(entityName);
      entry.classes.push(cls);
      entry.types.add('python-class');
      entry.evidence.push(pyf.filepath);
    }
  }

  // ── SQL tables ──
  for (const sqlF of sqlData) {
    for (const table of sqlF.tables || []) {
      const entityName = table.replace(/_/g, '').replace(/s$/, ''); // rough singular camel
      const displayName = table
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/s$/, '');
      if (SKIP_ENTITY_NAMES.has(displayName)) continue;
      if (!map.has(displayName))
        map.set(displayName, {
          name: displayName,
          classes: [],
          types: new Set(),
          evidence: [],
          methods: [],
        });
      const entry = map.get(displayName);
      entry.classes.push(`${table} (table)`);
      entry.types.add('database-table');
      entry.evidence.push(`SQL table: ${table} in ${sqlF.filename}`);
    }
  }

  // Convert to feature array with confidence scores
  const features = [];
  for (const [, data] of map.entries()) {
    const types = [...data.types];
    const count = data.classes.length;

    let confidence = 55;
    if (count >= 3) confidence = 95;
    else if (count === 2) confidence = 82;
    else confidence = 68;

    const hasController = types.some((t) => t.includes('controller'));
    const hasService = types.some((t) => t.includes('service'));
    const hasEntity = types.some((t) => ['entity', 'database-table'].includes(t));
    if (hasController && (hasService || hasEntity)) confidence = Math.min(99, confidence + 12);
    if (hasEntity) confidence = Math.max(confidence, 78);

    const featureName = `${data.name} Management`;

    features.push({
      name: featureName,
      entityName: data.name,
      classes: [...new Set(data.classes)],
      types,
      evidence: [...new Set(data.evidence)],
      confidence,
      methodExamples: [...new Set(data.methods)].slice(0, 3),
    });
  }

  return features.sort((a, b) => b.confidence - a.confidence);
}

/* ══════════════════════════════════════════════════════════
   ARCHITECTURE DETECTION
══════════════════════════════════════════════════════════ */

function detectArchitecture(javaClasses) {
  const r = {
    pattern: null,
    patternConfidence: 0,
    patternEvidence: [],
    layers: {
      controllers: [],
      services: [],
      repositories: [],
      entities: [],
      configs: [],
      components: [],
    },
    packages: [],
    entryPoint: null,
    entryPointFile: null,
    entryPointConfidence: 0,
  };

  if (!javaClasses.length) return r;

  r.layers.controllers = javaClasses.filter(
    (e) =>
      e.annotations.some((a) => ['RestController', 'Controller'].includes(a)) ||
      e.className?.endsWith('Controller')
  );
  r.layers.services = javaClasses.filter(
    (e) =>
      e.annotations.includes('Service') ||
      e.className?.endsWith('Service') ||
      e.className?.endsWith('ServiceImpl')
  );
  r.layers.repositories = javaClasses.filter(
    (e) =>
      e.annotations.includes('Repository') ||
      e.className?.endsWith('Repository') ||
      e.className?.endsWith('DAO') ||
      e.className?.endsWith('DAOImpl')
  );
  r.layers.entities = javaClasses.filter((e) =>
    e.annotations.some((a) => ['Entity', 'Table', 'Document', 'MappedSuperclass'].includes(a))
  );
  r.layers.configs = javaClasses.filter(
    (e) =>
      e.annotations.includes('Configuration') ||
      e.className?.endsWith('Config') ||
      e.className?.endsWith('Configuration')
  );
  r.layers.components = javaClasses.filter(
    (e) =>
      e.annotations.includes('Component') &&
      !r.layers.controllers.includes(e) &&
      !r.layers.services.includes(e)
  );

  const C = r.layers.controllers.length;
  const S = r.layers.services.length;
  const R = r.layers.repositories.length;
  const E = r.layers.entities.length;

  if (C > 0 && S > 0 && R > 0) {
    r.pattern = 'Layered Architecture (Controller → Service → Repository)';
    r.patternConfidence = 95;
    r.patternEvidence = [
      `${C} Controller(s): ${r.layers.controllers
        .slice(0, 3)
        .map((c) => c.filename)
        .join(', ')}`,
      `${S} Service(s): ${r.layers.services
        .slice(0, 3)
        .map((s) => s.filename)
        .join(', ')}`,
      `${R} Repository/DAO(s): ${r.layers.repositories
        .slice(0, 3)
        .map((x) => x.filename)
        .join(', ')}`,
    ];
  } else if (C > 0 && S > 0) {
    r.pattern = 'MVC with Service Layer';
    r.patternConfidence = 82;
    r.patternEvidence = [`${C} Controller(s)`, `${S} Service(s)`];
  } else if (E > 0 && R > 0) {
    r.pattern = 'Repository Pattern';
    r.patternConfidence = 78;
    r.patternEvidence = [`${E} Entity class(es)`, `${R} Repository class(es)`];
  } else if (C > 0) {
    r.pattern = 'Controller-based (MVC)';
    r.patternConfidence = 70;
    r.patternEvidence = [`${C} Controller class(es)`];
  }

  // Entry point
  const springMain = javaClasses.find((e) => e.annotations.includes('SpringBootApplication'));
  const mainMethod = javaClasses.find((e) => e.isMainClass);
  const ep = springMain || mainMethod;
  if (ep) {
    r.entryPoint = ep.packageName ? `${ep.packageName}.${ep.className}` : ep.className;
    r.entryPointFile = ep.filepath;
    r.entryPointConfidence = springMain ? 100 : 95;
  }

  r.packages = [...new Set(javaClasses.map((e) => e.packageName).filter(Boolean))].sort();

  return r;
}

/* ══════════════════════════════════════════════════════════
   DESIGN PATTERN DETECTION
══════════════════════════════════════════════════════════ */

function detectDesignPatterns(javaClasses) {
  const patterns = [];
  const names = javaClasses.map((e) => e.className).filter(Boolean);
  const anns = javaClasses.flatMap((e) => e.annotations);

  const check = (suffix, label) => {
    const matches = names.filter((n) => n.endsWith(suffix));
    if (matches.length > 0) patterns.push({ name: label, evidence: matches });
  };

  check('Factory', 'Factory Pattern');
  check('Builder', 'Builder Pattern');
  check('Observer', 'Observer Pattern');
  check('Listener', 'Listener / Observer Pattern');
  check('Strategy', 'Strategy Pattern');
  check('Decorator', 'Decorator Pattern');
  check('Adapter', 'Adapter Pattern');
  check('Proxy', 'Proxy Pattern');
  check('Command', 'Command Pattern');
  check('Template', 'Template Method Pattern');
  check('Singleton', 'Singleton Pattern');
  check('Facade', 'Facade Pattern');
  check('Mediator', 'Mediator Pattern');
  check('Repository', 'Repository Pattern');

  if (anns.includes('Scheduled'))
    patterns.push({ name: 'Scheduler Pattern', evidence: ['@Scheduled annotation'] });
  if (anns.includes('EventListener'))
    patterns.push({ name: 'Event-Driven Pattern', evidence: ['@EventListener annotation'] });
  if (anns.includes('Async'))
    patterns.push({ name: 'Asynchronous Processing', evidence: ['@Async annotation'] });
  if (anns.includes('Cacheable'))
    patterns.push({ name: 'Cache-Aside Pattern', evidence: ['@Cacheable annotation'] });
  if (anns.includes('Transactional'))
    patterns.push({
      name: 'Unit of Work (Transactional)',
      evidence: ['@Transactional annotation'],
    });

  // Deduplicate
  const seen = new Set();
  return patterns.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

/* ══════════════════════════════════════════════════════════
   API ROUTE COLLECTOR
══════════════════════════════════════════════════════════ */

function collectApiRoutes(javaClasses, pythonEntities, jsModules) {
  const routes = [];

  // Java (Spring annotations)
  for (const cls of javaClasses) {
    if (!cls.routeMappings.length) continue;
    const base = cls.baseMapping || '';
    for (const m of cls.routeMappings) {
      const method = m.annotation.replace('Mapping', '').replace('Request', 'HTTP').toUpperCase();
      const fullPath = (base + '/' + m.path).replace(/\/+/g, '/');
      routes.push({
        method: method === 'HTTP' ? 'ANY' : method,
        path: fullPath || '/',
        file: cls.filepath,
        handler: cls.className,
        evidence: `@${m.annotation} in ${cls.filename}`,
      });
    }
  }

  // Python
  for (const pyf of pythonEntities) {
    for (const route of pyf.routes) {
      routes.push({
        method: 'HTTP',
        path: route,
        file: pyf.filepath,
        handler: pyf.filename,
        evidence: `Route in ${pyf.filename}`,
      });
    }
  }

  // Express/Node.js
  for (const jsm of jsModules) {
    for (const route of jsm.routes) {
      routes.push({
        method: route.method,
        path: route.path,
        file: jsm.filepath,
        handler: jsm.filename,
        evidence: `${route.method} route in ${jsm.filename}`,
      });
    }
  }

  return routes.slice(0, 35);
}

/* ══════════════════════════════════════════════════════════
   FOLDER TREE  (skip generated dirs)
══════════════════════════════════════════════════════════ */

function buildFolderTree(files) {
  const root = { name: 'root', type: 'dir', children: [], path: '' };
  for (const file of files) {
    const parts = (file.path || '')
      .replace(/\\/g, '/')
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean);
    if (parts.some((p) => IGNORE_DIRS.has(p))) continue;
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      let dir = cur.children.find((c) => c.name === parts[i] && c.type === 'dir');
      if (!dir) {
        dir = { name: parts[i], type: 'dir', children: [], path: parts.slice(0, i + 1).join('/') };
        cur.children.push(dir);
      }
      cur = dir;
    }
    const fname = parts[parts.length - 1];
    if (fname && !cur.children.find((c) => c.name === fname && c.type === 'file')) {
      cur.children.push({
        name: fname,
        type: 'file',
        size: file.size || 0,
        ext: getExt(fname),
        path: file.path,
        lineCount: file.content ? countLines(file.content) : null,
      });
    }
  }
  return root;
}

/* ══════════════════════════════════════════════════════════
   QUALITY SCORES (evidence-based)
══════════════════════════════════════════════════════════ */

function calculateScores(a) {
  let q = 10,
    h = 20;

  // Documentation quality
  if (a.hasReadme) q += 15;
  if (a.hasLicense) q += 10;
  if (a.hasContributing) q += 8;
  if (a.hasGitignore) q += 5;
  if (a.description) q += 10;
  if (a.author) q += 5;
  if (a.version) q += 4;
  if (a.apiRoutes.length > 0) q += 8;
  if (a.envVars.length > 0) q += 5;
  if (a.hasEnvFile) q += 6;
  if (a.architecture?.pattern) q += 10;

  // Health
  if (a.hasGitignore) h += 8;
  if (a.hasDocker) h += 10;
  if (a.hasCI) h += 12;
  if (a.hasTests) h += 15;
  if (a.detectedTest.name) h += 5;
  if (a.hasEnvFile) h += 5;
  if (a.hasLicense) h += 5;
  if (a.detectedDatabase.type) h += 5;
  if (a.architecture?.pattern) h += 5;
  if (a.detectedFramework.data) h += 5;

  return { qualityScore: Math.min(q, 100), healthScore: Math.min(h, 100) };
}

/* ══════════════════════════════════════════════════════════
   SECURITY SCAN (basic)
══════════════════════════════════════════════════════════ */

function scanSecurityIssues(files) {
  const issues = [];
  const HARDCODED_PATTERNS = [
    { rx: /password\s*[:=]\s*["']([^"']{6,})["']/gi, label: 'Hardcoded password' },
    { rx: /api[_-]?key\s*[:=]\s*["']([A-Za-z0-9_\-]{10,})["']/gi, label: 'Hardcoded API key' },
    { rx: /secret\s*[:=]\s*["']([^"']{8,})["']/gi, label: 'Hardcoded secret' },
  ];
  const IGNORE_VALUES = new Set([
    'your_password_here',
    'changeme',
    'yourpassword',
    'secret',
    'password',
    'example',
    'placeholder',
    'xxxxxxxxxx',
    'your_secret_here',
  ]);

  for (const f of files.filter(
    (f) => f.content && !f.name.includes('.example') && !f.name.includes('.sample')
  )) {
    for (const { rx, label } of HARDCODED_PATTERNS) {
      const localRx = new RegExp(rx.source, rx.flags);
      let m;
      while ((m = localRx.exec(f.content)) !== null) {
        const val = (m[1] || '').toLowerCase();
        if (
          !IGNORE_VALUES.has(val) &&
          val !== '' &&
          !/\$\{/.test(m[0]) &&
          !/process\.env/.test(f.content.slice(Math.max(0, m.index - 20), m.index + 40))
        ) {
          issues.push({ file: f.path, label, value: m[0].slice(0, 60) });
          break; // one per file
        }
      }
    }
  }
  return issues;
}

/* ══════════════════════════════════════════════════════════
   MAIN ANALYSIS FUNCTION
══════════════════════════════════════════════════════════ */

function analyzeProject(files) {
  /* ── 1. Filter out ignored dirs ── */
  const filtered = files.filter((f) => !isIgnored(f.path || ''));

  /* ── 2. Partition by type ── */
  const javaFiles = filtered.filter((f) => getExt(f.name) === '.java' && f.content);
  const pythonFiles = filtered.filter((f) => getExt(f.name) === '.py' && f.content);
  const jsFiles = filtered.filter(
    (f) =>
      ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.cts', '.mts'].includes(getExt(f.name)) &&
      f.content
  );
  const sqlFiles = filtered.filter((f) => getExt(f.name) === '.sql' && f.content);

  /* ── 3. Parse config files ── */
  const pomFile = filtered.find((f) => f.name === 'pom.xml');
  const gradleFile = filtered.find(
    (f) => f.name === 'build.gradle' || f.name === 'build.gradle.kts'
  );
  const pkgFile = filtered.find(
    (f) => f.name === 'package.json' && !f.path.includes('node_modules')
  );
  const reqFile = filtered.find((f) => f.name === 'requirements.txt');
  const appPropFile = filtered.find((f) => f.name === 'application.properties');
  const appYmlFile = filtered.find(
    (f) => f.name === 'application.yml' || f.name === 'application.yaml'
  );
  const envFile = filtered.find((f) =>
    ['.env', '.env.example', '.env.sample', '.env.template', '.env.local'].includes(f.name)
  );
  // New config files
  const cargoFile = filtered.find(
    (f) => f.name === 'Cargo.toml' || (f.name === 'Cargo.toml' && f.content)
  );
  const goModFile = filtered.find((f) => f.name === 'go.mod' && f.content);
  const pyprojectFile = filtered.find((f) => f.name === 'pyproject.toml' && f.content);
  const readmeFile = filtered.find(
    (f) =>
      ['readme.md', 'readme.rst', 'readme.txt', 'readme'].includes(f.name.toLowerCase()) &&
      f.content
  );

  const pomData = parsePomXml(pomFile?.content);
  const gradleData = parseBuildGradle(gradleFile?.content);
  const pkgJson = pkgFile
    ? (() => {
        try {
          return JSON.parse(pkgFile.content);
        } catch {
          return null;
        }
      })()
    : null;
  const reqPkgs = parseRequirementsTxt(reqFile?.content);
  const appProps = parseApplicationProperties(appPropFile?.content);
  const appYml = parseApplicationYml(appYmlFile?.content);
  const envVarsRaw = parseEnvFile(envFile?.content || '');
  const cargoData = parseCargoToml(cargoFile?.content);
  const goModData = parseGoMod(goModFile?.content);
  const pyprojectData = parsePyprojectToml(pyprojectFile?.content);

  /* ── 3b. Extract description from existing README ── */
  let readmeDescription = null;
  if (readmeFile?.content) {
    const lines = readmeFile.content.split('\n');
    // Skip the title line (# ...) and any badge lines, find the first real paragraph
    let inContent = false;
    for (const line of lines) {
      const t = line.trim();
      if (!t) {
        inContent = false;
        continue;
      }
      // Skip headings, badges, html tags, horizontal rules, toc
      if (t.startsWith('#')) {
        inContent = false;
        continue;
      }
      if (t.startsWith('![') || t.startsWith('<') || t.startsWith('---') || t.startsWith('==='))
        continue;
      if (t.startsWith('>') && t.includes('shields.io')) continue;
      // First meaningful line is the description
      if (t.length > 20 && !t.startsWith('|') && !t.startsWith('-') && !t.startsWith('*')) {
        readmeDescription = t.replace(/[`*_~]/g, '').trim();
        if (readmeDescription.length > 15) break;
        readmeDescription = null;
      }
    }
  }

  /* ── 4. Scan sources for env var references ── */
  const envSet = new Set(envVarsRaw);
  const goFiles = filtered.filter((f) => getExt(f.name) === '.go' && f.content);
  const rustFiles = filtered.filter((f) => getExt(f.name) === '.rs' && f.content);
  for (const f of [...javaFiles, ...pythonFiles, ...jsFiles, ...goFiles, ...rustFiles].slice(
    0,
    50
  )) {
    if (!f.content) continue;
    for (const m of f.content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)) envSet.add(m[1]);
    for (const m of f.content.matchAll(/System\.getenv\s*\(\s*["']([^"']+)["']\s*\)/g))
      envSet.add(m[1]);
    for (const m of f.content.matchAll(/os\.environ(?:\.get)?\s*\(\s*["']([^"']+)["']/g))
      envSet.add(m[1]);
    for (const m of f.content.matchAll(/env!\s*\(\s*"([^"]+)"\s*\)/g)) envSet.add(m[1]); // Rust env!()
    for (const m of f.content.matchAll(/os\.Getenv\s*\(\s*"([^"]+)"\s*\)/g)) envSet.add(m[1]); // Go os.Getenv()
  }
  const envVars = [...envSet].slice(0, 30);

  /* ── 5. Deep source analysis ── */
  const javaClasses = javaFiles
    .slice(0, 120)
    .map((f) => analyzeJavaFile(f.content, f.path))
    .filter(Boolean);
  const pythonEntities = pythonFiles
    .slice(0, 80)
    .map((f) => analyzePythonFile(f.content, f.path))
    .filter(Boolean);
  const jsModules = jsFiles
    .slice(0, 80)
    .map((f) => analyzeJSFile(f.content, f.path))
    .filter(Boolean);
  const sqlData = sqlFiles.map((f) => analyzeSqlFile(f.content, f.path)).filter(Boolean);

  /* ── 6. Detections ── */
  const detectedFramework = detectFramework(
    javaClasses,
    pythonEntities,
    jsModules,
    pomData,
    gradleData,
    pkgJson,
    reqPkgs
  );
  const detectedDatabase = detectDatabase(
    javaClasses,
    pythonEntities,
    jsModules,
    appProps,
    appYml,
    pomData,
    gradleData,
    pkgJson,
    reqPkgs
  );
  const detectedAuth = detectAuthentication(javaClasses, pkgJson, pomData, gradleData, reqPkgs);
  const detectedTest = detectTestFramework(javaClasses, pkgJson, pomData, gradleData, reqPkgs);
  const features = extractFeatures(javaClasses, pythonEntities, jsModules, sqlData);
  const architecture = detectArchitecture(javaClasses);
  const apiRoutes = collectApiRoutes(javaClasses, pythonEntities, jsModules);
  const designPatterns = detectDesignPatterns(javaClasses);
  const securityIssues = scanSecurityIssues(filtered.slice(0, 60));

  /* ── 6b. Go / Rust framework detection (using parsed config + source imports) ── */
  if (!detectedFramework.primary && cargoData?.dependencies?.length > 0) {
    const cargoDeps = cargoData.dependencies.join(' ').toLowerCase();
    const GO_RUST_FW_MAP = [
      ['actix-web', 'Actix-web'],
      ['actix_web', 'Actix-web'],
      ['rocket', 'Rocket'],
      ['axum', 'Axum'],
      ['warp', 'Warp'],
      ['tide', 'Tide'],
      ['poem', 'Poem'],
    ];
    for (const [kw, name] of GO_RUST_FW_MAP) {
      if (cargoDeps.includes(kw)) {
        detectedFramework.primary = name;
        detectedFramework.primaryConfidence = 95;
        detectedFramework.primaryEvidence = [`${kw} in Cargo.toml dependencies`];
        break;
      }
    }
  }
  if (!detectedFramework.primary && goModData?.dependencies?.length > 0) {
    const goDeps = goModData.dependencies.join(' ').toLowerCase();
    const GO_FW_MAP = [
      ['gin-gonic/gin', 'Gin'],
      ['labstack/echo', 'Echo'],
      ['gofiber/fiber', 'Fiber'],
      ['gorilla/mux', 'Gorilla Mux'],
      ['go-chi/chi', 'Chi'],
      ['beego', 'Beego'],
      ['revel', 'Revel'],
    ];
    for (const [kw, name] of GO_FW_MAP) {
      if (goDeps.includes(kw)) {
        detectedFramework.primary = name;
        detectedFramework.primaryConfidence = 95;
        detectedFramework.primaryEvidence = [`${kw} in go.mod require`];
        break;
      }
    }
    // Also scan Go source files for framework imports
    if (!detectedFramework.primary) {
      const allGoImports = goFiles
        .flatMap((f) => [...(f.content?.matchAll(/import\s+"([^"]+)"/g) || [])].map((m) => m[1]))
        .join(' ');
      for (const [kw, name] of GO_FW_MAP) {
        if (allGoImports.includes(kw)) {
          detectedFramework.primary = name;
          detectedFramework.primaryConfidence = 90;
          detectedFramework.primaryEvidence = [`import "${kw}" in Go source`];
          break;
        }
      }
    }
  }

  /* ── 7. Language stats ── */
  const { primaryLanguage, languages, languageStats } = computeLanguageStats(filtered);

  /* ── 8. Project metadata (with cascading fallbacks across all config formats) ── */
  const META_FRAMEWORKS = new Set(['Next.js', 'Nuxt.js', 'SvelteKit', 'Gatsby', 'Remix', 'Astro']);

  // Project name: package.json → pom.xml → Cargo.toml → go.mod (last path segment) → pyproject.toml → directory name
  const projectName =
    pkgJson?.name ||
    pomData?.artifactId ||
    pomData?.name ||
    cargoData?.name ||
    (goModData?.moduleName ? goModData.moduleName.split('/').pop() : null) ||
    pyprojectData?.name ||
    (() => {
      for (const f of filtered) {
        const parts = (f.path || '')
          .replace(/\\/g, '/')
          .split('/')
          .filter((p) => p && !IGNORE_DIRS.has(p));
        if (parts.length > 0) return parts[0];
      }
      return 'unnamed-project';
    })();

  // Description: package.json → pom.xml → Cargo.toml → pyproject.toml → extracted from README
  const description =
    pkgJson?.description ||
    pomData?.description ||
    cargoData?.description ||
    pyprojectData?.description ||
    readmeDescription ||
    '';

  // Version
  const version =
    pkgJson?.version ||
    pomData?.version ||
    gradleData?.version ||
    cargoData?.version ||
    pyprojectData?.version ||
    '';

  // Author: prefer structured fields
  const author =
    typeof pkgJson?.author === 'string'
      ? pkgJson.author
      : pkgJson?.author?.name ||
        (cargoData?.authors?.[0] ? cargoData.authors[0].replace(/<[^>]+>/, '').trim() : null) ||
        '';

  const license = pkgJson?.license || '';

  /* ── 9. Fix metaFramework: detectedFramework.primary can be a meta-framework ── */
  const isMetaFw = META_FRAMEWORKS.has(detectedFramework.primary);
  const metaFramework = isMetaFw ? detectedFramework.primary : null;
  const backendFramework = isMetaFw ? null : detectedFramework.primary || null;
  const uiFramework = detectedFramework.ui || null;

  /* ── 9b. Boolean flags ── */
  const fnames = new Set(filtered.map((f) => f.name.toLowerCase()));
  const fpaths = filtered.map((f) => (f.path || '').toLowerCase());
  const hasReadme = fnames.has('readme.md') || fnames.has('readme.rst') || fnames.has('readme');
  const hasLicense = fnames.has('license') || fnames.has('license.md') || fnames.has('licence');
  const hasContributing = fnames.has('contributing.md');
  const hasGitignore = fnames.has('.gitignore');
  const hasEnvFile = !!envFile;
  const hasDocker =
    fnames.has('dockerfile') ||
    fnames.has('docker-compose.yml') ||
    fnames.has('docker-compose.yaml');
  const hasCI =
    fpaths.some((p) => p.includes('.github/workflows')) ||
    fnames.has('.travis.yml') ||
    fnames.has('.gitlab-ci.yml') ||
    fnames.has('jenkinsfile');
  const hasTests =
    detectedTest.name !== null ||
    filtered.some(
      (f) =>
        f.name.includes('.test.') ||
        f.name.includes('.spec.') ||
        f.name.endsWith('Test.java') ||
        f.name.endsWith('Tests.java') ||
        (f.name.startsWith('Test') && f.name.endsWith('.java')) ||
        fpaths.some(
          (p) => p.includes('/test/') || p.includes('/tests/') || p.includes('/__tests__/')
        )
    );

  /* ── 10. Build tool / Package manager ── */
  let packageManager = null,
    buildTool = null;
  if (pomData) {
    packageManager = 'maven';
    buildTool = 'Maven';
  } else if (gradleData) {
    packageManager = 'gradle';
    buildTool = 'Gradle';
  } else if (fnames.has('pnpm-lock.yaml')) {
    packageManager = 'pnpm';
    buildTool = 'pnpm';
  } else if (fnames.has('yarn.lock')) {
    packageManager = 'yarn';
    buildTool = 'Yarn';
  } else if (fnames.has('bun.lockb')) {
    packageManager = 'bun';
    buildTool = 'Bun';
  } else if (pkgJson) {
    packageManager = 'npm';
    buildTool = 'npm';
  } else if (pyprojectFile) {
    if (fnames.has('poetry.lock') || pyprojectData?.buildBackend?.includes('poetry')) {
      packageManager = 'poetry';
      buildTool = 'Poetry';
    } else {
      packageManager = 'pip';
      buildTool = 'pip';
    }
  } else if (reqFile) {
    if (fnames.has('poetry.lock')) {
      packageManager = 'poetry';
      buildTool = 'Poetry';
    } else if (fnames.has('pipfile')) {
      packageManager = 'pipenv';
      buildTool = 'Pipenv';
    } else {
      packageManager = 'pip';
      buildTool = 'pip';
    }
  } else if (cargoFile || fnames.has('cargo.toml')) {
    packageManager = 'cargo';
    buildTool = 'Cargo';
  } else if (goModFile || fnames.has('go.mod')) {
    packageManager = 'go mod';
    buildTool = 'Go Modules';
  } else if (fnames.has('composer.json')) {
    packageManager = 'composer';
    buildTool = 'Composer';
  } else if (fnames.has('gemfile')) {
    packageManager = 'bundler';
    buildTool = 'Bundler';
  }

  // Detect Vite/Webpack if npm project
  if (buildTool === 'npm' || buildTool === 'Yarn' || buildTool === 'pnpm') {
    if (fnames.has('vite.config.js') || fnames.has('vite.config.ts')) buildTool = 'Vite';
    else if (fnames.has('webpack.config.js') || fnames.has('webpack.config.ts'))
      buildTool = 'Webpack';
  }

  /* ── 11. SQL tables ── */
  const sqlTables = [...new Set(sqlData.flatMap((s) => s.tables || []))];

  /* ── 12. Large files ── */
  const largeFiles = filtered
    .filter((f) => !f.isDir && (f.content ? countLines(f.content) : 0) > 300)
    .map((f) => ({ path: f.path, lines: countLines(f.content) }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 8);

  /* ── 13. Assemble final analysis object ── */
  const analysis = {
    // Metadata
    projectName,
    description,
    version,
    author,
    license,
    keywords: pkgJson?.keywords || [],
    homepage: pkgJson?.homepage || '',
    repository:
      typeof pkgJson?.repository === 'string' ? pkgJson.repository : pkgJson?.repository?.url || '',

    // Language stats
    primaryLanguage,
    languages,
    languageStats,
    langColors: LANG_COLORS,

    // Framework — flat strings for UI compatibility
    // metaFramework is properly resolved (Next.js, Nuxt.js, SvelteKit, Gatsby, Remix, Astro)
    framework: uiFramework,
    backendFramework: backendFramework,
    metaFramework: metaFramework,

    // Evidence-rich detection objects
    detectedFramework,
    detectedDatabase,
    detectedAuth,
    detectedTest,

    // Flat for UI
    database: detectedDatabase.type || null,
    orm: detectedDatabase.orm || null,
    authentication: detectedAuth.name || null,
    testFramework: detectedTest.name || null,
    buildTool,
    packageManager,

    // Features from actual code analysis
    features,
    architecture,
    designPatterns,
    apiRoutes,
    sqlTables,
    sqlData,
    securityIssues,
    largeFiles,

    // Config data (for accurate installation instructions)
    configData: {
      pomData,
      gradleData,
      pkgJson,
      appProps,
      appYml,
      cargoData,
      goModData,
      pyprojectData,
      javaVersion: pomData?.javaVersion || gradleData?.javaVersion || null,
      springBootVersion: pomData?.springBootVersion || gradleData?.springBootVersion || null,
      goVersion: goModData?.goVersion || null,
      rustEdition: cargoData?.edition || null,
      serverPort: appProps?.serverPort || appYml?.serverPort || null,
      contextPath: appProps?.contextPath || null,
      mainClass: architecture?.entryPoint || null,
      mainClassFile: architecture?.entryPointFile || null,
      appName:
        appProps?.appName ||
        appYml?.appName ||
        pkgJson?.name ||
        cargoData?.name ||
        goModData?.moduleName ||
        null,
      datasourceUrl: appProps?.datasourceUrl || appYml?.datasourceUrl || null,
      jpaDdlAuto: appProps?.jpaDdlAuto || appYml?.jpaDdlAuto || null,
    },

    // Flags
    hasTests,
    hasDocker,
    hasCI,
    hasEnvFile,
    hasGitignore,
    hasLicense,
    hasReadme,
    hasContributing,

    // Env vars (from .env files + source scan)
    envVars,

    // Raw dependencies (for overview panel)
    dependencies: pkgJson?.dependencies || {},
    devDependencies: pkgJson?.devDependencies || {},

    // Folder structure
    folderStructure: buildFolderTree(filtered),

    // Stats
    fileCount: filtered.filter((f) => !f.isDir).length,
    totalSize: filtered.reduce((s, f) => s + (f.size || 0), 0),
    formatBytes,

    // Raw source entities (for deep inspection)
    javaClasses,
    pythonEntities,
    jsModules,
  };

  const { qualityScore, healthScore } = calculateScores(analysis);
  analysis.qualityScore = qualityScore;
  analysis.healthScore = healthScore;

  /* ── 14. Analysis confidence & detected signals ── */
  const detectedSignals = [];
  if (analysis.backendFramework || analysis.metaFramework)
    detectedSignals.push(`Framework: ${analysis.metaFramework || analysis.backendFramework}`);
  if (analysis.framework) detectedSignals.push(`UI: ${analysis.framework}`);
  if (analysis.database) detectedSignals.push(`Database: ${analysis.database}`);
  if (analysis.authentication) detectedSignals.push(`Auth: ${analysis.authentication}`);
  if (analysis.testFramework) detectedSignals.push(`Tests: ${analysis.testFramework}`);
  if (analysis.packageManager) detectedSignals.push(`Package manager: ${analysis.packageManager}`);
  if (analysis.apiRoutes.length) detectedSignals.push(`API routes: ${analysis.apiRoutes.length}`);
  if (analysis.features.filter((f) => f.confidence >= 70).length)
    detectedSignals.push(`Entities: ${analysis.features.filter((f) => f.confidence >= 70).length}`);
  if (analysis.architecture?.pattern)
    detectedSignals.push(`Architecture: ${analysis.architecture.pattern}`);
  if (analysis.hasDocker) detectedSignals.push('Docker');
  if (analysis.hasCI) detectedSignals.push('CI/CD');
  if (analysis.sqlTables.length) detectedSignals.push(`SQL tables: ${analysis.sqlTables.length}`);

  // Score: each strong signal = +1
  const signalScore = detectedSignals.length;
  const analysisConfidence = signalScore >= 4 ? 'high' : signalScore >= 2 ? 'medium' : 'low';

  analysis.detectedSignals = detectedSignals;
  analysis.analysisConfidence = analysisConfidence;

  return analysis;
}
