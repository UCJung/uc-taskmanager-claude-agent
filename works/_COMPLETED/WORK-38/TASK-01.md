# TASK-01: committer.md § 3-9-1 DONE 전환으로 변경

## WORK
WORK-38: WORK-LIST 3단계 상태 분리 (IN_PROGRESS/DONE/COMPLETED)

## Dependencies
- TASK-00 (required)

## Scope
en/ko 양쪽 committer.md를 수정하여, 마지막 TASK 완료 시 행 제거 + _COMPLETED 이동 대신 IN_PROGRESS → DONE 변경만 수행하도록 한다.

변경 내용:
1. § 3-9-1 제목: "WORK Archival (Last TASK)" → "WORK 상태 전환 (마지막 TASK)"
2. § 3-9-1 내용: sed로 행 제거 + mv _COMPLETED 대신, sed로 IN_PROGRESS → DONE 변경 + 완료일 기입
3. § 4 WORK-LIST.md Rules: "행 제거 + _COMPLETED 이동" → "IN_PROGRESS → DONE 변경"
4. bash 스크립트 교체:
   - 기존: `sed -i "/| ${WORK_ID} |/d"` + `mv works/${WORK_ID} works/_COMPLETED/`
   - 변경: `sed -i "s/| ${WORK_ID} |.*IN_PROGRESS/... DONE .../"` + 완료일 기입

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/en/committer.md` | MODIFY | § 3-9-1 DONE 전환, § 4 규칙 갱신 |
| `agents/ko/committer.md` | MODIFY | § 3-9-1 DONE 전환, § 4 규칙 갱신 |

## Acceptance Criteria
- [ ] en § 3-9-1에서 _COMPLETED 이동 코드 제거됨
- [ ] en § 3-9-1에서 IN_PROGRESS → DONE sed 변경 코드 존재
- [ ] ko § 3-9-1에서 _COMPLETED 이동 코드 제거됨
- [ ] ko § 3-9-1에서 IN_PROGRESS → DONE sed 변경 코드 존재
- [ ] en § 4 WORK-LIST.md Rules에 "DONE 변경" 문구
- [ ] ko § 4 WORK-LIST.md 규칙에 "DONE 변경" 문구
- [ ] en/ko 내용 동기화 확인

## Verify
```bash
# _COMPLETED 이동이 제거되었는지 확인
grep -c "_COMPLETED" agents/en/committer.md  # 0이어야 함
grep -c "_COMPLETED" agents/ko/committer.md  # 0이어야 함
# DONE 전환이 존재하는지 확인
grep -c "DONE" agents/en/committer.md
grep -c "DONE" agents/ko/committer.md
```
