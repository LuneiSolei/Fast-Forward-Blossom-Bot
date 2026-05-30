import CustomError from "./customError.js";

export default class InvalidInputValueError extends CustomError
{
    constructor(variable: string, value: string, reason: string)
    {
        const message = `Invalid value '${value}' for workflow input '${variable}'`;
        super(message, reason);
    }
}