/**
 * DAG 엔진 모듈
 * TASK 간 의존성 그래프를 관리하고, BFS 기반 탐색 및 상태 판정 기능을 제공한다.
 */
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
    getTaskStatus(taskId: string, completedTasks: Set<string>): "DONE" | "READY" | "BLOCKED";
    /** 등록된 모든 TASK ID 목록 */
    getAllTasks(): string[];
}
/**
 * TaskDag 인터페이스 구현체.
 * dependencies 맵은 "TASK-01이 실행되려면 TASK-00이 먼저 완료되어야 한다"는
 * 방향으로 해석한다. 즉 { "TASK-01": ["TASK-00"] }.
 */
export declare class DagEngine implements TaskDag {
    /**
     * 내부 의존성 맵.
     * deps[taskId] = [선행 TASK ID, ...]
     */
    private readonly deps;
    /**
     * 순방향 엣지 (의존성 방향: from -> to).
     * "from이 완료되면 to의 실행이 가능해진다"는 방향.
     * edges[from] = [to, ...]
     */
    private readonly edges;
    constructor(dependencies: TaskDependencyMap);
    /**
     * 직접 의존 TASK 목록 반환.
     * 등록되지 않은 taskId는 빈 배열 반환.
     */
    getDependencies(taskId: string): string[];
    /**
     * BFS로 모든 선행 TASK ID를 반환.
     * 직접 의존뿐 아니라 간접 의존(의존의 의존)도 포함한다.
     */
    getAllAncestors(taskId: string): string[];
    /**
     * BFS 최단 거리 계산.
     * from에서 의존성 방향(from -> to)으로 최단 경로를 탐색한다.
     * 도달 불가 시 Infinity 반환.
     */
    shortestPath(from: string, to: string): number;
    /**
     * 현재 실행 가능한 TASK 목록 반환.
     * completedTasks에 없고, 모든 의존 TASK가 완료된 TASK만 포함한다.
     */
    getReadyTasks(completedTasks: Set<string>): string[];
    /**
     * TASK 상태 판정.
     * DONE → READY → BLOCKED 순서로 판단한다.
     */
    getTaskStatus(taskId: string, completedTasks: Set<string>): "DONE" | "READY" | "BLOCKED";
    /**
     * 등록된 모든 TASK ID 목록 반환.
     */
    getAllTasks(): string[];
}
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
export declare function parseDagFromPlan(planContent: string): TaskDependencyMap;
//# sourceMappingURL=dag.d.ts.map