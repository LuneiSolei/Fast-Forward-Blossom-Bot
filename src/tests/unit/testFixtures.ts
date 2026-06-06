import {jest} from "@jest/globals";
import type IPrInfo from "../../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../../core/actionInfo/IRepoInfo.js";
import {ActionEventType} from "../../core/actionEvent/actionEventType.js";
import type IOptions from "../../core/actionInfo/IOptions.js";
import type IEventInfo from "../../core/actionInfo/IEventInfo.js";
import type IActionInfo from "../../core/actionInfo/IActionInfo.js";
import type {ActionEvent} from "../../core/actionEvent/actionEvent.js";
import fs from "node:fs";
import path from "path";
import type IApiCaller from "../../core/actionInfo/IApiCaller.js";
import ApiCaller from "../../implements/apiCaller.js";
import {Octokit} from "@octokit/core";
import CommentBuilder from "../../implements/commentBuilder.js";
import EventInfo from "../../implements/eventInfo.js";
import PrInfo from "../../implements/prInfo.js";
import ActionInfoFactory from "../../implements/actionInfoFactory.js";
import Options from "../../implements/options.js";
import RepoInfo from "../../implements/repoInfo.js";
import type ICommentBuilder from "../../core/ICommentBuilder.js";
import type {IGraphQlPrResponse} from "../../core/githubApi/IGraphQlPrResponse.js";

export default class TestFixtures
{
    public static InvalidEventPath = "./src/tests/events/invalid.txt";
    public static IncorrectEventPath = "./src/tests/events/incorrect.json";
    public static PullRequestOpenedEventPath = "./src/tests/events/pullRequestOpened.json";
    public static IssueCommentCreatedEventPath = "./src/tests/events/issueCommentCreated.json";
    public static IssueCommentEditedEventPath = "./src/tests/events/issueCommentEdited.json";

    public static ConcreteCommentBuilder = CommentBuilder;
    public static ConcreteEventInfo = EventInfo;
    public static ConcretePrInfo = PrInfo;
    public static ConcreteActionInfoFactory = ActionInfoFactory;
    public static ConcreteOptions = Options;
    public static ConcreteRepoInfo = RepoInfo;
    public static ConcreteApiCaller = ApiCaller;

    public static ParseEventFile(eventPath: string): ActionEvent
    {
        const raw = fs.readFileSync(path.resolve(eventPath), "utf8");
        return JSON.parse(raw);
    }

    public static CreateMockPullRequestResponse()
    {
        return {
            repository: {
                pullRequest: {
                    baseRefName: "mock-base-ref-name",
                        baseRefOid: "mock-base-ref-oid",
                        id: "mock-id",
                        headRepository: {
                        name: "mock-head-repo",
                    },
                    headRefOid: "mock-head-ref-oid",
                        headRefName: "mock-head-ref-name",
                        headRepositoryOwner: {
                        login: "mock-head-repo-owner"
                    }
                }
            }
        } as IGraphQlPrResponse;
    }

    public static CreateMockPrInfo(overrides?: Partial<IPrInfo>): IPrInfo
    {
        return {
            BaseNodeId: "mock-node-id",
            BaseRef: "master",
            BaseSha: "abc123",
            HeadNodeId: "mock-node-id",
            HeadRef: "feature-branch",
            HeadSha: "def456",
            HeadLabel: "luneisolei/Fast-Forward-Blossom-Bot",
            HeadOwner: "luneisolei",
            HeadRepo: "Fast-Forward-Blossom-Bot",
            MergeBaseSha: "ghi789",
            MergeBaseParentsAmount: 1,
            PrNodeId: "some node id",
            FinishInitialization: jest.fn() as any,
            SetEvent: jest.fn(),
            IssueNumber: 4,
            ...overrides
        }
    }

    public static CreateMockRepoInfo(overrides?: Partial<IRepoInfo>): IRepoInfo
    {
        return {
            Owner: "luneisolei",
            Name: "Fast-Forward-Blossom-Bot",
            CloneUrl: "some clone url",
            Pr: TestFixtures.CreateMockPrInfo(),
            ...overrides
        }
    }

    public static CreateMockEventInfo(overrides?: Partial<IEventInfo>): IEventInfo
    {
        return {
            ApiCaller: TestFixtures.CreateMockApiCaller(),
            User: "luneisolei",
            // @ts-ignore
            Event: {},
            EventType: ActionEventType.PullRequestOpened,
            CommandInvoked: true,
            CommentBody: "/fast-forward",
            GetUserHasPerms: jest.fn() as any,
            GetIsPossible: jest.fn() as any,
            ShouldExit: false,
            ...overrides
        }
    }

    public static CreateMockOptions(overrides?: Partial<IOptions>): IOptions
    {
        return {
            AutoMerge: true,
            PostComment: "always",
            CustomCommand: "/fast-forward",
            ...overrides
        }
    }

    public static CreateMockCommentBuilder(overrides?: Partial<IOptions>): ICommentBuilder
    {
        return {
            Build: async () => "Here's a default test comment!",
            ...overrides
        }
    }

    public static async CreateMockActionInfoFromEventPath(eventPath: string): Promise<IActionInfo>
    {
        const original = process.env["GITHUB_EVENT_PATH"];
        process.env["GITHUB_EVENT_PATH"] = eventPath;

        const actionInfo = await ActionInfoFactory.Create(
            this.CreateMockPrInfo({}),
            this.CreateMockOptions({}),
            this.CreateMockEventInfo({}),
            this.CreateMockRepoInfo({}),
            this.CreateMockApiCaller({}),
            this.CreateMockOctokit({})
        );
        process.env["GITHUB_EVENT_PATH"] = original;

        return actionInfo;
    }

    public static CreateMockActionInfo(overrides?: Partial<IActionInfo>): IActionInfo
    {
        return {
            ApiCaller: TestFixtures.CreateMockApiCaller(),
            Repo: TestFixtures.CreateMockRepoInfo(),
            Event: TestFixtures.CreateMockEventInfo(),
            Options: TestFixtures.CreateMockOptions(),
            ...overrides
        }
    }

    public static CreateMockApiCaller(overrides?: {
        graphql?: jest.MockedFunction<any>,
        request?: jest.MockedFunction<any>
    }): IApiCaller
    {
        const newOctokit = this.CreateMockOctokit(overrides)
        return new ApiCaller(newOctokit);
    }

    public static CreateMockOctokit(overrides?: {
        graphql?: jest.MockedFunction<any>,
        request?: jest.MockedFunction<any>
    }): Octokit
    {
        // @ts-ignore
        return {
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue({}),

            // @ts-ignore
            request: jest.fn().mockResolvedValue({}),
            ...overrides
        }
    }
}