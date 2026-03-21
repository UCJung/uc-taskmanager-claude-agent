# TASK-02: specifier.md IN_PROGRESS/DONE 안내 문구 반영

## WORK
WORK-38: WORK-LIST 3단계 상태 분리 (IN_PROGRESS/DONE/COMPLETED)

## Dependencies
- TASK-00 (required)

## Scope
en/ko 양쪽 specifier.md § 3-2에서 IN_PROGRESS WORK 존재 시 안내 문구에 DONE 상태도 포함한다.

변경 내용:
1. en § 3-2: "When IN_PROGRESS WORK exists:" 안내 문구에 DONE 포함
   - 기존: "There is an ongoing WORK-XX."
   - 변경: "There is an ongoing WORK-XX (IN_PROGRESS) or completed WORK-XX (DONE)."
2. ko § 3-2: "IN_PROGRESS WORK 존재 시:" 안내 문구에 DONE 포함
   - 기존: "현재 진행 중인 WORK-XX가 있습니다."
   - 변경: "현재 진행 중(IN_PROGRESS)이거나 완료 대기(DONE) 상태인 WORK-XX가 있습니다."

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/en/specifier.md` | MODIFY | § 3-2 안내 문구에 DONE 상태 추가 |
| `agents/ko/specifier.md` | MODIFY | § 3-2 안내 문구에 DONE 상태 추가 |

## Acceptance Criteria
- [ ] en § 3-2에 DONE 언급 존재
- [ ] ko § 3-2에 DONE 언급 존재
- [ ] 기존 IN_PROGRESS 안내 기능 유지

## Verify
```bash
grep -A2 "IN_PROGRESS WORK" agents/en/specifier.md
grep -A2 "IN_PROGRESS WORK" agents/ko/specifier.md
```
