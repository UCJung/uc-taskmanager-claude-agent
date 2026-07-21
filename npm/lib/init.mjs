import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { AGENT_FILES, REFERENCE_FILES, getAgentsSrcDir, getReferencesSrcDir, REQUIRED_PERMISSIONS } from './constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

import { createInterface } from 'node:readline';

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;

function copyAgents(destDir) {
  const srcDir = getAgentsSrcDir();
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

function copyReferences(destDir) {
  const srcDir = getReferencesSrcDir();
  mkdirSync(destDir, { recursive: true });
  let count = 0;
  for (const file of REFERENCE_FILES) {
    const src = join(srcDir, file);
    if (!existsSync(src)) continue;
    copyFileSync(src, join(destDir, file));
    count++;
  }
  return count;
}

function copyDirRecursive(src, dest) {
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

function copyPluginResources(destBaseDir) {
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

function ensureWorksDir(projectDir) {
  const worksDir = join(projectDir, 'works');
  if (existsSync(worksDir)) return false;
  mkdirSync(worksDir, { recursive: true });
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

export async function init(isGlobal) {
  const exampleTag = `[new-feature] Add a hello world feature`;

  if (isGlobal) {
    const globalClaudeDir = join(homedir(), '.claude');
    const agentCount = copyAgents(join(globalClaudeDir, 'agents'));
    const refCount = copyReferences(join(globalClaudeDir, 'references'));
    console.log(`\n  Installing to ${dim('~/.claude/')} ...`);
    console.log(`    ${green('✓')} ${agentCount} agent files copied to agents/`);
    console.log(`    ${green('✓')} ${refCount} reference files copied to references/`);
    const globalResCount = copyPluginResources(globalClaudeDir);
    if (globalResCount > 0) {
      console.log(`    ${green('✓')} ${globalResCount} plugin resource files copied`);
    }
    console.log(`\n  ${dim('Next steps:')}`);
    console.log(`    1. Open any project and run ${dim("'claude'")}`);
    console.log(`    2. Type: ${dim(exampleTag)}\n`);
    return;
  }

  const projectDir = process.cwd();
  const claudeDir = join(projectDir, '.claude');

  console.log(`\n  Installing to ${dim('.claude/')} ...`);

  const agentCount = copyAgents(join(claudeDir, 'agents'));
  console.log(`    ${green('✓')} ${agentCount} agent files copied to agents/`);
  const refCount = copyReferences(join(claudeDir, 'references'));
  console.log(`    ${green('✓')} ${refCount} reference files copied to references/`);

  const resCount = copyPluginResources(claudeDir);
  if (resCount > 0) {
    console.log(`    ${green('✓')} ${resCount} plugin resource files copied (.claude-plugin, skills)`);
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
