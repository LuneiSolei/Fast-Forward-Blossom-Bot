import CustomError from "./customError.js";

export default class InvalidEventError extends CustomError
{
    constructor(event: string, reason: string)
    {
        const message = `Received invalid event: ${event}`;
        super(message, reason);
    }
}