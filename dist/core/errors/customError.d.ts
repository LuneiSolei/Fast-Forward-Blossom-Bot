interface Cause {
    source?: string;
    line?: number;
    column?: number;
}
export default class CustomError extends Error {
    constructor(message: string, reason: string);
    protected static GetCallerInfo(depth?: number): Cause;
}
export {};
//# sourceMappingURL=customError.d.ts.map