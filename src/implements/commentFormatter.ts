import * as core from "@actions/core";
import Git from "../core/git.js";
import type {Octokit} from "@octokit/core";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";

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

export default class CommentFormatter
{
    private readonly _baseFullRef: string;
    private readonly _headFullRef: string;
    private _comment: string[] = [];

    public constructor(prInfo: IPrInfo)
    {
        this._baseFullRef = `${prInfo.BaseRef} (${prInfo.BaseSha})`
        this._headFullRef = `${prInfo.HeadRef} (${prInfo.HeadRef})`
    }

    public AddVerifyingLine(autoMerge: boolean): void
    {
        let result: string;
        switch (autoMerge) {
            case true:
                result = `Auto merge enabled. Verifying and then attempting to `;
                break;
            case false:
                result = `Auto merge disabled. Verifying we can `
        }

        // Push the result to our stored comment
        result = result.concat(`fast-forward ${this._baseFullRef} to ${this._headFullRef}.`);
        this._comment.push(result);
    }

    public async AddShellBlocks(octokit: Octokit, repo: IRepoInfo): Promise<void>
    {
        let result: string[] = []

        // Create the target shell block
        result.push(`Target Branch (${repo.Pr.BaseRef}):`);
        let owner = repo.Owner;
        let repoName = repo.Name;
        let sha = repo.Pr.BaseSha;
        result.concat(await this.createBlock(octokit, owner, repoName, sha));

        // Create the PR shell block
        result.push(`Pull Request (${repo.Pr.HeadRef}):`);
        owner = repo.Pr.HeadOwner || owner;
        repoName = repo.Pr.HeadRepo || repoName;
        sha = repo.Pr.HeadSha;
        result.concat(await this.createBlock(octokit, owner, repoName, sha));

        // Push the result to our stored comment
        this._comment.concat(result)
    }

    public AddNotPossibleLines(pr: IPrInfo): string[]
    {
        let result: string[] = [];

        // Fast forwarding is impossible, determine why.
        result.push(`Can't fast-forward ${this._baseFullRef} to ${this._headFullRef}. ${this._baseFullRef} is not 
        a direct ancestor of ${this._headFullRef}.`);

        // Show where the branches diverged
        if (pr.MergeBaseSha === null) {
            // No common ancestor
            result.push(`Branches do not appear to have a common ancestor.`);
            return result;
        }

        // Divergence point was found
        result.push(
            `Branches appear to have diverged at ${pr.MergeBaseSha}.`,
            `\`\`\`shell`
        );

        let exclude: string = "";
        if (pr.MergeBaseParentsAmount === 0) {
            // Merge base is a root (no parents). Exclude commits from before the merge base.
            exclude = pr.MergeBaseSha;
        }

        result.push(
            Git.Log(exclude, pr.BaseSha, pr.HeadSha),
            `Rebase ${pr.HeadRef} onto ${pr.BaseRef} and then force push to ${pr.HeadRef}`
        );

        return result;
    }

    public AddAutoMergeDisabledLine(): string
    {
        return `It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}, 
            but 'auto_merge' has been disabled.`
    }

    public AddNoPermsLine(repo: IRepoInfo): string
    {
        // Zero width character is added to avoid pinging the user
        return `Sorry, @\u200B'${repo.User}, it is possible to fast-forward ${this._baseFullRef} to 
            ${this._headFullRef}, but you do not appear to have permission to push to this repository.`;
    }

    public AddCommandNotInvokedLine(customCommand: string): string
    {
        return `It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}. If you have write access 
            to the target repository, you can add the comment \`${customCommand}\` to initiate the fast-forward.`;
    }

    public async PostComment(octokit: Octokit, nodeId: string): Promise<void>
    {
        // Construct JSON comment
        await octokit.graphql(`
            mutation AddComment($input: AddCommentInput!) {
                addComment(input: $input) {
                    clientMutationId
                }
            }
        `, {
            input: {
                body: this._comment.join("\n"),
                clientMutationId: nodeId
            }
        });
    }

    private async createBlock(octokit: Octokit, owner: string, repoName: string, sha: string): Promise<string[]> {
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