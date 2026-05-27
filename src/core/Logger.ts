import { mapSourcePosition, install } from "source-map-support";
import * as core from "@actions/core";

// Register source-map-support once
install();

export class Logger
{
    public static InvalidWorkflowValueError(variable: string, value: string, depth: number = 1): never
    {
        const info = this.getCallerInfo(depth + 1);
        const message = `Invalid value '${value}' for workflow variable '${variable}'`;
        core.setFailed(message);
        throw new TypeError(message, {
            cause: {
                source: info?.source,
                line: info?.line,
                column: info?.column,
            }
        });
    }

    public static ReferenceError(message: string, depth: number = 1): never
    {
        const info = this.getCallerInfo(depth + 1);
        core.setFailed(message);
        throw new ReferenceError(message, {
            cause: {
                source: info?.source,
                line: info?.line,
                column: info?.column,
            }
        });
    }

    private static getCallerInfo(depth: number = 0): { source: string | null; line: number | null; column: number | null } | null
    {
        const original = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const target = {} as { stack: NodeJS.CallSite[] };
        Error.captureStackTrace(target, Logger.getCallerInfo);
        const site = target.stack[depth];
        Error.prepareStackTrace = original;
        if (!site) return null;

        const raw = {
            source: site.getFileName() ?? null,
            line: site.getLineNumber() ?? null,
            column: site.getColumnNumber() ?? null
        };
        if (!raw.source) return null;

        // @ts-ignore
        const mapped = mapSourcePosition(raw);
        return {
            source: mapped.source || raw.source,
            line: mapped.line || raw.line,
            column: mapped.column || raw.column,
        }
    }
}