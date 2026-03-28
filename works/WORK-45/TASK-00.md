# TASK-00: README.md 및 README_KO.md 현행화

## WORK
WORK-45: 기술문서 및 README 영/한 현행화 (v1.4.0~v1.5.0)

## Dependencies
- (none)

## Scope
README.md (영문)과 README_KO.md (한국어) 양쪽에 2026-03-28 변경사항을 반영한다.

### 반영할 변경사항

1. **Spawn 결합 (326d238)**
   - Pipeline/full 모드: specifier+planner가 단일 spawn으로 결합
   - 모든 모드: verifier+committer가 단일 spawn으로 결합
   - 총 spawn 수 30% 감소 (6 TASK 기준: 20 → 14)
   - Pipeline 다이어그램, Token Economy 섹션, Three Execution Modes 섹션 갱신

2. **자동 권한 설정 (2840e05, v1.4.0)**
   - Quick Start: `uctm init` 시 settings.local.json에 Bash 권한 자동 설정
   - "During init, you'll be prompted..." → 자동 설정으로 변경
   - 권한 프롬프트 관련 안내 갱신

3. **Plugin 리소스 설치 (2e9de2e)**
   - `uctm init` 시 .claude-plugin 및 skills 폴더도 설치

4. **npm v1.5.0 (ca11d63)**
   - npm 패키지에 plugin 리소스(.claude-plugin, skills) 포함

5. **Pipe 명령어 제거 (27ea790)**
   - Windows 등 권한 호환성 개선 언급

6. **README_KO.md 저장소 구조**
   - docs/ 섹션이 실제 파일명(v1.3 suffix 등)과 일치하지 않음 → 갱신 필요

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | 영문 README v1.4.0~v1.5.0 변경사항 반영 |
| `README_KO.md` | MODIFY | 한국어 README 동일 변경사항 반영 + 저장소 구조 갱신 |

## Acceptance Criteria
- [ ] README.md Pipeline 다이어그램에 spawn 결합이 반영됨
- [ ] README.md Token Economy에 spawn 30% 감소 추가
- [ ] README.md Quick Start에 자동 권한 설정 반영
- [ ] README_KO.md에 동일 내용 한국어 반영
- [ ] README_KO.md 저장소 구조 docs/ 파일명이 실제와 일치

## Verify
```bash
# 문서 변경이므로 별도 빌드/테스트 불필요
# README 내용 확인
head -100 README.md
head -100 README_KO.md
```
