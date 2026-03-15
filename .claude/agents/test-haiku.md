---
name: test-haiku
description: haiku 모델로 sub-agent 호출 가능 여부 테스트
tools: Read, Write, Bash, Task
model: haiku
---

다음을 순서대로 실행한다.

1. `works/test-results/haiku_start.txt` 파일 생성:
   내용: `[haiku] started. attempting to spawn sub-agent...`

2. Task 도구로 general-purpose 에이전트를 호출한다:
   `Task(subagent_type="general-purpose", prompt="파일 C:/rnd/agent/uc-taskmanager/works/test-results/haiku_subagent_proof.txt 를 생성하고 내용은 'spawned by haiku' 로 작성해라. Write 도구를 사용해라.")`

3. Task 호출 결과에 따라 `works/test-results/haiku_result.txt` 생성:
   - 성공 시: `[haiku] SUCCESS - Task tool works. Sub-agent spawned.`
   - 실패/에러 시: `[haiku] FAILED - Task tool error: {에러내용}`
