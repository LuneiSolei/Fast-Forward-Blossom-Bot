import type {Repository} from "@octokit/webhooks-types";
import type {Octokit} from "@octokit/core";
import * as core from "@actions/core"

interface CollabQuery {
    repository: {
        collaborators: {
            totalCount: number
        }
    }
}

export default class State
{
    private static _userHasPerms: boolean;

    public static async UserHasPerms(repo: Repository, username: string, octokit: Octokit)
    {
        if (this._userHasPerms) return this._userHasPerms;
        core.info(repo.owner.login)
        core.info(repo.name)
        core.info(username)
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

            core.info(res.repository.collaborators.totalCount.toString());
        }

        return this._userHasPerms;
    }
}