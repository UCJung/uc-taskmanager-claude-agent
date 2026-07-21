# 공유 프롬프트 섹션

각 에이전트가 `cache_control` 마커를 통해 참조하는 공통 재사용 섹션.

---

## § 1. 출력 언어 규칙

```
우선순위: PLAN.md > Language: → CLAUDE.md ## Language → en (기본값)

디스패치 시: <context><language> 필드에 결정된 언어 코드 전달
섹션 헤더(##)도 결정된 언어로 작성 (언어 매핑 표 참조)
```

---

## § 2. 빌드 및 린트 명령

```bash
# 빌드 자동 감지 (스크립트가 있을 때만 실행)
if [ -f "package.json" ]; then
  if node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); process.exit(p.scripts&&p.scripts.build?0:1)" 2>/dev/null; then
    npm run build 2>&1 || bun run build 2>&1 || yarn build 2>&1
  fi
elif [ -f "Cargo.toml" ]; then
  cargo build 2>&1
elif [ -f "go.mod" ]; then
  go build ./... 2>&1
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  python -m py_compile $(find . -maxdepth 3 -name "*.py" -not -path "*/venv/*" 2>/dev/null) 2>&1
elif [ -f "Makefile" ]; then
  make build 2>&1 || make 2>&1
fi

# 린트 자동 감지 (스크립트가 있을 때만 실행)
if [ -f "package.json" ]; then
  if node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); process.exit(p.scripts&&p.scripts.lint?0:1)" 2>/dev/null; then
    npm run lint 2>&1 || bun run lint 2>&1 || true
  fi
elif [ -f "pyproject.toml" ]; then
  ruff check . 2>&1 || python -m flake8 . 2>&1 || true
fi
```

- 빌드/린트 스크립트가 없으면 → **생략 (N/A로 처리)**.
- 빌드/린트 실패 시 보고 전에 항상 수정.

---

## § 3. WORK 및 TASK 파일 경로 패턴

```
works/{WORK_ID}/
  ├─ Requirement.md                 # Specifier가 생성 (필수)
  ├─ PLAN.md
  ├─ TASK-00.md               # WORK 접두사 없음
  ├─ TASK-00_result.md        # 구분자: 언더스코어
  └─ TASK-01.md ...
```

- WORK ID: `WORK-NN` (예: `WORK-03`)
- TASK ID: `TASK-NN` (예: `TASK-00`) — WORK 접두사 포함 금지

---

## § 4. 파일 시스템 Discovery 스크립트

```
# 미완료 TASK가 있는 최신 WORK 찾기
# Glob 도구 사용: pattern "works/WORK-*/" → 모든 WORK 디렉토리 목록 (정렬)
# 각 WORK (내림차순)에 대해 works/WORK-NN/work_WORK-NN.log 마지막 줄 읽기
#   - 로그 파일 없음 → 시작 안 됨
#   - 마지막 줄이 "ORCHESTRATOR_DONE" → 완료됨
# 완전히 완료되지 않은 첫 번째 WORK가 활성 WORK

# 모든 WORK 목록
# Glob 도구 사용: pattern "works/WORK-*/"

# 활동 로그의 마지막 줄로 WORK/TASK 상태 파악 (orchestrator가 일괄 기록 → work-activity-log.md 참조)
# works/${WORK_ID}/work_${WORK_ID}.log 마지막 줄 읽기
#   형식: [timestamp] EVENT — description
#
#   핵심 규칙: STAGE_START에 대응하는 STAGE_DONE/GATE_WAIT/DECISION_WAIT가 없으면 = 자식 실행 중 중단됨, 해당 단계 재수행 필요
#
#   ORCHESTRATOR_DONE                        → WORK 전체 완료
#   STAGE_DONE — stage=X[ task=TASK-NN]      → 해당 단계 완료(게이트 통과됨), 다음 단계로
#   GATE_WAIT — stage=X                      → 게이트 미승인, 자식 재실행 없이 동일 게이트 재제시
#   DECISION_WAIT — stage=X[ task=TASK-NN]   → 결정 미확정, DECISIONS.md의 PENDING 항목 재제시
#   DECISION — stage=X by=user|auto          → 결정 확정됨, 후속 STAGE_DONE 없으면 해당 단계 이어서 진행
#   STAGE_START — stage=X[ task=TASK-NN]     → (대응 DONE/WAIT 없으면) 자식 실행 중 중단됨, 재실행
#   ORCHESTRATOR_START                       → orchestrator 시작됨, 하위 이벤트로 세부 판정
#   로그 파일 없음                           → 처음부터 시작 (신규 WORK)
```

---

## § 5. Task Result XML 형식

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{설명}</file>
  </files-changed>
  <verification>
    <check name="{type}" status="{PASS|FAIL|N/A}">{상세}</check>
  </verification>
  <notes>{다음 단계를 위한 메모}</notes>
