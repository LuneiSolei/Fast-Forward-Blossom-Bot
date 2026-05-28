import * as core from "@actions/core";

export default class InvalidInstallationTokenError extends Error {
    constructor(cause: object) {
        const message = `Failed to obtain installation token`;
        super(message);
        this.message = message;
        this.cause = cause;
        core.setFailed(message);
        Object.setPrototypeOf(this, InvalidInstallationTokenError.prototype);
    }
}