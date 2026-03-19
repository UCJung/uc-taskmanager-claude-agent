#!/usr/bin/env node

import { createInterface } from 'node:readline';
import { VERSION, SUPPORTED_LANGS } from '../lib/constants.mjs';

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;

const HELP = `
  ${bold('uctm')} ${dim(`v${VERSION}`)} — Universal Claude Task Manager

  ${bold('Usage:')}
    uctm init ${dim('[--global] [--lang ko|en]')}     Install agent files
    uctm update ${dim('[--global] --lang ko|en')}   Update agent files (--lang required)
    uctm --version            Show version
    uctm --help               Show this help

  ${bold('Options:')}
    --global    Install/update to ${dim('~/.claude/agents/')} (available across all projects)
                Default installs to ${dim('.claude/agents/')} in the current directory
    --lang      Select agent language: ${dim('ko')} (한국어) or ${dim('en')} (English)
                If omitted during init, interactive selection is shown

  ${bold('Examples:')}
    ${dim('# English agents')}
    ${cyan('$')} uctm init --lang en

    ${dim('# Korean agents')}
    ${cyan('$')} uctm init --lang ko

    ${dim('# Interactive language selection')}
    ${cyan('$')} uctm init

    ${dim('# Global setup')}
    ${cyan('$')} uctm init --global --lang en

    ${dim('# Update agents after uctm upgrade')}
    ${cyan('$')} uctm update --lang en

  ${bold('After init:')}
    1. Run ${dim("'claude'")} to start Claude Code
    2. Type: ${dim('[new-feature] Add a hello world feature')}

  ${dim('https://github.com/UCJung/uc-taskmanager-claude-agent')}
`;

function parseLangArg(args) {
  const langIdx = args.indexOf('--lang');
  if (langIdx === -1) return null;
  const lang = args[langIdx + 1];
  if (!lang || !SUPPORTED_LANGS.includes(lang)) {
    console.error(`\n  Error: --lang must be one of: ${SUPPORTED_LANGS.join(', ')}`);
    console.error(`  Usage: uctm <command> --lang ko|en\n`);
    process.exit(1);
  }
  return lang;
}

async function promptLang() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log(`\n  Select language:`);
    console.log(`    1. English`);
    console.log(`    2. 한국어`);
    rl.question('  > ', (answer) => {
      rl.close();
      const choice = answer.trim();
      if (choice === '1' || choice.toLowerCase() === 'en' || choice.toLowerCase() === 'english') {
        resolve('en');
      } else if (choice === '2' || choice.toLowerCase() === 'ko' || choice === '한국어') {
        resolve('ko');
      } else {
        console.log(`  Defaulting to English.`);
        resolve('en');
      }
    });
  });
}

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
    let lang = parseLangArg(args);
    if (!lang) {
      lang = await promptLang();
    }
    const { init } = await import('../lib/init.mjs');
    init(isGlobal, lang);
    return;
  }

  if (command === 'update') {
    console.log(`\n  ${bold('uctm')} ${dim(`v${VERSION}`)} — Universal Claude Task Manager`);
    const lang = parseLangArg(args);
    const { update } = await import('../lib/update.mjs');
    update(isGlobal, lang);
    return;
  }

  console.error(`\n  Unknown command: ${command}`);
  console.error(`  Run ${dim("'uctm --help'")} for usage.\n`);
  process.exit(1);
}

main();
