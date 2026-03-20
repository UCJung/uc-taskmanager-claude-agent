# TASK-00: README.md / README_KO.md 현행화

## WORK
WORK-32: docs 현행화 — Plugin 구조 전환 반영

## Dependencies
- (none)

## Scope
WORK-30/31에서 변경된 Plugin 구조를 README.md와 README_KO.md에 반영한다.

주요 변경사항:
1. plugin/agents/에서 support file 6개가 plugin/skills/sdd-pipeline/references/로 이동
2. plugin/skills/sdd-pipeline/SKILL.md 신규 추가
3. .claude/ 디렉토리 신규 추가 (settings.local.json)
4. plugin.json 버전 1.3.0, agents 배열에서 support files 제거
5. README_KO.md는 구 구조(agents/ 플랫)에서 신 구조(agents/en+ko/ + npm/ + plugin/ 분리)로 전면 갱신

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | Repository Structure, Support Files, Plugin 설명 갱신 |
| `README_KO.md` | MODIFY | 저장소 구조 섹션 전면 갱신 |

## Acceptance Criteria
- [ ] README.md Repository Structure가 실제 파일시스템과 일치
- [ ] README_KO.md 저장소 구조가 실제 파일시스템과 일치
- [ ] Support Files 설명에서 plugin 내 경로가 skills/sdd-pipeline/references/ 반영
- [ ] Plugin 설명에 skills 디렉토리 언급

## Verify
```bash
# 파일 존재 확인
ls README.md README_KO.md
# 변경 내용 확인
grep -n "skills/sdd-pipeline" README.md
grep -n "skills/sdd-pipeline" README_KO.md
```
