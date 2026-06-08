export class InvalidInstallationTokenError extends Error {
    constructor(cause) {
        const message = `Failed to obtain installation token`;
        super(message);
        this.message = message;
        this.cause = cause;
        Object.setPrototypeOf(this, InvalidInstallationTokenError.prototype);
    }
}
//# sourceMappingURL=errors.js.map