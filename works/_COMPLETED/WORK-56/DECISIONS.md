# DECISIONS — WORK-56

## D-01
> 시각: 2026-07-23T23:57:09Z
> 단계: specifier
> 상태: RESOLVED

### 배경
검사 대상 3에 "README가 참조하는 docs/*.md 중 파이프라인 서술 부분"이 포함된다. README가 링크/나열하는 `docs/spec_pipeline-architecture_v1.3.md`, `docs/spec_SDD_with_ucagent_requirement.md`, `docs/spec_sliding-window-context.md`는 버전이 명기된 설계 스냅샷(v1.3 등)으로 운영 정본이 아니라 설계 이력 문서다. 이들을 현행화 대상에 포함할지 스코프 경계 결정이 필요하다.

### 선택지
1. docs/spec_*.md는 수정 제외 — 파이프라인 서술 드리프트 유무만 검사·보고(FR-08). 운영 문서(skills/README)와 정본(agents/references)만 현행화.
2. docs/spec_*.md의 파이프라인 서술 부분도 현행화 대상에 포함해 수정.

### 권고안
option 1 — 버전 고정 설계 스냅샷은 이력 보존 가치가 있고 운영 정본이 아니므로 수정 제외, 드리프트는 보고만.

### 확정값
option 1 — docs/spec_*.md(버전 명기 설계 스냅샷)는 수정하지 않고 드리프트 유무만 검사·보고한다.

### 결정주체
auto

### 근거
mode=auto. 버전이 고정된 설계 스냅샷은 이력 보존 가치가 있고 운영 정본이 아니므로 임의 수정 시 이력 무결성이 훼손된다. 현행화 대상은 운영 문서(skills/README)와 정본(agents/references)으로 한정하는 것이 스코프 격리 원칙(NFR-04 계열)에 부합.
