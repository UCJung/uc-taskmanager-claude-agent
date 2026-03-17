/**
 * DAG 엔진 모듈
 * TASK 간 의존성 그래프를 관리하고, BFS 기반 탐색 및 상태 판정 기능을 제공한다.
 */

// ---------------------------------------------------------------------------
// 타입 정의
// ---------------------------------------------------------------------------

/** TASK 의존성 맵 — { "TASK-01": ["TASK-00"] } 형식 */
export type TaskDependencyMap = Record<string, string[]>;

/** TaskDag 인터페이스 */
export interface TaskDag {
  /** 직접 의존 TASK 목록 (이 TASK가 실행되기 전에 완료되어야 하는 TASK들) */
  getDependencies(taskId: string): string[];

  /** BFS로 모든 선행 TASK ID를 반환 (직접 + 간접 의존 모두 포함) */
  getAllAncestors(taskId: string): string[];

  /**
   * BFS 최단 거리 계산.
   * from에서 to까지 의존성 방향으로의 최단 경로 길이를 반환한다.
   * 도달 불가 시 Infinity 반환.
   */
  shortestPath(from: string, to: string): number;

  /**
   * 현재 실행 가능한 TASK 목록 반환.
   * completedTasks에 없고, 모든 의존 TASK가 완료된 TASK를 반환한다.
   */
  getReadyTasks(completedTasks: Set<string>): string[];

  /**
   * TASK 상태 판정.
   * - DONE: completedTasks에 포함됨
   * - READY: 미완료이며 모든 deps가 완료됨
   * - BLOCKED: 미완료이며 미완료 deps가 하나라도 있음
   */
  getTaskStatus(
    taskId: string,
    completedTasks: Set<string>
  ): "DONE" | "READY" | "BLOCKED";

  /** 등록된 모든 TASK ID 목록 */
  getAllTasks(): string[];
}

// ---------------------------------------------------------------------------
// DagEngine 구현
// ---------------------------------------------------------------------------

/**
 * TaskDag 인터페이스 구현체.
 * dependencies 맵은 "TASK-01이 실행되려면 TASK-00이 먼저 완료되어야 한다"는
 * 방향으로 해석한다. 즉 { "TASK-01": ["TASK-00"] }.
 */
export class DagEngine implements TaskDag {
  /**
   * 내부 의존성 맵.
   * deps[taskId] = [선행 TASK ID, ...]
   */
  private readonly deps: Map<string, string[]>;

  /**
   * 순방향 엣지 (의존성 방향: from -> to).
   * "from이 완료되면 to의 실행이 가능해진다"는 방향.
   * edges[from] = [to, ...]
   */
  private readonly edges: Map<string, string[]>;

