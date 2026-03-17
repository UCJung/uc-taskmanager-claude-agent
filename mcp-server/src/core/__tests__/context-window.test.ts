/**
 * context-window 모듈 단위 테스트
 */
import { describe, it, expect } from "vitest";
import {
  applyContextWindow,
  applyTaskDependencyWindow,
  extractContextHandoffFromResult,
  formatFullContext,
  type ContextHandoff,
  type TaskResultContextHandoff,
} from "../context-window.js";

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

function makeHandoff(
  from: string,
  overrides: Partial<ContextHandoff> = {}
): ContextHandoff {
  return {
    from,
    detailLevel: "FULL",
    what: `${from} 작업 완료`,
    why: `${from} 의사결정 근거`,
    caution: `${from} 주의사항`,
    incomplete: `${from} 미완료`,
    ...overrides,
  };
}

function makeTaskHandoff(taskId: string): TaskResultContextHandoff {
  return {
    taskId,
    builderContext: makeHandoff("builder"),
    verifierContext: makeHandoff("verifier"),
  };
}

// ---------------------------------------------------------------------------
// applyContextWindow
// ---------------------------------------------------------------------------

describe("applyContextWindow", () => {
  it("distance 1: FULL — 모든 필드 유지", () => {
    const h0 = makeHandoff("builder");
    const result = applyContextWindow([h0], 1);

    expect(result).toHaveLength(1);
    expect(result[0].detailLevel).toBe("FULL");
    expect(result[0].what).toBe(h0.what);
    expect(result[0].why).toBe(h0.why);
    expect(result[0].caution).toBe(h0.caution);
    expect(result[0].incomplete).toBe(h0.incomplete);
  });

  it("distance 2: SUMMARY — what만 유지", () => {
    const h0 = makeHandoff("builder");
    const h1 = makeHandoff("verifier");
    const result = applyContextWindow([h0, h1], 2);

    // h0: distance = 2 - 0 = 2 → SUMMARY
    expect(result[0].detailLevel).toBe("SUMMARY");
    expect(result[0].what).toBe(h0.what);
    expect(result[0].why).toBeUndefined();
    expect(result[0].caution).toBeUndefined();
    expect(result[0].incomplete).toBeUndefined();
  });

  it("distance 3+: DROP — 결과에서 제거됨", () => {
    const h0 = makeHandoff("builder");
    const h1 = makeHandoff("verifier");
    const h2 = makeHandoff("committer");
    // currentStep=3: h0 distance=3(DROP), h1 distance=2(SUMMARY), h2 distance=1(FULL)
    const result = applyContextWindow([h0, h1, h2], 3);

    expect(result).toHaveLength(2);
    expect(result.find((r) => r.from === "builder")).toBeUndefined();
  });

  it("혼합: distance 1=FULL, distance 2=SUMMARY, distance 3=DROP", () => {
    const items = [
      makeHandoff("step0"), // distance 3 → DROP
      makeHandoff("step1"), // distance 2 → SUMMARY
      makeHandoff("step2"), // distance 1 → FULL
    ];
    const result = applyContextWindow(items, 3);

    expect(result).toHaveLength(2);
    expect(result[0].detailLevel).toBe("SUMMARY");
    expect(result[0].from).toBe("step1");
    expect(result[1].detailLevel).toBe("FULL");
    expect(result[1].from).toBe("step2");
  });

  it("빈 배열 → 빈 배열 반환", () => {
    const result = applyContextWindow([], 0);
    expect(result).toHaveLength(0);
  });

  it("원본 객체를 변경하지 않음 (불변성)", () => {
    const h0 = makeHandoff("builder");
    const original = { ...h0 };
    applyContextWindow([h0], 2);
    expect(h0.detailLevel).toBe(original.detailLevel);
  });
});

// ---------------------------------------------------------------------------
// applyTaskDependencyWindow
// ---------------------------------------------------------------------------

