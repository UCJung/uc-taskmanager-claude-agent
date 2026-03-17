/** readDir 항목 타입 */
export interface DirEntry {
    name: string;
    isDirectory: boolean;
    isFile: boolean;
}
/**
 * 파일 시스템 추상화 클래스.
 * 경로는 절대 경로로 전달하거나 basePath를 생성자에서 지정할 수 있다.
 */
export declare class FileManager {
    private readonly basePath;
    constructor(basePath?: string);
    /**
     * basePath를 기준으로 절대 경로를 반환한다.
     * 이미 절대 경로이면 그대로 반환한다.
     */
    resolvePath(filePath: string): string;
    /**
     * 파일을 UTF-8 텍스트로 읽는다.
     * @throws 파일이 없으면 ENOENT 에러를 그대로 던진다.
     */
    readFile(filePath: string): Promise<string>;
    /**
     * 파일을 UTF-8 텍스트로 쓴다.
     * 부모 디렉토리가 없으면 자동으로 생성한다.
     */
    writeFile(filePath: string, content: string): Promise<void>;
    /**
     * 파일/디렉토리 존재 여부를 반환한다.
     */
    exists(filePath: string): Promise<boolean>;
    /**
     * 디렉토리 내 파일명 목록을 반환한다 (재귀 없음).
     * 디렉토리가 없으면 빈 배열을 반환한다.
     */
    listDir(dirPath: string): Promise<string[]>;
    /**
     * 디렉토리 내 항목을 DirEntry 배열로 반환한다.
     * 디렉토리가 없으면 빈 배열을 반환한다.
     */
    readDir(dirPath: string): Promise<DirEntry[]>;
    /**
     * 디렉토리를 생성한다 (부모 포함 재귀 생성).
     */
    mkdir(dirPath: string): Promise<void>;
    /**
     * 파일에 텍스트를 추가(append)한다.
     * 파일이 없으면 새로 생성한다.
     */
    appendFile(filePath: string, content: string): Promise<void>;
}
//# sourceMappingURL=file-manager.d.ts.map