# TASK-00: README "Why This Project Exists" 섹션 개선

## WORK
WORK-29: README "Why This Project Exists" 섹션 개선

## Dependencies
- (none)

## Scope
README.md(영문)와 README_KO.md(한국어)의 "Why This Project Exists" / "이 프로젝트를 만든 이유" 섹션을 다음 구조로 재작성한다:

### 수정 구조
1. **도입부**: 바이브 코딩 첫 경험 — 신세계였지만 프로젝트 규모가 커지면서 문제 발생
2. **3가지 문제점** (번호 리스트):
   - (1) 하나의 세션에서 계속 대화형으로 개발할 때 코드 품질 저하
   - (2) 대화형 개발로 인해 요구사항, 설계, 구현의 변경내용이 남지 않는 문제
   - (3) 프로젝트 덩치가 커질수록 추적성이 사라지는 문제
3. **해결책**: 이 문제를 해결하기 위해 WORK-PIPELINE Sub Agent 시스템을 만들었고, 각 문제가 어떻게 해결되는지 설명
4. **기존 SDD 철학 유지**: 요구사항 → 아키텍처 → 설계가 진짜 자산이라는 메시지
5. **4단계 프로세스 유지**: 계획 → 분해 → 실행 → 축적

### 수정 범위
- README.md: 44행 `## Why This Project Exists` ~ 61행 `Each step runs in an **isolated subagent pipeline**...` 까지
- README_KO.md: 44행 `## 이 프로젝트를 만든 이유` ~ 61행 동일 영역

### 주의사항
- 해당 섹션 아래의 `---` 구분선과 `Six subagents work across any project...` 문단은 그대로 유지
- README_KO.md의 "더 큰 그림", "언어에 대하여", "개발 기간" 하위 섹션은 그대로 유지

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | "Why This Project Exists" 섹션 재작성 |
| `README_KO.md` | MODIFY | "이 프로젝트를 만든 이유" 섹션 재작성 |

## Acceptance Criteria
- [ ] 바이브 코딩 3가지 문제점이 구체적으로 나열됨
- [ ] 문제점 → WORK-PIPELINE 해결책 연결 구조가 자연스러움
- [ ] SDD 철학 메시지 유지
- [ ] 4단계 프로세스(계획→분해→실행→축적) 유지
- [ ] 영문/한국어 동일 구조
- [ ] 섹션 전후 내용 손상 없음

## Verify
```bash
# 파일 존재 확인
test -f README.md && test -f README_KO.md && echo "PASS" || echo "FAIL"
# 섹션 헤더 확인
grep -c "Why This Project Exists" README.md
grep -c "이 프로젝트를 만든 이유" README_KO.md
```
