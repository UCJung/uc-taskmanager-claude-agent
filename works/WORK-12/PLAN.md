# WORK-12 PLAN

> Title: README.md / README_KO.md 개선 — 사용법 섹션 재배치 + router_rule_config.json 설명 추가
> Status: IN_PROGRESS
> Created: 2026-03-14
> Language: ko
> Execution-Mode: full

## 목표

README.md와 README_KO.md 두 파일에 대해 다음 두 가지 개선을 수행한다:

1. **사용법(Usage) 섹션을 개념 설명 앞으로 이동** — 독자가 "어떻게 쓰는지"를 먼저 파악할 수 있도록 섹션 순서를 재배치한다.
2. **`.agent/router_rule_config.json` 설명 섹션 추가** — config 파일의 구조, 설정 방법, 커스터마이즈 예시, fallback 동작을 문서화한다.

## 변경 대상

- `README.md` (영문)
- `README_KO.md` (한국어)

## 섹션 순서 변경 계획

### 현재 순서
```
Introduction
개념(실행 모드) ← 개념 먼저
파이프라인
에이전트 목록
[] 태그 시스템
파일 구조
설치
사용법 ← 사용법 나중에
팁
예제 세션
왜 이 방식인가?
산출물 언어
커스터마이징
지원 스택
저장소 구조
요구 사항
MCP 설정
라이선스
```

### 변경 후 순서
```
Introduction
사용법 ← 사용법 먼저 (Quick Start)
[] 태그 시스템
설치
개념(실행 모드) ← 개념 나중에 (심화)
파이프라인
에이전트 목록
파일 구조
팁
예제 세션
왜 이 방식인가?
  → router_rule_config.json 섹션 신규 추가 (여기에 삽입)
산출물 언어
커스터마이징
지원 스택
저장소 구조
요구 사항
MCP 설정
라이선스
```

## router_rule_config.json 추가 섹션 내용

### 영문 (README.md)
- 섹션명: `### Router Rule Config (`.agent/router_rule_config.json`)`
- 위치: `## Why This Approach?` 섹션 내, `### Three Execution Modes` 바로 위
- 내용: 파일 경로 및 목적, JSON 구조 설명, 필드별 설명, 커스터마이즈 예시, config 없을 때 fallback 동작

### 한국어 (README_KO.md)
- 섹션명: `### Router 판정 기준 config (`.agent/router_rule_config.json`)`
- 위치: `## 왜 이 방식인가?` 섹션 내, `### 세 가지 실행 모드` 바로 위

## TASK 구성

| TASK | 제목 | 선행 |
|------|------|------|
| TASK-00 | README.md 섹션 재배치 + config 설명 추가 | 없음 |
| TASK-01 | README_KO.md 섹션 재배치 + config 설명 추가 | TASK-00 참조 |

## 완료 조건

- [ ] README.md: 사용법 섹션이 개념 섹션 앞에 위치
- [ ] README.md: router_rule_config.json 설명 섹션 추가됨
- [ ] README_KO.md: 동일하게 적용됨
- [ ] 두 파일 모두 마크다운 구조 오류 없음 (헤더 계층, 링크 등)
