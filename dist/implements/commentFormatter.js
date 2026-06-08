import * as core from "@actions/core";
import Git from "../core/git.js";
export default class CommentFormatter {
    _baseFullRef;
    _headFullRef;
    _comment = [];
    constructor(prInfo) {
        this._baseFullRef = `${prInfo.BaseRef} (${prInfo.BaseSha})`;
        this._headFullRef = `${prInfo.HeadRef} (${prInfo.HeadRef})`;
    }
    AddVerifyingLine(autoMerge) {
        let result;
        switch (autoMerge) {
            case true:
                result = `Auto merge enabled. Verifying and then attempting to `;
                break;
            case false:
                result = `Auto merge disabled. Verifying we can `;
        }
        // Push the result to our stored comment
        result = result.concat(`fast-forward ${this._baseFullRef} to ${this._headFullRef}.`);
        this._comment.push(result);
    }
    async AddShellBlocks(octokit, repo) {
        let result = [];
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
        this._comment.concat(result);
    }
    AddNotPossibleLines(pr) {
        let result = [];
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
        result.push(`Branches appear to have diverged at ${pr.MergeBaseSha}.`, `\`\`\`shell`);
        let exclude = "";
        if (pr.MergeBaseParentsAmount === 0) {
            // Merge base is a root (no parents). Exclude commits from before the merge base.
            exclude = pr.MergeBaseSha;
        }
        result.push(Git.Log(exclude, pr.BaseSha, pr.HeadSha), `Rebase ${pr.HeadRef} onto ${pr.BaseRef} and then force push to ${pr.HeadRef}`);
        return result;
    }
    AddAutoMergeDisabledLine() {
        return `It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}, 
            but 'auto_merge' has been disabled.`;
    }
    AddNoPermsLine(repo) {
        // Zero width character is added to avoid pinging the user
        return `Sorry, @\u200B'${repo.User}, it is possible to fast-forward ${this._baseFullRef} to 
            ${this._headFullRef}, but you do not appear to have permission to push to this repository.`;
    }
    AddCommandNotInvokedLine(customCommand) {
        return `It is possible to fast-forward ${this._baseFullRef} to ${this._headFullRef}. If you have write access 
            to the target repository, you can add the comment \`${customCommand}\` to initiate the fast-forward.`;
    }
    async PostComment(octokit, nodeId) {
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
    async createBlock(octokit, owner, repoName, sha) {
        // Get commit info
        core.debug(`Querying ${owner}/${repoName} (${sha})`);
        const res = await octokit.graphql(`
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
            }`, { owner, repoName, sha });
        const commit = res.repository.object;
        const headRefName = commit.associatedPullRequests.nodes.headRefName;
        const baseRefName = commit.associatedPullRequests.nodes.baseRefName;
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
//# sourceMappingURL=commentFormatter.js.map