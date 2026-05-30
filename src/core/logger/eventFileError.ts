import CustomError from "./customError.js";

export default class EventFileError extends CustomError
{
    constructor(eventPath: string) {
        const message = `Event file could not be parsed: ${eventPath}`;
        super(message);
    }
}