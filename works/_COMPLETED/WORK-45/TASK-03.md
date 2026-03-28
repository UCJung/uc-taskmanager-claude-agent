# TASK-03: plugin/README.md 현행화

## WORK
WORK-45: 기술문서 및 README 영/한 현행화 (v1.4.0~v1.5.0)

## Dependencies
- TASK-00 (required)

## Scope
plugin/README.md에 v1.4.0~v1.5.0 변경사항을 반영한다.

### 반영할 변경사항

1. **Spawn 결합**
   - Pipeline flow 설명에 specifier+planner, verifier+committer 결합 반영
   - spawn 수 30% 감소 언급

2. **자동 권한 설정 (v1.4.0)**
   - `/uctm-init` 실행 시 Bash 권한 자동 설정

3. **Plugin 리소스 (v1.5.0)**
   - npm 패키지에 .claude-plugin, skills 포함
   - `uctm init` 시 plugin 리소스도 설치

## Files
| Path | Action | Description |
|------|--------|-------------|
| `plugin/README.md` | MODIFY | Plugin README v1.4.0~v1.5.0 변경사항 반영 |

## Acceptance Criteria
- [ ] plugin/README.md에 spawn 결합 파이프라인 설명 반영
- [ ] 자동 권한 설정 언급
- [ ] plugin 리소스 설치 설명 반영

## Verify
```bash
# 문서 변경이므로 별도 빌드/테스트 불필요
head -60 plugin/README.md
```
