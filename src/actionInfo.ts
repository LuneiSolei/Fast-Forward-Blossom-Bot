import type {Octokit} from "@octokit/core";
import type {PullRequest, Repository} from "@octokit/webhooks-types";

export type ActionInfo = {
    octokit: Octokit,
    repo: Repository,
    pr: PullRequest,
    isPossible: boolean,
    userHasPerms: boolean
}