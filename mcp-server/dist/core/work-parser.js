/**
 * WORK/TASK 파싱 로직 모듈
 * FileManager를 사용하여 works/ 디렉토리의 PLAN.md, TASK 파일 등을 파싱한다.
 */
import path from "node:path";
import { FileManager } from "./file-manager.js";
import { getConfig } from "./config.js";
// ---------------------------------------------------------------------------
// 파일명 정규식 (parseTaskFilename 호환)
// ---------------------------------------------------------------------------
/** TASK 명세 파일: TASK-00.md */
export const TASK_FILE_RE = /^TASK-(\d+)\.md$/;
/** progress 파일: TASK-00_progress.md */
export const TASK_PROGRESS_RE = /^TASK-(\d+)_progress\.md$/;
/** result 파일: TASK-00_result.md */
export const TASK_RESULT_RE = /^TASK-(\d+)_result\.md$/;
// ---------------------------------------------------------------------------
// WorkParser
// ---------------------------------------------------------------------------
/**
 * WORK/TASK 파싱 로직을 담당하는 클래스.
 * 의존성 주입으로 FileManager를 받아 테스트 가능하다.
 */
export class WorkParser {
    fm;
    worksDir;
    constructor(fm) {
        const config = getConfig();
        this.worksDir = config.worksDir;
        this.fm = fm ?? new FileManager(config.projectRoot);
    }
    // ---------------------------------------------------------------------------
    // WORK 목록
    // ---------------------------------------------------------------------------
    /**
     * works/ 디렉토리를 스캔하고 WORK-LIST.md를 파싱하여 WORK 목록을 반환한다.
     */
    async listWorks() {
        // WORK-LIST.md에서 기본 목록 파싱
        const listMdPath = path.join(this.worksDir, "WORK-LIST.md");
        const listEntries = await this._parseWorkListMd(listMdPath);
        // 각 WORK의 실제 진행률을 파일시스템에서 계산
        const summaries = [];
        for (const entry of listEntries) {
            const status = await this.getWorkStatus(entry.id).catch(() => null);
            summaries.push({
                ...entry,
                completed: status?.completedTasks ?? 0,
                total: status?.totalTasks ?? 0,
            });
        }
        return summaries;
    }
    /**
     * WORK-LIST.md 파일을 파싱하여 기본 항목 목록을 반환한다.
     * 마크다운 테이블 형식: | WORK-NN | 제목 | 상태 | 생성일 | 완료일 |
     */
    async _parseWorkListMd(mdPath) {
        let content;
        try {
            content = await this.fm.readFile(mdPath);
        }
        catch {
            return [];
        }
        const results = [];
        const lines = content.split("\n");
        for (const line of lines) {
            // 테이블 헤더/구분선 건너뜀
            if (!line.startsWith("| WORK-"))
                continue;
            const cols = line
                .split("|")
                .map((c) => c.trim())
                .filter((c) => c.length > 0);
            if (cols.length >= 3) {
                results.push({
                    id: cols[0],
                    title: cols[1],
                    status: cols[2],
                    createdAt: cols[3] ?? "",
                });
            }
        }
        return results;
    }
    // ---------------------------------------------------------------------------
    // WORK ID
    // ---------------------------------------------------------------------------
    /**
     * 파일시스템을 스캔하여 다음 WORK 번호를 반환한다.
     * 예: WORK-31이 최신이면 "WORK-32" 반환.
     */
    async getNextWorkId() {
        const entries = await this.fm.readDir(this.worksDir);
        let maxNum = 0;
        for (const e of entries) {
            if (!e.isDirectory)
                continue;
            const match = e.name.match(/^WORK-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum)
                    maxNum = num;
            }
        }
        return `WORK-${String(maxNum + 1).padStart(2, "0")}`;
    }
    // ---------------------------------------------------------------------------
    // PLAN.md 파싱
    // ---------------------------------------------------------------------------
    /**
     * works/{workId}/PLAN.md를 읽고 파싱 결과를 반환한다.
     */
    async readPlan(workId) {
        const planPath = path.join(this.worksDir, workId, "PLAN.md");
        const content = await this.fm.readFile(planPath);
        return this._parsePlanContent(workId, content);
    }
    /**
     * PLAN.md 내용을 파싱하여 Plan 객체를 반환한다.
     * 내부적으로 사용되며, 테스트에서도 직접 호출 가능하다.
     */
    _parsePlanContent(workId, content) {
        // 제목 추출: # WORK-NN: 제목
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : workId;
        // 메타정보 7개 필드 파싱 (> 필드명: 값 형식)
        const meta = {
            created: this._extractMeta(content, "Created"),
            requirements: this._extractMeta(content, "요구사항"),
            executionMode: this._extractMeta(content, "Execution-Mode"),
            project: this._extractMeta(content, "Project"),
            techStack: this._extractMeta(content, "Tech Stack"),
            language: this._extractMeta(content, "Language"),
            status: this._extractMeta(content, "Status"),
        };
        // Goal 섹션 추출
        const goalMatch = content.match(/##\s+Goal\s*\n([\s\S]*?)(?=\n##\s|\n---\s*$|$)/);
        const goal = goalMatch ? goalMatch[1].trim() : "";
        return { workId, title, meta, goal, rawContent: content };
    }
    /**
     * PLAN.md 내용에서 메타 필드 값을 추출한다.
     * 형식: `> 필드명: 값` 또는 `> **필드명**: 값`
     */
    _extractMeta(content, field) {
        // "> Created: 2026-03-18" 또는 "> **Created**: 2026-03-18" 패턴
        const re = new RegExp(`^>\\s+\\*{0,2}${field}\\*{0,2}:\\s*(.+)$`, "m");
        const match = content.match(re);
        return match ? match[1].trim() : "";
    }
    /**
     * Execution-Mode 값을 PLAN.md 원문에서 추출한다.
     * "direct" | "pipeline" | "full" 중 하나를 반환하며, 불일치 시 "full"로 기본값.
     */
    extractExecutionMode(plan) {
        const mode = plan.meta.executionMode.toLowerCase();
        if (mode === "direct" || mode === "pipeline" || mode === "full") {
            return mode;
        }
        return "full";
    }
    // ---------------------------------------------------------------------------
    // TASK 목록 추출
    // ---------------------------------------------------------------------------
    /**
     * PLAN.md 내용에서 TASK 목록을 추출한다.
     * ## Tasks 섹션의 ### TASK-NN: 제목 패턴을 파싱한다.
     */
    extractTasksFromPlan(planContent) {
        const tasks = [];
        // "### TASK-NN: 제목" 또는 "### TASK-NN 제목" 패턴
        const re = /###\s+TASK-(\d+)[:\s]+(.+)/g;
        let match;
        while ((match = re.exec(planContent)) !== null) {
            const num = parseInt(match[1], 10);
            tasks.push({
                taskId: `TASK-${String(num).padStart(2, "0")}`,
                num,
                title: match[2].trim(),
            });
        }
        // 중복 제거 (같은 TASK-NN이 여러 번 나올 경우 첫 번째만 유지)
        const seen = new Set();
        return tasks.filter((t) => {
            if (seen.has(t.taskId))
                return false;
            seen.add(t.taskId);
            return true;
        });
    }
    // ---------------------------------------------------------------------------
    // WORK 진행 상태
    // ---------------------------------------------------------------------------
    /**
     * TASK 파일 수와 result 파일 수를 기반으로 진행률을 계산한다.
     */
    async getWorkStatus(workId) {
        const workPath = path.join(this.worksDir, workId);
        const entries = await this.fm.listDir(workPath);
        let totalTasks = 0;
        let completedTasks = 0;
        for (const name of entries) {
            if (TASK_FILE_RE.test(name))
                totalTasks++;
            if (TASK_RESULT_RE.test(name))
                completedTasks++;
        }
        // PROGRESS.md에서 approved 상태 확인 (단순 파싱)
        const progressPath = path.join(workPath, "PROGRESS.md");
        let approved = false;
        try {
            const progressContent = await this.fm.readFile(progressPath);
            approved = /approved:\s*true/i.test(progressContent);
        }
        catch {
            // PROGRESS.md 없으면 미승인
        }
        return {
            workId,
            totalTasks,
            completedTasks,
            progress: `${completedTasks}/${totalTasks}`,
            approved,
        };
    }
    // ---------------------------------------------------------------------------
    // TASK 파일 읽기
    // ---------------------------------------------------------------------------
    /**
     * works/{workId}/TASK-{taskId}_result.md 파일 내용을 반환한다.
     */
    async readTaskResult(workId, taskId) {
        const num = this._parseTaskNum(taskId);
        const filePath = path.join(this.worksDir, workId, `TASK-${String(num).padStart(2, "0")}_result.md`);
        return this.fm.readFile(filePath);
    }
    /**
     * works/{workId}/TASK-{taskId}_progress.md 파일 내용을 반환한다.
     */
    async readTaskProgress(workId, taskId) {
        const num = this._parseTaskNum(taskId);
        const filePath = path.join(this.worksDir, workId, `TASK-${String(num).padStart(2, "0")}_progress.md`);
        return this.fm.readFile(filePath);
    }
    /**
     * taskId 문자열에서 숫자를 추출한다.
     * "TASK-01" -> 1, "01" -> 1, "1" -> 1
     */
    _parseTaskNum(taskId) {
        const match = taskId.match(/(\d+)$/);
        if (!match)
            throw new Error(`유효하지 않은 taskId: ${taskId}`);
        return parseInt(match[1], 10);
    }
    // ---------------------------------------------------------------------------
    // 기술 스택 감지
    // ---------------------------------------------------------------------------
    /**
     * 프로젝트 디렉토리를 분석하여 기술 스택을 감지한다.
     * package.json, pyproject.toml, Cargo.toml, go.mod 순서로 확인한다.
     */
    async detectTechStack(projectPath) {
        const fm = new FileManager(projectPath);
        const detected = [];
        let primary = "unknown";
        if (await fm.exists("package.json")) {
            detected.push("node");
            if (primary === "unknown")
                primary = "node";
            // TypeScript 여부 확인
            if (await fm.exists("tsconfig.json")) {
                detected.push("typescript");
            }
            // Bun 여부 확인
            if (await fm.exists("bun.lockb") || await fm.exists("bun.lock")) {
                detected.push("bun");
            }
        }
        if (await fm.exists("pyproject.toml") || await fm.exists("setup.py")) {
            detected.push("python");
            if (primary === "unknown")
                primary = "python";
        }
        if (await fm.exists("Cargo.toml")) {
            detected.push("rust");
            if (primary === "unknown")
                primary = "rust";
        }
        if (await fm.exists("go.mod")) {
            detected.push("go");
            if (primary === "unknown")
                primary = "go";
        }
        return { primary, detected };
    }
    // ---------------------------------------------------------------------------
    // Activity Log 파싱
    // ---------------------------------------------------------------------------
    /**
     * works/{workId}/work_{workId}.log 파일을 파싱하여 로그 엔트리 목록을 반환한다.
     * 엔트리 형식: [timestamp]_AGENT_STAGE_DESC
     *
     * @param workId WORK ID
     * @param lastN 마지막 N개 항목만 반환 (undefined이면 전체)
     */
    async parseActivityLog(workId, lastN) {
        const logPath = path.join(this.worksDir, workId, `work_${workId}.log`);
        let content;
        try {
            content = await this.fm.readFile(logPath);
        }
        catch {
            return [];
        }
        const lines = content
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        const entries = lines.map((line) => this._parseLogLine(line));
        if (lastN !== undefined && lastN > 0) {
            return entries.slice(-lastN);
        }
        return entries;
    }
    /**
     * 로그 한 줄을 파싱한다.
     * 형식: [2026-03-18T10:30:00]_AGENT_STAGE_description text
     */
    _parseLogLine(line) {
        // [timestamp]_AGENT_STAGE_DESC 형식
        const match = line.match(/^\[([^\]]+)\]_([^_]+)_([^_]+)_(.+)$/);
        if (!match) {
            return { timestamp: "", agent: "", stage: "", description: line, raw: line };
        }
        return {
            timestamp: match[1],
            agent: match[2],
            stage: match[3],
            description: match[4],
            raw: line,
        };
    }
    // ---------------------------------------------------------------------------
    // WORK-LIST.md 관리
    // ---------------------------------------------------------------------------
    /**
     * WORK-LIST.md에 새 WORK 항목을 추가한다.
     */
    async addToWorkList(workId, title, status) {
        const listMdPath = path.join(this.worksDir, "WORK-LIST.md");
        let content;
        try {
            content = await this.fm.readFile(listMdPath);
        }
        catch {
            content =
                "# WORK-LIST\n\n| WORK | 제목 | 상태 | 생성일 | 완료일 |\n|------|------|------|--------|--------|\n";
        }
        const today = new Date().toISOString().slice(0, 10);
        const completedAt = status === "COMPLETED" ? today : "";
        const newRow = `| ${workId} | ${title} | ${status} | ${today} | ${completedAt} |`;
        content = content.trimEnd() + "\n" + newRow + "\n";
        await this.fm.writeFile(listMdPath, content);
    }
    /**
     * WORK-LIST.md에서 특정 WORK의 상태를 업데이트한다.
     */
    async updateWorkListStatus(workId, status) {
        const listMdPath = path.join(this.worksDir, "WORK-LIST.md");
        const content = await this.fm.readFile(listMdPath);
        const today = new Date().toISOString().slice(0, 10);
        const lines = content.split("\n").map((line) => {
            if (!line.startsWith(`| ${workId} |`))
                return line;
            // 상태 컬럼(3번째) 업데이트
            const cols = line.split("|").map((c) => c.trim());
            if (cols.length >= 4) {
                cols[3] = ` ${status} `;
                if (status === "COMPLETED" && cols[5] !== undefined) {
                    cols[5] = ` ${today} `;
                }
                return cols.join("|");
            }
            return line;
        });
        await this.fm.writeFile(listMdPath, lines.join("\n"));
    }
    // ---------------------------------------------------------------------------
    // 다음 실행 가능한 TASK 조회 (간단한 선형 DAG 기준)
    // ---------------------------------------------------------------------------
    /**
     * DAG 분석 없이 단순히 result.md가 없는 가장 낮은 번호의 TASK를 반환한다.
     * (복잡한 DAG 지원은 core/dag.ts에서 담당)
     */
    async getNextExecutableTask(workId) {
        const workPath = path.join(this.worksDir, workId);
        const entries = await this.fm.listDir(workPath);
        // TASK 파일 수집 후 번호 순 정렬
        const taskNums = [];
        for (const name of entries) {
            const m = TASK_FILE_RE.exec(name);
            if (m)
                taskNums.push(parseInt(m[1], 10));
        }
        taskNums.sort((a, b) => a - b);
        // result.md가 없는 첫 번째 TASK 찾기
        for (const num of taskNums) {
            const resultName = `TASK-${String(num).padStart(2, "0")}_result.md`;
            if (!entries.includes(resultName)) {
                // TASK 파일에서 제목 읽기
                const taskFile = `TASK-${String(num).padStart(2, "0")}.md`;
                let title = taskFile;
                try {
                    const taskContent = await this.fm.readFile(path.join(workPath, taskFile));
                    const titleMatch = taskContent.match(/^#\s+(.+)$/m);
                    if (titleMatch)
                        title = titleMatch[1].trim();
                }
                catch {
                    // 제목 읽기 실패 시 파일명 사용
                }
                return {
                    taskId: `TASK-${String(num).padStart(2, "0")}`,
                    num,
                    title,
                };
            }
        }
        return null; // 모든 TASK 완료
    }
}
//# sourceMappingURL=work-parser.js.map