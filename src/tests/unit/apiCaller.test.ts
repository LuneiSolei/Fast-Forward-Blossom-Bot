import TestFixtures from "../testFixtures.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IApiCaller from "../../core/actionInfo/IApiCaller.js";
import {Octokit} from "@octokit/core";
import type {IApiCompareResponse} from "../../core/githubApi/IApiCompareResponse.js";
import {ActionEventType} from "../../core/actionEvent/actionEventType.js";
import type {IGraphQlCollaboratorResponse} from "../../core/githubApi/IGraphQlCollaboratorResponse.js";
import type IActionInfo from "../../core/actionInfo/IActionInfo.js";
import type ICommit from "../../core/ICommit.js";

let subject: IApiCaller,
    apiCaller: typeof TestFixtures.ConcreteApiCaller,
    mockOctokit: Octokit,
    mockActionInfo: IActionInfo;

// For each event type...
describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return TestFixtures.PullRequestOpenedEventPath }},
    { eventType: ActionEventType.IssueCommentCreated, get eventPath() { return TestFixtures.IssueCommentCreatedEventPath }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return TestFixtures.IssueCommentEditedEventPath }},
])("when event type is $eventType", ({ eventPath }) => {
    beforeEach(() => {
        apiCaller = TestFixtures.ConcreteApiCaller;
    });

    // ...test GetPullRequest()
    test("GetPullRequest() gets pull request info via graphql", async () => {
        mockActionInfo = await TestFixtures.CreateMockActionInfoFromEventPath(eventPath);
        mockOctokit = TestFixtures.CreateMockOctokit({
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue({
                repository: {
                    pullRequest: {
                        baseRefName: mockActionInfo.Repo.Pr.BaseRef,
                        baseRefOid: mockActionInfo.Repo.Pr.BaseSha,
                        headRefName: mockActionInfo.Repo.Pr.HeadRef,
                        headRefOid: mockActionInfo.Repo.Pr.HeadSha,
                        headRepository: {
                            name: mockActionInfo.Repo.Pr.HeadRepo
                        },
                        headRepositoryOwner: {
                            login: mockActionInfo.Repo.Pr.HeadOwner
                        },
                        id: mockActionInfo.Repo.Pr.PrNodeId
                    }
                }
            })
        });
        subject = new apiCaller(mockOctokit);
        const res = await subject.GetPullRequest(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Repo.Pr.IssueNumber);

        await expect(subject.GetPullRequest(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Repo.Pr.IssueNumber
        )).resolves
            .not
            .toThrow();
        expect(mockOctokit.graphql).toHaveBeenCalled();
        expect(res.repository.pullRequest.id).toEqual(mockActionInfo.Repo.Pr.PrNodeId);
    });

    // ...test GetBaseHeadComparison()
    test("GetBaseHeadComparison() gets base head comparison data via request", async () => {
        const mockResponse = {
            headers: {},
            status: 200,
            url: "",
            data: {
                ahead_by: 4
            }
        } as IApiCompareResponse
        mockOctokit = TestFixtures.CreateMockOctokit({
            // @ts-ignore
            request: jest.fn().mockResolvedValue(mockResponse)
        });
        subject = new apiCaller(mockOctokit);
        const res = await subject.GetBaseHeadComparison(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Repo.Pr.BaseSha,
            mockActionInfo.Repo.Pr.HeadLabel
        );

        await expect(subject.GetBaseHeadComparison(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Repo.Pr.BaseSha,
            mockActionInfo.Repo.Pr.HeadLabel
        )).resolves.not.toThrow();
        expect(res.data.ahead_by).toEqual(mockResponse.data.ahead_by);
    });

    // ...test GetCollaborator()
    test("GetCollaborator() gets collaborator info via request", async () => {
        const mockResponse = {
            repository: {
                collaborators: {
                    totalCount: 1
                }
            }
        } as IGraphQlCollaboratorResponse
        mockOctokit = TestFixtures.CreateMockOctokit({
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue(mockResponse)
        });
        subject = new apiCaller(mockOctokit);
        const res = await subject.GetCollaborator(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Event.User
        );

        await expect(subject.GetCollaborator(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Event.User
        )).resolves.not.toThrow();
        expect(res.repository.collaborators.totalCount).toEqual(mockResponse.repository.collaborators.totalCount);
    });

    // ...test PostComment()
    test("PostComment() posts comment via graphql", async () => {
        mockOctokit = TestFixtures.CreateMockOctokit();
        subject = new apiCaller(mockOctokit);
        const comment = await TestFixtures.CreateMockCommentBuilder().Build();

        await expect(subject.PostComment(
            mockActionInfo.Repo.Pr.PrNodeId,
            comment
        )).resolves.not.toThrow();
    });

    // ...test GetCommit()
    test("GetCommit() gets commit info via graphql", async () => {
        const mockResponse = {
            repository: {
                object: {
                    oid: mockActionInfo.Repo.Pr.MergeBaseSha,
                    author: {
                        name: "luneisolei",
                        email: "some email@email.com"
                    },
                    committedDate: Date.now().toString(),
                    message: "Here's a test message!",
                    associatedPullRequests: {
                        nodes: {
                            headRefName: mockActionInfo.Repo.Pr.HeadRef,
                            baseRefName: mockActionInfo.Repo.Pr.BaseRef
                        }
                    }
                }
            }
        } as ICommit;
        mockOctokit = TestFixtures.CreateMockOctokit({
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue(mockResponse)
        });
        subject = new apiCaller(mockOctokit);
        const res = await subject.GetCommit(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Repo.Pr.MergeBaseSha,
        );

        await expect(subject.GetCommit(
            mockActionInfo.Repo.Owner,
            mockActionInfo.Repo.Name,
            mockActionInfo.Repo.Pr.MergeBaseSha,
        )).resolves.not.toThrow();

        expect(res.repository.object.oid).toEqual(mockActionInfo.Repo.Pr.MergeBaseSha);
    });

    // ...test FastForward()
    test("FastForward() fast-forwards the base branch to the head branch", async () => {
        const mockActionInfo = await TestFixtures.CreateMockActionInfoFromEventPath(eventPath);
        const mockResponse = {
            ref: {
                name: `refs/heads/${mockActionInfo.Repo.Pr.BaseRef}`,
                target: {
                    oid: mockActionInfo.Repo.Pr.HeadSha
                }
            }
        }
        mockOctokit = TestFixtures.CreateMockOctokit({
            // @ts-ignore
            graphql: jest.fn().mockResolvedValue(mockResponse)
        });
        subject = new apiCaller(mockOctokit);
        (mockActionInfo as any)._apiCaller = subject;

        expect(subject.FastForward(mockActionInfo.Repo.Pr.HeadNodeId, mockActionInfo.Repo.Pr.BaseSha))
    });
});