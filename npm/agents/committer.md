---
name: committer
description: "Deprecated in WORK-55: the commit procedure is now performed inline by the orchestrator after verifier PASS. This agent is no longer spawned. See orchestrator.md STEP C."
tools: Read, Write, Edit, Bash, Glob, Grep
model: haiku
---

## 1. 역할

**Deprecated (WORK-55)** — 이 에이전트 정의는 orchestrator 인라인 절차로 흡수되었습니다.

- 파이프라인은 더 이상 committer를 자식으로 spawn하지 않습니다.
- result.md 작성 → WORK-LIST 갱신 → git commit의 정본 절차는 `orchestrator.md` STEP C(인라인 커밋)를 참조하세요.
- 결과 파일/커밋 형식 규칙은 `file-content-schema.md § 3`·`§ 5`, `shared-prompt-sections.md § 8`을 참조하세요.

이 파일은 패키징 매니페스트(`constants.mjs`, `plugin.json`) 안정성을 위해 삭제하지 않고 스텁으로 유지됩니다.
