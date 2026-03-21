# TASK-01: HTML 시각화 v1.2 갱신 + EN/KO 언어 전환

## WORK
WORK-37: Pipeline Architecture Spec v1.2 현행화 + HTML 시각화 갱신

## Dependencies
- TASK-00 (required)

## Scope

spec v1.2 문서 내용을 기반으로 HTML 시각화 파일을 전면 갱신하고, 영문/한글 언어 전환 기능을 추가한다.

### 주요 작업

1. **콘텐츠 갱신**: spec v1.2에 맞게 모든 에이전트, 파이프라인 흐름, 테이블, 다이어그램 갱신
   - Router → Specifier 전환
   - 6개 에이전트 구조 반영 (specifier, planner, scheduler, builder, verifier, committer)
   - execution-mode 3종 흐름도 갱신 (direct: Specifier 겸임, pipeline: Specifier→Planner→B→V→C, full: Specifier→Planner→Scheduler→[B→V→C]×N)
   - WORK-LIST.md 3단계 상태 반영
   - Dispatcher-Receiver 매핑 갱신
   - 불변 보장 항목 갱신

2. **EN/KO 언어 전환 UI**:
   - 헤더 영역에 언어 전환 토글/드롭다운 추가
   - JavaScript로 모든 텍스트 콘텐츠를 EN/KO 양국어로 관리
   - 페이지 새로고침 없이 즉시 반영 (DOM 조작)
   - `data-i18n` 속성 또는 유사한 방식으로 텍스트 요소 식별
   - 기본 언어: 한글 (KO)

3. **디자인 유지**:
   - 기존 다크/라이트 테마 전환 유지
   - 기존 애니메이션(fadeIn, hover 효과 등) 유지
   - 반응형 레이아웃 유지
   - 에이전트별 색상 코드 유지 (specifier는 기존 router 색상 또는 새 색상 배정)

### 참조 문서
- `docs/spec_pipeline-architecture_v1.2.md` — 갱신된 v1.2 명세 (TASK-00 산출물)
- `docs/pipeline-architecture-v1.1-visual.html` — 기존 HTML (구조/디자인 참조)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/pipeline-architecture-v1.2-visual.html` | CREATE | v1.2 기반 HTML 시각화 (EN/KO 토글 포함) |
| `docs/pipeline-architecture-v1.1-visual.html` | DELETE | v1.2로 대체 |

## Acceptance Criteria
- [ ] HTML 내 에이전트 구성이 spec v1.2와 일치 (6개 에이전트: specifier, planner, scheduler, builder, verifier, committer)
- [ ] 파이프라인 흐름도가 spec v1.2와 일치 (Router 참조 없음)
- [ ] EN/KO 언어 전환 토글이 존재하고 동작함
- [ ] 언어 전환 시 페이지 새로고침 없이 모든 텍스트가 즉시 변경됨
- [ ] 다크/라이트 테마 전환이 정상 동작함
- [ ] 기존 애니메이션(fadeIn, hover) 효과 유지
- [ ] execution-mode 3종(direct, pipeline, full)의 흐름이 Specifier 기준으로 표시
- [ ] WORK-LIST.md 3단계 상태(IN_PROGRESS→DONE→COMPLETED) 반영
- [ ] 파일명이 `pipeline-architecture-v1.2-visual.html`

## Verify
```bash
# 1. v1.2 HTML 파일 존재 확인
test -f "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: v1.2 HTML exists" || echo "FAIL: v1.2 HTML missing"

# 2. v1.1 HTML 파일 삭제 확인
test ! -f "docs/pipeline-architecture-v1.1-visual.html" && echo "PASS: v1.1 HTML removed" || echo "FAIL: v1.1 HTML still exists"

# 3. Router 단어 잔존 확인 (역사적 맥락 제외)
ROUTER_COUNT=$(grep -c -i "router" "docs/pipeline-architecture-v1.2-visual.html" 2>/dev/null || echo "0")
echo "INFO: 'router/Router' occurrences in HTML = ${ROUTER_COUNT} (should be 0 or minimal)"

# 4. Specifier 존재 확인
grep -qi "specifier" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: specifier found in HTML" || echo "FAIL: specifier missing"

# 5. 언어 전환 메커니즘 확인
grep -q "data-i18n\|data-lang\|i18n\|lang-toggle\|switchLang\|setLanguage" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: i18n mechanism found" || echo "FAIL: i18n mechanism missing"

# 6. 한글/영문 콘텐츠 존재 확인
grep -q "한글\|한국어\|KO\|ko" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: Korean content found" || echo "FAIL"
grep -q "EN\|English\|en" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: English content found" || echo "FAIL"

# 7. 테마 전환 유지 확인
grep -q "data-theme\|theme" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: theme toggle exists" || echo "FAIL"

# 8. 6개 에이전트 HTML 내 존재 확인
for agent in specifier planner scheduler builder verifier committer; do
  grep -qi "$agent" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: $agent in HTML" || echo "FAIL: $agent missing in HTML"
done

# 9. v1.2 버전 표기 확인
grep -q "v1.2" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: v1.2 in HTML" || echo "FAIL"

# 10. 3단계 상태 키워드 확인
grep -q "IN_PROGRESS" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: IN_PROGRESS in HTML" || echo "FAIL"
grep -q "COMPLETED" "docs/pipeline-architecture-v1.2-visual.html" && echo "PASS: COMPLETED in HTML" || echo "FAIL"
```
