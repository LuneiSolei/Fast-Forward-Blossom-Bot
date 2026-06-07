import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IEventInfo from "../../core/actionInfo/IEventInfo.js";
import EventFileError from "../../core/errors/eventFileError.js";
import InvalidEventError from "../../core/errors/invalidEventError.js";
import TestFixtures from "../testFixtures.js";
import type IOptions from "../../core/actionInfo/IOptions.js";
import {ActionEventType} from "../../core/actionEvent/actionEventType.js";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";
import type {ActionEvent} from "../../core/actionEvent/actionEvent.js";
import UnknownReferenceError from "../../core/errors/unknownReferenceError.js";

let subject: IEventInfo,
    pullRequestOpenedEventPath: string,
    issueCommentCreatedEventPath: string,
    issueCommentEditedEventPath: string,
    invalidEventPath: string,
    incorrectEventPath: string,
    event: ActionEvent,
    eventInfo: typeof TestFixtures.ConcreteEventInfo;

beforeEach(() => {
    eventInfo = TestFixtures.ConcreteEventInfo;
    invalidEventPath = TestFixtures.InvalidEventPath;
    incorrectEventPath = TestFixtures.IncorrectEventPath;
    pullRequestOpenedEventPath = TestFixtures.PullRequestOpenedEventPath;
    issueCommentCreatedEventPath = TestFixtures.IssueCommentCreatedEventPath;
    issueCommentEditedEventPath = TestFixtures.IssueCommentEditedEventPath;
});

// Constructor tests
describe("constructor", () => {
    test("throws when JSON parsing fails", async () => {
        expect(() => new eventInfo(TestFixtures.CreateMockOptions(), invalidEventPath)).toThrow(EventFileError);
    });

    test("throws when an invalid event is supplied", async () => {
        expect(() => new eventInfo(TestFixtures.CreateMockOptions(), incorrectEventPath)).toThrow(InvalidEventError);
    });
});

// For each event type...
describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return pullRequestOpenedEventPath }},
    { eventType: ActionEventType.IssueCommentCreated, get eventPath()  { return issueCommentCreatedEventPath }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return issueCommentEditedEventPath }}
])("when event type is $eventType", (describeRow) => {
    beforeEach(() => {
        subject = new eventInfo(TestFixtures.CreateMockOptions(), describeRow.eventPath);
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
    });

    // ...test construction
    test("returns a constructed instance of EventInfo", async () => {
        expect(() => new eventInfo(TestFixtures.CreateMockOptions(), describeRow.eventPath)).not.toThrow();
    });

    // ...test GetIsPossible...
    describe("GetIsPossible", () => {
        // ...with both 'ahead' and 'behind' statuses
        test.each([
            {status: "ahead", expected: true, label: "is"},
            {status: "behind", expected: false, label: "is not"}
        ])(
            "returns $expected when status $label 'ahead'",
            async ({status, expected}) =>
            {
                const mockResponse = {
                    headers: {},
                    status: 200,
                    url: "",
                    data: {status}
                }

                subject.ApiCaller = TestFixtures.CreateMockApiCaller({
                    // @ts-ignore
                    request: jest.fn().mockResolvedValue(mockResponse)
                });

                expect(await subject.GetIsPossible(TestFixtures.CreateMockRepoInfo())).toEqual(expected);
            }
        );
    });

    // ...test GetUserHasPerms...
    describe("GetUserHasPerms", () => {
        // ...with both "is an owner/collaborator" and "is not an owner/collaborator" statuses
        test.each([
            {user: "luneisolei", collabCount: 1, expected: true, label: "is"},
            {user: "luneisolei-testaccount", collabCount: 0, expected: false, label: "is not"}
        ])(
            "returns $expected when user $label owner/collaborator of the repo",
            async ({ user, collabCount, expected}) =>
        {
            (subject as any)._user = user;
            subject.ApiCaller = TestFixtures.CreateMockApiCaller({
                // @ts-ignore
                graphql: jest.fn().mockResolvedValue({
                    repository: {
                        collaborators: {
                            totalCount: collabCount
                        }
                    }
                })
            });
            const mockRepoInfo = TestFixtures.CreateMockRepoInfo();
            const hasPerms = await subject.GetUserHasPerms(mockRepoInfo);

            expect(hasPerms).toEqual(expected);
        });
    });

    // ...test User
    test("gets User", async () => {
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
        expect(subject.User).toEqual(event.sender.login);
    });

    test("retrieves user from 'sender' event info if _user is undefined", async () => {
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
        (subject as any)._user = undefined;

        expect(subject.User).toEqual(event.sender.login);
    });

    // ...test Event
    test("gets Event", async () => {
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
        expect(subject.Event).toEqual(event);
    });

    test("throws when Event returns undefined", async () => {
        (subject as any)._event = undefined;
        expect(() => subject.Event).toThrow(UnknownReferenceError);
    });

    // ...test EventType
    test("gets EventType", async () => {
        expect(subject.EventType).toEqual(describeRow.eventType);
    });

    test("throws when EventType returns undefined", async () => {
        (subject as any)._eventType = undefined;
        expect(() => subject.EventType).toThrow(UnknownReferenceError);
    })

    // ...test CommandInvoked
    test("gets CommandInvoked", async () => {
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
        const options: IOptions = TestFixtures.CreateMockOptions();
        let expected: boolean

        switch (describeRow.eventType) {
            case ActionEventType.PullRequestOpened:
                expected = (event as PullRequestOpenedEvent)
                    .pull_request
                    .body?.trim() === options.CustomCommand;

                break;
            case ActionEventType.IssueCommentCreated:
                expected = (event as IssueCommentCreatedEvent)
                    .comment
                    .body?.trim() === options.CustomCommand;

                break;
            case ActionEventType.IssueCommentEdited:
                expected = (event as IssueCommentEditedEvent)
                    .comment
                    .body?.trim() === options.CustomCommand;

                break;
        }

        expect(subject.CommandInvoked).toEqual(expected);
    });

    // ...test CommentBody
    test("gets CommentBody", async () => {
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
        let expected: string | null;

        switch (describeRow.eventType) {
            case ActionEventType.PullRequestOpened:
                expected = (event as PullRequestOpenedEvent).pull_request.body;

                break;
            case ActionEventType.IssueCommentCreated:
                expected = (event as IssueCommentCreatedEvent).comment.body;

                break;
            case ActionEventType.IssueCommentEdited:
                expected = (event as IssueCommentEditedEvent).comment.body;
        }

        expect(subject.CommentBody).toEqual(expected)
    });
});