  constructor(dependencies: TaskDependencyMap) {
    this.deps = new Map();
    this.edges = new Map();

    // 모든 TASK 등록 (의존성 맵에 명시된 TASK + 의존 대상 TASK)
    for (const [taskId, depList] of Object.entries(dependencies)) {
      this.deps.set(taskId, [...depList]);
      if (!this.edges.has(taskId)) {
        this.edges.set(taskId, []);
      }
      for (const dep of depList) {
        // 역방향: dep -> taskId
        if (!this.edges.has(dep)) {
          this.edges.set(dep, []);
        }
        this.edges.get(dep)!.push(taskId);

        // dep도 deps 맵에 등록 (의존성이 없는 루트 TASK)
        if (!this.deps.has(dep)) {
          this.deps.set(dep, []);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TaskDag 인터페이스 구현
  // ---------------------------------------------------------------------------

  /**
   * 직접 의존 TASK 목록 반환.
   * 등록되지 않은 taskId는 빈 배열 반환.
   */
  getDependencies(taskId: string): string[] {
    return this.deps.get(taskId) ?? [];
  }

  /**
   * BFS로 모든 선행 TASK ID를 반환.
   * 직접 의존뿐 아니라 간접 의존(의존의 의존)도 포함한다.
   */
  getAllAncestors(taskId: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [...this.getDependencies(taskId)];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const parentDeps = this.getDependencies(current);
      for (const dep of parentDeps) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * BFS 최단 거리 계산.
   * from에서 의존성 방향(from -> to)으로 최단 경로를 탐색한다.
   * 도달 불가 시 Infinity 반환.
   */
  shortestPath(from: string, to: string): number {
    if (from === to) return 0;

    // BFS: edges (순방향: from이 완료 후 실행 가능한 TASK)
    const visited = new Set<string>();
    const queue: Array<{ id: string; dist: number }> = [{ id: from, dist: 0 }];

    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const neighbors = this.edges.get(id) ?? [];
      for (const neighbor of neighbors) {
        if (neighbor === to) return dist + 1;
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, dist: dist + 1 });
        }
      }
    }

    return Infinity;
  }

  /**
   * 현재 실행 가능한 TASK 목록 반환.
   * completedTasks에 없고, 모든 의존 TASK가 완료된 TASK만 포함한다.
   */
  getReadyTasks(completedTasks: Set<string>): string[] {
    const ready: string[] = [];

    for (const taskId of this.deps.keys()) {
      if (completedTasks.has(taskId)) continue;

      const depList = this.getDependencies(taskId);
      const allDepsDone = depList.every((dep) => completedTasks.has(dep));

      if (allDepsDone) {
        ready.push(taskId);
      }
    }

    return ready;
  }

  /**
   * TASK 상태 판정.
   * DONE → READY → BLOCKED 순서로 판단한다.
   */
  getTaskStatus(
    taskId: string,
    completedTasks: Set<string>
  ): "DONE" | "READY" | "BLOCKED" {
    if (completedTasks.has(taskId)) return "DONE";

    const depList = this.getDependencies(taskId);
    const allDepsDone = depList.every((dep) => completedTasks.has(dep));

    return allDepsDone ? "READY" : "BLOCKED";
  }

  /**
   * 등록된 모든 TASK ID 목록 반환.
   */
  getAllTasks(): string[] {
    return Array.from(this.deps.keys());
  }
}

// ---------------------------------------------------------------------------
// PLAN.md 파싱
// ---------------------------------------------------------------------------

/**
 * PLAN.md 내용에서 DAG 의존성 맵을 파싱한다.
 *
 * 지원 형식:
 * 1. 테이블 형식 (## Task Dependency Graph 또는 ## Tasks 섹션):
 *    | TASK-00 | ... | (없음) |
 *    | TASK-01 | ... | TASK-00 |
 *
 * 2. 화살표 형식:
 *    TASK-00 → TASK-01
 *    TASK-00 ──→ TASK-01
 */
export function parseDagFromPlan(planContent: string): TaskDependencyMap {
  const result: TaskDependencyMap = {};

  // 화살표 형식 파싱 (→ 또는 ──→ 또는 --> 등)
  const arrowPattern = /(TASK-\d+)\s*(?:─+)?→\s*(TASK-\d+)/g;
  let arrowMatch: RegExpExecArray | null;

  while ((arrowMatch = arrowPattern.exec(planContent)) !== null) {
    const from = arrowMatch[1];
    const to = arrowMatch[2];

    // from이 없으면 의존성 없는 TASK로 등록
    if (!(from in result)) {
      result[from] = [];
    }

    // to는 from에 의존
    if (!(to in result)) {
      result[to] = [from];
    } else if (!result[to].includes(from)) {
      result[to].push(from);
    }
  }

  // 테이블 형식 파싱
  // "## Task Dependency Graph" 또는 "## Tasks" 섹션 탐색
  const sectionPattern =
    /##\s+(?:Task Dependency Graph|Tasks)\s*\n([\s\S]*?)(?=\n##\s|\n---\s*$|$)/g;
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = sectionPattern.exec(planContent)) !== null) {
    const sectionContent = sectionMatch[1];
    _parseTableSection(sectionContent, result);
  }

  // 섹션이 없으면 전체 내용에서 테이블 파싱 시도
  if (Object.keys(result).length === 0) {
    _parseTableSection(planContent, result);
  }

  return result;
}

/**
 * 마크다운 테이블에서 TASK 의존성을 파싱한다.
 * | TASK-00 | ... | (없음) | 또는 | TASK-01 | ... | TASK-00 | 형식
 */
function _parseTableSection(
  content: string,
  result: TaskDependencyMap
): void {
  const lines = content.split("\n");

  for (const line of lines) {
    // 테이블 행만 처리: | TASK-NN | ... |
    if (!line.trim().startsWith("|")) continue;

    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cols.length < 1) continue;

    // 첫 번째 컬럼이 TASK-NN 형식인지 확인
    const taskMatch = cols[0].match(/^(TASK-\d+)$/);
    if (!taskMatch) continue;

    const taskId = taskMatch[1];

    // 마지막 컬럼에서 의존성 추출 (가장 마지막 컬럼을 deps로 간주)
    const depsCol = cols[cols.length - 1];

    // "(없음)", "없음", "none", "(none)", "-" 등은 의존성 없음
    const isEmpty =
      /^[\(\（]?없음[\)\）]?$/.test(depsCol) ||
      /^[\(\（]?none[\)\）]?$/i.test(depsCol) ||
      depsCol === "-" ||
      depsCol === "";

    if (isEmpty) {
      if (!(taskId in result)) {
        result[taskId] = [];
      }
    } else {
      // 쉼표로 구분된 여러 의존성 지원: "TASK-00, TASK-01"
      const depIds = depsCol
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => /^TASK-\d+$/.test(s));

      if (depIds.length > 0) {
        if (!(taskId in result)) {
          result[taskId] = depIds;
        } else {
          for (const depId of depIds) {
            if (!result[taskId].includes(depId)) {
              result[taskId].push(depId);
            }
          }
        }

        // 의존 대상 TASK도 등록
        for (const depId of depIds) {
          if (!(depId in result)) {
            result[depId] = [];
          }
        }
      } else {
        // 의존성 컬럼이 있지만 TASK 형식이 아닌 경우 — 의존성 없음으로 처리
        if (!(taskId in result)) {
          result[taskId] = [];
        }
      }
    }
  }
}
