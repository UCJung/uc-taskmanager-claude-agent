# Claude Agent SDK Integration 분석

## 개요

uc-taskmanager에 Claude Agent SDK를 적용했을 때의 장단점 분석.
현재 아키텍처(Claude Code CLI + Task tool)와 Agent SDK 기반 아키텍처를 비교한다.

## 아키텍처 비교

### 현재 (Claude Code CLI + Task tool)

```
Main Claude (오케스트레이터)
  └─ Task tool → subagent (독립 프로세스, .md 프롬프트 기반)
```

- Claude Code CLI 구독 기반
- agents/*.md 파일이 에이전트 정의
- Main Claude가 자연어 + XML로 에이전트 간 통신

### Agent SDK 전환 시

```
Node.js 서버 (프로그래밍 방식 오케스트레이터)
  └─ Agent SDK query() → subagent (API 호출, 코드 기반 제어)
```

- Anthropic API 토큰 비용 직접 부담
- JS/Python 코드가 에이전트 흐름 제어
- 프로그래밍 방식으로 정밀한 파이프라인 관리

## 장점

| 항목 | 설명 |
|------|------|
| **프로그래밍 방식 제어** | DAG 실행, 재시도, 조건 분기를 JS/Python 코드로 구현. .md 프롬프트 + 자연어 지시 방식보다 예측 가능성 높음 |
| **모델 선택 자유도** | 에이전트별로 `model` 파라미터로 모델 확실히 지정 (builder=sonnet, verifier=haiku 등) |
| **비용 추적** | `total_cost_usd`, `modelUsage` 맵으로 TASK별/에이전트별 토큰 비용 정확 측정 |
| **병렬 실행** | 독립 TASK를 `Promise.all`로 진짜 병렬 실행. 현재는 scheduler가 순차 dispatch |
| **서버 통합** | HTTP API로 외부 시스템(CI/CD, SDD 서버)과 직접 연동. webhook 콜백보다 견고한 통합 |
| **세션 관리** | `ClaudeSDKClient`로 장기 세션 유지/재개. CLI의 컨텍스트 압축/유실 문제 없음 |

## 단점

| 항목 | 설명 |
|------|------|
| **API 비용 직접 부담** | Opus $5/$25, Sonnet $3/$15, Haiku $1/$5 per MTok. 구독 기반 대비 비용 크게 증가 가능 |
| **인프라 필요** | Node.js 서버 직접 운영 필요. 현재는 Claude Code CLI만 있으면 됨 (zero infra) |
| **진입장벽 상승** | 현재: `uctm init` → `claude` → `[new-feature]` 끝. SDK: 서버 설치 + API 키 설정 + 실행 환경 구성 |
| **파일 시스템 접근** | CLI subagent는 로컬 파일시스템 직접 접근. SDK는 tool 정의를 통해 접근해야 하므로 구현 비용 발생 |
| **MCP 통합 재구현** | 현재 builder가 Serena MCP 바로 사용. SDK에서도 MCP 지원되지만 설정/연결을 코드로 관리 |
| **프롬프트 유지보수 이원화** | agents/*.md 프롬프트 + SDK 코드 양쪽 관리 필요. 현재는 .md 파일만 수정하면 끝 |

## 적용 판단 기준

### 현재 유지가 유리한 경우

- 개인/소규모 팀이 Claude Code 구독으로 사용
- zero infra, zero dependency가 중요
- CLI 환경에서 대화형 작업이 주 사용 패턴

### Agent SDK 전환이 유리한 경우

- SDD 서버와 프로그래밍 방식으로 연동하는 자동화 파이프라인
- 정확한 비용 추적/제어가 필요
- 병렬 실행 성능이 중요
- CI/CD에서 headless로 실행해야 할 때

## 권장 접근

현재 uc-taskmanager의 핵심 가치: **"Claude Code CLI 위에서 zero-infra로 동작"**

→ 기존 CLI 방식을 메인으로 유지하면서 Agent SDK 기반 서버 모드를 **별도 패키지나 옵션**으로 추가하는 하이브리드 접근 권장.

## 참고

- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Cost Tracking](https://platform.claude.com/docs/en/agent-sdk/cost-tracking)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
