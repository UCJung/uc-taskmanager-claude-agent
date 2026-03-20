# Requirement — WORK-31

## Original Request
> 폴더구조 변경을 현재 계획된 내용으로 실행 — uc-taskmanager 프로젝트를 projectRoot 아래 `agents/`, `npm/`, `plugin/` 세 개 하위 폴더로 재구조화

## Functional Requirements

- FR-01: agents/ 루트의 en 에이전트 파일 12개를 agents/en/*.md로 이동
- FR-02: npm/ 폴더 생성 및 bin/, lib/, package.json, .npmignore, .agent/ 를 npm/ 하위로 이동
- FR-03: plugin/ 폴더 생성 및 .claude-plugin/ 을 plugin/.claude-plugin/ 으로 이동
- FR-04: npm/lib/constants.mjs 내 경로 수정 (npm/ 내부 기준으로 변경)
- FR-05: npm/package.json의 files 필드 수정
- FR-06: plugin/.claude-plugin/plugin.json의 agents 경로 확인/수정
- FR-07: 초기 에이전트 복사 수행 — agents/en/ -> npm/agents/, agents/ko/ -> npm/agents/ko/, agents/en/ -> plugin/agents/
- FR-08: plugin/README.md 생성 (Plugin 전용 README)
- FR-09: CLAUDE.md Push 절차에 에이전트 동기화 단계 추가
- FR-10: 루트 README.md Repository Structure 섹션 업데이트
- FR-11: 구 디렉토리/파일 정리 — 루트의 bin/, lib/, .claude-plugin/, .npmignore 제거

## Non-Functional Requirements

- NFR-01: npm publish는 npm/ 디렉토리에서 직접 수행 가능해야 함 (package.json이 npm/ 루트에 위치)
- NFR-02: Plugin은 plugin/ 디렉토리가 플러그인 루트 역할을 해야 함 (.claude-plugin/plugin.json 위치)
- NFR-03: agents 배열은 plugin.json에서 배열 형식 필수 (문자열 지정 시 설치 실패)
- NFR-04: 기존 uctm 사용자 호환성 유지 (npm 패키지 설치/업데이트 정상 동작)
- NFR-05: agent 원본은 agents/에서 개발, push 시 npm/agents 및 plugin/agents로 복사하는 워크플로우

## Acceptance Criteria

- [ ] agents/ 폴더에 en/, ko/ 서브디렉토리만 존재 (루트 레벨 .md 파일 없음)
- [ ] npm/ 폴더에 package.json, bin/, lib/, agents/, .agent/ 존재
- [ ] plugin/ 폴더에 .claude-plugin/, agents/, README.md 존재
- [ ] `cd npm && npm pack` 정상 실행
- [ ] plugin/.claude-plugin/plugin.json의 agents 경로가 유효
- [ ] npm/lib/constants.mjs의 경로 참조가 npm/ 기준으로 정상 동작
- [ ] 루트에 bin/, lib/, .claude-plugin/, .npmignore 잔존 파일 없음
- [ ] CLAUDE.md Push 절차에 에이전트 동기화 단계 포함
- [ ] README.md Repository Structure가 새 구조 반영
