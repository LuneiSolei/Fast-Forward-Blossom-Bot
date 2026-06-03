import {beforeAll, describe, expect, test} from "@jest/globals";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import ActionInfoFactory from "../implements/actionInfoFactory.js";
import TestFixtures from "./testFixtures.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";

let subject: IActionInfo;

describe("Create()", () => {
    test("returns a constructed instance of ActionInfo", async () => {
        await expect(async () => await ActionInfoFactory.Create(
            TestFixtures.CreateMockPrInfo(),
            TestFixtures.CreateMockOptions(),
            TestFixtures.CreateMockEventInfo(),
            TestFixtures.CreateMockRepoInfo(),
            TestFixtures.CreateMockApiCaller(),
            TestFixtures.CreateMockOctokit()
        )).resolves.not.toThrow();
    });

    test("throws when GITHUB_EVENT_PATH environment variable is not set", async () => {
        const original = process.env["GITHUB_EVENT_PATH"];
        delete process.env["GITHUB_EVENT_PATH"];
        await expect(ActionInfoFactory.Create(
            TestFixtures.CreateMockPrInfo(),
            TestFixtures.CreateMockOptions(),
            TestFixtures.CreateMockEventInfo(),
            TestFixtures.CreateMockRepoInfo(),
            TestFixtures.CreateMockApiCaller(),
            TestFixtures.CreateMockOctokit()
        )).rejects.toThrow(UnknownReferenceError);
        process.env["GITHUB_EVENT_PATH"] = original;
    });
});


describe("Getters", () => {
    beforeAll(async () => {
        subject = await ActionInfoFactory.Create(
            TestFixtures.CreateMockPrInfo(),
            TestFixtures.CreateMockOptions(),
            TestFixtures.CreateMockEventInfo(),
            TestFixtures.CreateMockRepoInfo(),
            TestFixtures.CreateMockApiCaller(),
            TestFixtures.CreateMockOctokit()
        );
    });

    test.each([
        { label: "ApiCaller", get property() { return subject.ApiCaller }},
        { label: "RepoInfo", get property() { return subject.Repo }},
        { label: "Options", get property() { return subject.Options }},
        { label: "EventInfo", get property() { return subject.Event }}
    ])("gets $label", ({ property }) => {
        expect(property).toBeDefined();
    });
});