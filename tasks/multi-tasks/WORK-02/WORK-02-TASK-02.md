# WORK-02-TASK-02: README 문서 업데이트

## WORK
WORK-02: WORK Seq 인식 오류 개선

## Dependencies
- WORK-02-TASK-00 (required)

## Scope
README.md와 README_KO.md에 WORK ID 할당 규칙 변경사항을 문서화한다.

핵심 변경:
1. **README.md**: "Why This Approach?" 또는 적절한 섹션에 WORK ID가 파일시스템 기반으로 할당된다는 설명 추가. Planner가 MEMORY.md가 아닌 파일시스템을 우선 참조한다는 점 명시
2. **README_KO.md**: 동일 내용을 한국어로 반영
3. 기존 문서 구조를 최대한 유지하면서 간결하게 추가

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | WORK ID 할당 규칙 변경사항 추가 |
| `README_KO.md` | MODIFY | 동일 내용 한국어 반영 |

## Acceptance Criteria
- [ ] README.md에 파일시스템 우선 WORK ID 할당이 언급됨
- [ ] README_KO.md에 동일 내용이 한국어로 언급됨
- [ ] 기존 문서 구조가 유지됨
- [ ] 추가된 내용이 간결하고 명확함

## Verify
```bash
# README.md에 filesystem 관련 내용 확인
grep -qi "filesystem\|file.system" /c/rnd/agent/uc-taskmanager/README.md && echo "PASS: README.md updated" || echo "FAIL"

# README_KO.md에 파일시스템 관련 내용 확인
grep -q "파일시스템" /c/rnd/agent/uc-taskmanager/README_KO.md && echo "PASS: README_KO.md updated" || echo "FAIL"
```
