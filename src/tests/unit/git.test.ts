import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import {ActionEventType} from "../../core/actionEvent/actionEventType.js";
import type {ActionEvent} from "../../core/actionEvent/actionEvent.js";

jest.unstable_mockModule("node:child_process", () => ({
    execSync: jest.fn().mockReturnValue(Buffer.from(""))
}));

const { default: Git } = await import("../../core/git/git.js");
const { default: TestFixtures } = await import("./testFixtures.js");
const { execSync } = await import("node:child_process");
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

let subject: typeof Git,
    event: ActionEvent

// For each event type...
describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return TestFixtures.PullRequestOpenedEventPath }},
    { eventType: ActionEventType.IssueCommentCreated, get eventPath() { return TestFixtures.IssueCommentCreatedEventPath }},
    { eventType: ActionEventType.IssueCommentEdited, get eventPath() { return TestFixtures.IssueCommentEditedEventPath }},
])("when event type is $eventType", (describeRow) => {
    beforeEach(() => {
        subject = Git;
        event = TestFixtures.ParseEventFile(describeRow.eventPath);
        mockExecSync.mockClear();
    });

    // ...test CloneRepo()
    test("CloneRepo() uses correct arguments", async () => {
        const cloneUrl = event.repository.clone_url;
        subject.CloneRepo(cloneUrl);

        expect(mockExecSync).toHaveBeenCalledTimes(3);
        expect(mockExecSync).toHaveBeenNthCalledWith(1, "rm -rf ./tmp/repo/*", { "cwd": undefined });
        expect(mockExecSync).toHaveBeenNthCalledWith(2, "mkdir -p ./tmp/repo", { "cwd": undefined });
        expect(mockExecSync).toHaveBeenNthCalledWith(3, `git clone ${cloneUrl} ./tmp/repo`, { "cwd": undefined })
    });

    // ...test Log()
    test("Log() uses correct arguments", async () => {
        const exclude = "^abc123";
        const baseSha = "def456";
        const headSha = "ghi789";
        const expected = "* def456 some commit message";

        mockExecSync.mockReturnValueOnce(Buffer.from(expected));
        const result = subject.Log(exclude, baseSha, headSha);

        expect(mockExecSync).toHaveBeenCalledTimes(1);
        expect(mockExecSync).toHaveBeenCalledWith(
            `git log --pretty=oneline --graph ${exclude} ${baseSha} ${headSha}`,
            { cwd: "./tmp/repo"}
        );
        expect(result).toEqual(expected);
    });

    // ..test GetMergeBaseSha()
    test("GetMergeBaseSha() uses correct arguments", async () => {
        const baseSha = "abc123";
        const headSha = "def456";
        const expected = "ghi789";

        mockExecSync.mockReturnValueOnce(Buffer.from(expected));
        const result = subject.GetMergeBaseSha(baseSha, headSha);

        expect(mockExecSync).toHaveBeenCalledTimes(1);
        expect(mockExecSync).toHaveBeenCalledWith(
            `git merge-base ${baseSha} ${headSha}`,
            { cwd: "./tmp/repo"}
        );
        expect(result).toEqual(expected);
    });

    test("GetAmountOfParents() uses correct arguments", async () => {
        const mergeBaseSha = "abc123";
        const parentSha = "def456";
        const expected = 1;

        mockExecSync.mockReturnValueOnce(Buffer.from(`${mergeBaseSha} ${parentSha}`));
        const result = subject.GetAmountOfParents(mergeBaseSha);

        expect(mockExecSync).toHaveBeenCalledTimes(1);
        expect(mockExecSync).toHaveBeenCalledWith(
            `git log --parents -n 1 ${mergeBaseSha}`,
            { cwd: "./tmp/repo" }
        );
        expect(result).toEqual(expected);
    });

    test("GetAmountOfParents() returns 0 when output is empty", () => {
        mockExecSync.mockReturnValueOnce(Buffer.from(""));
        const result = subject.GetAmountOfParents("abc123");

        expect(result).toEqual(0);
    })
});