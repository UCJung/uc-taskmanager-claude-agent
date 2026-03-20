# WORK-10-TASK-00: mini-PLAN 명칭을 PLAN으로 전면 치환

## WORK
WORK-10: mini-PLAN.md 명칭을 PLAN.md로 통일

## Dependencies
- (없음)

## Scope
5개 대상 파일에서 `mini-PLAN` 관련 텍스트를 `PLAN`으로 치환하고, Router가 direct/pipeline 모드에서 직접 PLAN.md를 생성한다는 점을 명확히 보강한다.

### 파일별 작업 내용

1. **`.claude/agents/router.md`** — 이미 sed로 mini-PLAN -> PLAN 치환 완료. "Router가 직접 PLAN.md를 생성한다"는 문구 명시 보강 필요. Planner가 만드는 것으로 오해하지 않도록 문맥 확인.
2. **`.claude/agents/xml-schema.md`** — 이미 sed 치환 완료. 내용 검토 후 추가 수정 필요시 반영.
3. **`README.md`** — mini-PLAN 언급이 아직 남아 있음. PLAN으로 치환.
4. **`README_KO.md`** — mini-PLAN 언급이 아직 남아 있음. PLAN으로 치환.
5. **`docs/spec_pipeline-architecture.md`** — 이미 sed 치환 완료. 내용 검토.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `.claude/agents/router.md` | MODIFY | Router 직접 생성 문구 보강 |
| `.claude/agents/xml-schema.md` | MODIFY | 치환 결과 검토 + 필요시 추가 수정 |
| `README.md` | MODIFY | mini-PLAN -> PLAN 치환 |
| `README_KO.md` | MODIFY | mini-PLAN -> PLAN 치환 |
| `docs/spec_pipeline-architecture.md` | MODIFY | 치환 결과 검토 |

## Acceptance Criteria
- [ ] `grep -r "mini-PLAN" . --include="*.md"` 결과 0건
- [ ] router.md에 "Router가 직접 PLAN.md를 생성" 문구가 명확히 존재
- [ ] xml-schema.md에서 mini-PLAN 언급 0건
- [ ] README.md에서 mini-PLAN 언급 0건
- [ ] README_KO.md에서 mini-PLAN 언급 0건
- [ ] 각 파일의 문맥이 자연스럽게 유지됨

## Verify
```bash
# mini-PLAN 잔존 여부 확인 (0건이어야 통과)
grep -r "mini-PLAN" . --include="*.md" | grep -v node_modules | grep -v WORK-10
# router.md에 직접 생성 문구 존재 확인
grep -n "Router.*직접.*PLAN\|Router.*directly.*PLAN" .claude/agents/router.md
```
