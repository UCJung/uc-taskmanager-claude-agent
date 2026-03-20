# WORK-06-TASK-02: 전역 설치 파일 동기화

> WORK: WORK-06 — committer result 파일 섹션 헤더 다국어 대응
> Depends on: WORK-06-TASK-00, WORK-06-TASK-01

## 목적

레포의 수정된 committer.md와 shared-prompt-sections.md를 전역 설치 경로에 복사하여 동기화한다.

## 구현 내용

```bash
cp agents/committer.md ~/.claude/agents/committer.md
cp agents/shared-prompt-sections.md ~/.claude/agents/shared-prompt-sections.md
```

## 대상 파일

- `C:\Users\ucjung\.claude\agents\committer.md` — SYNC (복사)
- `C:\Users\ucjung\.claude\agents\shared-prompt-sections.md` — SYNC (복사)

## 인수 조건

- [ ] 레포와 전역 설치 파일의 내용이 동일

## 검증

```bash
diff agents/committer.md ~/.claude/agents/committer.md
diff agents/shared-prompt-sections.md ~/.claude/agents/shared-prompt-sections.md
```
