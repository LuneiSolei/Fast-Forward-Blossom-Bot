import { mapSourcePosition, install } from "source-map-support";
import * as core from "@actions/core";
import InvalidInstallationTokenError from "./invalidInstallationTokenError.js";
import AppNotInstalledError from "./appNotInstalledError.js";

// Register source-map-support once
install();

export class Logger
{
    public static AppNotInstalledError(owner: string, repoName: string): never
    {
        throw new AppNotInstalledError(owner, repoName);
    }

    public static Debug(message: string)
    {
        core.debug(message);
    }

    public static InvalidInstallationTokenError(depth: number = 1) : never
    {
        const info = this.getCallerInfo(depth + 1)
        throw new InvalidInstallationTokenError({ ...info })
    }

    public static EventFileParseError(eventPath: string, depth: number = 1): never
    {
        const info = this.getCallerInfo(depth + 1);
        const message = `Event file could not be parsed: ${eventPath}`;
        core.setFailed(message)
        throw new SyntaxError(message, {
            cause: {
                ...info
            }
        });
    }

    public static InvalidEventError(event: string, depth: number = 1): never
    {
        const info = this.getCallerInfo(depth + 1);
        const message = `Received invalid event: ${event}`;
        core.setFailed(message);
        throw new TypeError(message, {
            cause: {
                ...info
            }
        })
    }

    public static ReferenceError(variable: string, depth: number = 1): never
    {
        const info = this.getCallerInfo(depth + 1);
        const message = `Attempted to access undefined '${variable}'`
        core.setFailed(message);
        throw new ReferenceError(message, {
            cause: {
                ...info
            }
        });
    }

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

    private static getCallerInfo(depth: number = 0): { source: string | null; line: number | null; column: number | null } | null
    {
        const original = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const target = {} as { stack: NodeJS.CallSite[] };
        Error.captureStackTrace(target, Logger.getCallerInfo);
        const site = target.stack[depth];
        Error.prepareStackTrace = original;

        // istanbul ignore if
        if (!site) return null;

        const raw = {
            source: site.getFileName() ?? null,
            line: site.getLineNumber() ?? null,
            column: site.getColumnNumber() ?? null
        };

        // istanbul ignore if
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

export default Logger;