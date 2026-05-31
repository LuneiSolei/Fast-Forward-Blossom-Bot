import {jest} from "@jest/globals";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";

export default class TestFactories
{
    public static CreatePrInfo(overrides?: Partial<IPrInfo>)
    {
        return {
            BaseRef: "master",
            BaseSha: "abc123",
            HeadRef: "feature-branch",
            HeadSha: "def456",
            HeadLabel: "luneisolei/Fast-Forward-Blossom-Bot",
            HeadOwner: "luneisolei",
            HeadRepo: "Fast-Forward-Blossom-Bot",
            MergeBaseSha: "ghi789",
            MergeBaseParentsAmount: 1,
            NodeId: "some node id",
            FinishInitialization: jest.fn() as any,
            SetEvent: jest.fn(),
            ...overrides
        }
    }

    public static CreateRepoInfo(overrides?: Partial<IRepoInfo>)
    {
        return {
            Owner: "luneisolei",
            Name: "Fast-Forward-Blossom-Bot",
            CloneUrl: "some clone url",
            ...overrides
        }
    }

    public static CreateEventInfo(overrides?: Partial<IEventInfo>)
    {
        return {
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

    public static CreateOptions(overrides?: Partial<IOptions>)
    {
        return {
            AutoMerge: true,
            PostComment: "always",
            CustomCommand: "/fast-forward",
            ...overrides
        }
    }

    public static CreateActionInfo(overrides?: Partial<IActionInfo>)
    {
        return {
            Octokit: TestFactories.createOctokit() as any,
            ...overrides
        }
    }

    private static createOctokit(overrides?: {
        oid: string;
        message: string;
        committedDate: string;
        authorName: string;
        authorEmail: string;
        headRefName: string;
        baseRefName: string;})
    {
        const info = {
            oid: overrides?.oid ?? "abc123",
            message: overrides?.message ?? "Some message here",
            committedDate: overrides?.committedDate ?? Date.now().toString(),
            authorName: overrides?.authorName ?? "Some author name",
            authorEmail: overrides?.authorEmail ?? "Some email",
            headRefName: overrides?.headRefName ?? "some headRef name",
            baseRefName: overrides?.baseRefName ?? "some baseRef name",
        }

        return {
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue({
                repository: {
                    object: {
                        oid: info.oid,
                        message: info.message,
                        committedDate: info.committedDate,
                        author: {
                            name: info.authorName,
                            email: info.authorEmail,
                        },
                        associatedPullRequests: {
                            nodes: {
                                headRefName: info.headRefName,
                                baseRefName: info.baseRefName
                            }
                        }
                    }
                }
            })
        }
    }
}