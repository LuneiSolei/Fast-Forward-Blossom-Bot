import * as core from "@actions/core";
import Git from "../core/git.js";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type ICommit from "../core/ICommit.js";
import type ICommentBuilder from "../core/ICommentBuilder.js";

export default class CommentBuilder implements ICommentBuilder
{
    private readonly _baseFullRef: string;
    private readonly _headFullRef: string;
    private readonly _actionInfo: IActionInfo;
    private readonly _prInfo: IPrInfo;
    private readonly _repoInfo: IRepoInfo;
    private readonly _commitGetter: (owner: string, repoName: string, sha: string) => Promise<Commit>;
    private _comment: string[] = [];

    public constructor(info: IActionInfo, commitGetter: (owner: string, repoName: string, sha: string) => Promise<Commit>)
    {
        this._actionInfo = info;
        this._repoInfo = info.Repo;
        this._prInfo = info.Repo.Pr;
        this._commitGetter = commitGetter;

        this._baseFullRef = `${this._prInfo.BaseRef} (${this._prInfo.BaseSha})`
        this._headFullRef = `${this._prInfo.HeadRef} (${this._prInfo.HeadSha})`
    }

    public async Build(): Promise<string>
    {
        this.AddVerifyingLine();
        await this.AddShellBlocks();

        if (!await this._actionInfo.Event.GetIsPossible(this._repoInfo))
        {
            // Fast-forward is not possible
            this.AddNotPossibleLines();
            this._actionInfo.Event.ShouldExit = true;
        }
        else if (!this._actionInfo.Options.AutoMerge)
        {
            // Fast-forward is possible, but auto_merge is disabled
            this.AddAutoMergeDisabledLine();
            this._actionInfo.Event.ShouldExit = true;
        }
        else if (!await this._actionInfo.Event.GetUserHasPerms(this._repoInfo))
        {
            // Fast-forward is possible, but user does not have proper permissions
            this.AddNoPermsLine();
            this._actionInfo.Event.ShouldExit = true;
        }
        else if (!this._actionInfo.Event.CommandInvoked)
        {
            // The command was not invoked
            this.AddCommandNotInvokedLine();
            this._actionInfo.Event.ShouldExit = true;
        }

        return this._comment.join("\n");
    }

    private AddVerifyingLine(): void
    {
        let result: string;
        switch (this._actionInfo.Options.AutoMerge) {
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

    private async AddShellBlocks(): Promise<void>
    {
        let result: string[] = []

        // Create the target shell block
        result.push(`Target Branch (${this._prInfo.BaseRef}):`);
        let owner = this._repoInfo.Owner;
        let repoName = this._repoInfo.Name;
        let sha = this._prInfo.BaseSha;
        result.concat(await this.createBlock(owner, repoName, sha));

        // Create the PR shell block
        result.push(`Pull Request (${this._prInfo.HeadRef}):`);
        owner = this._prInfo.HeadOwner || owner;
        repoName = this._prInfo.HeadRepo || repoName;
        sha = this._prInfo.HeadSha;
        result.concat(await this.createBlock(owner, repoName, sha));

        // Push the result to our stored comment
        this._comment = this._comment.concat(result)
    }

    private AddNotPossibleLines(): void
    {
        let result: string[] = [];

        // Fast forwarding is impossible, determine why.
        result.push(`Can't fast-forward ${this._baseFullRef} to ${this._headFullRef}. ${this._baseFullRef} is not 
        a direct ancestor of ${this._headFullRef}.`);

        // Show where the branches diverged
        if (this._prInfo.MergeBaseSha === null) {
            // No common ancestor
            result.push(`Branches do not appear to have a common ancestor.`);
            this._comment = this._comment.concat(result);

            return
        }

        // Divergence point was found
        result.push(
            `Branches appear to have diverged at ${this._prInfo.MergeBaseSha}.`,
            `\`\`\`shell`
        );

        let exclude: string = "";
        if (this._prInfo.MergeBaseParentsAmount === 0) {
            // Merge base is a root (no parents). Exclude commits from before the merge base.
            exclude = this._prInfo.MergeBaseSha;
        }

        result.push(
            Git.Log(exclude, this._prInfo.BaseSha, this._prInfo.HeadSha),
            `Rebase ${this._prInfo.HeadRef} onto ${this._prInfo.BaseRef} and then force push to ${this._prInfo.HeadRef}`
        );

        this._comment = this._comment.concat(result);
    }

    private AddAutoMergeDisabledLine(): void
    {
        this._comment.push(`It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}, 
            but 'auto_merge' has been disabled.`)

        return;
    }

    private AddNoPermsLine(): void
    {
        // Zero width character is added to avoid pinging the user
        this._comment.push(`Sorry, @\u200B'${this._actionInfo.Event.User}, it is possible to fast-forward ${this._baseFullRef} to 
            ${this._headFullRef}, but you do not appear to have permission to push to this repository.`);

        return;
    }

    private AddCommandNotInvokedLine(): void
    {
        this._comment.push(`It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}. If you have write access 
            to the target repository, you can add the comment \`${this._actionInfo.Options.CustomCommand}\` to initiate the fast-forward.`);

        return;
    }

    private async createBlock(
        owner: string,
        repoName: string,
        sha: string): Promise<string[]>
    {
        // Get commit info
        core.debug(`Querying ${owner}/${repoName} (${sha})`);

        const res: ICommit = await this._commitGetter(owner, repoName, sha);
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