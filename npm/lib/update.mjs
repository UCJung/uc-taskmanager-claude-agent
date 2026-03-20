import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { AGENT_FILES, getAgentsSrcDir } from './constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

export function update(isGlobal, lang) {
  if (!lang) {
    console.error(`\n  ${red('Error:')} --lang is required for update.`);
    console.error(`  Usage: uctm update --lang ko|en ${isGlobal ? '--global' : ''}\n`);
    process.exit(1);
  }

  const srcDir = getAgentsSrcDir(lang);
  const destDir = isGlobal
    ? join(homedir(), '.claude', 'agents')
    : join(process.cwd(), '.claude', 'agents');

  if (!existsSync(destDir)) {
    console.error(`\n  Error: ${destDir} not found. Run ${dim("'uctm init'")} first.\n`);
    process.exit(1);
  }

  let count = 0;
  for (const file of AGENT_FILES) {
    const src = join(srcDir, file);
    if (!existsSync(src)) continue;
    copyFileSync(src, join(destDir, file));
    count++;
  }

  const label = isGlobal ? '~/.claude/agents/' : '.claude/agents/';
  console.log(`\n  Updating ${dim(label)} (${lang}) ...`);
  console.log(`    ${green('✓')} ${count} agent files updated`);
  console.log(`    ${dim('-')} CLAUDE.md, router_rule_config.json untouched\n`);
}
