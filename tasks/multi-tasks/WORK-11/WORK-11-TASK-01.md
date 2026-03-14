# WORK-11-TASK-01: `agents/router.md` config 읽기 절차 추가 및 판정 로직 교체

> WORK: WORK-11 — Router execution-mode 판정 기준 외부 config 파일 분리
> Task: WORK-11-TASK-01
> Depends on: WORK-11-TASK-00
> Status: PENDING

## 목적

`agents/router.md`의 §2에서 하드코딩된 Routing Criteria 테이블을 config 파일 참조 방식으로 교체한다.
config가 없으면 내장 기본값(fallback)으로 동작하도록 하위 호환을 유지한다.

## 작업 내용

### 1. Config 읽기 절차 섹션 추가

§2 Three-Path Routing 섹션 앞(또는 직후)에 다음 내용의 "Config 읽기 절차" 서브섹션을 삽입한다:

```markdown
### Config 읽기 절차

판정 기준은 `.agent/router_rule_config.json`에서 읽는다.

```bash
# config 로드 시도
CONFIG_FILE=".agent/router_rule_config.json"
if [ -f "$CONFIG_FILE" ]; then
  # config 파일의 rules 섹션을 판정에 사용
  echo "Config loaded: $CONFIG_FILE"
else
  # Fallback: 내장 기본값 사용 (하위 호환)
  echo "Config not found. Using built-in defaults."
fi
```

config 파일이 존재하는 경우 해당 파일의 `rules` 필드를 읽어 각 mode 판정에 사용한다.
config 파일이 없는 경우 아래 내장 기본값(Routing Criteria)을 사용한다.
```

### 2. 기존 Routing Criteria 테이블 수정

기존 테이블 위에 다음 안내 문구를 추가한다:

> **내장 기본값 (config 파일이 없을 때 적용):**
> 실제 운용 시에는 `.agent/router_rule_config.json`의 `rules` 값이 우선 적용된다.

기존 테이블은 내장 기본값으로서 유지한다 (삭제하지 않음).

## 완료 기준

- [ ] §2에 "Config 읽기 절차" 서브섹션 삽입
- [ ] 기존 Routing Criteria 테이블 위에 config 파일 우선 안내 추가
- [ ] 내장 기본값 테이블은 fallback으로 유지됨
- [ ] 파일의 다른 섹션(§1, §3~§7)은 미변경
