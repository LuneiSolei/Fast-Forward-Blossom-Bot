import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type ICommentBuilder from "../core/ICommentBuilder.js";
export default class CommentBuilder implements ICommentBuilder {
    private readonly _baseFullRef;
    private readonly _headFullRef;
    private readonly _actionInfo;
    private readonly _prInfo;
    private readonly _repoInfo;
    private readonly _commitGetter;
    private _comment;
    constructor(info: IActionInfo, commitGetter: typeof this._commitGetter);
    Build(): Promise<string>;
    private addVerifyingLine;
    private addNotPossibleLines;
    private addAutoMergeDisabledLine;
    private addNoPermsLine;
    private addCommandNotInvokedLine;
    private addShellBlocks;
    private createBlock;
}
//# sourceMappingURL=commentBuilder.d.ts.map