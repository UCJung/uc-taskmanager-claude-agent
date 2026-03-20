# Requirement — WORK-32

## Original Request
> "docs 현행화"
> Plugin 구조 전환(WORK-30, WORK-31) 후 변경된 폴더 구조를 README.md, README_KO.md에 반영

## Functional Requirements
- FR-01: README.md의 Repository Structure 섹션을 현재 폴더 구조에 맞게 갱신
  - plugin/agents/에서 support file 6개 제거 (skills/sdd-pipeline/references/로 이동됨)
  - plugin/skills/sdd-pipeline/ 디렉토리 및 SKILL.md 추가
  - .claude/ 디렉토리 추가
  - plugin.json 버전 1.3.0 반영
- FR-02: README_KO.md의 저장소 구조 섹션을 동일하게 갱신
  - README_KO.md는 현재 구 구조(agents/ 플랫 구조)를 보여주고 있으므로 agents/en/, agents/ko/ + npm/ + plugin/ 분리 구조로 전면 갱신

## Non-Functional Requirements
- NFR-01: 기존 README 문체/톤 유지

## Acceptance Criteria
- [ ] README.md Repository Structure가 실제 파일시스템과 일치
- [ ] README_KO.md 저장소 구조가 실제 파일시스템과 일치
- [ ] Support Files 섹션에서 참조 경로가 skills/sdd-pipeline/references/로 갱신
- [ ] Plugin 설명에 skills 디렉토리 언급
