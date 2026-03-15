---
name: test-sonnet
description: sonnet 모델로 sub-agent 호출 가능 여부 테스트
tools: Read, Write, Bash, Task
model: sonnet
---

다음을 순서대로 실행한다.

1. `works/test-results/sonnet_start.txt` 파일 생성:
   내용: `[sonnet] started. attempting to spawn sub-agent...`

2. Task 도구로 general-purpose 에이전트를 호출한다:
   `Task(subagent_type="general-purpose", prompt="파일 C:/rnd/agent/uc-taskmanager/works/test-results/sonnet_subagent_proof.txt 를 생성하고 내용은 'spawned by sonnet' 로 작성해라. Write 도구를 사용해라.")`

3. Task 호출 결과에 따라 `works/test-results/sonnet_result.txt` 생성:
   - 성공 시: `[sonnet] SUCCESS - Task tool works. Sub-agent spawned.`
   - 실패/에러 시: `[sonnet] FAILED - Task tool error: {에러내용}`
