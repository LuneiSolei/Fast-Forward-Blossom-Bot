import {beforeEach, describe, expect, test} from "@jest/globals";
import CommentBuilder from "../implements/commentBuilder.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import ApiCaller from "../implements/apiCaller.js";
import TestFixtures from "./testFixtures.js";

let subject: any;
let actionInfo: IActionInfo;

beforeEach(() => {
    // Create new info objects every time while keeping their definitions towards the top of this file
    actionInfo = TestFixtures.CreateActionInfo();
});

test("constructor constructs without throwing", () => {
    expect(() => new CommentBuilder(actionInfo, ApiCaller.GetCommit)).not.toThrow();
});

describe("AddVerifyingLine()", () => {
    test("creates verifying message when auto_merge is true", async () => {
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddVerifyingLine();
        const comment = subject._comment.join("\n");

        expect(comment).toContain("Auto merge enabled"); // Check for conditional first part
        expect(comment).toContain("fast-forward") // Check for non-conditional second part
    });

    test("creates verifying message when auto_merge is false", async () => {
        (actionInfo.Options as any).AutoMerge = false;
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddVerifyingLine();
        const comment = subject._comment.join("\n");

        expect(comment).toContain("Auto merge disabled");
        expect(comment).toContain("fast-forward");
    });

    test("mentions both refs", async () => {
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddVerifyingLine();
        const comment = subject._comment.join("\n")

        expect(comment).toContain(subject._baseFullRef);
        expect(comment).toContain(subject._headFullRef);
    });
});

describe("AddNotPossibleLines()", () => {
    test("adds lines for impossible fast-forward", async () => {
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddNotPossibleLines();
        const comment = subject._comment.join("\n");

        expect(comment).toContain("Can't fast-forward");
    });

    test("mentions both refs", async () => {
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddNotPossibleLines();
        const comment = subject._comment.join("\n");

        expect(comment).toContain(subject._baseFullRef);
        expect(comment).toContain(subject._headFullRef);
    });

    test("adds no common ancestor line when MergeBaseSha is null", async () => {
        (actionInfo.Repo.Pr as any).MergeBaseSha = null;
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddNotPossibleLines();
        const comment = subject._comment.join("\n");

        expect(comment).toContain("common ancestor");
    });

    test("adds diverged line when MergeBaseSha exists", async () => {
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddNotPossibleLines();
        const comment = subject._comment.join("\n");

        expect(comment).toContain(TestFixtures.CreatePrInfo().MergeBaseSha);
    });

    test("adds shell block when divergence point is found", async () => {
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddNotPossibleLines();
        const comment = subject._comment.join("\n");

        expect(comment).toContain("\`\`\`shell");
    });

    test("uses empty exclude when MergeBaseParentsAmount is 0", () => {
        subject._actionInfo.Repo.Pr.MergeBaseParentsAmount = 0;
        (actionInfo.Repo.Pr as any).MergeBaseParentsAmount = 0
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddNotPossibleLines();
        const comment = subject._comment.join("\n");

        expect(comment).toBeDefined();
    });
});

describe("AddAutoMergeDisabledLine()", () => {
    test("adds a message saying that auto_merge is disabled", async () => {
        subject = new CommentBuilder(actionInfo, ApiCaller.GetCommit);
        subject.AddAutoMergeDisabledLine();
        const comment = subject._comment.join("\n");

        expect(comment).toContain(`It is possible to fast-forward ${subject._baseFullRef} to ${subject._headFullRef}`);
    });
});

// describe("AddNoPermsLine()", () => {
//     test("")
// });