import type IRepoInfo from "./IRepoInfo.js";
import type IOptions from "./IOptions.js";
import type IEventInfo from "./IEventInfo.js";
import type IApiCaller from "./IApiCaller.js";

export default interface IActionInfo
{
    get ApiCaller(): IApiCaller;
    get Repo(): IRepoInfo;
    get Options(): IOptions;
    get Event(): IEventInfo;
}