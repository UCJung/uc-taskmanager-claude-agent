# WORK-43: Boggle Game (보글 게임)

> Created: 2026-03-28
> 요구사항: works/WORK-43/Requirement.md
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: HTML/CSS/JavaScript (Vanilla)
> Language: ko
> Status: PLANNED

## Goal

4x4 격자 기반 보글(Boggle) 게임을 HTML/CSS/JS로 구현한다. 드래그 단어 입력, 영어 사전 검증, Boggle 공식 점수 계산, 3분 타이머, 반응형 UI를 포함하며 브라우저에서 서버 없이 바로 실행 가능하다.

## Task Dependency Graph

```
TASK-00 (보드 UI + 기본 구조)
  ├── TASK-01 (드래그 입력 시스템)
  └── TASK-02 (사전 + 단어 검증)
         │
         ▼
      TASK-03 (점수 + 타이머 + 게임 플로우)
              ↑
        TASK-01 ┘
```

## Tasks

### TASK-00: 보드 UI 및 기본 구조
- **Depends on**: (none)
- **Scope**: HTML/CSS/JS 기본 파일 구조 생성, 4x4 격자 보드 렌더링, 랜덤 알파벳 배치(Boggle 주사위 기반), 반응형 레이아웃(모바일/데스크탑)
- **Files**:
  - `works/WORK-43/game/index.html` — 메인 HTML 파일 (보드, 점수판, 타이머, 단어 목록 영역)
  - `works/WORK-43/game/style.css` — 반응형 CSS (격자 레이아웃, 모바일 대응)
  - `works/WORK-43/game/game.js` — 게임 코어 모듈 (보드 생성, 알파벳 배치)

### TASK-01: 드래그 입력 시스템
- **Depends on**: TASK-00
- **Scope**: 마우스 드래그 및 터치 드래그로 인접 셀(8방향) 연결, 선택 경로 시각적 피드백, 현재 선택 단어 표시, 경로 유효성(인접성 + 중복 방문 금지) 검증
- **Files**:
  - `works/WORK-43/game/game.js` — 드래그 입력 로직 추가 (mousedown/mousemove/mouseup + touch 이벤트)
  - `works/WORK-43/game/style.css` — 선택 상태 시각적 피드백 스타일 추가

### TASK-02: 영어 사전 및 단어 검증
- **Depends on**: TASK-00
- **Scope**: 경량 영어 사전 데이터 내장 (Trie 구조 또는 Set), 입력 단어의 사전 존재 여부 확인, 최소 3글자 이상 단어만 허용, 중복 입력 방지
- **Files**:
  - `works/WORK-43/game/dictionary.js` — 사전 데이터 및 검색 로직 (경량 영어 단어 목록 + Trie/Set 검증)
  - `works/WORK-43/game/game.js` — 단어 제출 시 사전 검증 연동

### TASK-03: 점수 계산, 타이머, 게임 플로우
- **Depends on**: TASK-01, TASK-02
- **Scope**: Boggle 공식 점수 규칙 적용(3-4글자=1점, 5글자=2점, 6글자=3점, 7글자=5점, 8+글자=11점), 3분 카운트다운 타이머, 시간 종료 시 게임 종료 처리(입력 비활성화 + 최종 점수 표시), New Game 버튼으로 재시작, 찾은 단어 목록 UI
- **Files**:
  - `works/WORK-43/game/game.js` — 점수 계산, 타이머, 게임 상태 관리, 재시작 로직 통합
  - `works/WORK-43/game/style.css` — 게임 종료 오버레이, 단어 목록 스타일 보완
  - `works/WORK-43/game/index.html` — 게임 종료 모달/오버레이 마크업 추가 (필요 시)
