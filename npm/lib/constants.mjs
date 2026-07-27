import { readFileSync, existsSync, rmSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

export const VERSION = pkg.version;

export const AGENT_FILES = [
  'orchestrator.md',
  'builder.md',
  'planner.md',
  'specifier.md',
  'verifier.md',
];

export const REFERENCE_FILES = [
  'agent-flow.md',
  'context-policy.md',
  'file-content-schema.md',
  'shared-prompt-sections.md',
  'work-activity-log.md',
  'xml-schema.md',
];

export function getAgentsSrcDir() {
  return join(__dirname, '..', 'agents');
}

export function getReferencesSrcDir() {
  return join(__dirname, '..', 'references');
}

/**
 * Files and directories shipped by earlier versions that no longer exist.
 * init and update copy files but never delete, so an upgraded install keeps
 * stale copies unless they are pruned explicitly.
 *
 * Paths are relative to the install root (.claude/ or ~/.claude/).
 */
export const OBSOLETE_PATHS = [
  'agents/scheduler.md',             // removed in 2.0.0 — orchestrator took over scheduling
  'agents/committer.md',             // removed in 2.2.0 — commit is inline in orchestrator (was a deprecated stub since 2.0.0)
  'references/callback-protocol.md', // removed in 2.0.0 — external callback integration dropped
  'references/ref-cache-protocol.md',// removed in 2.0.1 — protocol folded into xml-schema.md § 4
  'skills/sdd-pipeline/references',  // removed in 1.5.0 — references moved to references/
];

/**
 * Delete every OBSOLETE_PATHS entry that still exists under baseDir.
 * Returns the paths actually removed.
 */
export function pruneObsolete(baseDir) {
  const removed = [];
  for (const relPath of OBSOLETE_PATHS) {
    const target = join(baseDir, relPath);
    if (!existsSync(target)) continue;
    rmSync(target, { recursive: true, force: true });
    removed.push(relPath);
  }
  return removed;
}

/**
 * Recursively copy a directory tree. Shared by init and update.
 * Returns the number of files copied.
 */
export function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

/**
 * Copy plugin resources (.claude-plugin/, skills/) from the package root
 * into the install destination. Shared by init and update.
 */
export function copyPluginResources(destBaseDir) {
  const pkgRoot = join(__dirname, '..');
  let count = 0;

  // .claude-plugin/
  const pluginSrc = join(pkgRoot, '.claude-plugin');
  if (existsSync(pluginSrc)) {
    count += copyDirRecursive(pluginSrc, join(destBaseDir, '.claude-plugin'));
  }

  // skills/
  const skillsSrc = join(pkgRoot, 'skills');
  if (existsSync(skillsSrc)) {
    count += copyDirRecursive(skillsSrc, join(destBaseDir, 'skills'));
  }

  return count;
}


/**
 * Bash permissions required by uc-taskmanager agents.
 * Merged into .claude/settings.local.json during init.
 *
 * Categories:
 *   - File discovery: ls, cat, basename, find, wc, sort, tail, head
 *   - Pattern matching: grep, sed, cut, tr
 *   - Formatting: printf, echo
 *   - Build/Lint: node, npm, bun, yarn, cargo, go, python, ruff, make
 *   - Git: git add, git commit, git log, git rev-parse
 */
export const REQUIRED_PERMISSIONS = [
  // File read/write tools (project-root scoped)
  'Read(/**)',
  'Edit(/**)',
  'Write(/**)',
  'Read(**)',
  'Edit(**)',
  'Write(**)',

  // File discovery & text utilities
  'Bash(ls:*)',
  'Bash(cat:*)',
  'Bash(mkdir:*)',
  'Bash(basename:*)',
  'Bash(find:*)',
  'Bash(wc:*)',
  'Bash(sort:*)',
  'Bash(tail:*)',
  'Bash(head:*)',
  'Bash(echo:*)',
  'Bash(printf:*)',

  // Pattern matching & text processing
  'Bash(grep:*)',
  'Bash(sed:*)',
  'Bash(cut:*)',
  'Bash(tr:*)',

  // Build & Lint (auto-detect per project type)
  'Bash(node:*)',
  'Bash(npm run:*)',
  'Bash(npm test:*)',
  'Bash(bun run:*)',
  'Bash(yarn:*)',
  'Bash(cargo:*)',
  'Bash(go build:*)',
  'Bash(go test:*)',
  'Bash(python:*)',
  'Bash(ruff:*)',
  'Bash(make:*)',

  // Git operations (inline commit in orchestrator)
  'Bash(git:*)',
];
