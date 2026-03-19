import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { AGENT_FILES, CLAUDE_MD_SECTION } from './constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_SRC = join(__dirname, '..', 'agents');

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function copyAgents(destDir) {
  mkdirSync(destDir, { recursive: true });
  let count = 0;
  for (const file of AGENT_FILES) {
    const src = join(AGENTS_SRC, file);
    if (!existsSync(src)) continue;
    copyFileSync(src, join(destDir, file));
    count++;
  }
  return count;
}

function ensureRouterConfig(projectDir) {
  const configDir = join(projectDir, '.agent');
  const configPath = join(configDir, 'router_rule_config.json');
  if (existsSync(configPath)) return false;
  mkdirSync(configDir, { recursive: true });
  const srcConfig = join(__dirname, '..', '.agent', 'router_rule_config.json');
  if (existsSync(srcConfig)) {
    copyFileSync(srcConfig, configPath);
  }
  return true;
}

function ensureWorksDir(projectDir) {
  const worksDir = join(projectDir, 'works');
  if (existsSync(worksDir)) return false;
  mkdirSync(worksDir, { recursive: true });
  return true;
}

function updateClaudeMd(projectDir) {
  const claudeMdPath = join(projectDir, 'CLAUDE.md');
  if (existsSync(claudeMdPath)) {
    const content = readFileSync(claudeMdPath, 'utf8');
    if (content.includes('Agent 호출 규칙') || content.includes('agent-flow.md')) {
      return false;
    }
    writeFileSync(claudeMdPath, content.trimEnd() + '\n\n' + CLAUDE_MD_SECTION);
  } else {
    writeFileSync(claudeMdPath, '# CLAUDE.md\n\n' + CLAUDE_MD_SECTION);
  }
  return true;
}

export function init(isGlobal) {
  if (isGlobal) {
    const globalDir = join(homedir(), '.claude', 'agents');
    const count = copyAgents(globalDir);
    console.log(`\n  Installing to ${dim('~/.claude/agents/')} ...`);
    console.log(`    ${green('✓')} ${count} agent files copied`);
    console.log(`\n  ${dim('Next steps:')}`);
    console.log(`    1. Open any project and run ${dim("'claude'")}`);
    console.log(`    2. Type: ${dim('[추가기능] Add a hello world feature')}\n`);
    return;
  }

  const projectDir = process.cwd();
  const destDir = join(projectDir, '.claude', 'agents');

  console.log(`\n  Installing to ${dim('.claude/agents/')} ...`);

  const count = copyAgents(destDir);
  console.log(`    ${green('✓')} ${count} agent files copied`);

  if (ensureRouterConfig(projectDir)) {
    console.log(`    ${green('✓')} .agent/router_rule_config.json created`);
  } else {
    console.log(`    ${dim('-')} .agent/router_rule_config.json already exists`);
  }

  if (updateClaudeMd(projectDir)) {
    console.log(`    ${green('✓')} CLAUDE.md updated`);
  } else {
    console.log(`    ${dim('-')} CLAUDE.md already has agent rules`);
  }

  if (ensureWorksDir(projectDir)) {
    console.log(`    ${green('✓')} works/ directory created`);
  } else {
    console.log(`    ${dim('-')} works/ directory already exists`);
  }

  console.log(`\n  ${dim('Next steps:')}`);
  console.log(`    1. Run ${dim("'claude'")} to start Claude Code`);
  console.log(`    2. Type: ${dim('[추가기능] Add a hello world feature')}\n`);
}
