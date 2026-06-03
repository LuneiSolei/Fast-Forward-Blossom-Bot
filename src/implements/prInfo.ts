import type {
    IssueCommentCreatedEvent,
    IssueCommentEditedEvent,
    PullRequestOpenedEvent
} from "@octokit/webhooks-types";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import * as core from "@actions/core";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";
import Git from "../core/git.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import type {IGraphQlPrResponse} from "../core/githubApi/IGraphQlPrResponse.js";

export default class PrInfo implements IPrInfo
{
    private _baseRef?: string;
    private _baseSha?: string;
    private _headRef?: string;
    private _headSha?: string;
    private _headLabel?: string;
    private _headOwner?: string;
    private _headRepo?: string;
    private _nodeId?: string;
    private _mergeBaseSha?: string;
    private _mergeBaseParentsAmount?: number;
    private _issueNumber?: number;

    public SetEvent(
        event: ActionEvent,
        eventType: ActionEventType): void
    {
        switch (eventType) {
            case ActionEventType.PullRequestOpened:
                event = event as PullRequestOpenedEvent;
                this._baseRef = event.pull_request.base.ref;
                this._baseSha = event.pull_request.base.sha;
                this._headRef = event.pull_request.head.ref;
                this._headSha = event.pull_request.head.sha;
                this._headLabel = event.pull_request.head.label;
                this._nodeId = event.pull_request.node_id;
                this._headOwner = event.pull_request.head.repo?.owner.login || event.repository.owner.login
                this._headRepo = event.pull_request.head.repo?.name || event.repository.name;
                this._issueNumber = event.pull_request.number;

                break;
            case ActionEventType.IssueCommentCreated:
                core.info("Pull request comment created/edited. Waiting for Octokit authorization...")

                break;
            case ActionEventType.IssueCommentEdited:
                core.info("Pull request comment created/edited. Waiting for Octokit authorization...")

                break;
        }
    }

    public async FinishInitialization(
        apiCaller: IApiCaller,
        event: ActionEvent,
        eventType: ActionEventType): Promise<void>
    {
        switch (eventType)
        {
            case ActionEventType.PullRequestOpened:
                return;
            case ActionEventType.IssueCommentCreated:
                event = event as IssueCommentCreatedEvent;
                if (!event.issue.pull_request
                    || Object.keys(event.issue.pull_request).length === 0)
                {
                    core.info("Event is IssueCommentCreated, but pull_request is either empty, null, or undefined. Skipping...");
                    core.debug(`Received: ${JSON.stringify(event.issue.pull_request)}`);
                    return;
                }

                break;
            case ActionEventType.IssueCommentEdited:
                event = event as IssueCommentEditedEvent;

                // istanbul ignore else
                if (!event.issue.pull_request
                    || Object.keys(event.issue.pull_request).length === 0)
                {
                    core.info("Event is IssueCommentEdited, but pull_request is either empty, null, or undefined. Skipping...");
                    core.debug(`Received: ${JSON.stringify(event.issue.pull_request)}`);
                    return;
                }
        }

        // Retrieve the pull request info via api call
        this._issueNumber = event.issue.number
        const res: IGraphQlPrResponse = await apiCaller.GetPullRequest(
            event.repository.owner.login,
            event.repository.name,
            this._issueNumber
        );

        const pr = res.repository.pullRequest;
        this._baseRef = pr.baseRefName;
        this._baseSha = pr.baseRefOid;
        this._headRef = pr.headRefName;
        this._headSha = pr.headRefOid;
        this._headOwner = pr.headRepositoryOwner.login;
        this._headLabel = `${this._headOwner}/${pr.headRefName}`;
        this._nodeId = pr.id;
        this._headRepo = pr.headRepository.name;
    }

    private GetMergeBaseData(): { sha: string, amountOfParents: number }
    {
        // Get the merge base's sha
        this._mergeBaseSha = Git.GetMergeBaseSha(this.BaseSha, this.HeadSha);

        // Get the amount of parents from the sha
        this._mergeBaseParentsAmount = Git.GetAmountOfParents(this._mergeBaseSha);

        return { sha: this._mergeBaseSha, amountOfParents: this._mergeBaseParentsAmount };
    }

    public get IssueNumber(): number
    {
        if (this._issueNumber) return this._issueNumber

        throw new UnknownReferenceError("IssueNumber", "Property 'IssueNumber' is uninitialized")
    }

    public get MergeBaseSha(): string
    {
        if (this._mergeBaseSha) return this._mergeBaseSha;

        return this.GetMergeBaseData().sha;
    }

    public get MergeBaseParentsAmount(): number
    {
        if (this._mergeBaseParentsAmount) return this._mergeBaseParentsAmount;

        return this.GetMergeBaseData().amountOfParents;
    }

    public get BaseRef(): string {
        if (this._baseRef) return this._baseRef;

        throw new UnknownReferenceError("BaseRef", "Property 'BaseRef' is uninitialized");
    }

    public get BaseSha(): string {
        if (this._baseSha) return this._baseSha;

        throw new UnknownReferenceError("BaseSha", "Property 'BaseSha' is uninitialized");
    }

    public get HeadRef(): string {
        if (this._headRef) return this._headRef;

        throw new UnknownReferenceError("HeadRef", "Property 'HeadRef' is uninitialized");
    }

    public get HeadSha(): string {
        if (this._headSha) return this._headSha;

        throw new UnknownReferenceError("HeadSha", "Property 'HeadSha' is uninitialized");
    }

    public get HeadLabel(): string {
        if (this._headLabel) return this._headLabel;

        throw new UnknownReferenceError("HeadLabel", "Property 'HeadLabel' is uninitialized");
    }

    public get NodeId(): string {
        if (this._nodeId) return this._nodeId;

        throw new UnknownReferenceError("NodeId", "Property 'NodeId' is uninitialized");
    }

    public get HeadOwner(): string
    {
        if (this._headOwner) return this._headOwner;

        throw new UnknownReferenceError("HeadOwner", "Property 'HeadOwner' is uninitialized");
    }

    public get HeadRepo(): string
    {
        if (this._headRepo) return this._headRepo;

        throw new UnknownReferenceError("HeadRepo", "Property 'HeadRepo' is uninitialized");
    }
}