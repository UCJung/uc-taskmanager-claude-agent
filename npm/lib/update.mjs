import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { AGENT_FILES, REFERENCE_FILES, getAgentsSrcDir, getReferencesSrcDir, pruneObsolete, copyPluginResources } from './constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

export function update(isGlobal) {
  const baseDir = isGlobal
    ? join(homedir(), '.claude')
    : join(process.cwd(), '.claude');
  const agentDestDir = join(baseDir, 'agents');
  const refDestDir = join(baseDir, 'references');

  if (!existsSync(agentDestDir)) {
    console.error(`\n  Error: ${agentDestDir} not found. Run ${dim("'uctm init'")} first.\n`);
    process.exit(1);
  }

  const agentSrcDir = getAgentsSrcDir();
  let agentCount = 0;
  for (const file of AGENT_FILES) {
    const src = join(agentSrcDir, file);
    if (!existsSync(src)) continue;
    copyFileSync(src, join(agentDestDir, file));
    agentCount++;
  }

  mkdirSync(refDestDir, { recursive: true });
  const refSrcDir = getReferencesSrcDir();
  let refCount = 0;
  for (const file of REFERENCE_FILES) {
    const src = join(refSrcDir, file);
    if (!existsSync(src)) continue;
    copyFileSync(src, join(refDestDir, file));
    refCount++;
  }

  const resCount = copyPluginResources(baseDir);
  const removed = pruneObsolete(baseDir);

  const label = isGlobal ? '~/.claude/' : '.claude/';
  console.log(`\n  Updating ${dim(label)} ...`);
  console.log(`    ${green('✓')} ${agentCount} agent files updated`);
  console.log(`    ${green('✓')} ${refCount} reference files updated`);
  if (resCount > 0) {
    console.log(`    ${green('✓')} ${resCount} plugin resource files updated`);
  }
  if (removed.length > 0) {
    console.log(`    ${green('✓')} ${removed.length} obsolete files removed`);
    for (const relPath of removed) {
      console.log(`      ${dim('-')} ${dim(relPath)}`);
    }
  }
  console.log(`    ${dim('-')} CLAUDE.md untouched\n`);
}
