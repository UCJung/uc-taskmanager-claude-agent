# Requirement — WORK-30

## Original Request
> uc-taskmanager를 claude marketplace에 올리려고 해. Plugin 형식으로 전환을 진행하자.

## Resolved Questions

- Q-01: 공식 Repo는 `github.com/anthropics/claude-plugins-official`, 제출 URL은 `platform.claude.com/plugins/submit`
- Q-02: Plugin Reference (`code.claude.com/docs/en/plugins-reference`) 기반. `agents` 필드는 배열 형식만 동작 (알려진 이슈)
- Q-03: **Marketplace Plugin은 영어(en) 에이전트만 포함** — 다국어 처리 불필요. ko 에이전트는 npm CLI(`uctm init --lang ko`) 전용으로 유지

## Key Technical Constraints

- `.claude-plugin/plugin.json`에는 매니페스트만, 다른 컴포넌트는 플러그인 루트에 배치
- `agents/` 디렉토리 자동 발견 (표준 위치)
- `agents` 필드: 문자열 지정 시 설치 실패 → **배열 형식 필수**
  ```json
  // ✅ 실제 동작
  { "agents": ["./agents/specifier.md", "./agents/builder.md"] }
  ```
- Plugin 에이전트는 `hooks`, `mcpServers`, `permissionMode` frontmatter 미지원 (보안 제한)
- SessionStart 훅으로 에이전트 동적 전환 불가 (아키텍처 한계)
- `${CLAUDE_PLUGIN_ROOT}`: 플러그인 설치 경로 변수
- `${CLAUDE_PLUGIN_DATA}`: 영속적 데이터 디렉토리 (업데이트 시에도 유지)

## Plugin Standard Directory Structure

```
uc-taskmanager/           (plugin root)
├── .claude-plugin/
│   └── plugin.json       # 매니페스트 (여기만)
├── agents/               # 에이전트 정의 (.md) — en 파일만
├── commands/             # 슬래시 커맨드 (.md)
├── skills/               # 스킬 (하위 디렉토리별 SKILL.md)
├── hooks/
│   └── hooks.json
├── .mcp.json             # MCP 서버 설정
├── settings.json         # 플러그인 기본 설정
└── README.md
```

## Functional Requirements (기능 요구사항)

- FR-01: `.claude-plugin/plugin.json` 매니페스트 생성 — name, version, description, author, repository, license, keywords, agents 배열 등 메타데이터 포함
- FR-02: Plugin 디렉토리 구조 전환 — 현재 `agents/en/*.md` 12개 파일을 Plugin 표준 `agents/` 위치에 맞게 재배치. ko 에이전트는 npm CLI 전용으로 별도 경로 유지
- FR-03: 기존 npm CLI(`uctm init/update`) 방식과 Plugin 방식 병행 지원 — npm 패키지 배포와 Marketplace Plugin 배포가 동시에 가능하도록 양립 구조 설계
- FR-04: Plugin README 작성 — Marketplace 페이지에 표시될 설명, 사용법, 에이전트 목록, 설치 가이드 등
- FR-05: Marketplace 제출 준비 — `platform.claude.com/plugins/submit` 제출에 필요한 모든 파일 및 메타데이터 준비

## Non-Functional Requirements (비기능 요구사항)

- NFR-01: 기존 사용자 호환성 — 현재 `uctm init`으로 설치한 사용자 환경이 깨지지 않아야 한다
- NFR-02: Marketplace 리뷰 요건 충족 — Claude Plugin 등록 가이드라인 및 리뷰 기준을 충족해야 한다

## Acceptance Criteria

- [ ] `.claude-plugin/plugin.json` 매니페스트가 유효한 포맷으로 존재
- [ ] `agents/` 디렉토리에 en 에이전트 12개 파일이 Plugin 표준 구조로 배치
- [ ] `agents` 필드가 배열 형식으로 12개 에이전트 경로를 명시
- [ ] 기존 `uctm init --lang ko/en` 명령이 동일하게 작동
- [ ] Plugin README가 작성되어 Marketplace 등록 준비 완료
- [ ] `claude --plugin-dir ./` 로컬 테스트 시 에이전트가 정상 발견됨
