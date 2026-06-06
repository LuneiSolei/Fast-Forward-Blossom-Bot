import {beforeAll, beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IActionInfo from "../../core/actionInfo/IActionInfo.js";
import TestFixtures from "./testFixtures.js";
import {ActionEventType} from "../../core/actionEvent/actionEventType.js";
import type {IGraphQlNodeIdResponse} from "../../core/githubApi/IGraphQlNodeIdResponse.js";
import UnknownReferenceError from "../../core/errors/unknownReferenceError.js";

let subject: IActionInfo,
    factory: typeof TestFixtures.ConcreteActionInfoFactory;

describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return TestFixtures.PullRequestOpenedEventPath }},
    { eventType: ActionEventType.IssueCommentCreated, get eventPath() { return TestFixtures.IssueCommentCreatedEventPath }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return TestFixtures.IssueCommentEditedEventPath }}
])("when event type is $eventType", (describeRow) => {
    beforeEach(() => {
        process.env["GITHUB_EVENT_PATH"] = describeRow.eventPath;
        factory = TestFixtures.ConcreteActionInfoFactory;
    });

    describe("Create()", () => {
        test("uses premade instances to return an instance of IActionInfo", async () => {
            await expect(async () => await factory.Create(
                TestFixtures.CreateMockPrInfo(),
                TestFixtures.CreateMockOptions(),
                TestFixtures.CreateMockEventInfo(),
                TestFixtures.CreateMockRepoInfo(),
                TestFixtures.CreateMockApiCaller(),
                TestFixtures.CreateMockOctokit()
            )).resolves.not.toThrow();
        });

        test("uses constructors to create an instance of IActionInfo", async () => {
            const mockNodeIdResponse = {
                repository: {
                    ref: {
                        id: "mock-node-id"
                    }
                }
            } as IGraphQlNodeIdResponse;

            let mockOctokit;
            if (describeRow.eventType === ActionEventType.PullRequestOpened)
            {
                mockOctokit = {
                    graphql: jest.fn()
                        // @ts-ignore
                        .mockResolvedValueOnce(mockNodeIdResponse)

                        // @ts-ignore
                        .mockResolvedValueOnce(mockNodeIdResponse)

                        // @ts-ignore
                        .mockResolvedValueOnce(TestFixtures.CreateMockPullRequestResponse())
                }
            } else {
                    mockOctokit = {
                        graphql: jest.fn()
                            // @ts-ignore
                            .mockResolvedValueOnce(TestFixtures.CreateMockPullRequestResponse())

                            // @ts-ignore
                            .mockResolvedValueOnce(mockNodeIdResponse)

                            // @ts-ignore
                            .mockResolvedValueOnce(mockNodeIdResponse)
                    }
            }

            await expect(async () => await factory.Create(
                TestFixtures.ConcretePrInfo,
                TestFixtures.ConcreteOptions,
                TestFixtures.ConcreteEventInfo,
                TestFixtures.ConcreteRepoInfo,
                TestFixtures.ConcreteApiCaller,

                // @ts-ignore
                TestFixtures.CreateMockOctokit(mockOctokit)
            )).resolves.not.toThrow();
        });

        test("throws when GITHUB_EVENT_PATH is not set", async () => {
            delete process.env["GITHUB_EVENT_PATH"];
            await expect(async () => await factory.Create(
                TestFixtures.CreateMockPrInfo(),
                TestFixtures.CreateMockOptions(),
                TestFixtures.CreateMockEventInfo(),
                TestFixtures.CreateMockRepoInfo(),
                TestFixtures.CreateMockApiCaller(),
                TestFixtures.CreateMockOctokit()
            )).rejects.toThrow(UnknownReferenceError);

            process.env["GITHUB_EVENT_PATH"] = describeRow.eventPath;
        });
    });

    describe("Create()", () => {
        beforeAll(async () => {
            subject = await factory.Create(
                TestFixtures.CreateMockPrInfo(),
                TestFixtures.CreateMockOptions(),
                TestFixtures.CreateMockEventInfo(),
                TestFixtures.CreateMockRepoInfo(),
                TestFixtures.CreateMockApiCaller(),
                TestFixtures.CreateMockOctokit()
            );
        });

        test.each([
            { label: "ApiCaller", get property() { return subject.ApiCaller }},
            { label: "RepoInfo", get property() { return subject.Repo }},
            { label: "Options", get property() { return subject.Options }},
            { label: "EventInfo", get property() { return subject.Event }}
        ])("gets $label", ({ property }) => {
            expect(property).toBeDefined();
        });
    })
});