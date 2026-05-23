// import * as fs from "node:fs";
// import path from "path";
// import type {
//     IssueCommentCreatedEvent,
//     IssueCommentEditedEvent, IssueCommentEvent, PullRequest,
//     PullRequestOpenedEvent, Repository, User,
// } from "@octokit/webhooks-types";
// import * as core from "@actions/core";
// import {ValidEvent} from "../core/validEvent.js";
// import type IEventParser from "../core/IEventParser.js";
// import type PrInfo from "../core/prInfo.js";
//
// export default class EventParser implements IEventParser {
//     private static _event: PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent;
//     private static _eventType: ValidEvent;
//
//     public static get Event(): PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent {
//         if (!this._event)
//         {
//             // Resolve event as a WebhookEvent
//             const eventPath: string = process.env.GITHUB_EVENT_PATH as string;
//             const raw: string = fs.readFileSync(path.resolve(eventPath), "utf8");
//             const parsedEvent = JSON.parse(raw);
//
//             if (parsedEvent.pull_request != undefined && parsedEvent.action == "opened")
//             {
//                 this._event = parsedEvent as PullRequestOpenedEvent;
//                 this._eventType = ValidEvent.PullRequestOpened;
//             }
//             else if (parsedEvent.comment != undefined)
//             {
//                 if (parsedEvent.action == "created") {
//                     this._event = parsedEvent as IssueCommentCreatedEvent;
//                     // TODO: Validate that this is a comment on a PR, not a plain issue
//                     this._eventType = ValidEvent.IssueCommentCreated;
//                 }
//                 else if (parsedEvent.action == "edited") {
//                     this._event = parsedEvent as IssueCommentEditedEvent;
//                     this._eventType = ValidEvent.IssueCommentEdited;
//                 }
//             }
//             else
//             {
//                 core.error("Event is neither a pull request or issue comment: ", parsedEvent);
//             }
//
//             // Debug logging
//             if (process.env.ACTIONS_STEP_DEBUG) {
//                 core.debug(`Received '${this._eventType.toString()}Event': ${JSON.stringify(parsedEvent, null, 2)}`);
//             }
//         }
//
//         return this._event;
//     }
//
//     public static get EventType(): ValidEvent
//     {
//         if (this._eventType) return this._eventType;
//
//         this.Event;
//         return this.EventType;
//     }
//
//     private constructor() {}
//
//     public static GetOwner(): string
//     {
//         return this.Event.repository.owner.login;
//     }
//
//     public static GetRepoName(): string
//     {
//         return this.Event.repository.name;
//     }
//
//     public static GetUser(): string
//     {
//         return this.Event.sender.login;
//     }
//
//     public static GetComment(): string
//     {
//         const event: IssueCommentEvent = this.Event as IssueCommentEvent;
//
//         return event.comment.body;
//     }
//
//     public static GetPullRequestInfo(): PrInfo
//     {
//
//     }
// }