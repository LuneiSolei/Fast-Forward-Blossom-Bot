import CustomError from "./customError.js";
export default class OctokitInitError extends CustomError {
    constructor(reason) {
        const message = `Something went wrong while trying to initialize an instance of Octokit`;
        super(message, reason);
    }
}
//# sourceMappingURL=OctokitInitError.js.map