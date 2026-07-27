# uc-taskmanager (uctm)

[English](README.md) | **한국어**

> Claude Code를 위한 **SDD(명세 주도 개발) 기반 WORK-PIPELINE 서브에이전트 시스템**
> 요구분석 → 설계 → 구현 → 검증 → 커밋을 전담 에이전트들이 자율 오케스트레이션으로 처리합니다.

## 📖 개요

**uc-taskmanager**는 하나의 개발 요청을 받아 **요구분석부터 커밋까지 전 과정을 자동으로 수행**하는 Claude Code 서브에이전트 파이프라인입니다.

사용자가 `[new-feature] 로그인 기능 추가` 처럼 요청하면, 파이프라인이 이를 **WORK(작업 단위)** 로 만들고 여러 개의 **TASK**로 분해한 뒤, 각 단계를 전담 에이전트가 순차·병렬로 처리합니다.

핵심은 **역할 분리**와 **자율 조정**입니다. 하나의 거대한 에이전트가 모든 일을 하는 대신, 각자 다른 책임과 모델을 가진 에이전트들이 협업합니다.

| 에이전트 | 역할 | 모델 |
|----------|------|------|
| **orchestrator** | 전체 파이프라인 조정·스케줄링·커밋 | opus |
| **specifier** | 요구사항 명세화 (**무엇을** = What) | opus |
| **planner** | 구현 설계·TASK 분해 (**어떻게** = How) | opus |
| **builder** | 실제 코드 구현 + 빌드 셀프체크 | sonnet |
| **verifier** | 빌드·린트·테스트·인수기준 독립 검증 (read-only) | haiku |

파이프라인 흐름:

```
사용자 요청
   │
   ▼
[orchestrator]  ← Main Claude가 1회만 spawn
   ├─ specifier   → Requirement.md (요구 명세)
   ├─ planner     → PLAN.md + TASK DAG (설계·작업분해)
   └─ TASK 반복:
        builder   → 코드 구현
        verifier  → 독립 검증 (PASS/FAIL)
        [커밋]     → orchestrator가 인라인으로 result.md 작성 → git commit
   │
   ▼
WORK 완료 보고
```

모든 산출물은 `works/WORK-NN/` 폴더에 남습니다 — 요구명세(`Requirement.md`), 계획(`PLAN.md`), 태스크별 명세·결과(`TASK-NN.md`, `TASK-NN_result.md`), 의사결정 기록(`DECISIONS.md`), 활동 로그(`work_WORK-NN.log`).

---

## 📂 산출물

파이프라인은 모든 WORK에 대해 문서화된 기록을 **자동 생성**합니다 — 수기 메모가 필요 없습니다.

**폴더 구조**

```
works/
├── WORK-LIST.md              # 전체 WORK 목록·상태 인덱스
├── WORK-NN/                  # WORK 1건당 폴더 1개
│   ├── Requirement.md        # 요구사항 명세
│   ├── PLAN.md               # 구현 계획
│   ├── TASK-01.md            # TASK별 명세 (DAG 노드)
│   ├── TASK-01_result.md     # TASK별 수행 결과
│   ├── ...
│   ├── DECISIONS.md          # 의사결정 기록
│   └── work_WORK-NN.log      # 활동 로그 (재개 기준)
└── _COMPLETED/               # 완료된 WORK 아카이브
```

**작업 단계별 생성 산출물**

| 단계 | Naming | 설명 |
|------|--------|------|
| specifier | `Requirement.md` | 구조화된 요구사항 명세 (What) |
| planner | `PLAN.md` | WORK 단위 구현 계획 |
| planner | `TASK-NN.md` | TASK별 명세 — TASK DAG의 노드 |
| builder → verifier → 커밋 | `TASK-NN_result.md` | TASK별 결과 — verifier PASS 후 orchestrator가 인라인 작성 |
| orchestrator | `DECISIONS.md` | 자동/사용자 의사결정 기록(근거 포함) |
| orchestrator | `work_WORK-NN.log` | 멱등 재개를 구동하는 활동 로그 |
| orchestrator | `WORK-LIST.md` | 전역 WORK 목록·상태 (IN_PROGRESS → DONE) |

---

## 🚀 설치 및 사용방법

### 설치

**npm (권장)**

```bash
# 전역 설치
npm install -g uctm

# 프로젝트에 파이프라인 설치 (.claude/ 에 에이전트·스킬·레퍼런스 배치)
uctm init

# 모든 프로젝트에서 쓰도록 전역(~/.claude/) 설치
uctm init --global

# 버전 업그레이드 후 파일 갱신
uctm update
```

`uctm init`은 현재 프로젝트의 `.claude/` 아래에 에이전트 정의·스킬·레퍼런스를 설치하고, 파이프라인 실행에 필요한 Bash 권한을 `settings.local.json`에 구성합니다.

### 사용

Claude Code를 실행하고, **대괄호 태그**로 새 작업을 시작합니다.

```bash
claude
```

```
[new-feature] 사용자 프로필 편집 기능을 추가해줘
```

지원 트리거 태그: `[new-feature]` · `[enhancement]` · `[bugfix]` · `[new-work]` · `[WORK start]` (또는 임의의 대괄호 태그)

**실행 모드 2종**

| 모드 | 설명 | 트리거 |
|------|------|--------|
| **gated** (기본) | specifier 완료 후·planner 완료 후 **승인 게이트**에서 멈춰 사용자 확인을 받고, 판단이 필요한 지점마다 선택지를 제시 | 기본값 |
| **auto** | 게이트 없이 전 과정을 완주하고, 모든 판단을 권고안으로 자동 결정 후 보고 | 요청에 "auto" 또는 "자동으로" 포함 |

