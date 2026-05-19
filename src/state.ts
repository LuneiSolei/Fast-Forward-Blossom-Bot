import type {PullRequest, Repository} from "@octokit/webhooks-types";
import type {Octokit} from "@octokit/core";
import * as core from "@actions/core"

interface CollabQuery {
    repository: {
        collaborators: {
            totalCount: number
        }
    }
}

interface CompareQuery {
    repository: {
        ref: {
            compare: {
                status: string
            }
        }
    }
}

export default class State
{
    private static _userHasPerms: boolean;

    public static async UserHasPerms(repo: Repository, username: string, octokit: Octokit)
    {
        if (this._userHasPerms) return this._userHasPerms;
        // Check if user is owner
        if (repo.owner.login == username) {
            this._userHasPerms = true;
        } else {
            // Check if user is a collaborator
            const res: CollabQuery = await octokit.graphql(`
                query($owner: String!, $repoName: String!, $username: String!) {
                    repository(owner: $owner, name: $repoName) {
                        collaborators(login: $username) {
                            totalCount
                        }
                    }
                }
            `, {owner: repo.owner.login, repoName: repo.name, username});

            core.debug(res.repository.collaborators.totalCount.toString());
        }

        return this._userHasPerms;
    }

    public static async FastForwardIsPossible(octokit: Octokit, repo: Repository, pr: PullRequest): Promise<boolean> {
        const res: CompareQuery = await octokit.graphql(`
            query($owner: String!, $repoName: String!, $baseRef: String!, $headRef: String!) {
                repository(owner: $owner, name: $repoName) {
                    ref(qualifiedName: $baseRef) {
                        compare(headRef: $headRef) {
                            status
                        }
                    }
                }
            }
        `, {owner: repo.owner.login, repoName: repo.name, baseRef: pr.base.ref, headRef: pr.head.sha});
        const status: string = res.repository.ref.compare.status;

        core.debug(`PR is ahead by: ${status}`);
        return status === "AHEAD";
    }
}