export declare class Logger {
    static AppNotInstalledError(owner: string, repoName: string): never;
    static Debug(message: string): void;
    static InvalidInstallationTokenError(depth?: number): never;
    static EventFileParseError(eventPath: string, depth?: number): never;
    static InvalidEventError(event: string, depth?: number): never;
    static ReferenceError(variable: string, depth?: number): never;
    static InvalidWorkflowValueError(variable: string, value: string, depth?: number): never;
    private static getCallerInfo;
}
export default Logger;
//# sourceMappingURL=logger.d.ts.map