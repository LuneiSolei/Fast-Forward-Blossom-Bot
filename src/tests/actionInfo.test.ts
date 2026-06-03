import {beforeAll, beforeEach, describe, expect, test} from "@jest/globals";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import TestFixtures from "./testFixtures.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";

let subject: IActionInfo,
    actionInfoFactory: typeof TestFixtures.ConcreteActionInfoFactory;

describe("Create() with premade instances", () => {
    beforeEach(() => {
        actionInfoFactory = TestFixtures.ConcreteActionInfoFactory;
    });

    test("returns a constructed instance of ActionInfo", async () => {
        await expect(async () => await actionInfoFactory.Create(
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
        await expect(actionInfoFactory.Create(
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

describe("Create() with constructors", () => {
    beforeEach(() => {
        actionInfoFactory = TestFixtures.ConcreteActionInfoFactory;
    });

    test("constructs using injected constructors", async () => {
        await expect(actionInfoFactory.Create(
            TestFixtures.ConcretePrInfo,
            TestFixtures.ConcreteOptions,
            TestFixtures.ConcreteEventInfo,
            TestFixtures.ConcreteRepoInfo,
            TestFixtures.ConcreteApiCaller,
            TestFixtures.CreateMockOctokit()
        )).resolves.not.toThrow();
    })
});

describe("Getters", () => {
    beforeAll(async () => {
        subject = await actionInfoFactory.Create(
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