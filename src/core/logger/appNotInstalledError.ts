import * as core from "@actions/core";

export default class AppNotInstalledError extends Error
{
    constructor(owner: string, repoName: string)
    {
        const message = `The GitHub App for 'Fast-Forward-Blossom-Bot' is not installed in repository '${owner}/${repoName}'`;
        super(message);
        this.message = message;
        core.setFailed(message);
        Object.setPrototypeOf(this, AppNotInstalledError.prototype);
    }
}