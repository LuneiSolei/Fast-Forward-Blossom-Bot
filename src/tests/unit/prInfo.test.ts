import {ActionEventType} from "../../core/actionEvent/actionEventType.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import TestFixtures from "./testFixtures.js";
import type IPrInfo from "../../core/actionInfo/IPrInfo.js";
import type {ActionEvent} from "../../core/actionEvent/actionEvent.js";
import type {PullRequestOpenedEvent} from "@octokit/webhooks-types";
import type IApiCaller from "../../core/actionInfo/IApiCaller.js";
import UnknownReferenceError from "../../core/errors/unknownReferenceError.js";
import type {IGraphQlPrResponse} from "../../core/githubApi/IGraphQlPrResponse.js";
import type {IGraphQlNodeIdResponse} from "../../core/githubApi/IGraphQlNodeIdResponse.js";
import Git from "../../core/git/git.js";

let subject: IPrInfo,
    prInfo: typeof TestFixtures.ConcretePrInfo,
    event: ActionEvent,
    mockApiCaller: IApiCaller,
    mockPr: IGraphQlPrResponse["repository"]["pullRequest"],
    mockNodeIdResponse: IGraphQlNodeIdResponse;

// For PullRequestOpenedEvent
describe("when event type is PullRequestOpened", () => {
    beforeEach(() => {
        prInfo = TestFixtures.ConcretePrInfo;
        subject = new prInfo();
        event = TestFixtures.ParseEventFile(TestFixtures.PullRequestOpenedEventPath);
        subject.SetEvent(event, ActionEventType.PullRequestOpened);
    });

    // ...test SetEvent()
    describe("SetEvent()", () => {
        test.each([
            {
                propertyName: "BaseRef",
                get property() { return subject.BaseRef },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.base.ref }
            },
            {
                propertyName: "BaseSha",
                get property() { return subject.BaseSha },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.base.sha }
            },
            {
                propertyName: "HeadRef",
                get property() { return subject.HeadRef },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.head.ref }
            },
            {
                propertyName: "HeadSha",
                get property() { return subject.HeadSha },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.head.sha }
            },
            {
                propertyName: "HeadOwner",
                get property() { return subject.HeadOwner },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.head.repo?.owner.login }
            },
            {
                propertyName: "HeadLabel",
                get property() { return subject.HeadLabel },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.head.label }
            },
            {
                propertyName: "HeadRepo",
                get property() { return subject.HeadRepo },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.head.repo?.name }
            },
            {
                propertyName: "PrNodeId",
                get property() { return subject.PrNodeId },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.node_id }
            },
            {
                propertyName: "IssueNumber",
                get property() { return subject.IssueNumber },
                get expected() { return (event as PullRequestOpenedEvent).pull_request.number }
            }
        ])("SetEvent() property $propertyName successfully", ({property, expected}) => {
            expect(property).toBe(expected)
        });

        test("uses fallback value for property HeadOwner", async () => {
            subject = new prInfo();
            event = TestFixtures.ParseEventFile(TestFixtures.PullRequestOpenedEventPath) as PullRequestOpenedEvent;
            event.pull_request.head.repo = null
            subject.SetEvent(event, ActionEventType.PullRequestOpened);

            expect(subject.HeadOwner).toEqual(event.repository.owner.login);
        });

        test("uses fallback value for property HeadRepo", async () => {
            subject = new prInfo();
            event = TestFixtures.ParseEventFile(TestFixtures.PullRequestOpenedEventPath) as PullRequestOpenedEvent;
            event.pull_request.head.repo = null
            subject.SetEvent(event, ActionEventType.PullRequestOpened);

            expect(subject.HeadRepo).toEqual(event.repository.name);
        });
    });

    // ...test FinishInitialization()
    describe("FinishInitialization()", () => {
        const expectedNodeId = {
            repository: {
                ref: {
                    id: "mock-node-id"
                }
            }
        };

        beforeEach(async () => {
            mockApiCaller = TestFixtures.CreateMockApiCaller({
                // @ts-ignore
                graphql: jest.fn().mockResolvedValue(expectedNodeId)
            });
            subject.SetEvent(event, ActionEventType.PullRequestOpened);
            await subject.FinishInitialization(mockApiCaller, event, ActionEventType.PullRequestOpened);
        });

        event = event as PullRequestOpenedEvent;
        test.each([
            {
                propertyName: "BaseNodeId",
                get property() { return subject.BaseNodeId }
            },
            {
                propertyName: "HeadNodeId",
                get property() { return subject.HeadNodeId }
            }
        ])("sets property $propertyName successfully", ({ property }) => {
            expect(property).toBe(expectedNodeId.repository.ref.id)
        });
    });
});

