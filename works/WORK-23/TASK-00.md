# TASK-00: Callback Integration 시각화 HTML 작성

## WORK
WORK-23: Callback Integration 시각화 HTML 작성

## Dependencies
- (none)

## Scope

`docs/spec_callback-integration.md` 스펙 문서를 기반으로 Callback Integration 시각화 HTML 단일 파일을 생성한다.

기존 `docs/pipeline-architecture-visual.html` 디자인 패턴을 준수한다:
- 다크/라이트 테마 토글
- 탭 기반 네비게이션
- CSS 변수 기반 색상 시스템
- 반응형 레이아웃

### 시각화 포함 내용

1. **Overview 탭**: Callback 시스템 개요, 설계 원칙 4가지, CLAUDE.md 설정 필드 3개
2. **Callback Flow 탭**: execution-mode별 콜백 전송 주체 테이블 + Sequence Diagram 시각화 (direct 모드 / pipeline+full 모드)
3. **Payload Schema 탭**: TaskCallback JSON Schema (9 필드), ProgressCallback JSON Schema (6 필드), 필드별 설명
4. **Error Handling 탭**: Curl Failure 처리, Network Transience 가정, Timeout 정책, Authorization Failure 처리, Idempotency 키 전략

### 참조 스펙 문서
- `docs/spec_callback-integration.md` (전체)
- `docs/pipeline-architecture-visual.html` (디자인 패턴 참고)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/callback-integration-visual.html` | CREATE | Callback Integration 시각화 HTML 단일 파일 |

## Acceptance Criteria
- [ ] `docs/callback-integration-visual.html` 파일 생성
- [ ] 4개 탭 구조: Overview, Callback Flow, Payload Schema, Error Handling
- [ ] 다크/라이트 테마 토글 동작
- [ ] execution-mode별 콜백 흐름 시각화 (direct vs pipeline/full)
- [ ] TaskCallback, ProgressCallback JSON Schema 표시
- [ ] Error Handling 전략 및 Idempotency 키 전략 표시
- [ ] 기존 HTML 시각화 파일과 일관된 디자인 (CSS 변수, 색상 체계)
- [ ] 브라우저에서 정상 렌더링 (외부 의존성 없는 단일 파일)

## Verify
```bash
# 파일 존재 확인
test -f docs/callback-integration-visual.html && echo "PASS: file exists" || echo "FAIL: file missing"

# 필수 키워드 포함 확인
grep -q "TaskCallback" docs/callback-integration-visual.html && echo "PASS: TaskCallback" || echo "FAIL: TaskCallback missing"
grep -q "ProgressCallback" docs/callback-integration-visual.html && echo "PASS: ProgressCallback" || echo "FAIL: ProgressCallback missing"
grep -q "data-theme" docs/callback-integration-visual.html && echo "PASS: theme toggle" || echo "FAIL: theme toggle missing"
```
