import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
import TestFixtures from "./testFixtures.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";

let subject: IPrInfo,
    mockApiCaller: IApiCaller,
    event: ActionEvent;

async function assertPullRequestRetrievedViaGraphql(subject: IPrInfo, event: ActionEvent, eventType: ActionEventType) {
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
    };
    const newApiCaller = TestFixtures.CreateMockApiCaller({
        // @ts-ignore
        graphql: jest.fn().mockResolvedValue(expectedValues)
    });

    subject.SetEvent(event, eventType);
    await subject.FinishInitialization(newApiCaller, event, eventType);

    const pr = expectedValues.repository.pullRequest;
    expect(subject.BaseRef).toEqual(pr.baseRefName);
    expect(subject.BaseSha).toEqual(pr.baseRefOid);
    expect(subject.HeadRef).toEqual(pr.headRefName);
    expect(subject.HeadSha).toEqual(pr.headRefOid);
    expect(subject.HeadOwner).toEqual(pr.headRepositoryOwner.login);
    expect(subject.HeadLabel).toEqual(pr.headRepositoryOwner.login + "/" + pr.headRefName);
    expect(subject.HeadRepo).toEqual(pr.headRepository.name);
    expect(subject.NodeId).toEqual(pr.id);
    expect(subject.MergeBaseSha).toBeNull();
    expect(subject.MergeBaseParentsAmount).toEqual(0);
    expect(subject.IssueNumber).toBeDefined();
}

// For each event type...
describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return TestFixtures.PullRequestOpenedEventPath; }},
    { eventType: ActionEventType.IssueCommentCreated, get eventPath() { return TestFixtures.IssueCommentCreatedEventPath; }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return TestFixtures.IssueCommentEditedEventPath; }}
])("when event type is $eventType", (describeRow) => {

    beforeEach(() => {
        const prInfo = TestFixtures.ConcretePrInfo;
        subject = new prInfo();
        mockApiCaller = TestFixtures.CreateMockApiCaller();
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
    });

    // ...test SetEvent()
    describe("SetEvent()", () => {
        test("throws UnknownReferenceError for all PR ref properties when event has no PR data", () => {
            if (describeRow.eventType === ActionEventType.PullRequestOpened) return;

            subject.SetEvent(event as IssueCommentCreatedEvent | IssueCommentEditedEvent, describeRow.eventType);

            expect(() => subject.BaseRef).toThrow(UnknownReferenceError);
            expect(() => subject.BaseSha).toThrow(UnknownReferenceError);
            expect(() => subject.HeadRef).toThrow(UnknownReferenceError);
            expect(() => subject.HeadSha).toThrow(UnknownReferenceError);
            expect(() => subject.HeadLabel).toThrow(UnknownReferenceError);
            expect(() => subject.HeadRepo).toThrow(UnknownReferenceError);
            expect(() => subject.HeadOwner).toThrow(UnknownReferenceError);
            expect(() => subject.NodeId).toThrow(UnknownReferenceError);
        });

        test("parses PR ref properties correctly when event carries PR data directly", () => {
            if (describeRow.eventType !== ActionEventType.PullRequestOpened) return;

            event = event as PullRequestOpenedEvent;
            subject.SetEvent(event, ActionEventType.PullRequestOpened);

            expect(subject.BaseRef).toEqual(event.pull_request.base.ref);
            expect(subject.BaseSha).toEqual(event.pull_request.base.sha);
            expect(subject.HeadRef).toEqual(event.pull_request.head.ref);
            expect(subject.HeadSha).toEqual(event.pull_request.head.sha);
            expect(subject.HeadLabel).toEqual(event.pull_request.head.label);
            expect(subject.HeadOwner).toEqual(event.pull_request.head.repo?.owner.login);
        });

        test("falls back to repository name when HeadRepo is undefined", () => {
            if (describeRow.eventType !== ActionEventType.PullRequestOpened) return;

            event = event as PullRequestOpenedEvent;
            // @ts-ignore
            event.pull_request.head.repo.name = undefined;
            subject.SetEvent(event, describeRow.eventType);

            expect(subject.HeadRepo).toEqual(event.repository.name);
        });

        test("falls back to repository owner when HeadOwner is undefined", () => {
            if (describeRow.eventType !== ActionEventType.PullRequestOpened) return;

            event = event as PullRequestOpenedEvent;
            // @ts-ignore
            event.pull_request.head.repo.owner.login = undefined;
            subject.SetEvent(event, describeRow.eventType);

            expect(subject.HeadOwner).toEqual(event.repository.owner.login);
        });
    });

    // ...test FinishInitialization()
    describe("FinishInitialization()", () => {
        test("returns early without calling graphql when event carries PR data directly", async () => {
            if (describeRow.eventType !== ActionEventType.PullRequestOpened) return;

            subject.SetEvent(event, describeRow.eventType);
            await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);

            expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
        });

        test("returns early without calling graphql when pull_request is empty", async () => {
            if (describeRow.eventType === ActionEventType.PullRequestOpened) return;

            (event as IssueCommentCreatedEvent | IssueCommentEditedEvent).issue.pull_request = {};

            subject.SetEvent(event, describeRow.eventType);
            await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);

            expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
        });

        test("retrieves the pull request information via graphql", async () => {
            if (describeRow.eventType === ActionEventType.PullRequestOpened) return;

            await assertPullRequestRetrievedViaGraphql(subject, event, describeRow.eventType);
        });
    });

    // ...test MergeBaseSha and MergeBaseParentsAmount
    test("returns MergeBaseSha if already set", () => {
        (subject as any)._mergeBaseSha = "abc1234";

        expect(subject.MergeBaseSha).toEqual("abc1234");
    });

    test("returns MergeBaseParentsAmount if already set", () => {
        (subject as any)._mergeBaseParentsAmount = 102983;

        expect(subject.MergeBaseParentsAmount).toEqual(102983);
    });

    test("throws UnknownReferenceError if IssueNumber is not set", () => {
        expect(() => subject.IssueNumber).toThrow(UnknownReferenceError);
    });
});