# TASK-01 Progress

- Status: COMPLETED
- Started: 2026-03-20
- Updated: 2026-03-20
- Files changed:
  - README_KO.md (router → specifier 참조 전체 갱신)

## 변경 내역

1. 빠른 시작: "router가 요청을 분석" → "specifier가 요청을 분석"
2. 소개 문구: "router가 WORK 판단" → "specifier가 WORK 판단"
3. direct 모드 설명: router → specifier (겸임 구조 명시)
4. pipeline 모드 설명: router → specifier
5. IN_PROGRESS 질문 주체: router → specifier (2곳)
6. execution-mode 개념 다이어그램: router 박스 → specifier 박스 + "판정" 표현
7. direct 모드 개념 설명: router → specifier
8. WORK 파이프라인 다이어그램: router → specifier
9. pipeline 모드 다이어그램: router → specifier
10. direct 모드 다이어그램: router → specifier (겸임)
11. 에이전트 테이블: router 행 → specifier (겸임 구조 포함)
12. 파일 구조: WORK-LIST.md 관리 주체 router → specifier
13. WORK-LIST.md 섹션: router → specifier
14. IN_PROGRESS 확인 주체: router → specifier
15. 설치 확인: "# router, planner, ..." → "# specifier, planner, ..."
16. 예제 세션: "[router → WORK 경로]" → "[specifier → WORK 경로]"
17. 저장소 구조: agents/ ko/en 서브디렉토리 구조로 갱신 + router.md → specifier.md
18. Specifier 판정 기준 config 섹션 제목 및 설명: router → specifier
19. 필드 설명표: router → specifier
20. Fallback 동작: router → specifier
21. JSON $schema URL + description: router → specifier
22. 세 가지 실행 모드 섹션: router → specifier
23. 커스터마이징 테이블: router.md → specifier.md
24. WORK ID 할당 전략: router → specifier

## 검증

```
grep -n -i "router" README_KO.md | grep -v -i "router_rule_config" | grep -v -i "Router Rule Config" | grep -v "router_rule"
→ PASS: no agent-name router references
```
