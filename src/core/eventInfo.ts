import {ValidEvent} from "./validEvent.js";
import type {
    IssueCommentCreatedEvent,
    IssueCommentEditedEvent, IssueCommentEvent,
    PullRequestOpenedEvent
} from "@octokit/webhooks-types";
import path from "path";
import * as fs from "node:fs";
import * as core from "@actions/core";
import type {IApiCompareResponse} from "./IApiCompareResponse.js";
import type {Octokit} from "@octokit/core";
import type {IGraphQLCompareResponse} from "./IGraphQLCompareResponse.js";
import Options from "./options.js";
import type RepoInfo from "./repoInfo.js";

export default class EventInfo
{
    private readonly _eventActionMap: Map<string, { check: () => boolean, type: ValidEvent }> = new Map();
    private readonly _event: PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent;
    private _octokit?: Octokit = undefined;
    private _options: Options;
    private _eventType!: ValidEvent;
    private _commandInvoked?: boolean;
    private _comment?: string
    private _isPossible?: boolean
    private _userHasPerms?: boolean
    private _shouldExit: boolean = false

    public constructor(options: Options)
    {
        this._options = options;

        const eventPath: string = process.env.GITHUB_EVENT_PATH as string;
        const raw: string = fs.readFileSync(path.resolve(eventPath), "utf8");
        const event = JSON.parse(raw);
        this._eventActionMap.set(
            "opened",
            {check: (): boolean => event.pull_request, type: ValidEvent.PullRequestOpened}
        );
        this._eventActionMap.set(
            "created",
            {check: (): boolean => event.comment, type: ValidEvent.IssueCommentCreated}
        );
        this._eventActionMap.set(
            "edited",
            {check: (): boolean => event.comment, type: ValidEvent.IssueCommentEdited}
        )

        const config = this._eventActionMap.get(event.action);
        if (config?.check()) {
            this.EventType = config.type;
            this._event = event as PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent;

            if (process.env.ACTIONS_STEP_DEBUG)
            {
                core.debug(`Received '${this.EventType.toString()}Event: ${JSON.stringify(event, null, 2)}`);
            }

            return this;
        }

        // Invalid event
        if (process.env.ACTIONS_STEP_DEBUG)
        {
            core.debug(`Received invalid event: ${JSON.stringify(event, null, 2)}`);
        }

        process.exit(0);
    }

    public get Event(): PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent
    {
        return this._event;
    }

    public get EventType(): ValidEvent {
        return this._eventType;
    }

    public set EventType(value: ValidEvent)
    {
        this._eventType = value;
    }

    public get CommandInvoked(): boolean
    {
        if (this._commandInvoked) return this._commandInvoked;

        this._commandInvoked = (this.Comment.trim() === this._options.customCommand);

        return this._commandInvoked;
    }

    public get Comment(): string
    {
        if (this._comment) return this._comment;

        const event = this._event as IssueCommentEvent;

        return event.comment.body;
    }

    public IsPossible: (repo: RepoInfo) => Promise<boolean | undefined> = async (repo: RepoInfo) =>
    {
        if (this._isPossible) return this._isPossible;

        core.info("Determining if fast-forward is possible...");
        const res: IApiCompareResponse = await this.Octokit.request("GET /repos/{owner}/{repo}/compare/{basehead}", {
            owner: repo.Owner,
            repo: repo.Name,
            basehead: `${repo.Pr.BaseSha}...${repo.Pr.HeadLabel}`
        });
        this._isPossible = res.data.status === "ahead";

        return this._isPossible;
    }

    public UserHasPerms: (repo: RepoInfo) => Promise<boolean> = async (repo: RepoInfo) =>
    {
        if (this._userHasPerms) return this._userHasPerms;
        if (repo.Owner === repo.User) {
            // User is owner
            this._userHasPerms = true;
        } else {
            const res: IGraphQLCompareResponse = await this.Octokit.graphql(`
                query($owner: String!, $repoName: String!, $user: String!) {
                    repository(owner: $owner, name: $repoName) {
                        collaborators(login: $user) {
                            totalCount
                        }
                    }
                }
            `, { owner: repo.Owner, repoName: repo.Name, user: repo.User });

            this._userHasPerms = res.repository.collaborators.totalCount > 0;
        }

        return this._userHasPerms;
    }

    public get ShouldExit(): boolean {
        return this._shouldExit;
    }

    public set ShouldExit(value: boolean) {
        this._shouldExit = value;
    }

    public get Octokit(): Octokit
    {
        if (this._octokit) return this._octokit;

        core.setFailed("Attempted to access 'octokit' before initialization.");
        process.exit(1);
    }

    public set Octokit(value: Octokit)
    {
        this._octokit = value;
    }
}