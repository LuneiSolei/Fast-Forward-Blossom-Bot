import type {PullRequest, Repository} from "@octokit/webhooks-types";
import type {Octokit} from "@octokit/core";
import * as core from "@actions/core"
import type {Endpoints, OctokitResponse} from "@octokit/types";
import type {ActionInfo} from "./actionInfo.js";

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

type CompareRequest = Endpoints["GET /repos/{owner}/{repo}/compare/{basehead}"]["response"];

export default class State
{
    private static _userHasPerms: boolean;

    public static async UserHasPerms(info: ActionInfo): Promise<boolean>
    {
        if (this._userHasPerms) return this._userHasPerms;
        const owner = info.repo.owner.login;
        const user = info.pr.user.login;

        // Check if user is owner
        if (owner == user) {
            this._userHasPerms = true;
        } else {
            // Check if user is a collaborator
            const res: CollabQuery = await info.octokit.graphql(`
                query($owner: String!, $repoName: String!, $username: String!) {
                    repository(owner: $owner, name: $repoName) {
                        collaborators(login: $username) {
                            totalCount
                        }
                    }
                }
            `, {owner: owner, repoName: info.repo.name, username: user});

            core.debug(res.repository.collaborators.totalCount.toString());
        }

        return this._userHasPerms;
    }

    public static async FastForwardIsPossible(info: ActionInfo): Promise<boolean> {
        core.info("Determining if fast-forward is possible...")
        const res: CompareRequest = await info.octokit.request("GET /repos/{owner}/{repo}/compare/{basehead}", {
            owner: info.repo.owner.login,
            repo: info.repo.name,
            basehead: `${info.pr.base.sha}...${info.pr.head.label}`
        });

        const isPossible = res.data.status === "ahead";
        switch (isPossible) {
            case true:
                core.info("Fast-forward is possible");
                return true;
            case false:
                core.info("Fast-forward is not possible");
                info.mergeBaseCommit = res.data.merge_base_commit;
                return false;
        }
    }
}