import * as core from "@actions/core";
import {install, mapSourcePosition} from "source-map-support";

interface Cause
{
    source?: string | null;
    line?: number | null;
    column?: number | null;
}

// Map source support
install();

export default class CustomError extends Error
{
    constructor(message: string, addCallerInfo: boolean = true)
    {
        super(message);
        core.setFailed(super.message);
        super.cause = addCallerInfo ? CustomError.GetCallerInfo() : {};
        console.error(super.message, super.cause);
    }

    protected static GetCallerInfo(depth: number = 1): Cause
    {
        const original = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;

        const target = {} as {
            stack: NodeJS.CallSite[]
        }
        Error.captureStackTrace(target, this.GetCallerInfo);

        const site = target.stack[depth];
        Error.prepareStackTrace = original;

        // istanbul ignore if
        if (!site) return {};

        const raw = {
            source: site.getFileName() ?? null,
            line: site.getLineNumber() ?? null,
            column: site.getColumnNumber() ?? null
        };

        // istanbul ignore if
        if (!raw.source) return {};

        // @ts-ignore
        const mapped = mapSourcePosition(raw);
        return {
            source: mapped.source,
            line: mapped.line,
            column: mapped.column
        }
    }
}