import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import TestFixtures from "./testFixtures.js";
import type ICommentBuilder from "../core/ICommentBuilder.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";

let subject: ICommentBuilder,
    mockActionInfo: IActionInfo,
    commentBuilder: typeof TestFixtures.ConcreteCommentBuilder;

function containsBothRefs(func: (...args: any) => any, ...args: any[])
{
    (subject as any)[func.name](...args);
    const comment = (subject as any)._comment.join("\n");
    const baseFullRef = `${mockActionInfo.Repo.Pr.BaseRef} (${mockActionInfo.Repo.Pr.BaseSha})`;
    const headFullRef = `${mockActionInfo.Repo.Pr.HeadRef} (${mockActionInfo.Repo.Pr.HeadSha})`;

    expect(comment).toContain(baseFullRef);
    expect(comment).toContain(headFullRef);
}

beforeEach(() => {
    // Create new info objects every time while keeping their definitions towards the top of this file
    commentBuilder = TestFixtures.ConcreteCommentBuilder;
    mockActionInfo = TestFixtures.CreateMockActionInfo();
    subject = new commentBuilder(mockActionInfo, mockActionInfo.ApiCaller.GetCommit);
});

test("constructor constructs without throwing", () => {
    expect(() => new commentBuilder(mockActionInfo, mockActionInfo.ApiCaller.GetCommit)).not.toThrow();
});

describe("Build()", () => {
    test.each([
        { isPossible: true, autoMerge: true, hasPerms: true, commandInvoked: true },
        { isPossible: false, autoMerge: true, hasPerms: true, commandInvoked: true },
        { isPossible: true, autoMerge: false, hasPerms: true, commandInvoked: true },
        { isPossible: true, autoMerge: true, hasPerms: false, commandInvoked: true },
        { isPossible: true, autoMerge: true, hasPerms: true, commandInvoked: false },
    ])(
        "builds correctly when 'isPossible' is $isPossible, 'autoMerge' is $autoMerge, 'hasPerms' is $hasPerms, and " +
        "'commandInvoked' is $commandInvoked",
        async ({ isPossible, autoMerge, hasPerms, commandInvoked }) =>
    {
        const mockResponse = {
            repository: {
                object: {
                    oid: "ARandomOid",
                    message: "Here's a message",
                    committedDate: new Date(),
                    author: {
                        name: "luneisolei",
                        email: "luneisolei@SomeRandomEmailHost.server"
                    },
                    associatedPullRequests: {
                        nodes: {
                            headRefName: "master",
                            baseRefName: "feature-branch"
                        }
                    }
                }
            }
        };

        mockActionInfo = TestFixtures.CreateMockActionInfo();

        // @ts-ignore
        mockActionInfo.Event.GetIsPossible = jest.fn().mockResolvedValue(isPossible) as IEventInfo["GetIsPossible"];

        // @ts-ignore
        mockActionInfo.Event.GetUserHasPerms = jest.fn().mockResolvedValue(hasPerms) as IEventInfo["GetUserHasPerms"];
        (mockActionInfo.Event as any).CommandInvoked = commandInvoked as IEventInfo["CommandInvoked"];
        (mockActionInfo.Options as any).AutoMerge = autoMerge;

        // @ts-ignore
        subject = new commentBuilder(mockActionInfo, jest.fn().mockResolvedValue(mockResponse));

        jest.spyOn(subject as any, "addNotPossibleLines");
        jest.spyOn(subject as any, "addAutoMergeDisabledLine");
        jest.spyOn(subject as any, "addNoPermsLine");
        jest.spyOn(subject as any, "addCommandNotInvokedLine");

        await expect(subject.Build()).resolves.not.toThrow();

        expect((subject as any).addNotPossibleLines).toHaveBeenCalledTimes(isPossible ? 0 : 1);
        expect((subject as any).addAutoMergeDisabledLine).toHaveBeenCalledTimes(autoMerge ? 0 : 1);
        expect((subject as any).addNoPermsLine).toHaveBeenCalledTimes(hasPerms ? 0 : 1);
        expect((subject as any).addCommandNotInvokedLine).toHaveBeenCalledTimes(commandInvoked ? 0 : 1);
    });
});

