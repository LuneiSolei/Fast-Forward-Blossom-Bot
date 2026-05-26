import PrInfo from "../implements/prInfo.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import {Octokit} from "@octokit/core";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";

describe("FinishInitialization", () => {
    let subject: IPrInfo;
    let octokit: Octokit;
    let eventPullRequest: PullRequestOpenedEvent;
    let eventIssue: IssueCommentCreatedEvent;

    beforeEach(() => {
        subject = new PrInfo();
        octokit = {
            graphql: jest.fn()
        } as unknown as Octokit;
        eventPullRequest = {
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

    test("returns early when baseRef is already set", async () => {
        (subject as any)._baseRef = "master";
        const event = {} as IssueCommentCreatedEvent; // We shouldn't need an event here
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentCreated);

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when eventType is ActionEventType.PullRequestOpened", async () => {
        await subject.FinishInitialization(
            octokit as Octokit,
            eventPullRequest,
            ActionEventType.PullRequestOpened);

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.pull_request is null and eventType is ActionEventType.IssueCommentCreated",
        async () => {
         // @ts-ignore
        eventIssue.issue.pull_request = undefined;
        await subject.FinishInitialization(
            octokit as Octokit,
            eventIssue,
            ActionEventType.IssueCommentCreated);

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.action is not 'created' and eventType is ActionEventType.IssueCommentCreated",
        async () => {
        // @ts-ignore
        eventIssue.action = "edited";
        await subject.FinishInitialization(
            octokit as Octokit,
            eventIssue,
            ActionEventType.IssueCommentCreated
        );

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.pull_request is null and eventType is ActionEventType.IssueCommentEdited",
        async () => {
        // @ts-ignore
        const event = eventIssue as IssueCommentEditedEvent;
        // @ts-ignore
        event.issue.pull_request = undefined;
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentEdited
        );

        expect(octokit.graphql as unknown as jest.Mock).not.toHaveBeenCalled();
    });

    test("returns early when event.action is not 'edited' and eventType is ActionEventType.IssueCommentEdited",
        async () => {
        // @ts-ignore
        const event = eventIssue as IssueCommentEditedEvent;
        // @ts-ignore
        event.action = "created";
        await subject.FinishInitialization(
            octokit as Octokit,
            event,
            ActionEventType.IssueCommentEdited
        );
    });

    test("retrieves the pull request information from the graphql call", async () => {
        const expectedValue = {
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
        jest.mocked(octokit.graphql).mockResolvedValue(expectedValue);

        await subject.FinishInitialization(
            octokit,
            eventIssue,
            ActionEventType.IssueCommentCreated
        );

        expect(subject.BaseRef).toEqual(expectedValue.repository.pullRequest.baseRefName);
        expect(subject.BaseSha).toEqual(expectedValue.repository.pullRequest.baseRefOid);
        expect(subject.HeadRef).toEqual(expectedValue.repository.pullRequest.headRefName);
        expect(subject.HeadSha).toEqual(expectedValue.repository.pullRequest.headRefOid);
        expect(subject.HeadOwner).toEqual(expectedValue.repository.pullRequest.headRepositoryOwner.login);
        expect(subject.HeadLabel).toEqual(
            expectedValue.repository.pullRequest.headRepositoryOwner.login + "/" +
            expectedValue.repository.pullRequest.headRefName
        );
        expect(subject.HeadRepo).toEqual(expectedValue.repository.pullRequest.headRepository.name);
        expect(subject.NodeId).toEqual(expectedValue.repository.pullRequest.id);
        expect(subject.MergeBaseSha).toBeNull();
        expect(subject.MergeBaseParentsAmount).toEqual(0);
    });
});