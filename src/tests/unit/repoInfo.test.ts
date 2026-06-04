import {beforeEach, describe, expect, test} from "@jest/globals";
import type {PullRequestOpenedEvent} from "@octokit/webhooks-types";
import type IPrInfo from "../../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../../core/actionInfo/IRepoInfo.js";
import TestFixtures from "./testFixtures.js";
import type {ActionEvent} from "../../core/actionEvent/actionEvent.js";

let subject: IRepoInfo,
    event: ActionEvent,
    mockPrInfo: IPrInfo,
    repoInfo: typeof TestFixtures.ConcreteRepoInfo;

beforeEach(() => {
    mockPrInfo = TestFixtures.CreateMockPrInfo()
    repoInfo = TestFixtures.ConcreteRepoInfo;
    event = TestFixtures.ParseEventFile(TestFixtures.PullRequestOpenedEventPath) as PullRequestOpenedEvent;
    subject = new repoInfo(mockPrInfo, event)
})

test("constructor initializes new instance properly", async () => {
    expect(() => new repoInfo(mockPrInfo, event)).not.toThrow();
});

describe("Property Getters", () => {
    test("gets repo name", async () => {
        expect(subject.Name).toEqual(event.repository.name);
    });

    test("gets pull request info", async () => {
        expect(subject.Pr).toEqual(mockPrInfo);
    });


    test("gets repo owner", async () => {
        expect(subject.Owner).toEqual(event.repository.owner.login);
    });

    test("gets clone url", async () => {
       expect(subject.CloneUrl).toEqual(event.repository.clone_url);
    });
});