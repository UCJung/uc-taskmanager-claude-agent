# TASK-01: FileManager + WorkParser 코어 모듈

## WORK
WORK-31: MCP Server Phase 1 — Core MCP Server 구현

## Dependencies
- TASK-00 (required)

## Scope
파일 시스템 추상화 계층(FileManager)과 WORK/TASK 파싱 로직(WorkParser)을 구현한다.

FileManager는 fs/promises 기반으로 readFile, writeFile, listDir, exists, readDir 등을 제공한다. WorkParser는 FileManager를 사용하여 다음 기능을 구현한다:

- `listWorks()`: works/ 디렉토리 스캔 + WORK-LIST.md 파싱, 각 WORK의 ID/제목/진행률 반환
- `getNextWorkId()`: 파일시스템 스캔으로 다음 WORK 번호 산출
- `readPlan(workId)`: PLAN.md 파싱 — 메타정보 7개 필드 + Goal + Tasks 추출
- `extractTasksFromPlan(planContent)`: PLAN.md에서 TASK 목록 추출
- `getWorkStatus(workId)`: 진행률 계산 (TASK 파일 수 vs result 파일 수)
- `readTaskResult(workId, taskId)`: TASK-XX_result.md 읽기
- `readTaskProgress(workId, taskId)`: TASK-XX_progress.md 읽기
- `detectTechStack(projectPath)`: package.json/pyproject.toml/Cargo.toml/go.mod 감지
- `parseActivityLog(workId, lastN?)`: work_{WORK_ID}.log 파싱 — [timestamp]_AGENT_STAGE_DESC 포맷

파일명 정규식 (parseTaskFilename 호환):
- TASK 파일: `/^TASK-(\d+)\.md$/`
- progress 파일: `/^TASK-(\d+)_progress\.md$/`
- result 파일: `/^TASK-(\d+)_result\.md$/`

설계문서 참조: docs/plan_MCP-Integration-Design.md §3.2(프로젝트 구조), §4.2(Pipeline Tool 내 parser 사용 예시), §6 Phase 1 TASK-01

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/core/file-manager.ts` | CREATE | 파일 시스템 추상화 — readFile, writeFile, listDir, exists |
| `mcp-server/src/core/work-parser.ts` | CREATE | WORK/TASK 파싱 — listWorks, getNextWorkId, readPlan, getWorkStatus, readTaskResult, detectTechStack, parseActivityLog |
| `mcp-server/src/core/__tests__/work-parser.test.ts` | CREATE | WorkParser 단위 테스트 — listWorks, getWorkStatus, readPlan, 파일명 정규식 검증 |

## Acceptance Criteria
- [ ] FileManager가 readFile, writeFile, listDir, exists 메서드 제공
- [ ] WorkParser.listWorks()가 works/ 디렉토리에서 WORK 목록을 올바르게 반환
- [ ] WorkParser.getWorkStatus()가 TASK 파일 수와 result 파일 수 기반 진행률 계산
- [ ] WorkParser.readPlan()이 PLAN.md 메타정보 7개 필드를 올바르게 파싱
- [ ] WorkParser.readTaskResult()가 TASK-XX_result.md 내용을 반환
- [ ] WorkParser.parseActivityLog()가 로그 엔트리를 올바르게 파싱
- [ ] 파일명 정규식이 TASK-00.md, TASK-00_progress.md, TASK-00_result.md 패턴만 매칭
- [ ] npx tsc --noEmit 통과
- [ ] npx vitest run 통과 (단위 테스트)

## Verify
```bash
cd mcp-server && npx tsc --noEmit && npx vitest run
```