describe("applyTaskDependencyWindow", () => {
  it("distance 1: FULL 컨텍스트 포함", () => {
    const dep = {
      taskId: "TASK-00",
      distance: 1,
      handoff: makeTaskHandoff("TASK-00"),
    };
    const result = applyTaskDependencyWindow("TASK-01", [dep]);

    expect(result).toBeDefined();
    expect(result).toContain("TASK-00 (FULL)");
    expect(result).toContain("**Builder Context**");
    expect(result).toContain("**Verifier Context**");
    expect(result).toContain("why");
    expect(result).toContain("caution");
    expect(result).toContain("incomplete");
  });

  it("distance 2: SUMMARY — what만 포함", () => {
    const dep = {
      taskId: "TASK-00",
      distance: 2,
      handoff: makeTaskHandoff("TASK-00"),
    };
    const result = applyTaskDependencyWindow("TASK-02", [dep]);

    expect(result).toBeDefined();
    expect(result).toContain("TASK-00 (SUMMARY)");
    expect(result).not.toContain("why");
    expect(result).not.toContain("caution");
  });

  it("distance 3+: DROP — undefined 반환", () => {
    const dep = {
      taskId: "TASK-00",
      distance: 3,
      handoff: makeTaskHandoff("TASK-00"),
    };
    const result = applyTaskDependencyWindow("TASK-03", [dep]);

    expect(result).toBeUndefined();
  });

  it("여러 의존성 혼합: distance 1 + distance 3", () => {
    const deps = [
      { taskId: "TASK-00", distance: 3, handoff: makeTaskHandoff("TASK-00") },
      { taskId: "TASK-01", distance: 1, handoff: makeTaskHandoff("TASK-01") },
    ];
    const result = applyTaskDependencyWindow("TASK-03", deps);

    expect(result).toBeDefined();
    expect(result).toContain("TASK-01 (FULL)");
    expect(result).not.toContain("TASK-00");
  });

  it("모든 의존성이 DROP이면 undefined 반환", () => {
    const deps = [
      { taskId: "TASK-00", distance: 4, handoff: makeTaskHandoff("TASK-00") },
      { taskId: "TASK-01", distance: 5, handoff: makeTaskHandoff("TASK-01") },
    ];
    const result = applyTaskDependencyWindow("TASK-05", deps);

    expect(result).toBeUndefined();
  });

  it("빈 의존성 배열 → undefined 반환", () => {
    const result = applyTaskDependencyWindow("TASK-01", []);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractContextHandoffFromResult
// ---------------------------------------------------------------------------

describe("extractContextHandoffFromResult", () => {
  const sampleResult = `# TASK-02 결과

## 요약
FileManager 구현 완료

## Context Handoff

### Builder Context
- **what**: FileManager 및 config 모듈 구현
- **why**: 파일시스템 추상화로 테스트 용이성 확보
- **caution**: basePath가 없으면 cwd() 기본값 사용
- **incomplete**: appendFile 대용량 테스트 미완료

### Verifier Context
- **what**: 빌드 및 단위 테스트 통과 확인
- **why**: tsc --noEmit + vitest 실행으로 검증
- **caution**: Node.js 18+ 필요

`;

  it("taskId를 올바르게 파싱한다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result).not.toBeNull();
    expect(result!.taskId).toBe("TASK-02");
  });

  it("Builder Context의 what을 파싱한다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result!.builderContext.what).toBe(
      "FileManager 및 config 모듈 구현"
    );
  });

  it("Builder Context의 why를 파싱한다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result!.builderContext.why).toBe(
      "파일시스템 추상화로 테스트 용이성 확보"
    );
  });

  it("Builder Context의 caution을 파싱한다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result!.builderContext.caution).toBe(
      "basePath가 없으면 cwd() 기본값 사용"
    );
  });

  it("Builder Context의 incomplete을 파싱한다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result!.builderContext.incomplete).toBe(
      "appendFile 대용량 테스트 미완료"
    );
  });

  it("Verifier Context의 what을 파싱한다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result!.verifierContext.what).toBe(
      "빌드 및 단위 테스트 통과 확인"
    );
  });

  it("Verifier Context의 caution을 파싱한다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result!.verifierContext.caution).toBe("Node.js 18+ 필요");
  });

  it("Context Handoff 섹션이 없으면 null 반환", () => {
    const result = extractContextHandoffFromResult("# TASK-02\n## 요약\n내용");
    expect(result).toBeNull();
  });

  it("Builder Context가 없으면 null 반환", () => {
    const noBuilder = `# TASK-02 결과\n## Context Handoff\n### Verifier Context\n- **what**: 검증 완료\n`;
    const result = extractContextHandoffFromResult(noBuilder);
    expect(result).toBeNull();
  });

  it("detailLevel이 FULL로 설정된다", () => {
    const result = extractContextHandoffFromResult(sampleResult);
    expect(result!.builderContext.detailLevel).toBe("FULL");
    expect(result!.verifierContext.detailLevel).toBe("FULL");
  });
});

// ---------------------------------------------------------------------------
// formatFullContext
// ---------------------------------------------------------------------------

describe("formatFullContext", () => {
  it("taskId 헤더를 포함한다", () => {
    const handoff = makeTaskHandoff("TASK-03");
    const output = formatFullContext(handoff);
    expect(output).toContain("TASK-03 (FULL)");
  });

  it("Builder Context 섹션을 포함한다", () => {
    const handoff = makeTaskHandoff("TASK-03");
    const output = formatFullContext(handoff);
    expect(output).toContain("**Builder Context**");
  });

  it("Verifier Context 섹션을 포함한다", () => {
    const handoff = makeTaskHandoff("TASK-03");
    const output = formatFullContext(handoff);
    expect(output).toContain("**Verifier Context**");
  });

  it("optional 필드가 없으면 해당 줄 미포함", () => {
    const handoff: TaskResultContextHandoff = {
      taskId: "TASK-03",
      builderContext: { from: "builder", detailLevel: "FULL", what: "빌드 완료" },
      verifierContext: { from: "verifier", detailLevel: "FULL", what: "검증 완료" },
    };
    const output = formatFullContext(handoff);
    expect(output).not.toContain("why");
    expect(output).not.toContain("caution");
    expect(output).not.toContain("incomplete");
  });
});
