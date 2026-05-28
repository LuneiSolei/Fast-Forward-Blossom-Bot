import {Octokit} from "@octokit/core";
import * as fs from "node:fs";
import {createAppAuth} from "@octokit/auth-app";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";
import Logger from "../core/logger.js";

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
        Logger.Debug("Retrieving options...");
        this._options = new options;

        // Get basic info first
        Logger.Debug("Retrieving basic event info...");
        this._event = new eventInfo(this._options, process.env["GITHUB_EVENT_PATH"] as string);
        Logger.Debug("Done!");

        Logger.Debug("Retrieving basic pull request info...");
        const newPrInfo = new prInfo();
        newPrInfo.SetEvent(this._event.Event, this._event.EventType);
        Logger.Debug("Done!");

        Logger.Debug("Retrieving basic repository info...");
        this._repo = new repoInfo(newPrInfo, this._event.Event);
        Logger.Debug("Done!");

        // Authenticate
        Logger.Debug("Authenticating octokit instance...");
        this._octokit = octokit
        Logger.Debug("Done!");

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
        Logger.Debug("Constructing new ActionInfo instance...");

        // Create temporary instances to get repo info for authentication
        const tempOptions = new options();
        const tempEvent = new eventInfo(tempOptions, process.env["GITHUB_EVENT_PATH"] as string);
        const tempPrInfo = new prInfo();
        tempPrInfo.SetEvent(tempEvent.Event, tempEvent.EventType);
        const tempRepo = new repoInfo(tempPrInfo, tempEvent.Event);

        // Authenticate
        const octokit = await ActionInfo.CreateOctokit(tempRepo.Owner, tempRepo.Name);
        const actionInfo = new ActionInfo(octokit, prInfo, options, eventInfo, repoInfo);

        Logger.Debug("Done!");
        return actionInfo;
    }

    private static async CreateOctokit(owner: string, repoName: string): Promise<Octokit>
    {
        Logger.Debug("Creating Octokit instance...");
        const APP_ID = process.env["APP_CLIENT_ID"] as string;
        const PRIVATE_KEY = fs.readFileSync(process.env["APP_PRIVATE_KEY_PATH"] as string, "utf8");

        // Create Octokit JWT
        let octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: APP_ID,
                privateKey: PRIVATE_KEY
            }
        });

        Logger.Debug(`Getting installation key for ${owner}'s ${repoName}`);

        // Find repo installation
        let res;
        try {
            res = await octokit.request(
                "GET /repos/{owner}/{repo}/installation",
                { owner, repo: repoName }
            );
        } catch (error) {
            Logger.AppNotInstalledError(owner, repoName);
        }


        // Exchange installation ID for installation token
        const appAuth = createAppAuth({
            appId: APP_ID,
            privateKey: PRIVATE_KEY,
            installationId: res.data.id
        });
        const authRes = await appAuth({type: "installation"})

        if (!authRes.token) Logger.InvalidInstallationTokenError();

        // Authenticate as app
        octokit = new Octokit({ auth: authRes.token });

        Logger.Debug("Done!");
        return octokit;
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