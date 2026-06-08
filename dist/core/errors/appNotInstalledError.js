import CustomError from "./customError.js";
export default class AppNotInstalledError extends CustomError {
    constructor(owner, repoName, reason) {
        const message = `The GitHub App for 'Fast-Forward-Blossom-Bot' is not installed in repository '${owner}/${repoName}'`;
        super(message, reason);
    }
}
//# sourceMappingURL=appNotInstalledError.js.map