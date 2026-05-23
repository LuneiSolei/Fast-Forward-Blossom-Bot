import type {PullRequest} from "@octokit/webhooks-types";
import * as core from "@actions/core";
import Git from "../core/git.js";
import ActionInfo from "./actionInfo.js";
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

    public static AddVerifyingLine(pr: PullRequest): string
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

        return tmpStr.concat(`fast-forward ${this._baseFullRef} to ${this._headFullRef}.`);
    }

    public static async AddShellBlocks(info: ActionInfo): Promise<string[]>
    {
        let result: string[] = []
        // Create the target shell block
        result.push(`Target Branch (${info.Repo.Pr.BaseRef}):`);
        let owner = info.Repo.Owner;
        let repoName = info.Repo.Name;
        let sha = info.Repo.Pr.BaseSha;
        result.concat(await this.createBlock(info.Octokit, owner, repoName, sha));

        // Create the PR shell block
        result.push(`Pull Request (${info.Repo.Pr.HeadRef}):`);
        owner = info.Repo.Pr.HeadOwner || owner;
        repoName = info.pr.head.repo?.name || repoName;
        sha = info.pr.head.sha
        result.concat(await this.createBlock(info.Octokit, owner, repoName, sha));

        return result;
    }

    public static async AddNotPossibleLines(info: ActionInfo): Promise<string[]>
    {
        let result: string[] = [];

        // Fast forwarding is impossible, determine why.
        result.push(`Can't fast-forward ${this._baseFullRef} to ${this._headFullRef}. ${this._baseFullRef} is not 
        a direct ancestor of ${this._headFullRef}.`);

        // Show where the branches diverged
        if (info.mergeBaseCommit === null) {
            // No common ancestor
            result.push(`Branches do not appear to have a common ancestor.`);
            return result;
        }

        // Divergence point was found
        result.push(
            `Branches appear to have diverged at ${info.mergeBaseCommit.sha}`,
            `\`\`\`shell`
        );

        let exclude: string = "";
        if (info.mergeBaseCommit.parents.length === 0) {
            // Merge base is a root (no parents). Exclude commits from before the merge base.
            exclude = info.mergeBaseCommit.sha;
        }

        result.push(
            await Git.Log(exclude, info.pr.base.sha, info.pr.head.sha),
            `Rebase ${info.pr.head.ref} onto ${info.pr.base.ref} and then force push to ${info.pr.head.ref}`
        );

        return result;
    }

    public static AddAutoMergeDisabledLine(): string
    {
        return `It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}, 
            but 'auto_merge' has been disabled.`
    }

    public static AddNoPermsLine(info: ActionInfo): string
    {
        // Zero width character is added to avoid pinging the user
        return `Sorry, @\u200B'${info.user.name}, it is possible to fast-forward ${this._baseFullRef} to 
            ${this._headFullRef}, but you do not appear to have permission to push to this repository.`;
    }

    public static AddCommandNotInvokedLine(): string
    {
        return `It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}. If you have write access 
            to the target repository, you can add the comment \`${core.getInput("command")}\` to initiate the fast-forward.`;
    }

    public static async PostComment(info: ActionInfo, comment: string[]): Promise<void>
    {
        // Construct JSON comment
        await info.octokit.graphql(`
            mutation AddComment($input: AddCommentInput!) {
                addComment(input: $input) {
                    clientMutationId
                }
            }
        `, {
            input: {
                body: comment.join("\n"),
                clientMutationId: info.pr.node_id
            }
        });
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