describe("addVerifyingLine()", () => {
    test.each([
        { status: true },
        { status: false }
    ])("creates verifying message when auto_merge is $status", async ({ status }) => {
        (mockActionInfo.Options as any).AutoMerge = status;
        (subject as any).addVerifyingLine();
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain(`Auto merge ${status ? "enabled" : "disabled"}`);
        expect(comment).toContain("fast-forward");
    });

    test("mentions both refs", async () => {
        containsBothRefs((subject as any).addVerifyingLine);
    });
});

describe("addNotPossibleLines()", () => {
    test("adds lines for impossible fast-forward", async () => {
        (subject as any).addNotPossibleLines();
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain("Can't fast-forward");
    });

    test("mentions both refs", async () => {
        containsBothRefs((subject as any).addNotPossibleLines);
    });

    test("adds no common ancestor line when MergeBaseSha is null", async () => {
        (mockActionInfo.Repo.Pr as any).MergeBaseSha = null;
        (subject as any).addNotPossibleLines();
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain("common ancestor");
    });

    test("adds diverged line when MergeBaseSha exists", async () => {
        (subject as any).addNotPossibleLines();
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain(TestFixtures.CreateMockPrInfo().MergeBaseSha);
    });

    test("adds shell block when divergence point is found", async () => {
        (subject as any).addNotPossibleLines();
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain("\`\`\`shell");
    });

    test("uses empty exclude when MergeBaseParentsAmount is 0", () => {
        (subject as any)._actionInfo.Repo.Pr.MergeBaseParentsAmount = 0;
        (mockActionInfo.Repo.Pr as any).MergeBaseParentsAmount = 0;
        (subject as any).addNotPossibleLines();
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toBeDefined();
    });
});

describe("addAutoMergeDisabledLine()", () => {
    test("adds a message saying that auto_merge is disabled", async () => {
        containsBothRefs((subject as any).addAutoMergeDisabledLine);
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain(`It is possible to fast-forward `);
    });
});

describe("addNoPermsLine()", () => {
    test("adds a message saying that user has no perms for the repo", async () => {
        containsBothRefs((subject as any).addNoPermsLine);
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain(mockActionInfo.Event.User);
    });
});

describe("addCommandNotInvokedLine()", () => {
    test("adds a message saying that the custom command needs to be invoked in order to fast-forward", async () => {
        containsBothRefs((subject as any).addCommandNotInvokedLine);
        const comment = (subject as any)._comment.join("\n");

        expect(comment).toContain(mockActionInfo.Options.CustomCommand);
    });
});

describe("addShellBlocks()", () => {
    test("adds shell blocks containing all ref information", async () => {
        const mockResponse = {
            repository: {
                object: {
                    oid: "ARandomOid",
                    message: "Here's a message",
                    committedDate: new Date(),
                    author: {
                        name: "luneisolei",
                        email: "luneisolei@SomeRandomEmailHost.server"
                    },
                    associatedPullRequests: {
                        nodes: {
                            headRefName: "master",
                            baseRefName: "feature-branch"
                        }
                    }
                }
            }
        };

        // @ts-ignore
        const mockGetter = jest.fn().mockResolvedValue(mockResponse);

        // @ts-ignore
        subject = new commentBuilder(mockActionInfo, mockGetter);
        await (subject as any).addShellBlocks();
        const comment = (subject as any)._comment.join("\n");
        const commit = mockResponse.repository.object;

        expect(comment).toContain(`\`\`\`shell`);
        expect(comment).toContain(
            `commit ${commit.oid} (HEAD -> ${commit.associatedPullRequests.nodes.headRefName}, origin/${commit.associatedPullRequests.nodes.baseRefName})`
        );
        expect(comment).toContain(
            `Author: ${commit.author.name} <${commit.author.email}>`,
        );
        expect(comment).toContain(
            `Date:   ${commit.committedDate}`
        );
        expect(comment).toContain(commit.message);
    });
});

describe("createBlock()", () => {

});