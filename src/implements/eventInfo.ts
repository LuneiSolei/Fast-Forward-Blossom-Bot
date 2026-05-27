import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import path from "path";
import * as fs from "node:fs";
import * as core from "@actions/core";
import type {IApiCompareResponse} from "../core/githubApi/IApiCompareResponse.js";
import type {Octokit} from "@octokit/core";
import type {IGraphQLCompareResponse} from "../core/githubApi/IGraphQLCompareResponse.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";
import type {
    IssueCommentCreatedEvent,
    IssueCommentEditedEvent,
    PullRequestOpenedEvent
} from "@octokit/webhooks-types";
import {Logger} from "../core/Logger.js";

export default class EventInfo implements IEventInfo
{
    private readonly _eventActionMap: Map<string, { check: () => boolean, type: ActionEventType }> = new Map();
    private readonly _event: ActionEvent;
    private readonly _eventType!: ActionEventType;
    private _octokit?: Octokit = undefined;
    private _options: IOptions;
    private _commandInvoked?: boolean;
    private _commentBody?: string | null
    private _isPossible?: boolean
    private _userHasPerms?: boolean
    private _shouldExit: boolean = false

    public constructor(options: IOptions, eventPath: string)
    {
        this._options = options;

        // Read the event
        const raw: string = fs.readFileSync(path.resolve(eventPath), "utf8");
        let event: ActionEvent;
        try {
            event = JSON.parse(raw);
        } catch (error) {
            Logger.EventFileParseError(eventPath);
        }

        // Determine the event type
        this._eventActionMap.set(
            "opened",
            {check: (): boolean => "pull_request" in event, type: ActionEventType.PullRequestOpened}
        );
        this._eventActionMap.set(
            "created",
            {check: (): boolean => "comment" in event, type: ActionEventType.IssueCommentCreated}
        );
        this._eventActionMap.set(
            "edited",
            {check: (): boolean => "comment" in event, type: ActionEventType.IssueCommentEdited}
        )

        const config = this._eventActionMap.get(event.action);
        if (config?.check()) {
            this._eventType = config.type;
            this._event = event as ActionEvent;
        } else {
            // Invalid event
            Logger.InvalidEventError(JSON.stringify(event, null, 2), 1);
        }
    }

    public get Event(): ActionEvent
    {
        return this._event;
    }

    public get EventType(): ActionEventType
    {
        return this._eventType;
    }

    public get CommandInvoked(): boolean
    {
        if (this._commandInvoked)
            return this._commandInvoked;

        // Check if event is relevant type
        if (this.EventType !== ActionEventType.IssueCommentCreated
            && this.EventType !== ActionEventType.IssueCommentEdited)
        {
            this._commandInvoked = false;
            return this._commandInvoked;
        }

        this._commandInvoked = (this.CommentBody?.trim() === this._options.CustomCommand);

        return this._commandInvoked;
    }

    public get CommentBody(): string | null
    {
        if (this._commentBody) return this._commentBody;

        switch (this._eventType) {
            case ActionEventType.PullRequestOpened:
                this._commentBody = (this._event as PullRequestOpenedEvent).pull_request.body;
                break;
            case ActionEventType.IssueCommentCreated:
                this._commentBody = (this._event as IssueCommentCreatedEvent).comment.body;
                break;
            case ActionEventType.IssueCommentEdited:
                this._commentBody = (this._event as IssueCommentEditedEvent).comment.body;
                break;
        }

        return this._commentBody;
    }

    public GetIsPossible: (repo: IRepoInfo) => Promise<boolean> = async (repo: IRepoInfo) =>
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

    public GetUserHasPerms: (repo: IRepoInfo) => Promise<boolean> = async (repo: IRepoInfo) =>
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

    private get Octokit(): Octokit
    {
        if (this._octokit) return this._octokit;

        core.setFailed("Attempted to access 'octokit' before initialization.");
        process.exit(1);
    }
}