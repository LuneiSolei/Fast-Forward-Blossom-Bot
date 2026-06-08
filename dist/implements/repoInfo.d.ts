import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type { ActionEvent } from "../core/actionEvent/actionEvent.js";
export default class RepoInfo implements IRepoInfo {
    private readonly _name;
    private readonly _pr;
    private readonly _owner;
    private readonly _cloneUrl;
    constructor(prInfo: IPrInfo, event: ActionEvent);
    get Name(): string;
    get Owner(): string;
    get Pr(): IPrInfo;
    get CloneUrl(): string;
}
//# sourceMappingURL=repoInfo.d.ts.map