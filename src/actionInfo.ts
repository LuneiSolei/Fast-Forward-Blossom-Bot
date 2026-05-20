import type {Octokit} from "@octokit/core";
import type {PullRequest, Repository} from "@octokit/webhooks-types";
import type {Endpoints} from "@octokit/types";

type CompareResponse = Endpoints["GET /repos/{owner}/{repo}/compare/{basehead}"]["response"]
type MergeBaseCommit = CompareResponse["data"]["merge_base_commit"];

export type ActionInfo = {
    octokit: Octokit,
    repo: Repository,
    pr: PullRequest,
    isPossible: boolean | null,
    userHasPerms: boolean | null,
    mergeBaseCommit: MergeBaseCommit | null
}