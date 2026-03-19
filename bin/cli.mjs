#!/usr/bin/env node

import { VERSION } from '../lib/constants.mjs';

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;

const HELP = `
  ${bold('uctm')} ${dim(`v${VERSION}`)} — Universal Claude Task Manager

  ${bold('Usage:')}
    uctm init ${dim('[--global]')}     Install agent files to the current project
    uctm update ${dim('[--global]')}   Update agent files (keeps your config)
    uctm --version            Show version
    uctm --help               Show this help

  ${bold('Options:')}
    --global    Install/update to ${dim('~/.claude/agents/')} (available across all projects)
                Default installs to ${dim('.claude/agents/')} in the current directory

  ${bold('Examples:')}
    ${dim('# Per-project setup')}
    ${cyan('$')} cd your-project
    ${cyan('$')} uctm init

    ${dim('# Global setup')}
    ${cyan('$')} uctm init --global

    ${dim('# Update agents after uctm upgrade')}
    ${cyan('$')} uctm update

  ${bold('After init:')}
    1. Run ${dim("'claude'")} to start Claude Code
    2. Type: ${dim('[추가기능] Add a hello world feature')}

  ${dim('https://github.com/UCJung/uc-taskmanager-claude-agent')}
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args.find((a) => !a.startsWith('-'));
  const isGlobal = args.includes('--global');

  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    return;
  }

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(HELP);
    return;
  }

  if (command === 'init') {
    console.log(`\n  ${bold('uctm')} ${dim(`v${VERSION}`)} — Universal Claude Task Manager`);
    const { init } = await import('../lib/init.mjs');
    init(isGlobal);
    return;
  }

  if (command === 'update') {
    console.log(`\n  ${bold('uctm')} ${dim(`v${VERSION}`)} — Universal Claude Task Manager`);
    const { update } = await import('../lib/update.mjs');
    update(isGlobal);
    return;
  }

  console.error(`\n  Unknown command: ${command}`);
  console.error(`  Run ${dim("'uctm --help'")} for usage.\n`);
  process.exit(1);
}

main();
