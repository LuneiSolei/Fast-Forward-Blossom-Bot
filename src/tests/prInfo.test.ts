import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
import TestFixtures from "./testFixtures.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";

let subject: IPrInfo,
    prInfo: typeof TestFixtures.ConcretePrInfo,
    mockApiCaller: IApiCaller,
    event: ActionEvent;

function failsToParseExpects(event: IssueCommentCreatedEvent | IssueCommentEditedEvent) {
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

// For each event type
describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return TestFixtures.PullRequestOpenedEventPath }},
    { eventType: ActionEventType.IssueCommentCreated, get eventPath() { return TestFixtures.IssueCommentCreatedEventPath }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return TestFixtures.IssueCommentEditedEventPath }}
])("when event type is $eventType", (describeRow) => {
    beforeEach(() => {
        prInfo = TestFixtures.ConcretePrInfo;
        subject = new prInfo();
        mockApiCaller = TestFixtures.CreateMockApiCaller();
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
    });

    switch (describeRow.eventType)
    {
        case ActionEventType.PullRequestOpened:
            test("parses properties correctly", () => {
                event = event as PullRequestOpenedEvent;
                subject.SetEvent(event, ActionEventType.PullRequestOpened);

                expect(subject.BaseRef).toEqual(event.pull_request.base.ref);
                expect(subject.BaseSha).toEqual(event.pull_request.base.sha);
                expect(subject.HeadRef).toEqual(event.pull_request.head.ref);
                expect(subject.HeadSha).toEqual(event.pull_request.head.sha);
                expect(subject.HeadLabel).toEqual(event.pull_request.head.label);
                expect(subject.HeadOwner).toEqual(event.pull_request.head.repo?.owner.login);
            });

            describe("SetEvent()", () => {
                test("handles undefined HeadRepo", async () => {
                    event = event as PullRequestOpenedEvent;
                    // @ts-ignore
                    event.pull_request.head.repo.name = undefined;
                    subject.SetEvent(event, describeRow.eventType);

                    expect(subject.HeadRepo).toEqual(event.repository.name);
                });

                test("handles undefined HeadOwner", async () => {
                    event = event as PullRequestOpenedEvent;
                    // @ts-ignore
                    event.pull_request.head.repo.owner.login = undefined;
                    subject.SetEvent(event, describeRow.eventType);

                    expect(subject.HeadOwner).toEqual(event.repository.owner.login);
                });
            });

            break;
        case ActionEventType.IssueCommentCreated:
            test("fails to parse properties correctly", () => {
                event = event as IssueCommentCreatedEvent;
                failsToParseExpects(event);
            });

            break;
        case ActionEventType.IssueCommentEdited:
            test("fails to parse properties correctly", () => {
                event = event as IssueCommentEditedEvent;
                failsToParseExpects(event);
            });
    }

    describe("FinishInitialization()", () => {
        async function commonPullRequestRetrieval()
        {
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

            subject.SetEvent(event, ActionEventType.IssueCommentCreated);
            await subject.FinishInitialization(
                newApiCaller,
                event,
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
            expect(subject.IssueNumber).toBeDefined();
        }
            switch (describeRow.eventType)
            {
                case ActionEventType.PullRequestOpened:
                    test("returns early", async () => {
                        // Parse event
                        subject.SetEvent(event, describeRow.eventType);
                        await subject.FinishInitialization(
                            mockApiCaller,
                            event,
                            describeRow.eventType);

                        if (describeRow.eventType === ActionEventType.PullRequestOpened)
                        {
                            expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
                        } else {
                            expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).toHaveBeenCalled();
                        }
                    });

                    break;
                case ActionEventType.IssueCommentCreated:
                    test("returns early when pull_request is empty", async() =>
                    {
                        event = event as IssueCommentCreatedEvent;
                        event.issue.pull_request = {};

                        subject.SetEvent(event, ActionEventType.IssueCommentCreated);
                        await subject.FinishInitialization(
                            mockApiCaller,
                            event,
                            ActionEventType.IssueCommentCreated
                        );

                        expect((mockApiCaller as any)._octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
                    });

                    test("retrieves the pull request information", async () => {
                        await commonPullRequestRetrieval();
                    });

                    break;
                case ActionEventType.IssueCommentEdited:
                    test("returns early when pull_request is empty and eventType is IssueCommentEdited", async () => {
                        event = event as IssueCommentEditedEvent;
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

                    test("retrieves the pull request information", async () => {
                        await commonPullRequestRetrieval();
                    });
            }
    });

    test("returns MergeBaseSha if already set", async () => {
        (subject as any)._mergeBaseSha = "abc1234";

        expect(subject.MergeBaseSha).toEqual("abc1234");
    });

    test("returns MergeBaseParentsAmount if already set", async () => {
        (subject as any)._mergeBaseParentsAmount = "102983";

        expect(subject.MergeBaseParentsAmount).toEqual("102983");
    });

    test("throws if IssueNumber is undefined", async() => {
        expect(() => subject.IssueNumber).toThrow(UnknownReferenceError);
    })
});