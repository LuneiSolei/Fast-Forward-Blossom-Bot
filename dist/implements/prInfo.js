import { ActionEventType } from "../core/actionEvent/actionEventType.js";
import * as core from "@actions/core";
import Git from "../core/git/git.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
export default class PrInfo {
    _baseRef;
    _baseSha;
    _headRef;
    _headSha;
    _headLabel;
    _headOwner;
    _headRepo;
    _prNodeId;
    _headNodeId;
    _baseNodeId;
    _mergeBaseSha;
    _mergeBaseParentsAmount;
    _issueNumber;
    SetEvent(event, eventType) {
        switch (eventType) {
            case ActionEventType.PullRequestOpened:
                event = event;
                this._baseRef = event.pull_request.base.ref;
                this._baseSha = event.pull_request.base.sha;
                this._headRef = event.pull_request.head.ref;
                this._headSha = event.pull_request.head.sha;
                this._headLabel = event.pull_request.head.label;
                this._prNodeId = event.pull_request.node_id;
                this._headOwner = event.pull_request.head.repo?.owner.login || event.repository.owner.login;
                this._headRepo = event.pull_request.head.repo?.name || event.repository.name;
                this._issueNumber = event.pull_request.number;
                break;
            case ActionEventType.IssueCommentCreated:
                core.info("Pull request comment created/edited. Waiting for Octokit authorization...");
                break;
            case ActionEventType.IssueCommentEdited:
                core.info("Pull request comment created/edited. Waiting for Octokit authorization...");
                break;
        }
    }
    async FinishInitialization(apiCaller, event, eventType) {
        switch (eventType) {
            case ActionEventType.PullRequestOpened:
                this._baseNodeId = await apiCaller.GetNodeId(event.repository.owner.login, event.repository.name, `refs/heads/${this._baseRef}`);
                this._headNodeId = await apiCaller.GetNodeId(event.repository.owner.login, event.repository.name, `refs/heads/${this._headRef}`);
                return;
            case ActionEventType.IssueCommentCreated:
                event = event;
                if (!event.issue.pull_request
                    || Object.keys(event.issue.pull_request).length === 0) {
                    core.info("Event is IssueCommentCreated, but pull_request is either empty, null, or undefined. Skipping...");
                    core.debug(`Received: ${JSON.stringify(event.issue.pull_request)}`);
                    return;
                }
                break;
            case ActionEventType.IssueCommentEdited:
                event = event;
                // istanbul ignore else
                if (!event.issue.pull_request
                    || Object.keys(event.issue.pull_request).length === 0) {
                    core.info("Event is IssueCommentEdited, but pull_request is either empty, null, or undefined. Skipping...");
                    core.debug(`Received: ${JSON.stringify(event.issue.pull_request)}`);
                    return;
                }
        }
        // Retrieve the pull request info via api call
        const owner = event.repository.owner.login;
        const repoName = event.repository.name;
        this._issueNumber = event.issue.number;
        const res = await apiCaller.GetPullRequest(owner, repoName, this._issueNumber);
        const pr = res.repository.pullRequest;
        this._baseRef = pr.baseRefName;
        this._baseSha = pr.baseRefOid;
        this._headRef = pr.headRefName;
        this._headSha = pr.headRefOid;
        this._headOwner = pr.headRepositoryOwner.login;
        this._headLabel = `${this._headOwner}/${pr.headRefName}`;
        this._prNodeId = pr.id;
        this._headRepo = pr.headRepository.name;
        this._baseNodeId = await apiCaller.GetNodeId(owner, repoName, `refs/heads/${this._baseRef}`);
        this._headNodeId = await apiCaller.GetNodeId(owner, repoName, `refs/heads/${this._headRef}`);
    }
    GetMergeBaseData() {
        // Get the merge base's sha
        const result = Git.GetMergeBaseSha(this.BaseSha, this.HeadSha);
        if (!result)
            return { sha: "", amountOfParents: 0 };
        this._mergeBaseSha = result;
        // Get the amount of parents from the sha
        this._mergeBaseParentsAmount = Git.GetAmountOfParents(this._mergeBaseSha);
        return { sha: this._mergeBaseSha, amountOfParents: this._mergeBaseParentsAmount };
    }
    get IssueNumber() {
        if (this._issueNumber)
            return this._issueNumber;
        throw new UnknownReferenceError("IssueNumber", "Property 'IssueNumber' is uninitialized");
    }
    get MergeBaseSha() {
        if (this._mergeBaseSha)
            return this._mergeBaseSha;
        return this.GetMergeBaseData().sha;
    }
    get MergeBaseParentsAmount() {
        if (this._mergeBaseParentsAmount)
            return this._mergeBaseParentsAmount;
        return this.GetMergeBaseData().amountOfParents;
    }
    get BaseRef() {
        if (this._baseRef)
            return this._baseRef;
        throw new UnknownReferenceError("BaseRef", "Property 'BaseRef' is uninitialized");
    }
    get BaseSha() {
        if (this._baseSha)
            return this._baseSha;
        throw new UnknownReferenceError("BaseSha", "Property 'BaseSha' is uninitialized");
    }
    get HeadRef() {
        if (this._headRef)
            return this._headRef;
        throw new UnknownReferenceError("HeadRef", "Property 'HeadRef' is uninitialized");
    }
    get HeadSha() {
        if (this._headSha)
            return this._headSha;
        throw new UnknownReferenceError("HeadSha", "Property 'HeadSha' is uninitialized");
    }
    get HeadLabel() {
        if (this._headLabel)
            return this._headLabel;
        throw new UnknownReferenceError("HeadLabel", "Property 'HeadLabel' is uninitialized");
    }
    get PrNodeId() {
        if (this._prNodeId)
            return this._prNodeId;
        throw new UnknownReferenceError("PrNodeId", "Property 'PrNodeId' is uninitialized");
    }
    get BaseNodeId() {
        if (this._baseNodeId)
            return this._baseNodeId;
        throw new UnknownReferenceError("BaseNodeId", "Property 'BaseNodeId' is uninitialized");
    }
    get HeadNodeId() {
        if (this._headNodeId)
            return this._headNodeId;
        throw new UnknownReferenceError("HeadNodeId", "Property 'HeadNodeId' is uninitialized");
    }
    get HeadOwner() {
        if (this._headOwner)
            return this._headOwner;
        throw new UnknownReferenceError("HeadOwner", "Property 'HeadOwner' is uninitialized");
    }
    get HeadRepo() {
        if (this._headRepo)
            return this._headRepo;
        throw new UnknownReferenceError("HeadRepo", "Property 'HeadRepo' is uninitialized");
    }
}
//# sourceMappingURL=prInfo.js.map