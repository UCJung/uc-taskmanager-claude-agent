# TASK-00: README.md 및 README_KO.md 현행화

## WORK
WORK-44: README 문서 현행화 (v1.4.0)

## Dependencies
- (none)

## Scope
v1.4.0에서 변경된 8개 항목을 README.md에 반영하고 README_KO.md에 동기화한다.

### 변경 항목

1. **Combined Spawns 반영** -- 파이프라인 다이어그램에서 specifier+planner 결합, verifier+committer 결합 표현. 에이전트 테이블에서도 해당 변경 반영.
2. **Spawn Count 테이블 추가** -- 실행 모드별 서브에이전트 호출 횟수 테이블: direct 3회, pipeline 3회, full 2+2N회.
3. **Approval Gate 변경** -- pipeline/full 모드에서 승인 횟수가 2회에서 1회로 변경됨을 반영.
4. **ref-cache Phase 2** -- Selective Section Delivery 개요 추가 (에이전트별 필요 섹션만 전달).
5. **Bash CLI 실행** -- `claude -p` 비대화형 파이프라인 실행 방법 추가.
6. **Skills 수 정정** -- Marketplace Plugin 설명에서 skills 3개를 4개로 수정 (init 추가).
7. **Repository Structure** -- PRIVACY.md 파일 추가.
8. **README_KO.md 동기화** -- 위 1-7번 변경사항을 한국어 문서에도 동일하게 반영.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | 8개 변경 항목 반영 |
| `README_KO.md` | MODIFY | 변경사항 한국어 동기화 |

## Acceptance Criteria
- [ ] 파이프라인 다이어그램이 combined spawns를 반영
- [ ] 에이전트 테이블이 combined spawns를 반영
- [ ] Spawn Count 테이블 존재
- [ ] Approval Gate 1회 변경 반영
- [ ] ref-cache Phase 2 설명 추가
- [ ] `claude -p` 비대화형 실행 설명 추가
- [ ] Skills 수 4개로 표기
- [ ] Repository Structure에 PRIVACY.md 포함
- [ ] README_KO.md 동기화 완료

## Verify
```bash
grep -c "PRIVACY.md" README.md
grep -c "claude -p" README.md
grep -c "4 skills" README.md
```
