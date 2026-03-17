/**
 * DagEngine 및 parseDagFromPlan 단위 테스트
 * vitest 기반
 */
import { describe, it, expect } from "vitest";
import { DagEngine, parseDagFromPlan } from "../dag.js";

// ---------------------------------------------------------------------------
// DagEngine — 선형 의존성 (TASK-00 → TASK-01 → TASK-02)
// ---------------------------------------------------------------------------

describe("DagEngine: 선형 의존성", () => {
  // TASK-00 → TASK-01 → TASK-02
  const engine = new DagEngine({
    "TASK-00": [],
    "TASK-01": ["TASK-00"],
    "TASK-02": ["TASK-01"],
  });

  it("TASK-00의 직접 의존성은 없다", () => {
    expect(engine.getDependencies("TASK-00")).toEqual([]);
  });

  it("TASK-01의 직접 의존성은 TASK-00이다", () => {
    expect(engine.getDependencies("TASK-01")).toEqual(["TASK-00"]);
  });

  it("TASK-02의 직접 의존성은 TASK-01이다", () => {
    expect(engine.getDependencies("TASK-02")).toEqual(["TASK-01"]);
  });

  it("TASK-02의 모든 선행 TASK는 TASK-01, TASK-00이다", () => {
    const ancestors = engine.getAllAncestors("TASK-02");
    expect(ancestors).toContain("TASK-00");
    expect(ancestors).toContain("TASK-01");
    expect(ancestors).toHaveLength(2);
  });

  it("TASK-01의 모든 선행 TASK는 TASK-00이다", () => {
    const ancestors = engine.getAllAncestors("TASK-01");
    expect(ancestors).toEqual(["TASK-00"]);
  });

  it("TASK-00의 선행 TASK는 없다", () => {
    const ancestors = engine.getAllAncestors("TASK-00");
    expect(ancestors).toHaveLength(0);
  });

  it("모든 TASK를 반환한다", () => {
    const tasks = engine.getAllTasks();
    expect(tasks).toHaveLength(3);
    expect(tasks).toContain("TASK-00");
    expect(tasks).toContain("TASK-01");
    expect(tasks).toContain("TASK-02");
  });
});

// ---------------------------------------------------------------------------
// DagEngine — 다이아몬드 의존성 (TASK-00 → TASK-01, TASK-02 → TASK-03)
// ---------------------------------------------------------------------------

