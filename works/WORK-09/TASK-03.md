# WORK-09-TASK-03: 콜백 통합 설계 명세 문서 작성

## WORK
WORK-09: CLAUDE.md 콜백 URL 기반 외부 시스템 결과 전달

## Dependencies
- WORK-09-TASK-01 (required)
- WORK-09-TASK-02 (required)

## Scope

전체 콜백 통합 설계를 정리한 명세 문서 `docs/spec_callback-integration.md`를 작성한다. TASK-01(committer TaskCallback)과 TASK-02(builder ProgressCallback)의 구현 결과를 바탕으로, 외부 시스템 연동에 필요한 모든 정보를 하나의 문서에 통합한다.

### 문서에 포함할 내용

1. **개요**: 콜백 시스템의 목적과 설계 원칙 (선택적 활성화, 실패 허용, 범용성 유지)
2. **CLAUDE.md 설정 스펙**: Task Callbacks 섹션 형식, 각 키의 의미와 용도
3. **TaskCallback 스키마**: committer가 전송하는 페이로드 JSON 스키마 + 필드 설명
4. **ProgressCallback 스키마**: builder가 전송하는 페이로드 JSON 스키마 + 필드 설명
5. **흐름 다이어그램**: builder/committer의 콜백 호출 타이밍을 Mermaid 시퀀스 다이어그램으로 표현
6. **에러 처리 전략**: curl 실패, 타임아웃, 네트워크 오류 시 동작 정의
7. **외부 시스템 구현 가이드**: 콜백을 수신하는 측(예: uc-teamspace)의 엔드포인트 구현 참고사항

## Files

| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_callback-integration.md` | CREATE | 콜백 통합 설계 명세 — 설정 스펙, 페이로드 스키마, 흐름도, 에러 처리 |

## Acceptance Criteria
- [ ] `docs/spec_callback-integration.md` 파일이 생성됨
- [ ] CLAUDE.md 콜백 설정 형식(TaskCallback, ProgressCallback, CallbackToken)이 문서화됨
- [ ] TaskCallback 페이로드 JSON 스키마가 필드별 설명과 함께 문서화됨
- [ ] ProgressCallback 페이로드 JSON 스키마가 필드별 설명과 함께 문서화됨
- [ ] builder/committer 콜백 흐름이 다이어그램(Mermaid 등)으로 설명됨
- [ ] 에러 처리 전략(curl 실패, 타임아웃 등)이 문서화됨
- [ ] 외부 시스템(콜백 수신측) 구현 참고사항이 포함됨

## Verify
```bash
# 파일 존재 확인
test -f docs/spec_callback-integration.md && echo "PASS: spec file exists" || echo "FAIL"

# 핵심 섹션 존재 확인
grep "TaskCallback" docs/spec_callback-integration.md && echo "PASS: TaskCallback documented" || echo "FAIL"
grep "ProgressCallback" docs/spec_callback-integration.md && echo "PASS: ProgressCallback documented" || echo "FAIL"
grep "CallbackToken" docs/spec_callback-integration.md && echo "PASS: CallbackToken documented" || echo "FAIL"

# 다이어그램 존재 확인
grep -i "mermaid\|sequenceDiagram\|흐름" docs/spec_callback-integration.md && echo "PASS: diagram exists" || echo "FAIL"

# 에러 처리 섹션 확인
grep -i "error\|에러\|실패\|timeout\|타임아웃" docs/spec_callback-integration.md && echo "PASS: error handling documented" || echo "FAIL"
```
