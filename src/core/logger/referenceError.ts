import CustomError from "./customError.js";

export default class ReferenceError extends CustomError
{
    constructor(variable: string)
    {
        const message = `Attempted to access undefined variable '${variable}'`;
        super(message);
    }
}