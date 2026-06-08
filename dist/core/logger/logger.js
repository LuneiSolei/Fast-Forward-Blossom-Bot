import { mapSourcePosition, install } from "source-map-support";
import * as core from "@actions/core";
import { InvalidInstallationTokenError } from "./errors.js";
// Register source-map-support once
install();
export class Logger {
    static AppNotInstalledError(owner, repoName) {
        const message = `The GitHub App for 'Fast-Forward-Blossom-Bot' is not installed in repository '${owner}/${repoName}'`;
        core.setFailed(message);
        throw new Error(message);
    }
    static Debug(message) {
        core.debug(message);
    }
    static InvalidInstallationTokenError(depth = 1) {
        const info = this.getCallerInfo(depth + 1);
        throw new InvalidInstallationTokenError({ ...info });
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
    static ReferenceError(variable, depth = 1) {
        const info = this.getCallerInfo(depth + 1);
        const message = `Attempted to access undefined '${variable}'`;
        core.setFailed(message);
        throw new ReferenceError(message, {
            cause: {
                ...info
            }
        });
    }
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
    static getCallerInfo(depth = 0) {
        const original = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const target = {};
        Error.captureStackTrace(target, Logger.getCallerInfo);
        const site = target.stack[depth];
        Error.prepareStackTrace = original;
        // istanbul ignore if
        if (!site)
            return null;
        const raw = {
            source: site.getFileName() ?? null,
            line: site.getLineNumber() ?? null,
            column: site.getColumnNumber() ?? null
        };
        // istanbul ignore if
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
export default Logger;
//# sourceMappingURL=logger.js.map