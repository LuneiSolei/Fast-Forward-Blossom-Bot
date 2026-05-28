import {describe, expect, test} from "@jest/globals";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import PrInfo from "../implements/prInfo.js";
import Options from "../implements/options.js";
import EventInfo from "../implements/eventInfo.js";
import RepoInfo from "../implements/repoInfo.js";
import {Octokit} from "@octokit/core";
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
        expect(subject.Octokit).toBeInstanceOf(Octokit);
    });

    test("gets RepoInfo", async () => {
        expect(subject.Repo).toBeInstanceOf(RepoInfo);
    });

    test("gets Options", async () => {
        expect(subject.Options).toBeInstanceOf(Options);
    });

    test("gets eventInfo", async () => {
        expect(subject.Event).toBeInstanceOf(EventInfo);
    });
});