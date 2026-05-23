import type {
    IssueCommentCreatedEvent,
    IssueCommentEditedEvent,
    PullRequestOpenedEvent
} from "@octokit/webhooks-types";
import {ValidEvent} from "./validEvent.js";
import * as core from "@actions/core";
import type {Octokit} from "@octokit/core";
import type {IGraphQLPrResponse} from "./IGraphQLPrResponse.js";

export default class PrInfo
{
    private _baseRef?: string;
    private _baseSha?: string;
    private _headRef?: string;
    private _headSha?: string;
    private _headLabel?: string;
    private _headOwner?: string;
    private _nodeId?: string;

    public constructor(event: PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent, eventType: ValidEvent)
    {
        switch (eventType) {
            case ValidEvent.PullRequestOpened:
                event = event as PullRequestOpenedEvent;
                this._baseRef = event.pull_request.base.ref;
                this._baseSha = event.pull_request.base.sha;
                this._headRef = event.pull_request.head.ref;
                this._headSha = event.pull_request.head.sha;
                this._headLabel = event.pull_request.head.label;
                this._nodeId = event.pull_request.node_id;
                this._headOwner = event.pull_request.head.repo?.owner.login || event.repository.owner.login

                break;
            case ValidEvent.IssueCommentCreated || ValidEvent.IssueCommentEdited:
                core.info("Pull request comment created/edited. Waiting for Octokit authorization...")

                break;
            default:
                core.setFailed(`Pull request could not be found on event '${event}'`);
                process.exit(1);
        }
    }

    public async FinishInitialization(
        octokit: Octokit,
        event: PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent,
        eventType: ValidEvent): Promise<void>
    {
        if (this._baseRef) return;

        switch (eventType)
        {
            case ValidEvent.PullRequestOpened:
                return;
            case ValidEvent.IssueCommentCreated:
                event = event as IssueCommentCreatedEvent;
                if (event.issue.pull_request === null || event.action !== "created") return;

            case ValidEvent.IssueCommentEdited:
                event = event as IssueCommentEditedEvent;
                if (event.issue.pull_request === null || event.action !== "edited") return;
            default:
                // Retrieve the pull request info via api call
                // @ts-ignore
                const number: number = event.issue.number
                const res: IGraphQLPrResponse = await octokit.graphql(`
                    query($owner: String!, $repoName: String!, $number: Int!) {
                        repository(owner: $owner, name: $repoName) {
                            pullRequest(number: $number) {
                                baseRefName
                                baseRefOid
                                headRefName
                                headRefOid
                                headRepositoryOwner {
                                    login
                                }
                                id
                            }
                        }
                    }
                `, { owner: event.repository.owner.login, repoName: event.repository.name, number });

                const pr = res.repository.pullRequest;
                this._baseRef = pr.baseRefName;
                this._baseSha = pr.baseRefOid;
                this._headRef = pr.headRefName;
                this._headSha = pr.headRefOid;
                this._headOwner = pr.headRepositoryOwner.login;
                this._headLabel = `${this._headOwner}/${pr.headRefName}`;
                this._nodeId = pr.id;

                break;
        }
    }

    public get BaseRef(): string {
        if (this._baseRef) return this._baseRef;

        core.setFailed("Attempted to access 'BaseRef' before finishing initialization.");
        process.exit(1);
    }

    public get BaseSha(): string {
        if (this._baseSha) return this._baseSha;

        core.setFailed("Attempted to access 'BaseSha' before finishing initialization.");
        process.exit(1);
    }

    public get HeadRef(): string {
        if (this._headRef) return this._headRef;

        core.setFailed("Attempted to access 'HeadRef' before finishing initialization.");
        process.exit(1);
    }

    public get HeadSha(): string {
        if (this._headSha) return this._headSha;

        core.setFailed("Attempted to access 'HeadSha' before finishing initialization.");
        process.exit(1);
    }

    public get HeadLabel(): string {
        if (this._headLabel) return this._headLabel;

        core.setFailed("Attempted to access 'HeadLabel' before finishing initialization.");
        process.exit(1);
    }

    public get NodeId(): string {
        if (this._nodeId) return this._nodeId;

        core.setFailed("Attempted to access 'NodeId' before finishing initialization.");
        process.exit(1);
    }

    public get HeadOwner(): string
    {
        if (this._headOwner) return this._headOwner;

        core.setFailed("Attempted to access 'HeadOwner' before finishing initialization.");
        process.exit(1);
    }
}