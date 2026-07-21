import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

export const VERSION = pkg.version;

export const AGENT_FILES = [
  'orchestrator.md',
  'builder.md',
  'committer.md',
  'planner.md',
  'specifier.md',
  'verifier.md',
];

export const REFERENCE_FILES = [
  'agent-flow.md',
  'context-policy.md',
  'file-content-schema.md',
  'ref-cache-protocol.md',
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

  // Git operations (committer)
  'Bash(git:*)',
];
