import PrInfo from "../implements/prInfo.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
import TestFixtures from "./testFixtures.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";

let subject: IPrInfo,
    mockApiCaller: IApiCaller,
    pullRequestOpenedEvent: PullRequestOpenedEvent,
    issueCommentCreatedEvent: IssueCommentCreatedEvent,
    issueCommentEditedEvent: IssueCommentEditedEvent;

beforeEach(() => {
    subject = new PrInfo();
    mockApiCaller = TestFixtures.CreateMockApiCaller();
    const pullRequestOpenedEventPath = TestFixtures.PullRequestOpenedEventPath,
        issueCommentCreatedEventPath = TestFixtures.IssueCommentCreatedEventPath,
        issueCommentEditedEventPath = TestFixtures.IssueCommentEditedEventPath;

    pullRequestOpenedEvent = TestFixtures.ParseEventFile(pullRequestOpenedEventPath) as PullRequestOpenedEvent,
    issueCommentCreatedEvent = TestFixtures.ParseEventFile(issueCommentCreatedEventPath) as IssueCommentCreatedEvent,
    issueCommentEditedEvent = TestFixtures.ParseEventFile(issueCommentEditedEventPath) as IssueCommentEditedEvent;
});

describe("SetEvent()", () => {
    beforeEach(async () => {
        subject = new PrInfo();
    });

    function commonEvent(event: IssueCommentCreatedEvent | IssueCommentEditedEvent) {
        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentCreated);

        expect(() => subject.BaseRef).toThrow(UnknownReferenceError);
        expect(() => subject.BaseSha).toThrow(UnknownReferenceError);
        expect(() => subject.HeadRef).toThrow(UnknownReferenceError);
        expect(() => subject.HeadSha).toThrow(UnknownReferenceError);
        expect(() => subject.HeadLabel).toThrow(UnknownReferenceError);
        expect(() => subject.HeadRepo).toThrow(UnknownReferenceError);
        expect(() => subject.HeadOwner).toThrow(UnknownReferenceError);
        expect(() => subject.NodeId).toThrow(UnknownReferenceError);
    }

    test("fails to parse event properties when eventType is IssueCommentCreated", async () => {
        // Create mock issue comment created event
        commonEvent(issueCommentCreatedEvent);
    });

    test("fails to parse event properties when eventType is IssueCommentEdited", async () => {
        // Create mock issue comment edited event
        commonEvent(issueCommentEditedEvent);
    });

    test("sets properties when eventType is PullRequestOpened", async () => {
        // Create mock pull request event
        const event = pullRequestOpenedEvent;
        subject.SetEvent(event, ActionEventType.PullRequestOpened);

        expect(subject.BaseRef).toEqual(event.pull_request.base.ref);
        expect(subject.BaseSha).toEqual(event.pull_request.base.sha);
        expect(subject.HeadRef).toEqual(event.pull_request.head.ref);
        expect(subject.HeadSha).toEqual(event.pull_request.head.sha);
        expect(subject.HeadLabel).toEqual(event.pull_request.head.label);
        expect(subject.HeadOwner).toEqual(event.pull_request.head.repo?.owner.login);
    });

    test("handles undefined head repo", async () => {
        // Create mock pull request event
        const event = pullRequestOpenedEvent;
        subject.SetEvent(event, ActionEventType.PullRequestOpened);

        expect(subject.HeadOwner).toEqual(event.repository.owner.login);
        expect(subject.HeadRepo).toEqual(event.repository.name);
    });
});

describe("FinishInitialization()", () => {
    test("returns early when eventType is PullRequestOpened", async () => {
        // Parse event
        const event = pullRequestOpenedEvent;
        subject.SetEvent(event, ActionEventType.PullRequestOpened);
        await subject.FinishInitialization(
            mockApiCaller,
            event,
            ActionEventType.PullRequestOpened);

        expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when pull_request is null and eventType is IssueCommentCreated", async () => {
        // Set up event
        const event = issueCommentCreatedEvent;
        // @ts-ignore
        event.issue.pull_request = null;

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentCreated);
        await subject.FinishInitialization(
            mockApiCaller,
            event,
            ActionEventType.IssueCommentCreated);

        expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when pull_request is empty and eventType is IssueCommentCreated", async () => {
        // Set up event
        const event = issueCommentCreatedEvent;
        event.issue.pull_request = {};

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentCreated);
        await subject.FinishInitialization(
            mockApiCaller,
            event,
            ActionEventType.IssueCommentCreated
        );

        expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.pull_request is null and eventType is IssueCommentEdited", async () => {
        // Set up event
        const event = issueCommentEditedEvent;
        // @ts-ignore
        event.issue.pull_request = null;

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentEdited);
        await subject.FinishInitialization(
            mockApiCaller,
            event,
            ActionEventType.IssueCommentEdited
        );

        expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when pull_request is empty and eventType is IssueCommentEdited", async () => {
        // Set up event
        const event = issueCommentEditedEvent;
        // @ts-ignore
        event.issue.pull_request = {};

        // Parse event
        subject.SetEvent(event, ActionEventType.IssueCommentEdited);
        await subject.FinishInitialization(
            mockApiCaller,
            event,
            ActionEventType.IssueCommentEdited
        );

        expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("retrieves the pull request information when event type is IssueCommentCreated", async () => {
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
        const newApiCaller = TestFixtures.CreateMockApiCaller({
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue(expectedValues)
        });

        subject.SetEvent(issueCommentCreatedEvent, ActionEventType.IssueCommentCreated);
        await subject.FinishInitialization(
            newApiCaller,
            issueCommentCreatedEvent,
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

    test("retrieves the pull request information when event type is IssueCommentEdited", async () => {
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
        const newApiCaller = TestFixtures.CreateMockApiCaller({
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue(expectedValues)
        });

        subject.SetEvent(issueCommentEditedEvent, ActionEventType.IssueCommentEdited);
        await subject.FinishInitialization(
            newApiCaller,
            issueCommentEditedEvent,
            ActionEventType.IssueCommentEdited
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

describe("Uncovered Branches", () => {
    beforeEach(() => {
        subject = new PrInfo();
        subject.SetEvent(pullRequestOpenedEvent, ActionEventType.PullRequestOpened);
        subject.FinishInitialization(mockApiCaller, pullRequestOpenedEvent, ActionEventType.PullRequestOpened);
    });

    test("returns MergeBaseSha if already set", async () => {
        (subject as any)._mergeBaseSha = "abc1234";

        expect(subject.MergeBaseSha).toEqual("abc1234");
    });

    test("returns MergeBaseParentsAmount if already set", async () => {
        (subject as any)._mergeBaseParentsAmount = "102983";

        expect(subject.MergeBaseParentsAmount).toEqual("102983");
    });
});