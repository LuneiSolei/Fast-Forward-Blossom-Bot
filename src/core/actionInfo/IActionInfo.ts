import type {Octokit} from "@octokit/core";
import type IRepoInfo from "./IRepoInfo.js";
import type IOptions from "./IOptions.js";
import type IEventInfo from "./IEventInfo.js";

export default interface IActionInfo
{
    get Octokit(): Octokit;
    get Repo(): IRepoInfo;
    get Options(): IOptions;
    get Event(): IEventInfo;
}