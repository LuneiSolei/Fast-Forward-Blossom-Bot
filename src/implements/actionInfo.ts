import {Octokit} from "@octokit/core";
import * as core from "@actions/core";
import * as fs from "node:fs";
import {createAppAuth} from "@octokit/auth-app";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";

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
        eventInfo: new (options: IOptions) => IEventInfo,
        repoInfo: new (prInfo: IPrInfo, event: ActionEvent) => IRepoInfo)
    {
        core.debug("Retrieving options...");
        this._options = new options;

        // Get basic info first
        core.debug("Retrieving basic event info...");
        this._event = new eventInfo(this._options);
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
        eventInfo: new (options: IOptions) => IEventInfo,
        repoInfo: new (prInfo: IPrInfo, event: ActionEvent) => IRepoInfo,
    ): Promise<ActionInfo>
    {
        core.debug("Constructing new ActionInfo instance...");

        // Create temporary instances to get repo info for authentication
        const tempOptions = new options();
        const tempEvent = new eventInfo(tempOptions);
        const tempPrInfo = new prInfo();
        tempPrInfo.SetEvent(tempEvent.Event, tempEvent.EventType);
        const tempRepo = new repoInfo(tempPrInfo, tempEvent.Event);

        // Authenticate
        const octokit = await ActionInfo.CreateOctokit(tempRepo.Owner, tempRepo.Name);
        const actionInfo = new ActionInfo(octokit, prInfo, options, eventInfo, repoInfo);

        core.debug("Done!");
        return actionInfo;
    }

    private static async CreateOctokit(owner: string, repoName: string): Promise<Octokit>
    {
        const APP_ID = process.env.APP_CLIENT_ID as string;
        const PRIVATE_KEY = fs.readFileSync(process.env.APP_PRIVATE_KEY_PATH as string, "utf8");

        // Create Octokit JWT
        let octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: APP_ID,
                privateKey: PRIVATE_KEY
            }
        });

        // Find repo installation
        const res = await octokit.request(
            "GET /repos/{owner}/{repo}/installation",
            { owner, repo: repoName }
        );

        // Exchange installation ID for installation token
        const appAuth = createAppAuth({
            appId: APP_ID,
            privateKey: PRIVATE_KEY,
            installationId: res.data.id
        });
        const authRes = await appAuth({type: "installation"})
        if (!authRes.token) core.error("Failed to obtain installation token.");

        // Authenticate as app
        octokit = new Octokit({ auth: authRes.token });

        core.debug("Done!");
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