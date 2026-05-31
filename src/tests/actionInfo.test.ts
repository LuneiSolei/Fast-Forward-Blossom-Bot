import {beforeAll, describe, expect, test} from "@jest/globals";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import ActionInfo from "../implements/actionInfo.js";
import ActionInfoFactory from "../implements/actionInfoFactory.js";
import TestFixtures from "./testFixtures.js";

let subject: IActionInfo;

test("Create() returns a constructed instance of ActionInfo", async () => {
    subject = await ActionInfoFactory.Create(
        TestFixtures.CreateMockPrInfo(),
        TestFixtures.CreateMockOptions(),
        TestFixtures.CreateMockEventInfo(),
        TestFixtures.CreateMockRepoInfo(),
        TestFixtures.CreateMockApiCaller(),
        TestFixtures.CreateMockOctokit()
    );

    expect(subject).toBeInstanceOf(ActionInfo);
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