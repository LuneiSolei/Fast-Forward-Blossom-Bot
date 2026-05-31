import {describe, expect, test} from "@jest/globals";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import PrInfo from "../implements/prInfo.js";
import Options from "../implements/options.js";
import EventInfo from "../implements/eventInfo.js";
import RepoInfo from "../implements/repoInfo.js";
import ActionInfo from "../implements/actionInfo.js";

let subject: IActionInfo;

subject = await ActionInfo.Create(
    PrInfo,
    Options,
    EventInfo,
    RepoInfo
);

test("Create() returns a constructed instance of ActionInfo", async () => {
    expect(subject).toBeInstanceOf(ActionInfo);
});

describe("Getters", () => {
    test("gets Octokit", async () => {
        expect(subject.Octokit).toBeDefined();
    });

    test("gets RepoInfo", async () => {
        expect(subject.Repo).toBeDefined();
    });

    test("gets Options", async () => {
        expect(subject.Options).toBeDefined();
    });

    test("gets eventInfo", async () => {
        expect(subject.Event).toBeDefined();
    });
});