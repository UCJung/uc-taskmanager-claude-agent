/**
 * Git Tools — git 작업 도구 2개를 MCP Tool로 등록한다.
 *
 * 등록 도구:
 *   1. commit_work — WORK 산출물을 git commit한다.
 *   2. push_work   — 커밋된 변경사항을 push한다. Push 절차 3단계를 자동 실행한다.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WorkParser } from "../core/work-parser.js";
import { logWork } from "../core/activity-log.js";
import { getConfig } from "../core/config.js";

// ---------------------------------------------------------------------------
// 공유 WorkParser 인스턴스 (기본 설정 사용)
// ---------------------------------------------------------------------------
let _parser: WorkParser | null = null;

function getParser(): WorkParser {
  if (!_parser) {
    _parser = new WorkParser();
  }
  return _parser;
}

// ---------------------------------------------------------------------------
// registerGitTools
// ---------------------------------------------------------------------------

/**
 * McpServer에 Git Tools 2개를 등록한다.
 *
 * @param server McpServer 인스턴스
 * @param parser 테스트 주입용 WorkParser (생략 시 싱글톤 사용)
 */
export function registerGitTools(server: McpServer, parser?: WorkParser): void {
  const p = parser ?? getParser();

  // 1. commit_work
  server.tool(
    "commit_work",
    "WORK 산출물을 git commit한다. 메시지를 자동 생성하거나 명시적으로 지정할 수 있다.",
    {
      work_id: z.string().describe("커밋할 WORK ID (예: WORK-31)"),
      message: z
        .string()
        .optional()
        .describe("커밋 메시지 (생략 시 자동 생성)"),
    },
    async ({ work_id, message }) => {
      const config = getConfig();
      const commitMessage = message ?? `feat(${work_id}): TASK 구현 완료`;

      try {
        // git add works/{work_id}/
        execSync(`git add works/${work_id}/`, {
          cwd: config.projectRoot,
          encoding: "utf-8",
        });

        // git commit -m "{message}"
        execSync(`git commit -m "${commitMessage}"`, {
          cwd: config.projectRoot,
          encoding: "utf-8",
        });

        // 커밋 해시 파싱
        const commitHash = execSync("git log --format=%H -1", {
          cwd: config.projectRoot,
          encoding: "utf-8",
        }).trim();

        // 변경 파일 수 추출
        const showOutput = execSync(`git show --stat --format="" ${commitHash}`, {
          cwd: config.projectRoot,
          encoding: "utf-8",
        });
        const filesChangedMatch = showOutput.match(/(\d+) file/);
        const filesChanged = filesChangedMatch
          ? parseInt(filesChangedMatch[1], 10)
          : 0;

        await logWork(work_id, "MCP", "COMMIT", `Committed: ${commitHash}`);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  work_id,
                  commit_hash: commitHash,
                  files_changed: filesChanged,
                  message: commitMessage,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: `git commit 실패: ${errorMessage}`,
                  work_id,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  // 2. push_work
  server.tool(
    "push_work",
    "커밋된 변경사항을 push한다. Push 절차 3단계를 자동 실행한다.",
    {
      work_id: z.string().describe("push할 WORK ID (예: WORK-31)"),
      update_readme: z
        .boolean()
        .optional()
        .default(true)
        .describe("README 업데이트 안내 포함 여부 (기본값: true)"),
    },
    async ({ work_id, update_readme }) => {
      const config = getConfig();
      const stepsCompleted: string[] = [];

      try {
        // Step 1: README 업데이트 안내 (실제 업데이트는 클라이언트 책임)
        if (update_readme) {
          stepsCompleted.push(
            "README update noted (실제 업데이트는 클라이언트 책임)"
          );
        }

        // Step 2: WORK-LIST.md 상태를 COMPLETED로 업데이트 후 커밋
        await p.updateWorkListStatus(work_id, "COMPLETED");

        execSync("git add works/WORK-LIST.md", {
          cwd: config.projectRoot,
          encoding: "utf-8",
        });

        execSync(
          `git commit -m "chore: update WORK-LIST.md ${work_id} → COMPLETED"`,
          {
            cwd: config.projectRoot,
            encoding: "utf-8",
          }
        );
        stepsCompleted.push("WORK-LIST updated");

        // Step 3: git push
        execSync("git push", {
          cwd: config.projectRoot,
          encoding: "utf-8",
        });
        stepsCompleted.push("git pushed");

        await logWork(work_id, "MCP", "COMMIT", "Pushed to remote");

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  work_id,
                  pushed: true,
                  steps_completed: stepsCompleted,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: `push 실패: ${errorMessage}`,
                  work_id,
                  steps_completed: stepsCompleted,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}
