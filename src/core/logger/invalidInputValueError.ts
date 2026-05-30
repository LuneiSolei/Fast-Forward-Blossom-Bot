import CustomError from "./customError.js";

export default class InvalidInputValueError extends CustomError
{
    constructor(variable: string, value: string)
    {
        const message = `Invalid value '${value}' for workflow input '${variable}'`;
        super(message)
    }
}