import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

export const VERSION = pkg.version;

export const AGENT_FILES = [
  'agent-flow.md',
  'builder.md',
  'committer.md',
  'context-policy.md',
  'file-content-schema.md',
  'planner.md',
  'router.md',
  'scheduler.md',
  'shared-prompt-sections.md',
  'verifier.md',
  'work-activity-log.md',
  'xml-schema.md',
];

export const CLAUDE_MD_SECTION = `
## Agent 호출 규칙

\`[]\` 태그로 시작하는 요청 → \`agents/agent-flow.md\` 를 읽고 파이프라인을 실행한다.

- **Main Claude가 오케스트레이터**다. 모든 에이전트 호출은 Main Claude가 직접 수행한다.
- 각 에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환한다.
- Main Claude가 반환값을 받아 다음 에이전트를 순서대로 호출한다.
- 파이프라인 흐름은 \`agents/agent-flow.md\` 기준을 따른다.

예: \`[추가기능]\`, \`[버그수정]\`, \`[리팩토링]\`, \`[WORK 시작]\` 등
`.trimStart();
