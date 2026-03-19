import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

export const VERSION = pkg.version;

export const SUPPORTED_LANGS = ['ko', 'en'];

export const AGENT_FILES = [
  'agent-flow.md',
  'builder.md',
  'committer.md',
  'context-policy.md',
  'file-content-schema.md',
  'planner.md',
  'scheduler.md',
  'shared-prompt-sections.md',
  'specifier.md',
  'verifier.md',
  'work-activity-log.md',
  'xml-schema.md',
];

export function getAgentsSrcDir(lang) {
  return join(__dirname, '..', 'agents', lang);
}

export const CLAUDE_MD_SECTION_KO = `
## Agent 호출 규칙

\`[]\` 태그로 시작하는 요청 → \`.claude/agents/agent-flow.md\` 를 읽고 파이프라인을 실행한다.

- **Main Claude가 오케스트레이터**다. 모든 에이전트 호출은 Main Claude가 직접 수행한다.
- \`[]\` 태그 감지 시 → specifier 호출 (첫 번째 에이전트)
- 각 에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환한다.
- Main Claude가 반환값을 받아 다음 에이전트를 순서대로 호출한다.
- 파이프라인 흐름은 \`.claude/agents/agent-flow.md\` 기준을 따른다.

예: \`[추가기능]\`, \`[버그수정]\`, \`[리팩토링]\`, \`[WORK 시작]\` 등
`.trimStart();

export const CLAUDE_MD_SECTION_EN = `
## Agent Invocation Rules

Requests starting with a \`[]\` tag → read \`.claude/agents/agent-flow.md\` and execute the pipeline.

- **Main Claude is the orchestrator.** All agent invocations are performed directly by Main Claude.
- On \`[]\` tag detection → invoke specifier (first agent)
- Each agent only returns results (dispatch XML or task-result XML) after completing its work.
- Main Claude receives return values and invokes the next agent in sequence.
- Pipeline flow follows \`.claude/agents/agent-flow.md\`.

Examples: \`[new-feature]\`, \`[bugfix]\`, \`[enhancement]\`, \`[new-work]\`, etc.
`.trimStart();

export function getClaudeMdSection(lang) {
  return lang === 'ko' ? CLAUDE_MD_SECTION_KO : CLAUDE_MD_SECTION_EN;
}
