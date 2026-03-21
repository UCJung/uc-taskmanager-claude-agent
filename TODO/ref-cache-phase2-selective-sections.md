# TODO: ref-cache Phase 2 — 에이전트별 필요 섹션만 선택 전달

## 개요
Phase 1에서는 ref-cache에 참조 파일 전체를 전달한다.
Phase 2에서는 Main Claude가 각 에이전트에 필요한 섹션만 선별하여 dispatch에 포함한다.

## 에이전트별 필요 섹션 매핑

### Specifier
| 참조 파일 | 필요 섹션 |
|-----------|----------|
| shared-prompt-sections | §1, §7, §8, §9, §11 |
| file-content-schema | §0, §1, §2, §3 |
| xml-schema | §1, §3 |
| work-activity-log | full |

### Planner
| 참조 파일 | 필요 섹션 |
|-----------|----------|
| shared-prompt-sections | §1, §2, §11 |
| file-content-schema | §1, §2, §3 |
| work-activity-log | full |

### Scheduler
| 참조 파일 | 필요 섹션 |
|-----------|----------|
| shared-prompt-sections | §4, §8, §10 |
| file-content-schema | §1, §6 |
| xml-schema | §1, §3, §4, §5 |
| context-policy | full |
| work-activity-log | full |

### Builder
| 참조 파일 | 필요 섹션 |
|-----------|----------|
| shared-prompt-sections | §1, §2, §10, §12 |
| file-content-schema | §2, §3 |
| xml-schema | §1, §2, §4 |
| context-policy | Builder절 |
| work-activity-log | full |

### Verifier
| 참조 파일 | 필요 섹션 |
|-----------|----------|
| shared-prompt-sections | §1, §2, §12 |
| xml-schema | §1, §2, §4 |
| context-policy | Verifier절 |
| work-activity-log | full |

### Committer
| 참조 파일 | 필요 섹션 |
|-----------|----------|
| shared-prompt-sections | §1, §2, §8, §10 |
| file-content-schema | §3, §4, §5, §6, §7 |
| xml-schema | §1, §2, §4 |
| context-policy | Committer절 + Retry |
| work-activity-log | full |

## 예상 효과
- Phase 1 (전체 전달): 26회 읽기 → 5~6회 (파일 읽기 77% 절감)
- Phase 2 (선택 전달): dispatch 토큰 추가 절감 (ref-cache 크기 50~70% 축소)

## 구현 방향
- Main Claude의 agent-flow.md에 에이전트별 섹션 매핑 테이블 추가
- dispatch 생성 시 ref-cache에서 해당 에이전트 필요 섹션만 추출하여 전달
- 참조 파일의 섹션 구분자(## § N)를 파싱 기준으로 활용
