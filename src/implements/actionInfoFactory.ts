import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import * as core from "@actions/core";
import ActionInfo from "./actionInfo.js";
import type {Octokit} from "@octokit/core";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
import OctokitFactory from "./octokitFactory.js";

export default class ActionInfoFactory
{
    public static async Create(
        prInfo: (new () => IPrInfo) | IPrInfo,
        options: (new () => IOptions) | IOptions,
        eventInfo: (new (options: IOptions, eventPath: string) => IEventInfo) | IEventInfo,
        repoInfo: (new (prInfo: IPrInfo, event: ActionEvent) => IRepoInfo) | IRepoInfo,
        apiCaller: (new (octokit: Octokit) => IApiCaller) | IApiCaller,
        octokit?: Octokit
    ): Promise<IActionInfo>
    {
        core.debug("Constructing new ActionInfo instance...");

        core.debug("Retrieving options...");
        const newOptions: IOptions = this.isConstructor(options)
            ? new options()
            : options;
        core.debug("Done!")

        // Get basic info first
        core.debug("Retrieving basic event info...");
        const eventPath = process.env["GITHUB_EVENT_PATH"];
        if (!eventPath)
            throw new UnknownReferenceError("GITHUB_EVENT_PATH", "Environment variable GITHUB_EVENT_PATH is required");

        const newEventInfo: IEventInfo = (this.isConstructor(eventInfo)
            ? new eventInfo(newOptions, eventPath)
            : eventInfo) as IEventInfo;
        core.debug("Done!");

        core.debug("Retrieving basic pull request info...");
        const newPrInfo: IPrInfo = this.isConstructor(prInfo)
            ? new prInfo()
            : prInfo;
        newPrInfo.SetEvent(newEventInfo.Event, newEventInfo.EventType);
        core.debug("Done!");

        core.debug("Retrieving basic repository info...");
        const newRepo: IRepoInfo = (this.isConstructor(repoInfo)
            ? new repoInfo(newPrInfo, newEventInfo.Event)
            : repoInfo) as IRepoInfo;
        core.debug("Done!");

        // Assign octokit to ApiCaller
        const newOctokit = (this.isConstructor(apiCaller) && !octokit)
            ? await OctokitFactory.Create(newRepo.Owner, newRepo.Name)
            : octokit;

        const newApiCaller = (this.isConstructor(apiCaller)
            ? new apiCaller(newOctokit)
            : apiCaller) as IApiCaller;

        // Get any authentication required info
        await newRepo.Pr.FinishInitialization(newApiCaller, newEventInfo.Event, newEventInfo.EventType);
        newEventInfo.ApiCaller = newApiCaller;

        return new ActionInfo(newApiCaller, newRepo, newOptions, newEventInfo);
    }

    private static isConstructor<T>(value: (new (...args: any[]) => T) | T): value is new (...args: any[]) => T
    {
        if (typeof value !== "function") return false;
        return /^\s*class\s+/.test(value.toString());
    }
}