# TASK-05: 루트 정리 및 문서 업데이트

## WORK
WORK-31: 프로젝트 폴더 구조 재구조화 (agents / npm / plugin 분리)

## Dependencies
- TASK-03 (required)
- TASK-04 (required)

## Scope
루트의 구 파일/디렉토리를 제거한다 (bin/, lib/, .claude-plugin/, .npmignore, package.json). CLAUDE.md Push 절차에 에이전트 동기화 단계를 추가한다. README.md Repository Structure 섹션을 새 구조로 업데이트한다. 최종 검증으로 `cd npm && npm pack`을 실행한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `bin/` | DELETE | 루트 bin 디렉토리 제거 (npm/bin/으로 이동 완료) |
| `lib/` | DELETE | 루트 lib 디렉토리 제거 (npm/lib/으로 이동 완료) |
| `.claude-plugin/` | DELETE | 루트 플러그인 디렉토리 제거 (plugin/으로 이동 완료) |
| `.npmignore` | DELETE | 루트 .npmignore 제거 (npm/으로 이동 완료) |
| `package.json` | DELETE | 루트 package.json 제거 (npm/으로 이동 완료) |
| `CLAUDE.md` | MODIFY | Push 절차에 에이전트 동기화 단계 추가 |
| `README.md` | MODIFY | Repository Structure 섹션 업데이트 |

## Acceptance Criteria
- [ ] 루트에 bin/, lib/, .claude-plugin/, .npmignore 존재하지 않음
- [ ] 루트에 package.json 존재하지 않음
- [ ] CLAUDE.md Push 절차에 에이전트 동기화 단계 포함
- [ ] README.md Repository Structure가 새 구조 반영
- [ ] `cd npm && npm pack` 정상 실행

## Verify
```bash
# 구 파일 제거 확인
test ! -d bin && echo "bin/ removed OK"
test ! -d lib && echo "lib/ removed OK"
test ! -d .claude-plugin && echo ".claude-plugin/ removed OK"
test ! -f .npmignore && echo ".npmignore removed OK"
test ! -f package.json && echo "package.json removed OK"

# CLAUDE.md 동기화 단계 확인
grep -c "동기화" CLAUDE.md

# npm pack 검증
cd npm && npm pack --dry-run
```
