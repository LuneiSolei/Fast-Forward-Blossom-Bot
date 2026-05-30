import {Octokit} from "@octokit/core";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";
import OctokitFactory from "../core/octokitFactory.js";
import * as core from "@actions/core";

export default class ActionInfo implements IActionInfo
{
    private readonly _octokit: Octokit;
    private readonly _repo: IRepoInfo;
    private readonly _options: IOptions;
    private readonly _event: IEventInfo;

    private constructor(
        octokit: Octokit,
        prInfo: new () => IPrInfo,
        options: new () => IOptions,
        eventInfo: new (options: IOptions, eventPath: string) => IEventInfo,
        repoInfo: new (prInfo: IPrInfo, event: ActionEvent) => IRepoInfo)
    {
        core.debug("Retrieving options...");
        this._options = new options;

        // Get basic info first
        core.debug("Retrieving basic event info...");
        this._event = new eventInfo(this._options, process.env["GITHUB_EVENT_PATH"] as string);
        core.debug("Done!");

        core.debug("Retrieving basic pull request info...");
        const newPrInfo = new prInfo();
        newPrInfo.SetEvent(this._event.Event, this._event.EventType);
        core.debug("Done!");

        core.debug("Retrieving basic repository info...");
        this._repo = new repoInfo(newPrInfo, this._event.Event);
        core.debug("Done!");

        // Authenticate
        core.debug("Authenticating octokit instance...");
        this._octokit = octokit
        core.debug("Done!");

        // Get any authentication required info
        this._repo.Pr.FinishInitialization(this._octokit, this._event.Event, this._event.EventType)
            .then();

        return this;
    }

    public static async Create(
        prInfo: new () => IPrInfo,
        options: new () => IOptions,
        eventInfo: new (options: IOptions, eventPath: string) => IEventInfo,
        repoInfo: new (prInfo: IPrInfo, event: ActionEvent) => IRepoInfo,
    ): Promise<IActionInfo>
    {
        core.debug("Constructing new ActionInfo instance...");

        // Create temporary instances to get repo info for authentication
        const tempOptions = new options();
        const tempEvent = new eventInfo(tempOptions, process.env["GITHUB_EVENT_PATH"] as string);
        const tempPrInfo = new prInfo();
        tempPrInfo.SetEvent(tempEvent.Event, tempEvent.EventType);
        const tempRepo = new repoInfo(tempPrInfo, tempEvent.Event);

        // Authenticate
        const octokit = await OctokitFactory.Create(tempRepo.Owner, tempRepo.Name);
        return new ActionInfo(octokit, prInfo, options, eventInfo, repoInfo);
    }

    public static async CreateWithOctokit(
        octokit: Octokit,
        prInfo: new () => IPrInfo,
        options: new () => IOptions,
        eventInfo: new (options: IOptions, eventPath: string) => IEventInfo,
        repoInfo: new (prInfo: IPrInfo, event: ActionEvent) => IRepoInfo
    ): Promise<IActionInfo> {
        return new ActionInfo(octokit, prInfo, options, eventInfo, repoInfo);
    }

    public get Octokit(): Octokit {
        return this._octokit;
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