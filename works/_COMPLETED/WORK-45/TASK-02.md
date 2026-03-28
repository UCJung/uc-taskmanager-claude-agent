# TASK-02: SDD 스펙 및 기타 스펙/시각화 현행화

## WORK
WORK-45: 기술문서 및 README 영/한 현행화 (v1.4.0~v1.5.0)

## Dependencies
- TASK-01 (required)

## Scope
SDD 통합 설계 명세, sliding-window, callback 문서와 각 HTML 시각화를 현행화한다.

### 반영할 변경사항

1. **spec_SDD_with_ucagent_requirement.md**
   - 변경 이력에 v1.6.0 추가 (spawn 결합, 자동 권한 설정, plugin 리소스, pipe 명령어 제거)
   - 3.1 에이전트 목록: spawn 결합 설명 추가
   - 3.2 실행 경로: spawn 수 갱신
   - 에이전트 간 호출 구조 다이어그램 갱신

2. **spec_sliding-window-context.md**
   - verifier+committer 결합으로 context handoff 경로 변경 반영
   - verifier가 committer에게 전달하던 context가 동일 spawn 내에서 처리됨

3. **spec_callback-integration.md**
   - callback 전송 주체(committer)는 변경 없음, 단 spawn 결합 맥락 반영

4. **HTML 시각화 파일 3개**
   - 각 스펙 문서의 변경사항을 시각적으로 반영

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_SDD_with_ucagent_requirement.md` | MODIFY | v1.6.0 변경 이력 추가, 에이전트 호출 구조 현행화 |
| `docs/SDD-requirement-visual.html` | MODIFY | spawn 결합 시각화 반영 |
| `docs/spec_sliding-window-context.md` | MODIFY | verifier+committer 결합의 context handoff 영향 반영 |
| `docs/sliding-window-context-visual.html` | MODIFY | 슬라이딩 윈도우 시각화 갱신 |
| `docs/spec_callback-integration.md` | MODIFY | spawn 결합 맥락 반영 |
| `docs/callback-integration-visual.html` | MODIFY | 콜백 시각화 갱신 |

## Acceptance Criteria
- [ ] SDD 스펙 변경 이력에 v1.6.0이 추가됨
- [ ] SDD 스펙 에이전트 호출 구조가 spawn 결합을 반영
- [ ] sliding-window 스펙에 verifier+committer 결합 영향이 기술됨
- [ ] callback 스펙에 spawn 결합 맥락이 반영됨
- [ ] 3개 HTML 시각화가 모두 업데이트됨

## Verify
```bash
# 문서 변경이므로 별도 빌드/테스트 불필요
head -30 docs/spec_SDD_with_ucagent_requirement.md
```
