import * as core from "@actions/core";

interface Cause
{
    source?: string;
    line?: number;
    column?: number;
}

export default class CustomError extends Error
{
    constructor(message: string, reason: string)
    {
        const info = CustomError.GetCallerInfo();
        const appendedMessage = `${message} at ${info.source}:${info.line}:${info.column}. \n Reason: ${reason}`;
        super(appendedMessage);
        this.cause = CustomError.GetCallerInfo();
        core.setFailed(this.message);
    }

    protected static GetCallerInfo(depth: number = 2): Cause
    {
        const err = new Error();
        const lines = err.stack?.split("\n");
        const line = lines?.[depth + 2];
        if (!line) return {};

        const match = line.match(/\((.+):(\d+):(\d+)\)$/)
            ?? line.match(/at (.+):(\d+):(\d+)$/);

        if (!match) return {};

        return {
            source: match[1] ?? "",
            line: parseInt(match[2] ?? "", 10),
            column: parseInt(match[3] ?? "", 10),
        }
        // const original = Error.prepareStackTrace;
        // Error.prepareStackTrace = (_, stack) => stack;
        //
        // const target = {} as {
        //     stack: NodeJS.CallSite[]
        // }
        // Error.captureStackTrace(target, this.GetCallerInfo);
        //
        // const site = target.stack[depth];
        // Error.prepareStackTrace = original;
        //
        // // istanbul ignore if
        // if (!site) return {};
        //
        // const raw = {
        //     source: site.getFileName() ?? null,
        //     line: site.getLineNumber() ?? null,
        //     column: site.getColumnNumber() ?? null
        // };
        //
        // console.log(raw.source);
        //
        // // istanbul ignore if
        // if (!raw.source) return {};
        //
        // // @ts-ignore
        // const mapped = mapSourcePosition(raw);
        // return {
        //     source: mapped.source,
        //     line: mapped.line,
        //     column: mapped.column
        // }
    }
}