import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
export default class ActionInfo implements IActionInfo {
    private readonly _apiCaller;
    private readonly _repo;
    private readonly _options;
    private readonly _event;
    constructor(apiCaller: IApiCaller, repo: IRepoInfo, options: IOptions, event: IEventInfo);
    get ApiCaller(): IApiCaller;
    get Repo(): IRepoInfo;
    get Options(): IOptions;
    get Event(): IEventInfo;
}
//# sourceMappingURL=actionInfo.d.ts.map