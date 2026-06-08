import type { Octokit } from "@octokit/core";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
export default class CommentFormatter {
    private readonly _baseFullRef;
    private readonly _headFullRef;
    private _comment;
    constructor(prInfo: IPrInfo);
    AddVerifyingLine(autoMerge: boolean): void;
    AddShellBlocks(octokit: Octokit, repo: IRepoInfo): Promise<void>;
    AddNotPossibleLines(pr: IPrInfo): string[];
    AddAutoMergeDisabledLine(): string;
    AddNoPermsLine(repo: IRepoInfo): string;
    AddCommandNotInvokedLine(customCommand: string): string;
    PostComment(octokit: Octokit, nodeId: string): Promise<void>;
    private createBlock;
}
//# sourceMappingURL=commentFormatter.d.ts.map