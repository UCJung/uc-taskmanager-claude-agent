# TASK-01: Pipeline Architecture Spec 및 시각화 현행화

## WORK
WORK-45: 기술문서 및 README 영/한 현행화 (v1.4.0~v1.5.0)

## Dependencies
- TASK-00 (required)

## Scope
Pipeline architecture 스펙 문서와 HTML 시각화에 spawn 결합 아키텍처를 반영한다.

### 반영할 변경사항

1. **에이전트 호출 구조 다이어그램 갱신**
   - pipeline 모드: specifier+planner 단일 spawn → builder → verifier+committer 단일 spawn
   - full 모드: specifier+planner 단일 spawn → scheduler → [builder → verifier+committer] x N
   - direct 모드: specifier (Planner 겸임) → builder → verifier+committer 단일 spawn

2. **spawn 수 갱신**
   - direct: specifier(1) + builder(1) + verifier+committer(1) = 3 spawns
   - pipeline: specifier+planner(1) + builder(1) + verifier+committer(1) = 3 spawns
   - full (6 TASK): specifier+planner(1) + scheduler(1) + [builder(1) + verifier+committer(1)] x 6 = 14 spawns (기존 20)

3. **v1.4.0/v1.5.0 변경사항**
   - 자동 권한 설정, pipe 명령어 제거, plugin 리소스 npm 포함

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_pipeline-architecture_v1.3.md` | MODIFY | spawn 결합 반영, 호출 구조 다이어그램 갱신, spawn 수 갱신 |
| `docs/pipeline-architecture-v1.3-visual.html` | MODIFY | 인터랙티브 시각화에 spawn 결합 반영 |

## Acceptance Criteria
- [ ] 스펙 문서의 에이전트 호출 구조 다이어그램이 spawn 결합을 반영
- [ ] 각 execution-mode의 spawn 수가 정확
- [ ] HTML 시각화가 spawn 결합을 시각적으로 표현

## Verify
```bash
# 문서 변경이므로 별도 빌드/테스트 불필요
head -60 docs/spec_pipeline-architecture_v1.3.md
```
