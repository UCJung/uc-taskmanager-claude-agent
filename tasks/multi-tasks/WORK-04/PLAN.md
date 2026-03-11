# WORK-04: builder.md에 Serena MCP 도구 우선 탐색 지침 추가

> Created: 2026-03-11
> Project: uc-taskmanager
> Language: ko

## 목표

`agents/builder.md`의 코드 탐색 방식을 bash 명령어 기반에서 Serena MCP 심볼 탐색 우선으로 개선한다.
완료 후 전역 설정(`~/.claude/agents/builder.md`)에도 동일하게 반영한다.

## 배경

현재 builder.md 문제:
- tools 목록에 Serena 도구 없음 (`tools: Read, Write, Edit, Bash, Glob, Grep`)
- "Before ANY Implementation" 섹션이 bash 명령어(cat, find, ls, grep)만 사용
- 파일 전체 읽기 방식 → 심볼 단위 탐색으로 교체하면 토큰 30~50% 절감 가능

## TASK 목록

| TASK | 제목 | 의존 |
|------|------|------|
| WORK-04-TASK-00 | builder.md Serena 탐색 지침 개선 | 없음 |
| WORK-04-TASK-01 | 전역 반영 및 완료 처리 | TASK-00 |

## TASK 의존성 그래프

```
WORK-04-TASK-00
       │
       ▼
WORK-04-TASK-01
```
