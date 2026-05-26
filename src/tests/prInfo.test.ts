import PrInfo from "../implements/prInfo.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import {Octokit} from "@octokit/core";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";

let subject: IPrInfo;
let octokit: Octokit;
let eventPullRequest: PullRequestOpenedEvent;
let eventIssue: IssueCommentCreatedEvent;

beforeEach(() => {
    subject = new PrInfo();
    octokit = {
        graphql: jest.fn()
    } as unknown as Octokit;

    // Create mock pull request event
    eventPullRequest = {
        repository: {
            owner: {
                login: "luneisolei"
            },
            name: "Fast-Forward-Blossom-Bot"
        },
        pull_request: {
            base: {
                ref: "master",
                sha: "abc1234"
            },
            head: {
                ref: "master",
                sha: "abc1234",
                label: "LuneiSolei/new-feature-branch",
                repo: {
                    name: "Fast-Forward-Blossom-Bot",
                    owner: {
                        login: "luneisolei"
                    }
                }
            },
            node_id: "MDQ6VXNlcjU4MzIzMQ=="
        }
    } as PullRequestOpenedEvent;

    // Create mock issue event. Can be used for both Created and Edited events
    eventIssue = {
        action: "created",
        repository: {
            owner: {
                login: "luneisolei"
            },
            name: "Fast-Forward-Blossom-Bot"
        },
        issue: {
            number: 42,
            pull_request: {}
        }
    } as IssueCommentCreatedEvent;
});

describe("SetEvent()", () => {
    beforeEach(async () => {
        subject = new PrInfo();
        subject.SetEvent(eventPullRequest, ActionEventType.PullRequestOpened);
    });

    test("waits for octokit authorization when eventType is IssueCommentCreated", async () => {
        const event = eventIssue as IssueCommentCreatedEvent;
        subject = new PrInfo();

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentCreated);

        expect(() => subject.BaseRef).toThrow(ReferenceError);
        expect(() => subject.BaseSha).toThrow();
        expect(() => subject.HeadRef).toThrow();
        expect(() => subject.HeadSha).toThrow();
        expect(() => subject.HeadLabel).toThrow();
        expect(() => subject.HeadRepo).toThrow();
        expect(() => subject.HeadOwner).toThrow();
        expect(() => subject.NodeId).toThrow();
    });

    test("sets properties when eventType is PullRequestOpened", async () => {

        expect(subject.BaseRef).toEqual(eventPullRequest.pull_request.base.ref);
        expect(subject.BaseSha).toEqual(eventPullRequest.pull_request.base.sha);
        expect(subject.HeadRef).toEqual(eventPullRequest.pull_request.head.ref);
        expect(subject.HeadSha).toEqual(eventPullRequest.pull_request.head.sha);
        expect(subject.HeadLabel).toEqual(eventPullRequest.pull_request.head.label);
        expect(subject.HeadOwner).toEqual(eventPullRequest.pull_request.head.repo?.owner.login);
    });

    test("handles undefined head repo", async () => {
        // @ts-ignore
        eventPullRequest.pull_request.head.repo = undefined;
        subject.SetEvent(eventPullRequest, ActionEventType.PullRequestOpened);

        expect(subject.HeadOwner).toEqual(eventPullRequest.repository.owner.login);
        expect(subject.HeadRepo).toEqual(eventPullRequest.repository.name);
    });
})

describe("FinishInitialization()", () => {
    test("returns early when baseRef is already set", async () => {
        // Set up event
        (subject as any)._baseRef = "master";
        const event = eventIssue as IssueCommentCreatedEvent; // We shouldn't need an event here

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentCreated);
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentCreated);

        // Test
        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when eventType is PullRequestOpened", async () => {
        // Parse event
        subject.SetEvent(eventPullRequest, ActionEventType.PullRequestOpened);
        await subject.FinishInitialization(
            octokit as Octokit,
            eventPullRequest,
            ActionEventType.PullRequestOpened);

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.pull_request is null and eventType is IssueCommentCreated", async () => {
        // Set up event
        const event = eventIssue as IssueCommentCreatedEvent;
        // @ts-ignore
        event.issue.pull_request = undefined;

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentCreated);
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentCreated);

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.action is not 'created' and eventType is IssueCommentCreated", async () => {
        // Set up event
        const event = eventIssue as IssueCommentCreatedEvent;
        // @ts-ignore
        event.action = "edited";

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentCreated);
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentCreated
        );

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.pull_request is null and eventType is IssueCommentEdited", async () => {
        // Set up event
        const event = eventIssue as unknown as IssueCommentEditedEvent;
        // @ts-ignore
        event.issue.pull_request = undefined;

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentEdited);
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentEdited
        );

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.action is not 'edited' and eventType is IssueCommentEdited", async () => {
        // Set up event
        // @ts-ignore
        const event = eventIssue as IssueCommentCreatedEdited;
        // @ts-ignore
        event.action = "created";

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentEdited);
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentEdited
        );

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("retrieves the pull request information from the graphql call", async () => {
        const expectedValues = {
            repository: {
                pullRequest: {
                    baseRefName: "master",
                    baseRefOid: "ThisIsSomeRandomOID12345",
                    headRefName: "new-feature-branch",
                    headRefOid: "ThisIsAlsoARandomOID12345",
                    headRepository: {
                        name: "Fast-Forward-Blossom-Bot"
                    },
                    headRepositoryOwner: {
                        login: "luneisolei"
                    },
                    id: "MDQ6VXNlcjU4MzIzMQ=="
                }
            }
        }
        jest.mocked(octokit.graphql).mockResolvedValue(expectedValues);

        subject.SetEvent(eventIssue, ActionEventType.IssueCommentCreated);
        await subject.FinishInitialization(
            octokit,
            eventIssue,
            ActionEventType.IssueCommentCreated
        );

        expect(subject.BaseRef).toEqual(expectedValues.repository.pullRequest.baseRefName);
        expect(subject.BaseSha).toEqual(expectedValues.repository.pullRequest.baseRefOid);
        expect(subject.HeadRef).toEqual(expectedValues.repository.pullRequest.headRefName);
        expect(subject.HeadSha).toEqual(expectedValues.repository.pullRequest.headRefOid);
        expect(subject.HeadOwner).toEqual(expectedValues.repository.pullRequest.headRepositoryOwner.login);
        expect(subject.HeadLabel).toEqual(
            expectedValues.repository.pullRequest.headRepositoryOwner.login + "/" +
            expectedValues.repository.pullRequest.headRefName
        );
        expect(subject.HeadRepo).toEqual(expectedValues.repository.pullRequest.headRepository.name);
        expect(subject.NodeId).toEqual(expectedValues.repository.pullRequest.id);
        expect(subject.MergeBaseSha).toBeNull();
        expect(subject.MergeBaseParentsAmount).toEqual(0);
    });
});