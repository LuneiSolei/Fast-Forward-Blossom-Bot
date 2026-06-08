import CustomError from "./customError.js";
export default class EventFileError extends CustomError {
    constructor(eventPath, reason) {
        const message = `Event file could not be parsed: ${eventPath}`;
        super(message, reason);
    }
}
//# sourceMappingURL=eventFileError.js.map