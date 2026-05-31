import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";

export default class ActionInfo implements IActionInfo
{
    private readonly _apiCaller: IApiCaller;
    private readonly _repo: IRepoInfo;
    private readonly _options: IOptions;
    private readonly _event: IEventInfo;

    public constructor(apiCaller: IApiCaller, repo: IRepoInfo, options: IOptions, event: IEventInfo)
    {
        this._apiCaller = apiCaller;
        this._repo = repo;
        this._options = options;
        this._event = event;
    }

    public get ApiCaller(): IApiCaller {
        return this._apiCaller;
    }

    public get Repo(): IRepoInfo {
        return this._repo;
    }

    public get Options(): IOptions {
        return this._options;
    }

    public get Event(): IEventInfo {
        return this._event;
    }
}