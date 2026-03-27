import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { AGENT_FILES, getAgentsSrcDir, getClaudeMdSection, REQUIRED_PERMISSIONS } from './constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

import { createInterface } from 'node:readline';

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;

function copyAgents(destDir, lang) {
  const srcDir = getAgentsSrcDir(lang);
  mkdirSync(destDir, { recursive: true });
  let count = 0;
  for (const file of AGENT_FILES) {
    const src = join(srcDir, file);
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

function updateClaudeMd(projectDir, lang) {
  const section = getClaudeMdSection(lang);
  const claudeMdPath = join(projectDir, 'CLAUDE.md');
  if (existsSync(claudeMdPath)) {
    const content = readFileSync(claudeMdPath, 'utf8');
    if (content.includes('Agent 호출 규칙') || content.includes('Agent Invocation Rules') || content.includes('agent-flow.md')) {
      return false;
    }
    writeFileSync(claudeMdPath, content.trimEnd() + '\n\n' + section);
  } else {
    writeFileSync(claudeMdPath, '# CLAUDE.md\n\n' + section);
  }
  return true;
}

function mergePermissions(projectDir) {
  const settingsPath = join(projectDir, '.claude', 'settings.local.json');
  let settings = {};

  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    } catch {
      settings = {};
    }
  }

  if (!settings.permissions) settings.permissions = {};
  if (!Array.isArray(settings.permissions.allow)) settings.permissions.allow = [];

  const existing = new Set(settings.permissions.allow);
  let added = 0;

  for (const perm of REQUIRED_PERMISSIONS) {
    if (!existing.has(perm)) {
      settings.permissions.allow.push(perm);
      added++;
    }
  }

  if (added > 0) {
    const dir = dirname(settingsPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }

  return { added, total: settings.permissions.allow.length };
}

async function promptPermissions() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log(`\n  ${yellow('?')} Auto-configure Bash permissions for agents? (recommended)`);
    console.log(`    ${dim('Adds required permissions to .claude/settings.local.json')}`);
    rl.question('    [Y/n] ', (answer) => {
      rl.close();
      const choice = answer.trim().toLowerCase();
      resolve(choice === '' || choice === 'y' || choice === 'yes');
    });
  });
}

export async function init(isGlobal, lang) {
  const exampleTag = lang === 'ko'
    ? `[추가기능] Add a hello world feature`
    : `[new-feature] Add a hello world feature`;

  if (isGlobal) {
    const globalDir = join(homedir(), '.claude', 'agents');
    const count = copyAgents(globalDir, lang);
    console.log(`\n  Installing to ${dim('~/.claude/agents/')} (${lang}) ...`);
    console.log(`    ${green('✓')} ${count} agent files copied`);
    console.log(`\n  ${dim('Next steps:')}`);
    console.log(`    1. Open any project and run ${dim("'claude'")}`);
    console.log(`    2. Type: ${dim(exampleTag)}\n`);
    return;
  }

  const projectDir = process.cwd();
  const destDir = join(projectDir, '.claude', 'agents');

  console.log(`\n  Installing to ${dim('.claude/agents/')} (${lang}) ...`);

  const count = copyAgents(destDir, lang);
  console.log(`    ${green('✓')} ${count} agent files copied`);

  if (ensureRouterConfig(projectDir)) {
    console.log(`    ${green('✓')} .agent/router_rule_config.json created`);
  } else {
    console.log(`    ${dim('-')} .agent/router_rule_config.json already exists`);
  }

  if (updateClaudeMd(projectDir, lang)) {
    console.log(`    ${green('✓')} CLAUDE.md updated`);
  } else {
    console.log(`    ${dim('-')} CLAUDE.md already has agent rules`);
  }

  if (ensureWorksDir(projectDir)) {
    console.log(`    ${green('✓')} works/ directory created`);
  } else {
    console.log(`    ${dim('-')} works/ directory already exists`);
  }

  const wantPermissions = await promptPermissions();
  if (wantPermissions) {
    const { added, total } = mergePermissions(projectDir);
    if (added > 0) {
      console.log(`    ${green('✓')} ${added} permissions added to .claude/settings.local.json (total: ${total})`);
    } else {
      console.log(`    ${dim('-')} All permissions already configured (${total})`);
    }
  } else {
    console.log(`    ${dim('-')} Skipped permission setup`);
  }

  console.log(`\n  ${dim('Next steps:')}`);
  console.log(`    1. Run ${dim("'claude'")} to start Claude Code`);
  console.log(`    2. Type: ${dim(exampleTag)}\n`);
}
