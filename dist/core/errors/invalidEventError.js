import CustomError from "./customError.js";
export default class InvalidEventError extends CustomError {
    constructor(event, reason) {
        const message = `Received invalid event: ${event}`;
        super(message, reason);
    }
}
//# sourceMappingURL=invalidEventError.js.map