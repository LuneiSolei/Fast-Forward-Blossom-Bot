import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";

export type ActionEvent = PullRequestOpenedEvent | IssueCommentCreatedEvent | IssueCommentEditedEvent;