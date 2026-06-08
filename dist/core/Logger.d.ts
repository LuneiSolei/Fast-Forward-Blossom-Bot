export declare class Logger {
    static InvalidWorkflowValueError(variable: string, value: string, depth?: number): never;
    static InvalidEventError(event: string, depth?: number): never;
    static EventFileParseError(eventPath: string, depth?: number): never;
    static ReferenceError(message: string, depth?: number): never;
    private static getCallerInfo;
}
//# sourceMappingURL=Logger.d.ts.map