</task-result>
```

---

## § 6. 자동결정 기록 관례

권고안을 자동결정(결정주체 `auto`)한 경우, 판단 근거를 남겨 추적 가능하게 한다.

- **기록 위치**: `works/{WORK_ID}/DECISIONS.md`(항목별 배경/선택지/권고안/확정값/결정주체/상태) + 최종 결과보고서 `## 자동 결정 사항` 목록.
- **기록 시점**: 결정 확정 즉시 `RESOLVED`로 기록. `mode=auto`뿐 아니라 `mode=gated`에서 orchestrator가 경미한 사항으로 판단해 게이트 없이 자체 확정(`by=auto`)한 경우도 동일하게 기록.
- **최소 기재 항목**: 대상(stage 또는 task) · 확정값 · 근거 1줄.

→ 상세 포맷: `file-content-schema.md` § 5 참조. 기록 주체·이벤트: `work-activity-log.md`의 `DECISION` 이벤트 참조.

---

## § 7. PLAN.md 필수 메타 정보 — 7개 필드

→ `{REFERENCES_DIR}/file-content-schema.md` § 1 참조

| 필드 | 필수 | 설명 |
|------|------|------|
| `> Created:` | ✅ | YYYY-MM-DD |
| `> Requirement:` | ✅ | `REQ-XXX` 또는 사용자 요청 텍스트 |
| `> Project:` | ✅ | 프로젝트 이름 |
| `> Tech Stack:` | ✅ | 감지된 기술 스택 |
| `> Language:` | ✅ | 언어 코드 (`ko`, `en` 등) |
| `> Status:` | ✅ | 항상 `PLANNED`로 시작 |

---

## § 8. WORK-LIST.md 업데이트 규칙

파일: `works/WORK-LIST.md`

**형식:**
```
LAST_WORK_ID: WORK-XX

| WORK | 제목 | 상태 | 생성일 | 완료일 |
|------|------|------|--------|--------|
| WORK-NN | ... | IN_PROGRESS | YYYY-MM-DD | |
| WORK-MM | ... | DONE | YYYY-MM-DD | YYYY-MM-DD |
```

| 상태 | 의미 | 트리거 |
|------|------|--------|
| `IN_PROGRESS` | WORK 실행 중 | specifier가 WORK 생성 |
| `DONE` | 모든 TASK 완료, 리뷰/push 대기 | committer가 마지막 TASK 완료 |
| `COMPLETED` | _COMPLETED/로 아카이빙됨 | push 머지 (Main Claude가 모든 DONE 일괄 처리) |

규칙:
- `LAST_WORK_ID` 헤더는 지금까지 생성된 가장 높은 WORK ID를 추적
- **specifier**: WORK 생성 시 IN_PROGRESS 행 추가 + `LAST_WORK_ID` 업데이트
- **committer**: 마지막 TASK 완료 시 `IN_PROGRESS` → `DONE`으로 변경하고 완료일 기입 (폴더 이동이나 행 제거 금지)
- **Main Claude** (push 절차): 모든 DONE WORK를 `works/_COMPLETED/`로 이동, WORK-LIST.md에서 해당 행 제거

---

## § 9. 로케일 감지

```
1. Grep 도구 사용: pattern "Language:\s*[a-z]{2}" path="CLAUDE.md" → 언어 코드 추출
2. 없으면 사용자에게 언어 확인
3. 없으면 Bash로 시스템 로케일 자동 감지:
   - Windows: powershell -c "[CultureInfo]::CurrentCulture.TwoLetterISOLanguageName"
   - Linux/Mac: locale | grep LANG
   - 폴백: "en"
```

---

## § 12. Bash 명령 규칙

Bash 명령은 권한 호환성을 위해 다음 규칙을 반드시 따라야 합니다.

**필수:**
- Bash 호출당 단순 명령 하나 — 복합 명령 금지 (`&&`, `||`, `;`, `|`)
- `cd` 금지 — Bash 도구의 cwd는 항상 프로젝트 루트. `cd dir &&`, `cd dir ;`, `cd dir` 어떤 형태든 사용 금지. 프로젝트 루트 기준 상대 경로 사용
- 멀티라인 스크립트 금지 — 별도 Bash 호출로 분할
- 인수 내 서브셸 확장 금지 — 예: `printf` 안의 `$(date ...)`
- 프로젝트 루트 기준 상대 경로 사용 (예: `works/WORK-01/`) — 절대 경로 금지
- `git add file`, `git commit -m "msg"` 사용 — `git -C path` 플래그 금지

**파일 작업에는 Bash 대신 전용 도구를 우선 사용:**
- 파일 읽기 → `Read` 도구 (`cat` 아님)
- 파일 쓰기/추가 → `Write` 도구 (`echo >>` 또는 `printf >>` 아님)
- 파일 편집 → `Edit` 도구 (`sed -i` 아님)
- 파일 검색 → `Grep` 도구 (`grep` 아님)
- 파일 찾기 → `Glob` 도구 (`find` 아님)

**Git 예시:**
```
잘못됨: cd /path/to/project && git add file && git commit -m "msg"
올바름: git add file        (한 번의 호출)
       git commit -m "msg"  (다음 호출)
```

---

## Version

- Created: 2026-03-10
- Updated: 2026-03-31
