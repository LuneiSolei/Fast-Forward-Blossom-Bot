import { ActionEventType } from "../core/actionEvent/actionEventType.js";
import path from "path";
import * as fs from "node:fs";
import * as core from "@actions/core";
import EventFileError from "../core/errors/eventFileError.js";
import InvalidEventError from "../core/errors/invalidEventError.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
export default class EventInfo {
    _eventActionMap = new Map();
    _options;
    // istanbul ignore next
    _apiCaller;
    // istanbul ignore next
    get ApiCaller() {
        if (this._apiCaller)
            return this._apiCaller;
        throw new UnknownReferenceError("ApiCaller", "Property 'ApiCaller' is uninitialized");
    }
    // istanbul ignore next
    set ApiCaller(value) {
        this._apiCaller = value;
    }
    _event;
    get Event() {
        if (this._event)
            return this._event;
        throw new UnknownReferenceError("Event", "Property 'Event' is uninitialized");
    }
    _eventType;
    get EventType() {
        if (this._eventType)
            return this._eventType;
        throw new UnknownReferenceError("EventType", "Property 'EventType' is uninitialized");
    }
    _commandInvoked;
    get CommandInvoked() {
        // istanbul ignore if
        if (this._commandInvoked)
            return this._commandInvoked;
        this._commandInvoked = (this.CommentBody?.trim() === this._options.CustomCommand);
        return this._commandInvoked;
    }
    _commentBody;
    get CommentBody() {
        // istanbul ignore if
        if (this._commentBody)
            return this._commentBody;
        switch (this._eventType) {
            case ActionEventType.PullRequestOpened:
                this._commentBody = this._event.pull_request.body;
                break;
            case ActionEventType.IssueCommentCreated:
                this._commentBody = this._event.comment.body;
                break;
            case ActionEventType.IssueCommentEdited:
                this._commentBody = this._event.comment.body;
                break;
        }
        return this._commentBody;
    }
    _isPossible;
    GetIsPossible = async (repo) => {
        // istanbul ignore if
        if (this._isPossible)
            return this._isPossible;
        core.info("Determining if fast-forward is possible...");
        const res = await this.ApiCaller.GetBaseHeadComparison(repo.Owner, repo.Name, repo.Pr.BaseSha, repo.Pr.HeadLabel);
        this._isPossible = res.data.status === "ahead";
        return this._isPossible;
    };
    _userHasPerms;
    GetUserHasPerms = async (repo) => {
        // istanbul ignore if
        if (this._userHasPerms)
            return this._userHasPerms;
        if (repo.Owner === this.User) {
            // User is owner
            this._userHasPerms = true;
        }
        else {
            const res = await this.ApiCaller.GetCollaborator(repo.Owner, repo.Name, this.User);
            this._userHasPerms = res.repository.collaborators.totalCount > 0;
        }
        return this._userHasPerms;
    };
    // istanbul ignore next
    _shouldExit = false;
    // istanbul ignore next
    get ShouldExit() {
        return this._shouldExit;
    }
    // istanbul ignore next
    set ShouldExit(value) {
        this._shouldExit = value;
    }
    _user;
    get User() {
        if (this._user)
            return this._user;
        this._user = this.Event.sender.login;
        return this._user;
    }
    constructor(options, eventPath) {
        this._options = options;
        // Read the event
        const raw = fs.readFileSync(path.resolve(eventPath), "utf8");
        let event;
        try {
            event = JSON.parse(raw);
        }
        catch (error) {
            throw new EventFileError(eventPath, error.message);
        }
        // Determine the event type
        this._eventActionMap.set("opened", { check: () => "pull_request" in event, type: ActionEventType.PullRequestOpened });
        this._eventActionMap.set("created", { check: () => "comment" in event, type: ActionEventType.IssueCommentCreated });
        this._eventActionMap.set("edited", { check: () => "comment" in event, type: ActionEventType.IssueCommentEdited });
        const config = this._eventActionMap.get(event.action);
        if (config?.check()) {
            this._eventType = config.type;
            this._event = event;
            this._user = event.sender.login;
        }
        else {
            // Invalid event
            throw new InvalidEventError(JSON.stringify(event, null, 2), "This event is either not supported or improperly formatted");
        }
    }
}
//# sourceMappingURL=eventInfo.js.map