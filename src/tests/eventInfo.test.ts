import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import EventInfo from "../implements/eventInfo.js";
import Options from "../implements/options.js";
import fs from "node:fs";
import path from "path";
import type {IssueCommentCreatedEvent, IssueCommentEditedEvent, PullRequestOpenedEvent} from "@octokit/webhooks-types";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";

let subject: IEventInfo;

describe("constructor", () => {
    test("throws when JSON parsing fails", async () => {
        const eventPath = process.env["LOCAL_INVALID_EVENT_PATH"] as string;
        expect(() => new EventInfo(new Options(), eventPath)).toThrow();
    });

    test("throws when an invalid event is supplied", async () => {
        const eventPath = process.env["LOCAL_INCORRECT_EVENT_PATH"] as string;
        expect(() => new EventInfo(new Options(), eventPath)).toThrow();
    });
});

describe("IsPossible", () => {
    let mockRepoInfo: IRepoInfo;

    beforeEach(() => {
        const eventPath = process.env["LOCAL_PULL_REQUEST_OPENED_EVENT_PATH"] as string;
        subject = new EventInfo(new Options(), eventPath);

        mockRepoInfo = {
            Owner: "luneisolei",
            Name: "Fast-Forward-Blossom-Bot",
            Pr: {
                BaseSha: "abc1234",
                HeadLabel: "luneisolei:feature-branch"
            }
        } as IRepoInfo

        Object.defineProperty(subject, "_octokit", {
            value: {request: jest.fn()}
        });
    });

    test("returns as true when comparison status is 'ahead'", async () => {
        jest.mocked((subject as any)._octokit.request).mockResolvedValue({
            headers: {},
            status: 200,
            url: "",
            data: {
                status: "ahead"
            }
        });

        const isPossible = await subject.GetIsPossible(mockRepoInfo);
        expect(isPossible).toEqual(true);
    });

    test("returns as false when comparison status is not 'ahead'", async () => {
        jest.mocked((subject as any)._octokit.request).mockResolvedValue({
            headers: {},
            status: 200,
            url: "",
            data: {
                status: "behind"
            }
        });

        const isPossible = await subject.GetIsPossible(mockRepoInfo);
        expect(isPossible).toEqual(false);
    });
});

describe("GetUserHasPerms", () => {
    let mockRepoInfo: IRepoInfo;

    beforeEach(() => {
        const eventPath = process.env["LOCAL_PULL_REQUEST_OPENED_EVENT_PATH"] as string;
        subject = new EventInfo(new Options(), eventPath);

        mockRepoInfo = {
            Owner: "luneisolei",
            Name: "Fast-Forward-Blossom-Bot",
            User: "luneisolei-testaccount"
        } as IRepoInfo;

        Object.defineProperty(subject, "_octokit", {
            value: {graphql: jest.fn()}
        });
    });

    test("returns true when user is an owner", async () => {
        (mockRepoInfo as any).User = "luneisolei";
        const userHasPerms = await subject.GetUserHasPerms(mockRepoInfo);
        expect(userHasPerms).toEqual(true);
    });

    test("returns true when user is a collaborator", async () => {
        jest.mocked((subject as any)._octokit.graphql).mockResolvedValue({
            repository: {
                collaborators: {
                    totalCount: 1
                }
            }
        });

        const userHasPerms = await subject.GetUserHasPerms(mockRepoInfo);
        expect(userHasPerms).toEqual(true);
    });

    test("returns false when user is not an owner or collaborator", async () => {
        jest.mocked((subject as any)._octokit.graphql).mockResolvedValue({
            repository: {
                collaborators: {
                    totalCount: 0
                }
            }
        });

        const userHasPerms = await subject.GetUserHasPerms(mockRepoInfo);
        expect(userHasPerms).toEqual(false);
    });
});

describe("ShouldExit", () => {
    beforeEach(() => {
        const eventPath = process.env["LOCAL_PULL_REQUEST_OPENED_EVENT_PATH"] as string;
        subject = new EventInfo(new Options(), eventPath);
    });

    test("returns false if not set", async () => {
        expect(subject.ShouldExit).toEqual(false);
    });

    test("returns correct value", async () => {
        subject.ShouldExit = true;
        expect(subject.ShouldExit).toEqual(true);
    });
});

describe("when event type is PullRequestOpened", () => {
    let event: PullRequestOpenedEvent;
    beforeEach(() => {
        const eventPath = process.env["LOCAL_PULL_REQUEST_OPENED_EVENT_PATH"] as string;
        subject = new EventInfo(new Options(), eventPath);
        const raw = fs.readFileSync(path.resolve(eventPath), "utf8");
        event = JSON.parse(raw);
    });

    test("get Event", async () => {
        expect(subject.Event).toEqual(event);
    });

    test("get EventType", async () => {
        expect(subject.EventType).toEqual(ActionEventType.PullRequestOpened);
    });

    test("get CommandInvoked", async () => {
        expect(subject.CommandInvoked).toEqual(false);
    });

    test("get CommentBody", async () => {
        expect(subject.CommentBody).toBeNull();
    });
});

describe("when event type is IssueCommentCreated", () => {
    let event: IssueCommentCreatedEvent;

    beforeEach(() => {
        const eventPath = process.env["LOCAL_ISSUE_COMMENT_CREATED_EVENT_PATH"] as string;
        subject = new EventInfo(new Options(), eventPath);
        const raw = fs.readFileSync(path.resolve(eventPath), "utf8");
        event = JSON.parse(raw);
    });

    test("get Event", async () => {
        expect(subject.Event).toEqual(event);
    });

    test("get EventType", async () => {
        expect(subject.EventType).toEqual(ActionEventType.IssueCommentCreated);
    });

    test("get CommandInvoked", async () => {
        expect(subject.CommandInvoked).toEqual(true);
    });

    test("get CommentBody", async () => {
        expect(subject.CommentBody).toEqual("/fast-forward");
    });
});

describe("when event type is IssueCommentEdited", () => {
    let event: IssueCommentEditedEvent;

    beforeEach(() => {
        const eventPath = process.env["LOCAL_ISSUE_COMMENT_EDITED_EVENT_PATH"] as string;
        subject = new EventInfo(new Options(), eventPath);
        const raw = fs.readFileSync(path.resolve(eventPath), "utf8");
        event = JSON.parse(raw);
    });

    test("get Event", async () => {
        expect(subject.Event).toEqual(event);
    });

    test("get EventType", async () => {
        expect(subject.EventType).toEqual(ActionEventType.IssueCommentEdited);
    });

    test("get CommandInvoked", async () => {
        expect(subject.CommandInvoked).toEqual(true);
    });

    test("get CommentBody", async () => {
        expect(subject.CommentBody).toEqual(" /fast-forward");
    });
});

test("octokit getter throws when not available", () => {
    const eventPath = process.env["LOCAL_PULL_REQUEST_OPENED_EVENT_PATH"] as string;
    subject = new EventInfo(new Options(), eventPath);
    expect(() => (subject as any).Octokit).toThrow(UnknownReferenceError)
});