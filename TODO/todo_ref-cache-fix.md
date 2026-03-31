# TODO: ref-cache Phase 1 수정 — 기본 동작부터 정상화

## 현재 상태

ref-cache가 **설계만 되어있고 실제로 동작하지 않음**. 3회 테스트(test-22, test-23)에서 모두 실패 확인.

## 문제점 (근거: test-22, test-23 로그 분석)

### 1. specifier가 ref-cache XML을 반환하지 않음
- specifier.md에 `→ Protocol: see ref-cache-protocol.md`라는 간접 참조만 있음
- LLM이 이 간접 참조를 따라 ref-cache-protocol.md를 읽고 ref-cache를 생성하는 것을 기대했으나, 실제로는 무시함
- specifier의 반환: 텍스트 요약만 반환, `<ref-cache>` 블록 없음

### 2. Main Claude가 ref-cache를 다음 agent에 전달하지 않음
- agent-flow.md § ref-cache Chain Propagation에 규칙이 있지만, Main Claude가 spawn prompt 작성 시 무시
- builder에 전달된 prompt: `REFERENCES_DIR=... + TASK 설명`만 포함, `<ref-cache>` 없음
- 원인: specifier가 반환하지 않았으니 전달할 것도 없음 + 규칙이 일반 텍스트로만 서술되어 실행력 부족

### 3. agent 정의의 ref-cache 지시가 불충분
- 모든 agent에 `→ Protocol: see ref-cache-protocol.md`만 있고, 구체적 행동 지시 없음
- 출력부에 `<!-- Include all reference files -->` 코멘트 형태라 LLM이 선택적으로 무시

## 개선 방향

### A. Combined Agent Invocation 프롬프트 템플릿에 직접 명시
agent-flow.md의 Specifier+Planner / Verifier+Committer 프롬프트 템플릿에:
```
"... Execute Role 1, then Role 2.

CRITICAL: After completing all roles, include <ref-cache> in your return containing ALL reference files you read:
<ref-cache>
  <ref key="file-content-schema">{actual file content}</ref>
  <ref key="shared-prompt-sections">{actual file content}</ref>
  ...
</ref-cache>"
```

### B. Main Claude의 dispatch에 ref-cache 포함 지시 강화
agent-flow.md 각 모드의 step에 단순히 `include <ref-cache>`라고만 쓰지 않고:
```
3. Extract the <ref-cache> block from the previous agent's return text.
   Include it verbatim at the end of the next agent's prompt.
   If no <ref-cache> in return, omit.
```

### C. agent 정의의 STARTUP에 인라인 지시
`→ Protocol: see ref-cache-protocol.md` 대신:
```
Check if <ref-cache> exists in your input:
- If present: Use <ref key="..."> content directly. Do NOT read those files from disk.
- If absent: Read from REFERENCES_DIR normally.
```

### D. 검증 포인트 (테스트 시 확인할 것)
1. specifier 반환 텍스트에 `<ref-cache>` 포함 여부
2. Main Claude의 builder prompt에 `<ref-cache>` 포함 여부
3. builder의 Read tool 호출에서 reference 파일 읽기가 0회인지 확인
4. 전체 pipeline의 reference Read 횟수: 기대값 specifier 1회만

## ref-cache 없는 상태 vs 있는 상태 비교 데이터

| 항목 | test-21 (없음) | test-22 (있으나 미동작) |
|------|---:|---:|
| 총 소요 | ~10분 | ~13분 20초 |
| Agent 간 갭 합계 | 224s | 297s |
| builder→verifier 평균 갭 | 37s | 57s |
| 총 Tool Uses | 165 | 204 |
| Reference Read 횟수 | ~20 | ~20 (동일 — 캐시 미동작) |

ref-cache가 정상 동작하면 후속 agent의 reference Read가 0이 되어 갭과 전체 시간이 줄어들 것으로 예상.

## 관련 파일
- `develop/references/agent-flow.md` — Combined Agent Invocation, ref-cache Chain Propagation
- `develop/references/ref-cache-protocol.md` — 프로토콜 정의
- `develop/agents/specifier.md` — 첫 agent, ref-cache 생성 담당
- `develop/agents/builder.md`, `verifier.md`, `committer.md` — ref-cache 소비 담당
- `develop/skills/work-pipeline/SKILL.md` — Main Claude 행동 지시
