import CustomError from "./customError.js";

export default class UnknownReferenceError extends CustomError
{
    constructor(variable: string, reason: string)
    {
        const message = `Attempted to access undefined variable '${variable}'`;
        super(message, reason);
    }
}