// For other event types...
describe.each([
    { eventType: ActionEventType.IssueCommentCreated, get eventPath() { return TestFixtures.IssueCommentCreatedEventPath; }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return TestFixtures.IssueCommentEditedEventPath; }}
])("when event type is $eventType", (describeRow) => {
    beforeEach(async () => {
        mockNodeIdResponse = TestFixtures.CreateMockNodeIdResponse();

        mockApiCaller = TestFixtures.CreateMockApiCaller({
            // @ts-ignore
            graphql: jest.fn()
                // @ts-ignore
                .mockResolvedValueOnce(TestFixtures.CreateMockPullRequestResponse())

                // @ts-ignore
                .mockResolvedValueOnce(mockNodeIdResponse)

                // @ts-ignore
                .mockResolvedValueOnce(mockNodeIdResponse)
        });
        prInfo = TestFixtures.ConcretePrInfo;
        subject = new prInfo();
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
    });

    // ...test SetEvent()
    describe("SetEvent()", () => {
        beforeEach(() => {
            subject.SetEvent(event, describeRow.eventType);
        });

        test.each([
            {
                propertyName: "BaseRef",
                get property() { return subject.BaseRef }
            },
            {
                propertyName: "BaseSha",
                get property() { return subject.BaseSha }
            },
            {
                propertyName: "HeadRef",
                get property() { return subject.HeadRef }
            },
            {
                propertyName: "HeadSha",
                get property() { return subject.HeadSha }
            },
            {
                propertyName: "HeadOwner",
                get property() { return subject.HeadOwner }
            },
            {
                propertyName: "HeadLabel",
                get property() { return subject.HeadLabel }
            },
            {
                propertyName: "HeadRepo",
                get property() { return subject.HeadRepo }
            },
            {
                propertyName: "PrNodeId",
                get property() { return subject.PrNodeId }
            },
            {
                propertyName: "IssueNumber",
                get property() { return subject.IssueNumber }
            },
            {
                propertyName: "BaseNodeId",
                get property() { return subject.BaseNodeId }
            },
            {
                propertyName: "HeadNodeId",
                get property() { return subject.HeadNodeId }
            }
        ])("does not set $propertyName", (testRow) => {
            expect(() => testRow.property).toThrow(UnknownReferenceError);
        });
    });

    describe("FinishInitialization()", () => {
        beforeEach(async () => {
            subject.SetEvent(event, describeRow.eventType);
            await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);
            mockPr = TestFixtures.CreateMockPullRequestResponse().repository.pullRequest;
        });

        test("skips when pull_request is null", async () => {
            subject = new prInfo();
            event = TestFixtures.ParseEventFile(describeRow.eventPath);
            (event as any).issue.pull_request = null;
            subject.SetEvent(event, describeRow.eventType);
            await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);

            expect((subject as any)._baseRef).toBeUndefined();
        });

        test("skips when pull_request is empty", async () => {
            subject = new prInfo();
            event = TestFixtures.ParseEventFile(describeRow.eventPath);
            (event as any).issue.pull_request = {};
            subject.SetEvent(event, describeRow.eventType);
            await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);

            expect((subject as any)._baseRef).toBeUndefined();
        });

        test("skips when pull_request is undefined", async () => {
            subject = new prInfo();
            event = TestFixtures.ParseEventFile(describeRow.eventPath);
            (event as any).issue.pull_request = undefined;
            subject.SetEvent(event, describeRow.eventType);
            await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);

            expect((subject as any)._baseRef).toBeUndefined();
        });

        test.each([
            {
                propertyName: "BaseRef",
                get property() { return subject.BaseRef },
                get expected() { return mockPr.baseRefName }
            },
            {
                propertyName: "BaseSha",
                get property() { return subject.BaseSha },
                get expected() { return mockPr.baseRefOid }
            },
            {
                propertyName: "HeadRef",
                get property() { return subject.HeadRef },
                get expected() { return mockPr.headRefName }
            },
            {
                propertyName: "HeadSha",
                get property() { return subject.HeadSha },
                get expected() { return mockPr.headRefOid }
            },
            {
                propertyName: "HeadOwner",
                get property() { return subject.HeadOwner },
                get expected() { return mockPr.headRepositoryOwner.login }
            },
            {
                propertyName: "HeadLabel",
                get property() { return subject.HeadLabel },
                get expected() {
                    return `${mockPr.headRepositoryOwner.login}` +
                           `/${mockPr.headRefName}` }
            },
            {
                propertyName: "PrNodeId",
                get property() { return subject.PrNodeId },
                get expected() { return mockPr.id }
            },
            {
                propertyName: "HeadRepo",
                get property() { return subject.HeadRepo },
                get expected() { return mockPr.headRepository.name }
            },
            {
                propertyName: "BaseNodeId",
                get property() { return subject.BaseNodeId },
                get expected() { return mockNodeIdResponse.repository.ref.id }
            },
            {
                propertyName: "HeadNodeId",
                get property() { return subject.HeadNodeId },
                get expected() { return mockNodeIdResponse.repository.ref.id }
            }
        ])("sets property $propertyName successfully", (testRow) => {
            expect(testRow.property).toBe(testRow.expected)
        });
    });

    test("MergeBaseSha getter returns a commit sha representing the merge base commit", async () => {
        jest.spyOn(Git, "GetMergeBaseSha").mockReturnValue("abc123");

        subject.SetEvent(event, describeRow.eventType);
        await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);
        let result = subject.MergeBaseSha;

        expect(Git.GetMergeBaseSha).toHaveBeenCalled();
        expect(result).toEqual("abc123");

        result = subject.MergeBaseSha; // Call again to take if branch

        expect(result).toEqual("abc123");
    });

    test("MergeBaseParentsAmount getter returns the correct number of parent commits", async () => {
        jest.spyOn(Git, "GetAmountOfParents").mockReturnValue(2);
        subject.SetEvent(event, describeRow.eventType);
        await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);
        let result = subject.MergeBaseParentsAmount;

        expect(Git.GetAmountOfParents).toHaveBeenCalled();
        expect(result).toEqual(2);

        result = subject.MergeBaseParentsAmount; // Call again to take if branch

        expect(result).toEqual(2);
    });

    test("when MergeBaseSha is an empty string, MergeBaseAmountOfParents is 0", async () => {
        jest.spyOn(Git, "GetMergeBaseSha").mockReturnValue("");
        subject.SetEvent(event, describeRow.eventType);
        await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);
        const shaResult = subject.MergeBaseSha;
        const parentsResult = subject.MergeBaseParentsAmount;

        expect(shaResult).toEqual("");
        expect(parentsResult).toEqual(0);
    });
});