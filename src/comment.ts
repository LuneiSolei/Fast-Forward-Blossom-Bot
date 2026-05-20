import type {PullRequest, Repository} from "@octokit/webhooks-types";
import * as core from "@actions/core";
import Git from "./git.js";
import type {ActionInfo} from "./actionInfo.js";
import type {Octokit} from "@octokit/core";

interface Commit {
    repository: {
        object: {
            oid: string;
            message: string;
            committedDate: string;
            author: {
                name: string;
                email: string;
            }
            associatedPullRequests: {
                nodes: {
                    headRefName: string;
                    baseRefName: string;
                }
            }
        }
    }
}

interface AncestorQuery {
    repository: {
        ref: {
            compare: {
                baseTarget: {
                    oid: string;
                    parents: {
                        totalCount: number;
                    }
                } | null;
            }
        }
    }
}

export default class Comment
{
    private static _baseFullRef: string;
    private static _headFullRef: string;

    public static async AddVerifyingLine(pr: PullRequest, comment: string[]) : Promise<void>
    {
        this._baseFullRef = `${pr.base.ref} (${pr.base.sha})`;
        this._headFullRef = `${pr.head.ref} (${pr.head.sha})`;

        let tmpStr: string;
        switch (core.getBooleanInput("auto_merge")) {
            case true:
                tmpStr = `Auto merge enabled. Verifying and then attempting to `;
                break;
            case false:
                tmpStr = `Auto merge disabled. Verifying we can `
        }

        tmpStr.concat(`fast-forward ${this._baseFullRef} to ${this._headFullRef}.`);
        comment.push(tmpStr);
    }

    public static async AddShellBlocks(info: ActionInfo, comment: string[])
        : Promise<void>
    {
        // Create the target shell block
        comment.push(`Target Branch (${info.pr.base.ref}):`);
        let owner = info.repo.owner.login;
        let repoName = info.repo.name;
        let sha = info.pr.base.sha;
        comment.concat(await this.createBlock(info.octokit, owner, repoName, sha));

        // Create the PR shell block
        comment.push(`Pull Request (${info.pr.head.ref}):`);
        owner = info.pr.head.repo?.owner.login || owner;
        repoName = info.pr.head.repo?.name || repoName;
        sha = info.pr.head.sha
        comment.concat(await this.createBlock(info.octokit, owner, repoName, sha));

        return;
    }

    public static async AddPerformingLine(info: ActionInfo, comment: string[]) : Promise<void> {
        // Should we fast-forward?
        if (info.isPossible) {
            // Fast forwarding is impossible, determine why.
            comment.push(`Can't fast-forward ${this._baseFullRef} to ${this._headFullRef}. ${this._baseFullRef} is not 
            a direct ancestor of ${this._headFullRef}.`);

            // Show where the branches diverged
            const res: AncestorQuery = await info.octokit.graphql(`
                query($owner: String!, $repoName: String!, $baseRef: String!, $headSha: String!) {
                    repository(owner: $owner, name: $repoName) {
                        ref(qualifiedName: $baseRef) {
                            compare(headRef: $headSha) {
                                baseTarget {
                                    ... on Commit {
                                        oid
                                        parents(first: 1) {
                                            totalCount
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `, { owner: info.repo.owner.login, repoName: info.repo.name, baseRef: info.pr.base.ref, headSha: info.pr.head.sha});
            const baseTarget = res.repository.ref.compare.baseTarget;

            if (baseTarget === null) {
                // No ancestor
                comment.push(`Branches do not appear to have a common ancestor.`);
                return;
            }

            // Found divergence point
            const mergeParents = baseTarget.parents?.totalCount;
            comment.push(
                `Branches appear to have diverged at ${baseTarget.oid}.`,
                `\`\`\`shell`
            );

            if (mergeParents === 0) {
                // Merge base is a root (no parents). Exclude commits from before the merge base.
                // const out = await Git.Exec(["log", "--oneline", "--graph", "--decorate", info.pr.base.sha, info.pr.head.sha]);
                // comment.push(out);
            }
        }
    }

    private static async createBlock(octokit: Octokit, owner: string, repoName: string, sha: string): Promise<string[]> {
        // Get commit info
        core.debug(`Querying ${owner}/${repoName} (${sha})`);

        const res: Commit = await octokit.graphql(`
            query($owner: String!, $repoName: String!, $sha: GitObjectID!) {
                repository(owner: $owner, name: $repoName) {
                    object(oid: $sha) {
                        ... on Commit {
                            oid
                            message
                            committedDate
                            author {
                                name
                                email
                            }
                            associatedPullRequests(first: 1) { 
                                nodes {
                                    headRefName
                                    baseRefName
                                }
                            }
                        }
                    }
                }
            }`,
            { owner, repoName, sha });

        const commit = res.repository.object;
        const headRefName: string = commit.associatedPullRequests.nodes.headRefName;
        const baseRefName: string = commit.associatedPullRequests.nodes.baseRefName;

        return [
            `\`\`\`shell\n`,
            `commit ${res.repository.object.oid} (HEAD -> ${headRefName}, origin/${baseRefName})`,
            `Author: ${commit.author.name} <${commit.author.email}>`,
            `Date:   ${commit.committedDate}`,
            ``,
            `    ${commit.message}`,
            `\`\`\``
        ];
    }
}