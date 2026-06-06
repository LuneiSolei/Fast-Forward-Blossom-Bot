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

let subject: IPrInfo,
    prInfo: typeof TestFixtures.ConcretePrInfo,
    event: ActionEvent,
    mockApiCaller: IApiCaller,
    mockPr: IGraphQlPrResponse["repository"]["pullRequest"];

// For each event type...
describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return TestFixtures.PullRequestOpenedEventPath; }},
    { eventType: ActionEventType.IssueCommentCreated, get eventPath() { return TestFixtures.IssueCommentCreatedEventPath; }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return TestFixtures.IssueCommentEditedEventPath; }}
])("when event type is $eventType", (describeRow) => {
    beforeEach(async () => {
        prInfo = TestFixtures.ConcretePrInfo;
        subject = new prInfo();
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
    });

    describe("SetEvent()", () => {
        beforeEach(() => {
            subject.SetEvent(event, describeRow.eventType);
        });

        if (describeRow.eventType === ActionEventType.PullRequestOpened)
        {
            event = event as PullRequestOpenedEvent;
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
            ])("sets property $propertyName successfully", ({property, expected}) => {
                expect(property).toBe(expected)
            });
        } else {
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
                }
            ])("does not set $propertyName", (testRow) => {
                expect(() => testRow.property).toThrow(UnknownReferenceError);
            });
        }
    });

    describe("FinishInitialization()", () => {
        if (describeRow.eventType === ActionEventType.PullRequestOpened)
        {
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
                subject.SetEvent(event, describeRow.eventType);
                await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);
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
        } else {
            const mockGetNodeIdResponse = {
                repository: {
                    ref: {
                        id: "mock-node-id"
                    }
                }
            } as IGraphQlNodeIdResponse

            beforeEach(async () => {
                mockApiCaller = TestFixtures.CreateMockApiCaller({
                    // @ts-ignore
                    graphql: jest.fn()
                        // @ts-ignore
                        .mockResolvedValueOnce(TestFixtures.CreateMockPullRequestResponse())

                        // @ts-ignore
                        .mockResolvedValueOnce(mockGetNodeIdResponse)

                        // @ts-ignore
                        .mockResolvedValueOnce(mockGetNodeIdResponse)
                });
                subject.SetEvent(event, describeRow.eventType);
                await subject.FinishInitialization(mockApiCaller, event, describeRow.eventType);
                mockPr = TestFixtures.CreateMockPullRequestResponse().repository.pullRequest;
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
                    get expected() { return mockGetNodeIdResponse.repository.ref.id }
                },
                {
                    propertyName: "HeadNodeId",
                    get property() { return subject.HeadNodeId },
                    get expected() { return mockGetNodeIdResponse.repository.ref.id }
                }
            ])("sets property $propertyName successfully", (testRow) => {
                expect(testRow.property).toBe(testRow.expected)
            });
        }
    });
});