```
[new-feature] 다크모드 토글 추가, 자동으로 진행해줘   ← auto 모드
```

**중단된 작업 재개**

```
WORK-12 계속 실행    ·    resume WORK-12    ·    파이프라인 재개
```

활동 로그를 기반으로 중단 지점을 판정해 **이미 완료된 단계는 건너뛰고** 이어서 진행합니다. 커밋 같은 부작용 있는 작업도 멱등적으로 재개됩니다.

---

## ✨ 특장점

**1. DAG 기반 TASK 스케줄링**
TASK 간 의존관계를 DAG로 해석해, 서로 독립적인 TASK는 **동시에 병렬 실행**하고 의존 TASK는 순서를 지킵니다. 불필요한 대기 없이 빠르게 완주합니다.

**2. 슬라이딩 윈도우 컨텍스트 관리**
각 에이전트에게 직전 단계는 상세(FULL), 2단계 전은 요약(SUMMARY), 그 이전은 생략(DROP)해 전달합니다. 컨텍스트 폭증 없이 긴 파이프라인을 유지합니다.

**3. ref-cache — 레퍼런스 1회 읽기**
공용 레퍼런스 문서를 orchestrator가 **딱 한 번** 읽고, 각 자식에게 필요한 섹션만 잘라 전달합니다. 자식이 매번 문서를 다시 읽는 토큰 낭비를 제거합니다.

**4. 검증 독립성**
verifier는 read-only로 **독립 재실행**해 빌드·린트·테스트·인수기준을 검증합니다. 구현자(builder)와 검증자(verifier)가 분리되어 있어, 구현이 스스로를 통과시키는 문제가 없습니다.

**5. 게이트 & 자동 의사결정**
요구 해석의 다의성, 설계 트레이드오프, 범위 초과, 비가역적 변경 같은 판단 지점에서 gated 모드는 사용자에게 선택지를 제시하고, auto 모드는 권고안으로 결정한 뒤 `DECISIONS.md`에 근거를 남깁니다.

**6. 멱등적 재개**
모든 진행 상황을 활동 로그(`work_WORK-NN.log`)에 기록해, 세션이 중단돼도 정확한 지점부터 재개합니다. 커밋 중복·스킵 없이 안전하게 이어집니다.

**7. 모델 티어링으로 비용 최적화**
무거운 추론(요구분석·설계)은 opus, 구현은 sonnet, 검증은 haiku로 배분해 **품질과 비용의 균형**을 맞춥니다.

**8. 작업 산출물 자동 생성**
모든 단계가 산출물을 디스크에 기록합니다 — 요구명세·계획·TASK별 결과·의사결정 기록·활동 로그까지, 수기 메모 없이 완결된 검토 가능한 기록이 남습니다. [산출물](#-산출물) 참조.

---

## 🧩 Agent 구성 파일

`uctm init`은 `.claude/` 아래에 다음을 설치합니다:

```
.claude/
├── agents/       # 파이프라인 에이전트 정의
│   ├── orchestrator.md
│   ├── specifier.md
│   ├── planner.md
│   ├── builder.md
│   └── verifier.md
├── references/   # 공용 규칙·스키마 문서 — orchestrator가 1회만 읽음
│   ├── agent-flow.md
│   ├── context-policy.md
│   ├── file-content-schema.md
│   ├── shared-prompt-sections.md
│   ├── work-activity-log.md
│   └── xml-schema.md
└── skills/       # 사용자 트리거용 스킬
    ├── uctm-init/
    ├── work-pipeline/
    ├── work-status/
    └── sdd-pipeline/
```

**`agents/` — 파이프라인 에이전트 정의**

| 파일 | 설명 |
|------|------|
| `orchestrator.md` | 중첩 spawn으로 전체 파이프라인 자율 조정 — 스케줄링·게이트·인라인 커밋 담당 |
| `specifier.md` | 요구사항 명세 생성 (What) |
| `planner.md` | 요구사항을 설계 + TASK DAG로 변환 (How) |
| `builder.md` | TASK 코드 구현 + 빌드 셀프체크 |
| `verifier.md` | 독립 read-only 검증 (빌드·린트·테스트·인수기준) |

**`references/` — 공용 규칙·스키마 문서** (orchestrator가 1회 읽어 ref-cache로 자식에게 섹션 배분)

| 파일 | 설명 |
|------|------|
| `agent-flow.md` | Main Claude 역할 가이드 — 트리거·게이트 경계, 축퇴 모드 |
| `context-policy.md` | 슬라이딩 윈도우 컨텍스트 핸드오프 규칙 + 재시도 정책 |
| `file-content-schema.md` | 산출물 파일 형식·이름 규칙의 단일 정의 소스 |
| `shared-prompt-sections.md` | 공통 재사용 프롬프트 섹션 (출력 언어, 상태 판정, WORK-LIST, Bash 규칙) |
| `work-activity-log.md` | 멱등 재개를 구동하는 활동 로그 이벤트 규칙 |
| `xml-schema.md` | 에이전트 간 XML 프로토콜 (ref-cache, gate, needs-decision, task-result) |

**`skills/` — 사용자 트리거용 스킬**

| 파일 | 설명 |
|------|------|
| `uctm-init/` | 프로젝트에 uctm 초기화 (`works/` 생성, Bash 권한 구성) |
| `work-pipeline/` | WORK-PIPELINE 트리거 (오케스트레이션 시작) |
| `work-status/` | WORK 상태 조회 (read-only) |
| `sdd-pipeline/` | 파이프라인 에이전트 내부 참조 문서 묶음 (사용자 대면 아님) |

---

## 📄 라이선스

GPL-3.0 · [UCJung](https://github.com/UCJung/uc-taskmanager-claude-agent)
