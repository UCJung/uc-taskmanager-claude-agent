/**
 * 파일 시스템 추상화 모듈
 * fs/promises 기반으로 readFile, writeFile, listDir, exists, readDir 등을 제공한다.
 */
import fs from "node:fs/promises";
import path from "node:path";
/**
 * 파일 시스템 추상화 클래스.
 * 경로는 절대 경로로 전달하거나 basePath를 생성자에서 지정할 수 있다.
 */
export class FileManager {
    basePath;
    constructor(basePath) {
        this.basePath = basePath ?? process.cwd();
    }
    /**
     * basePath를 기준으로 절대 경로를 반환한다.
     * 이미 절대 경로이면 그대로 반환한다.
     */
    resolvePath(filePath) {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.join(this.basePath, filePath);
    }
    /**
     * 파일을 UTF-8 텍스트로 읽는다.
     * @throws 파일이 없으면 ENOENT 에러를 그대로 던진다.
     */
    async readFile(filePath) {
        const resolved = this.resolvePath(filePath);
        return fs.readFile(resolved, "utf-8");
    }
    /**
     * 파일을 UTF-8 텍스트로 쓴다.
     * 부모 디렉토리가 없으면 자동으로 생성한다.
     */
    async writeFile(filePath, content) {
        const resolved = this.resolvePath(filePath);
        await fs.mkdir(path.dirname(resolved), { recursive: true });
        await fs.writeFile(resolved, content, "utf-8");
    }
    /**
     * 파일/디렉토리 존재 여부를 반환한다.
     */
    async exists(filePath) {
        const resolved = this.resolvePath(filePath);
        try {
            await fs.access(resolved);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 디렉토리 내 파일명 목록을 반환한다 (재귀 없음).
     * 디렉토리가 없으면 빈 배열을 반환한다.
     */
    async listDir(dirPath) {
        const resolved = this.resolvePath(dirPath);
        try {
            const entries = await fs.readdir(resolved);
            return entries;
        }
        catch {
            return [];
        }
    }
    /**
     * 디렉토리 내 항목을 DirEntry 배열로 반환한다.
     * 디렉토리가 없으면 빈 배열을 반환한다.
     */
    async readDir(dirPath) {
        const resolved = this.resolvePath(dirPath);
        try {
            const entries = await fs.readdir(resolved, { withFileTypes: true });
            return entries.map((e) => ({
                name: e.name,
                isDirectory: e.isDirectory(),
                isFile: e.isFile(),
            }));
        }
        catch {
            return [];
        }
    }
    /**
     * 디렉토리를 생성한다 (부모 포함 재귀 생성).
     */
    async mkdir(dirPath) {
        const resolved = this.resolvePath(dirPath);
        await fs.mkdir(resolved, { recursive: true });
    }
    /**
     * 파일에 텍스트를 추가(append)한다.
     * 파일이 없으면 새로 생성한다.
     */
    async appendFile(filePath, content) {
        const resolved = this.resolvePath(filePath);
        await fs.mkdir(path.dirname(resolved), { recursive: true });
        await fs.appendFile(resolved, content, "utf-8");
    }
}
//# sourceMappingURL=file-manager.js.map