# TASK-00: Sliding Window Context Transfer 시각화 HTML 구현

## WORK
WORK-22: Sliding Window Context Transfer 시각화 HTML 작성

## Dependencies
- (none)

## Scope
docs/spec_sliding-window-context.md의 전체 내용을 시각화하는 단일 HTML 파일을 작성한다.
기존 docs/pipeline-architecture-visual.html의 스타일(다크/라이트 테마, CSS 변수, 카드 레이아웃, 탭 네비게이션)을 참고하여 통일감 있는 디자인을 적용한다.

### 시각화 대상 섹션 (탭 구성)
1. **개요** - 배경/문제 인식, 단일 세션 vs 멀티 에이전트 비교 다이어그램
2. **설계 원칙** - 슬라이딩 윈도우, 필요한 컨텍스트만, 역할 분리 3가지 원칙 카드
3. **context-handoff** - XML 구조체 시각화, FULL/SUMMARY/DROP detail-level 비교
4. **Execution Mode별 흐름** - direct/pipeline/full 3가지 모드의 컨텍스트 전달 흐름도
5. **TASK 간 전달** - full 모드 슬라이딩 윈도우 의존성 전달 다이어그램 (TASK-00~03 예시)
6. **체크포인트 시스템** - progress.md 상태 전이 + committer Gate 역할 흐름
7. **토큰 절감** - 기존 방식 vs 슬라이딩 윈도우 토큰 비교 차트 (막대 그래프)

### 기술 요구사항
- 단일 HTML 파일 (외부 의존성 없음, inline CSS/JS)
- 다크/라이트 테마 토글
- 탭 기반 네비게이션
- CSS 애니메이션/트랜지션
- 반응형 레이아웃
- 인터랙티브 요소 (클릭 시 상세 표시 등)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/sliding-window-context-visual.html` | CREATE | 슬라이딩 윈도우 컨텍스트 전달 시각화 HTML |

## Acceptance Criteria
- [ ] 7개 탭이 모두 동작하고 각 탭에 해당 시각화 콘텐츠가 표시된다
- [ ] 다크/라이트 테마 토글이 동작한다
- [ ] 반응형 레이아웃이 모바일에서도 정상 표시된다
- [ ] spec 문서의 핵심 내용이 빠짐없이 시각화되어 있다
- [ ] 토큰 절감 차트가 인터랙티브하게 동작한다

## Verify
```bash
# 파일 존재 확인
test -f docs/sliding-window-context-visual.html && echo "PASS" || echo "FAIL"
# HTML 유효성 기본 확인
grep -c "</html>" docs/sliding-window-context-visual.html
```
