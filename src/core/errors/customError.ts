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

        // istanbul ignore if
        if (!line) return {};

        const match = line.match(/\((.+):(\d+):(\d+)\)$/)
            ?? /* istanbul ignore next */ line.match(/at (.+):(\d+):(\d+)$/);

        // istanbul ignore if
        if (!match) return {};

        return {
            source: match[1] ?? /* istanbul ignore next */ "",
            line: parseInt(match[2] ?? /* istanbul ignore next */ "", 10),
            column: parseInt(match[3] ?? /* istanbul ignore next */ "", 10),
        }
    }
}