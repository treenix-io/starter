// Treenix vite plugin:
// 1. Resolve #subpath imports via nearest package.json (Vite doesn't support them)
// 2. Resolve @treenx/* exports with array conditions (Vite bug #16153)
// 3. Auto-discover mod client.ts → virtual:mod-clients
// 4. Block server.ts from frontend bundle

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin } from 'vite';

// ── Package.json resolution ──

type SpecValue = string | string[] | Record<string, string | string[]>;
type FieldMap = Record<string, SpecValue>;

const pkgCache = new Map<string, { dir: string; imports?: FieldMap; exports?: FieldMap } | null>();

function readPkg(startDir: string) {
  if (pkgCache.has(startDir)) return pkgCache.get(startDir)!;

  let current = startDir;
  while (current !== dirname(current)) {
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.imports || pkg.exports) {
        const result = { dir: current, imports: pkg.imports as FieldMap, exports: pkg.exports as FieldMap };
        pkgCache.set(startDir, result);
        return result;
      }
    }
    current = dirname(current);
  }

  pkgCache.set(startDir, null);
  return null;
}

// Cache for @treenx/* package dirs
const treenixPkgCache = new Map<string, { dir: string; exports: FieldMap; symlinked: boolean } | null>();

function findTreenixPkg(name: string): { dir: string; exports: FieldMap; symlinked: boolean } | null {
  if (treenixPkgCache.has(name)) return treenixPkgCache.get(name)!;

  // Walk up from CWD to find node_modules/@treenx/<name>
  let current = process.cwd();
  while (current !== dirname(current)) {
    const pkgDir = join(current, 'node_modules', name);
    const pkgPath = join(pkgDir, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      // Follow symlink to real path for resolution
      const realDir = realpathSync(pkgDir);
      const symlinked = realDir !== pkgDir;
      const result = pkg.exports ? { dir: realDir, exports: pkg.exports as FieldMap, symlinked } : null;
      treenixPkgCache.set(name, result);
      return result;
    }
    current = dirname(current);
  }

  treenixPkgCache.set(name, null);
  return null;
}

function resolveConditions(pkgDir: string, spec: SpecValue, conditions: string[]): string[] {
  if (typeof spec === 'string') return [resolve(pkgDir, spec)];
  if (Array.isArray(spec)) return spec.map(s => resolve(pkgDir, s));

  for (const cond of conditions) {
    if (spec[cond]) return resolveConditions(pkgDir, spec[cond], conditions);
  }
  if (spec.default) return resolveConditions(pkgDir, spec.default, conditions);
  return [];
}

function isFile(p: string): boolean {
  return existsSync(p) && statSync(p).isFile();
}

const EXT = ['.ts', '.tsx', '.js', '.jsx'];
const IDX = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

function tryResolve(candidates: string[]): string | undefined {
  for (const c of candidates) {
    if (isFile(c)) return c;
    for (const ext of EXT) { if (isFile(c + ext)) return c + ext; }
    for (const idx of IDX) { if (isFile(c + idx)) return c + idx; }
  }
}

function expandWildcard(spec: SpecValue, matched: string): SpecValue {
  if (typeof spec === 'string') return spec.replace('*', matched);
  if (Array.isArray(spec)) return spec.map(s => s.replace('*', matched));
  return Object.fromEntries(
    Object.entries(spec).map(([k, v]) => [k, expandWildcard(v, matched)])
  ) as SpecValue;
}

function matchPattern(id: string, map: FieldMap, pkgDir: string, conditions: string[]): string | undefined {
  for (const [pattern, spec] of Object.entries(map)) {
    if (pattern === id) {
      return tryResolve(resolveConditions(pkgDir, spec, conditions));
    }

    if (pattern.includes('*')) {
      const [prefix, suffix] = pattern.split('*');
      if (id.startsWith(prefix) && (!suffix || id.endsWith(suffix))) {
        const matched = id.slice(prefix.length, suffix ? -suffix.length || undefined : undefined);
        return tryResolve(resolveConditions(pkgDir, expandWildcard(spec, matched), conditions));
      }
    }
  }
}

// ── Mod discovery ──

const VIRTUAL_ID = 'virtual:mod-clients';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const SERVER_RE = /\/mods\/[^/]+\/server(\.ts)?$/;

