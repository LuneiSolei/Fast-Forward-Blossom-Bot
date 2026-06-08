import CustomError from "./customError.js";
export default class InvalidInstallationTokenError extends CustomError {
    constructor(reason) {
        const message = `Failed to obtain installation token`;
        super(message, reason);
    }
}
//# sourceMappingURL=invalidInstallationTokenError.js.map