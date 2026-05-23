import {Octokit} from "@octokit/core";
import Options from "../core/options.js";
import RepoInfo from "../core/repoInfo.js";
import EventInfo from "../core/eventInfo.js";
import * as core from "@actions/core";
import * as fs from "node:fs";
import {createAppAuth} from "@octokit/auth-app";

export default class ActionInfo
{
    private readonly _octokit: Octokit;
    private readonly _repo: RepoInfo;
    private readonly _options: Options;
    private readonly _event: EventInfo;

    public constructor()
    {
        this._options = new Options();

        // Get basic info first
        this._event = new EventInfo(this._options);
        this._repo = new RepoInfo(
            this._event.Event,
            this._event.EventType
        );
        this._event.Repo = this._repo;

        // Authenticate
        this._octokit = this.CreateOctokit();

        // Get any authentication required info
        this._repo.Pr.FinishInitialization(this._octokit, this._event.Event, this._event.EventType)
            .then();

        return this;
    }

    private CreateOctokit(): Octokit
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
        octokit.request(
            "GET /repos/{owner}/{repo}/installation",
            { owner: this._repo.Owner, repo: this._repo.Name }
        ).then(res => {
            // Exchange installation ID for installation token
            const appAuth = createAppAuth({
                appId: APP_ID,
                privateKey: PRIVATE_KEY,
                installationId: res.data.id
            });
            appAuth({type: "installation"}).then(res => {
                if (!res.token) core.error("Failed to obtain installation token.");

                // Authenticate as app
                octokit = new Octokit({ auth: res.token });
                return this._octokit;
            });
        });

        return octokit;
    }

    public get Octokit(): Octokit {
        return this._octokit;
    }

    public get Repo(): RepoInfo {
        return this._repo;
    }

    public get Options(): Options {
        return this._options;
    }

    public get Event(): EventInfo {
        return this._event;
    }
}