function scanClients(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const clients: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const client = resolve(dir, entry.name, 'client.ts');
    if (existsSync(client)) clients.push(client);
  }
  return clients;
}

// Scan node_modules for @treenx/* packages with treenix.clients field
// Returns bare import specifiers (e.g. '@treenx/mods/clients') — resolveId handles the rest
function discoverPackageClients(): string[] {
  const imports: string[] = [];
  let current = process.cwd();

  while (current !== dirname(current)) {
    const nmDir = join(current, 'node_modules', '@treenx');
    if (existsSync(nmDir)) {
      for (const entry of readdirSync(nmDir, { withFileTypes: true })) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
        const pkgPath = join(nmDir, entry.name, 'package.json');
        if (!existsSync(pkgPath)) continue;
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.treenix?.clients) {
          // Strip leading ./ and extension → bare subpath for import specifier
          const subpath = (pkg.treenix.clients as string).replace(/^\.\//, '').replace(/\.tsx?$/, '');
          imports.push(`@treenx/${entry.name}/${subpath}`);
        }
      }
      break;
    }
    current = dirname(current);
  }

  return imports;
}

// ── Plugin ──

export default function treenixPlugin(opts?: { modsDirs?: string[] }): Plugin {
  const engineRoot = resolve(import.meta.dirname, '../..');
  let conditions: string[] = [];

  return {
    name: 'treenix',
    enforce: 'pre',

    configResolved(config) {
      conditions = (config.resolve.conditions ?? []).concat('default');
    },

    resolveId(id, importer) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      if (!importer) return;

      // Block server.ts from frontend
      if (id.startsWith('.')) {
        const resolved = resolve(importer, '..', id).replace(/\\/g, '/');

        // Relative imports within @treenx packages: resolve explicitly so module IDs
        // match plugin-resolved @treenx/* paths (prevents ?v= hash mismatch → dual modules)
        if (importer.includes('/node_modules/@treenx/')) {
          return tryResolve([resolved]);
        }

        if (SERVER_RE.test(resolved)) {
          this.error(
            `Server module imported in frontend build: "${id}"\n` +
            `  from: ${importer}\n` +
            `  Mods must not import server.ts from client code`
          );
        }
      }

      // Resolve # imports via nearest package.json imports field
      if (id.startsWith('#')) {
        const pkg = readPkg(dirname(importer));
        if (pkg?.imports) {
          // node_modules: use only 'default' condition (dist/ files must resolve to dist/)
          const conds = importer.includes('/node_modules/') ? ['default'] : conditions;
          return matchPattern(id, pkg.imports, pkg.dir, conds);
        }
      }

      // Resolve @treenx/* wildcard exports (Vite doesn't support * patterns natively)
      if (id.startsWith('@treenx/')) {
        const parts = id.split('/');
        const pkgName = parts.slice(0, 2).join('/');
        const subpath = './' + parts.slice(2).join('/');
        const pkg = findTreenixPkg(pkgName);
        if (pkg?.exports) {
          const conds = pkg.symlinked ? conditions : ['default'];
          const resolved = matchPattern(parts.length > 2 ? subpath : '.', pkg.exports, pkg.dir, conds);
          // Return with ?v= to match Vite's native module ID format for node_modules files
          if (resolved) return resolved;
        }
      }
    },

    load(id) {
      if (id !== RESOLVED_ID) return;

      // 1. Auto-discover @treenx/* packages with treenix.clients
      const pkgClients = discoverPackageClients();

      // 2. Engine mods (sibling to this plugin's package)
      const engineMods = scanClients(resolve(engineRoot, 'mods'));

      // 3. Extra mods dirs (passed explicitly from project vite config)
      const extraMods = (opts?.modsDirs ?? []).flatMap(d => scanClients(resolve(d)));

      // Dedupe: bare specifiers by string, file paths by realpath
      const seen = new Set<string>();
      const imports: string[] = [];
      for (const p of [...pkgClients, ...engineMods, ...extraMods]) {
        const key = p.startsWith('@') ? p : realpathSync(p);
        if (!seen.has(key)) { seen.add(key); imports.push(p); }
      }

      return imports.map(p => `import '${p}';`).join('\n') + '\n';
    },
  };
}
