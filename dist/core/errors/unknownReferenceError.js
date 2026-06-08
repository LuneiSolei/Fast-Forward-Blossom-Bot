import CustomError from "./customError.js";
export default class UnknownReferenceError extends CustomError {
    constructor(variable, reason) {
        const message = `Attempted to access undefined variable '${variable}'`;
        super(message, reason);
    }
}
//# sourceMappingURL=unknownReferenceError.js.map