import CustomError from "./customError.js";
export default class InvalidInputValueError extends CustomError {
    constructor(variable, value, reason) {
        const message = `Invalid value '${value}' for workflow input '${variable}'`;
        super(message, reason);
    }
}
//# sourceMappingURL=invalidInputValueError.js.map