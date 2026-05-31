import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import path from "path";
import * as fs from "node:fs";
import * as core from "@actions/core";
import type {IApiCompareResponse} from "../core/githubApi/IApiCompareResponse.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";
import type {
    IssueCommentCreatedEvent,
    IssueCommentEditedEvent,
    PullRequestOpenedEvent
} from "@octokit/webhooks-types";
import EventFileError from "../core/errors/eventFileError.js";
import InvalidEventError from "../core/errors/invalidEventError.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";

export default class EventInfo implements IEventInfo
{
    private readonly _eventActionMap: Map<string, { check: () => boolean, type: ActionEventType }> = new Map();
    private _options: IOptions;

    // istanbul ignore next
    private _apiCaller?: IApiCaller;

    // istanbul ignore next
    public get ApiCaller(): IApiCaller
    {
        if (this._apiCaller) return this._apiCaller;

        throw new UnknownReferenceError("ApiCaller", "Property 'ApiCaller' is uninitialized")
    }

    // istanbul ignore next
    public set ApiCaller(value: IApiCaller)
    {
        this._apiCaller = value;
    }

    private readonly _event: ActionEvent;
    public get Event(): ActionEvent
    {
        if (this._event) return this._event;

        throw new UnknownReferenceError("Event", "Property 'Event' is uninitialized");
    }

    private readonly _eventType!: ActionEventType;
    public get EventType(): ActionEventType
    {
        if (this._eventType) return this._eventType;

        throw new UnknownReferenceError("EventType", "Property 'EventType' is uninitialized");
    }

    private _commandInvoked?: boolean;
    public get CommandInvoked(): boolean
    {
        // istanbul ignore if
        if (this._commandInvoked)
            return this._commandInvoked;

        this._commandInvoked = (this.CommentBody?.trim() === this._options.CustomCommand);

        return this._commandInvoked;
    }

    private _commentBody?: string | null
    public get CommentBody(): string | null
    {
        // istanbul ignore if
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

    private _isPossible?: boolean
    public GetIsPossible: (repo: IRepoInfo) => Promise<boolean> = async (repo: IRepoInfo) =>
    {
        // istanbul ignore if
        if (this._isPossible) return this._isPossible;

        core.info("Determining if fast-forward is possible...");
        const res: IApiCompareResponse = await this.ApiCaller.GetBaseHeadComparison(
            repo.Owner,
            repo.Name,
            repo.Pr.BaseSha,
            repo.Pr.HeadLabel);
        this._isPossible = res.data.status === "ahead";

        return this._isPossible;
    }

    private _userHasPerms?: boolean
    public GetUserHasPerms: (repo: IRepoInfo) => Promise<boolean> = async (repo: IRepoInfo) =>
    {
        // istanbul ignore if
        if (this._userHasPerms) return this._userHasPerms;

        if (repo.Owner === this.User) {
            // User is owner
            this._userHasPerms = true;
        } else {
            const res = await this.ApiCaller.GetCollaborator(
                repo.Owner,
                repo.Name,
                this.User);

            this._userHasPerms = res.repository.collaborators.totalCount > 0;
        }

        return this._userHasPerms;
    }

    // istanbul ignore next
    private _shouldExit: boolean = false;

    // istanbul ignore next
    public get ShouldExit(): boolean
    {
        return this._shouldExit;
    }

    // istanbul ignore next
    public set ShouldExit(value: boolean) {
        this._shouldExit = value;
    }

    private _user: string;
    public get User(): string
    {
        if (this._user) return this._user;

        this._user = this.Event.sender.login;
        return this._user;
    }

    public constructor(options: IOptions, eventPath: string)
    {
        this._options = options;

        // Read the event
        const raw: string = fs.readFileSync(path.resolve(eventPath), "utf8");
        let event: ActionEvent;
        try {
            event = JSON.parse(raw);
        } catch (error) {
            throw new EventFileError(eventPath, (error as Error).message);
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
            this._user = event.sender.login;
        } else {
            // Invalid event
            throw new InvalidEventError(JSON.stringify(event, null, 2), "This event is either not supported or improperly formatted");
        }
    }
}