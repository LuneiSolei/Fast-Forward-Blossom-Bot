import PrInfo from "./prInfo.js";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";
import type {ValidEvent} from "./validEvent.js";
import * as core from "@actions/core";

export default class RepoInfo
{
    private readonly _name: string;
    private _mergeBase?: string;
    private readonly _pr: PrInfo
    private readonly _user: string;
    private readonly _owner: string;
    private readonly _cloneUrl: string;

    public constructor(event: PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent, eventType: ValidEvent)
    {
        this._owner = event.repository.owner.login;
        this._name = event.repository.name;
        this._user = event.sender.login;
        this._pr = new PrInfo(event, eventType);
        this._cloneUrl = event.repository.clone_url;

        return this;
    }

    public get Name(): string
    {
        return this._name;
    }

    public get Owner(): string
    {
        return this._owner;
    }

    public get User(): string
    {
        return this._user;
    }

    public get Pr(): PrInfo {
        return this._pr;
    }

    public get MergeBase(): string | null
    {
        if (this._mergeBase) return this._mergeBase;

        core.setFailed("Attempted to access uninitialized 'RepoInfo.MergeBase'.");
        process.exit(1);
    }

    public get CloneUrl(): string
    {
        return this._cloneUrl;
    }
}