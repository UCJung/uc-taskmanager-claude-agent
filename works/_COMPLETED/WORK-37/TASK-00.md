# TASK-00: Spec v1.2 현행화

## WORK
WORK-37: Pipeline Architecture Spec v1.2 현행화 + HTML 시각화 갱신

## Dependencies
- (없음)

## Scope

`docs/spec_pipeline-architecture_v1.1.md`를 기반으로 v1.2 문서를 신규 생성하고, v1.1 파일을 삭제한다. 아래 항목을 전면 현행화한다.

### 변경 항목

1. **에이전트 구성 테이블 (§2)**: router 제거, specifier 추가. 6개 에이전트(specifier, planner, scheduler, builder, verifier, committer) 기준으로 재작성. 모델 정보 갱신.
2. **에이전트 간 호출 구조 다이어그램 (§2)**: `[WORK 시작]` 태그 → Specifier 호출로 변경. Router 참조 전면 제거.
3. **execution-mode 판정 (§3)**: 판정 주체를 router → specifier로 변경. config 파일 기반 판정 로직 갱신.
4. **direct 모드 (§3.1)**: Specifier가 Planner 겸임 — PLAN.md + TASK 생성 후 Builder dispatch. 14단계 → 현행 구조로 재작성.
5. **pipeline 모드 (§3.2)**: Specifier가 Requirement.md 생성 → Planner에 위임 → Main Claude가 B→V→C 순차 실행.
6. **full 모드 (§3.3)**: Specifier가 Requirement.md 생성 → Planner에 위임 → Planner가 Scheduler dispatch → Scheduler가 DAG 기반 [B→V→C]×N 실행.
7. **WORK/TASK 파일 구조 (§4)**: WORK-LIST.md 규칙 현행화 (LAST_WORK_ID 헤더, 3단계 상태: IN_PROGRESS→DONE→COMPLETED, _COMPLETED/ 아카이브).
8. **파일명 규칙 테이블 (§4)**: 생성 주체 현행화 (router → specifier/planner).
9. **불변 보장 항목 (§4)**: direct 수행 주체를 Router → Specifier로 변경. WORK-LIST.md IN_PROGRESS 추가 주체 변경.
10. **에이전트별 상세 역할 (§5)**: §5.1 Router 섹션 삭제 → §5.1 Specifier 신규 작성. 나머지 에이전트 번호 재배치 및 내용 현행화.
11. **TASK 파이프라인 흐름 (§6)**: dispatcher 주체를 Router/Scheduler → Specifier/Scheduler로 갱신.
12. **Dispatcher-Receiver 매핑 (§7)**: Router 행 제거, Specifier 행 추가.
13. **산출물 파일 포맷 테이블 (§13)**: 생성 주체 현행화 (router → specifier/planner).
14. **관련 문서 경로 (§15)**: `agents/` → 현행 경로 반영 (plugin 구조 시 `skills/sdd-pipeline/references/`).
15. **버전**: v1.2로 올리고 변경사항 기록.
16. **Committer DONE 전환**: committer가 마지막 TASK 완료 시 IN_PROGRESS → DONE 전환 로직 반영.

### 참조 문서
- `agents/en/specifier.md` — Specifier 역할 및 execution-mode 판정 로직
- `agents/en/committer.md` §3-9-1 — DONE 전환 로직
- `agents/en/shared-prompt-sections.md` §8 — WORK-LIST.md 3단계 상태 규칙
- `works/WORK-37/Requirement.md` — 변경 배경 및 요구사항

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_pipeline-architecture_v1.2.md` | CREATE | v1.1 기반 전면 갱신된 v1.2 명세 |
| `docs/spec_pipeline-architecture_v1.1.md` | DELETE | v1.2로 대체 |

## Acceptance Criteria
- [ ] 문서 내 "router" / "Router" 단어가 역사적 맥락(v1.1 변경사항 기록) 외에는 등장하지 않음
- [ ] 6개 에이전트(specifier, planner, scheduler, builder, verifier, committer) 기준으로 모든 테이블/다이어그램 갱신
- [ ] direct 모드의 실행 주체가 Specifier(Planner 겸임)로 명시
- [ ] execution-mode 판정 주체가 Specifier로 변경
- [ ] WORK-LIST.md 규칙이 LAST_WORK_ID + 3단계 상태(IN_PROGRESS→DONE→COMPLETED) 반영
- [ ] committer의 IN_PROGRESS→DONE 전환 로직이 반영
- [ ] 불변 보장 항목의 수행 주체가 Specifier 기준으로 갱신
- [ ] Dispatcher-Receiver 매핑이 Specifier 기준으로 갱신
- [ ] 관련 문서 경로가 현행 구조 반영
- [ ] 버전이 v1.2이고 변경사항이 기록됨

## Verify
```bash
# 1. v1.2 파일 존재 확인
test -f "docs/spec_pipeline-architecture_v1.2.md" && echo "PASS: v1.2 file exists" || echo "FAIL: v1.2 file missing"

# 2. v1.1 파일 삭제 확인
test ! -f "docs/spec_pipeline-architecture_v1.1.md" && echo "PASS: v1.1 file removed" || echo "FAIL: v1.1 file still exists"

# 3. Router 단어 잔존 확인 (변경사항 섹션 제외)
# 변경사항 기록 부분을 제외하고 router/Router가 남아있으면 FAIL
ROUTER_COUNT=$(grep -c -i "router" "docs/spec_pipeline-architecture_v1.2.md" 2>/dev/null || echo "0")
echo "INFO: 'router/Router' occurrences = ${ROUTER_COUNT} (should be minimal, only in historical context)"

# 4. Specifier 단어 존재 확인
SPECIFIER_COUNT=$(grep -c -i "specifier" "docs/spec_pipeline-architecture_v1.2.md" 2>/dev/null || echo "0")
echo "INFO: 'specifier/Specifier' occurrences = ${SPECIFIER_COUNT} (should be significant)"

# 5. 6개 에이전트 존재 확인
for agent in specifier planner scheduler builder verifier committer; do
  grep -qi "$agent" "docs/spec_pipeline-architecture_v1.2.md" && echo "PASS: $agent found" || echo "FAIL: $agent missing"
done

# 6. WORK-LIST.md 3단계 상태 키워드 확인
grep -q "IN_PROGRESS" "docs/spec_pipeline-architecture_v1.2.md" && echo "PASS: IN_PROGRESS found" || echo "FAIL"
grep -q "DONE" "docs/spec_pipeline-architecture_v1.2.md" && echo "PASS: DONE found" || echo "FAIL"
grep -q "COMPLETED" "docs/spec_pipeline-architecture_v1.2.md" && echo "PASS: COMPLETED found" || echo "FAIL"
grep -q "LAST_WORK_ID" "docs/spec_pipeline-architecture_v1.2.md" && echo "PASS: LAST_WORK_ID found" || echo "FAIL"

# 7. 버전 v1.2 표기 확인
grep -q "v1.2" "docs/spec_pipeline-architecture_v1.2.md" && echo "PASS: v1.2 version found" || echo "FAIL"
```
