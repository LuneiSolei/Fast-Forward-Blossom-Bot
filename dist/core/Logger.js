import { mapSourcePosition, install } from "source-map-support";
import * as core from "@actions/core";
// Register source-map-support once
install();
export class Logger {
    static InvalidWorkflowValueError(variable, value, depth = 1) {
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
    static InvalidEventError(event, depth = 1) {
        const info = this.getCallerInfo(depth + 1);
        const message = `Received invalid event: ${event}`;
        core.setFailed(message);
        throw new TypeError(message, {
            cause: {
                ...info
            }
        });
    }
    static EventFileParseError(eventPath, depth = 1) {
        const info = this.getCallerInfo(depth + 1);
        const message = `Event file could not be parsed: ${eventPath}`;
        core.setFailed(message);
        throw new SyntaxError(message, {
            cause: {
                ...info
            }
        });
    }
    static ReferenceError(message, depth = 1) {
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
    static getCallerInfo(depth = 0) {
        const original = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const target = {};
        Error.captureStackTrace(target, Logger.getCallerInfo);
        const site = target.stack[depth];
        Error.prepareStackTrace = original;
        if (!site)
            return null;
        const raw = {
            source: site.getFileName() ?? null,
            line: site.getLineNumber() ?? null,
            column: site.getColumnNumber() ?? null
        };
        if (!raw.source)
            return null;
        // @ts-ignore
        const mapped = mapSourcePosition(raw);
        return {
            source: mapped.source || raw.source,
            line: mapped.line || raw.line,
            column: mapped.column || raw.column,
        };
    }
}
//# sourceMappingURL=Logger.js.map