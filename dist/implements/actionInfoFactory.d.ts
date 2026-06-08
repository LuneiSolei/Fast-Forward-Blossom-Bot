import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type { ActionEvent } from "../core/actionEvent/actionEvent.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type { Octokit } from "@octokit/core";
export default class ActionInfoFactory {
    static Create(prInfo: (new () => IPrInfo) | IPrInfo, options: (new () => IOptions) | IOptions, eventInfo: (new (options: IOptions, eventPath: string) => IEventInfo) | IEventInfo, repoInfo: (new (prInfo: IPrInfo, event: ActionEvent) => IRepoInfo) | IRepoInfo, apiCaller: (new (octokit: Octokit) => IApiCaller) | IApiCaller, octokit?: Octokit): Promise<IActionInfo>;
    private static isConstructor;
}
//# sourceMappingURL=actionInfoFactory.d.ts.map