describe("DagEngine: 다이아몬드 의존성", () => {
  // TASK-00 → TASK-01
  //         ↘
  //           TASK-03
  //         ↗
  // TASK-00 → TASK-02
  const engine = new DagEngine({
    "TASK-00": [],
    "TASK-01": ["TASK-00"],
    "TASK-02": ["TASK-00"],
    "TASK-03": ["TASK-01", "TASK-02"],
  });

  it("TASK-03의 직접 의존성은 TASK-01과 TASK-02이다", () => {
    const deps = engine.getDependencies("TASK-03");
    expect(deps).toContain("TASK-01");
    expect(deps).toContain("TASK-02");
    expect(deps).toHaveLength(2);
  });

  it("TASK-03의 모든 선행 TASK는 TASK-00, TASK-01, TASK-02이다", () => {
    const ancestors = engine.getAllAncestors("TASK-03");
    expect(ancestors).toContain("TASK-00");
    expect(ancestors).toContain("TASK-01");
    expect(ancestors).toContain("TASK-02");
    expect(ancestors).toHaveLength(3);
  });

  it("모든 TASK가 등록된다", () => {
    const tasks = engine.getAllTasks();
    expect(tasks).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// DagEngine — 독립 TASK (의존성 없음)
// ---------------------------------------------------------------------------

describe("DagEngine: 독립 TASK", () => {
  const engine = new DagEngine({
    "TASK-00": [],
    "TASK-01": [],
    "TASK-02": [],
  });

  it("각 TASK의 직접 의존성은 없다", () => {
    expect(engine.getDependencies("TASK-00")).toEqual([]);
    expect(engine.getDependencies("TASK-01")).toEqual([]);
    expect(engine.getDependencies("TASK-02")).toEqual([]);
  });

  it("각 TASK의 선행 TASK는 없다", () => {
    expect(engine.getAllAncestors("TASK-00")).toHaveLength(0);
    expect(engine.getAllAncestors("TASK-01")).toHaveLength(0);
    expect(engine.getAllAncestors("TASK-02")).toHaveLength(0);
  });

  it("모든 TASK가 등록된다", () => {
    expect(engine.getAllTasks()).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// getReadyTasks
// ---------------------------------------------------------------------------

describe("getReadyTasks", () => {
  const linearEngine = new DagEngine({
    "TASK-00": [],
    "TASK-01": ["TASK-00"],
    "TASK-02": ["TASK-01"],
  });

  it("완료된 TASK가 없으면 TASK-00만 READY이다", () => {
    const ready = linearEngine.getReadyTasks(new Set());
    expect(ready).toEqual(["TASK-00"]);
  });

  it("TASK-00 완료 후 TASK-01이 READY이다", () => {
    const ready = linearEngine.getReadyTasks(new Set(["TASK-00"]));
    expect(ready).toEqual(["TASK-01"]);
  });

  it("TASK-00, TASK-01 완료 후 TASK-02가 READY이다", () => {
    const ready = linearEngine.getReadyTasks(new Set(["TASK-00", "TASK-01"]));
    expect(ready).toEqual(["TASK-02"]);
  });

  it("모두 완료되면 READY TASK가 없다", () => {
    const ready = linearEngine.getReadyTasks(
      new Set(["TASK-00", "TASK-01", "TASK-02"])
    );
    expect(ready).toHaveLength(0);
  });

  it("다이아몬드 의존성: TASK-00 완료 후 TASK-01, TASK-02 모두 READY", () => {
    const diamondEngine = new DagEngine({
      "TASK-00": [],
      "TASK-01": ["TASK-00"],
      "TASK-02": ["TASK-00"],
      "TASK-03": ["TASK-01", "TASK-02"],
    });

    const ready = diamondEngine.getReadyTasks(new Set(["TASK-00"]));
    expect(ready).toContain("TASK-01");
    expect(ready).toContain("TASK-02");
    expect(ready).toHaveLength(2);
  });

  it("다이아몬드 의존성: TASK-01만 완료 시 TASK-03은 아직 BLOCKED", () => {
    const diamondEngine = new DagEngine({
      "TASK-00": [],
      "TASK-01": ["TASK-00"],
      "TASK-02": ["TASK-00"],
      "TASK-03": ["TASK-01", "TASK-02"],
    });

    const ready = diamondEngine.getReadyTasks(new Set(["TASK-00", "TASK-01"]));
    expect(ready).toContain("TASK-02");
    expect(ready).not.toContain("TASK-03");
  });

  it("독립 TASK: 완료 없으면 모두 READY", () => {
    const independentEngine = new DagEngine({
      "TASK-00": [],
      "TASK-01": [],
      "TASK-02": [],
    });

    const ready = independentEngine.getReadyTasks(new Set());
    expect(ready).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// getTaskStatus
// ---------------------------------------------------------------------------

describe("getTaskStatus", () => {
  const engine = new DagEngine({
    "TASK-00": [],
    "TASK-01": ["TASK-00"],
    "TASK-02": ["TASK-01"],
  });

  it("completedTasks에 있으면 DONE", () => {
    expect(
      engine.getTaskStatus("TASK-00", new Set(["TASK-00"]))
    ).toBe("DONE");
  });

  it("deps가 없으면 READY", () => {
    expect(engine.getTaskStatus("TASK-00", new Set())).toBe("READY");
  });

  it("deps가 완료되면 READY", () => {
    expect(
      engine.getTaskStatus("TASK-01", new Set(["TASK-00"]))
    ).toBe("READY");
  });

  it("deps가 미완료면 BLOCKED", () => {
    expect(engine.getTaskStatus("TASK-01", new Set())).toBe("BLOCKED");
  });

  it("TASK-02: TASK-01 미완료면 BLOCKED", () => {
    expect(
      engine.getTaskStatus("TASK-02", new Set(["TASK-00"]))
    ).toBe("BLOCKED");
  });

  it("TASK-02: 모든 deps 완료 시 READY", () => {
    expect(
      engine.getTaskStatus("TASK-02", new Set(["TASK-00", "TASK-01"]))
    ).toBe("READY");
  });
});

// ---------------------------------------------------------------------------
// shortestPath
// ---------------------------------------------------------------------------

describe("shortestPath", () => {
  describe("선형 의존성", () => {
    const engine = new DagEngine({
      "TASK-00": [],
      "TASK-01": ["TASK-00"],
      "TASK-02": ["TASK-01"],
    });

    it("자기 자신까지 거리는 0", () => {
      expect(engine.shortestPath("TASK-00", "TASK-00")).toBe(0);
    });

    it("TASK-00 → TASK-01 거리는 1", () => {
      expect(engine.shortestPath("TASK-00", "TASK-01")).toBe(1);
    });

    it("TASK-00 → TASK-02 거리는 2", () => {
      expect(engine.shortestPath("TASK-00", "TASK-02")).toBe(2);
    });

    it("역방향 (TASK-02 → TASK-00)은 Infinity", () => {
      expect(engine.shortestPath("TASK-02", "TASK-00")).toBe(Infinity);
    });

    it("연결되지 않은 TASK는 Infinity", () => {
      const engineWithIsolated = new DagEngine({
        "TASK-00": [],
        "TASK-01": ["TASK-00"],
        "TASK-99": [],
      });
      expect(engine.shortestPath("TASK-00", "TASK-99")).toBe(Infinity);
    });
  });

  describe("다이아몬드 의존성", () => {
    //         TASK-01
    //       ↗         ↘
    // TASK-00           TASK-03
    //       ↘         ↗
    //         TASK-02
    const engine = new DagEngine({
      "TASK-00": [],
      "TASK-01": ["TASK-00"],
      "TASK-02": ["TASK-00"],
      "TASK-03": ["TASK-01", "TASK-02"],
    });

    it("TASK-00 → TASK-01 거리는 1", () => {
      expect(engine.shortestPath("TASK-00", "TASK-01")).toBe(1);
    });

    it("TASK-00 → TASK-02 거리는 1", () => {
      expect(engine.shortestPath("TASK-00", "TASK-02")).toBe(1);
    });

    it("TASK-00 → TASK-03 최단 거리는 2 (두 경로 모두 길이 2)", () => {
      expect(engine.shortestPath("TASK-00", "TASK-03")).toBe(2);
    });

    it("TASK-01 → TASK-03 거리는 1", () => {
      expect(engine.shortestPath("TASK-01", "TASK-03")).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// parseDagFromPlan
// ---------------------------------------------------------------------------

describe("parseDagFromPlan", () => {
  it("테이블 형식: (없음) 의존성 파싱", () => {
    const planContent = `
## Task Dependency Graph

| TASK | 설명 | 의존성 |
|------|------|--------|
| TASK-00 | 초기화 | (없음) |
| TASK-01 | 구현 | TASK-00 |
| TASK-02 | 테스트 | TASK-01 |
`;

    const dag = parseDagFromPlan(planContent);
    expect(dag["TASK-00"]).toEqual([]);
    expect(dag["TASK-01"]).toContain("TASK-00");
    expect(dag["TASK-02"]).toContain("TASK-01");
  });

  it("테이블 형식: 복수 의존성 파싱", () => {
    const planContent = `
## Task Dependency Graph

| TASK | 설명 | 의존성 |
|------|------|--------|
| TASK-00 | 초기화 | (없음) |
| TASK-01 | 구현A | TASK-00 |
| TASK-02 | 구현B | TASK-00 |
| TASK-03 | 통합 | TASK-01, TASK-02 |
`;

    const dag = parseDagFromPlan(planContent);
    expect(dag["TASK-03"]).toContain("TASK-01");
    expect(dag["TASK-03"]).toContain("TASK-02");
    expect(dag["TASK-03"]).toHaveLength(2);
  });

  it("화살표 형식: → 파싱", () => {
    const planContent = `
TASK-00 → TASK-01
TASK-01 → TASK-02
`;

    const dag = parseDagFromPlan(planContent);
    expect(dag["TASK-00"]).toEqual([]);
    expect(dag["TASK-01"]).toContain("TASK-00");
    expect(dag["TASK-02"]).toContain("TASK-01");
  });

  it("화살표 형식: ──→ 파싱", () => {
    const planContent = `
TASK-00 ──→ TASK-01
TASK-01 ──→ TASK-02
`;

    const dag = parseDagFromPlan(planContent);
    expect(dag["TASK-01"]).toContain("TASK-00");
    expect(dag["TASK-02"]).toContain("TASK-01");
  });

  it("## Tasks 섹션에서도 파싱된다", () => {
    const planContent = `
## Tasks

| TASK | 설명 | 의존성 |
|------|------|--------|
| TASK-00 | 초기화 | (없음) |
| TASK-01 | 구현 | TASK-00 |
`;

    const dag = parseDagFromPlan(planContent);
    expect(dag["TASK-00"]).toEqual([]);
    expect(dag["TASK-01"]).toContain("TASK-00");
  });

  it("의존성 없는 PLAN.md는 빈 맵 또는 의존성 없는 TASK만 반환한다", () => {
    const dag = parseDagFromPlan("# WORK-31: Test\n\nNo tasks here.");
    expect(Object.keys(dag)).toHaveLength(0);
  });

  it("DagEngine에 parseDagFromPlan 결과를 주입하면 올바르게 동작한다", () => {
    const planContent = `
## Task Dependency Graph

| TASK | 설명 | 의존성 |
|------|------|--------|
| TASK-00 | 초기화 | (없음) |
| TASK-01 | 구현 | TASK-00 |
| TASK-02 | 테스트 | TASK-01 |
`;

    const depMap = parseDagFromPlan(planContent);
    const engine = new DagEngine(depMap);

    expect(engine.getTaskStatus("TASK-00", new Set())).toBe("READY");
    expect(engine.getTaskStatus("TASK-01", new Set())).toBe("BLOCKED");

    const ready = engine.getReadyTasks(new Set(["TASK-00"]));
    expect(ready).toContain("TASK-01");
  });
});
