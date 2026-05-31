import {beforeEach, describe, expect, test} from "@jest/globals";
import RepoInfo from "../implements/repoInfo.js";
import PrInfo from "../implements/prInfo.js";
import type {PullRequestOpenedEvent} from "@octokit/webhooks-types";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";

let prInfo: IPrInfo;
let subject: IRepoInfo;

beforeEach(() => {
    prInfo = new PrInfo();
    subject = new RepoInfo(prInfo, {
        repository: {
            owner: {
                login: "luneisolei"
            },
            name: "Fast-Forward-Blossom-Bot",
            clone_url: "https://github.com/LuneiSolei/Fast-Forward-Blossom-Bot.git",
        },
        sender: {
            login: "luneisolei"
        }
    } as unknown as PullRequestOpenedEvent)
})

test("constructor initializes new instance properly", async () => {
    expect(subject).toBeInstanceOf(RepoInfo);
});

describe("Property Getters", () => {
    test("gets repo name", async () => {
        expect(subject.Name).toEqual("Fast-Forward-Blossom-Bot");
    });

    test("gets pull request info", async () => {
        expect(subject.Pr).toEqual(prInfo);
    });


    test("gets repo owner", async () => {
        expect(subject.Owner).toEqual("luneisolei");
    });

    test("gets clone url", async () => {
       expect(subject.CloneUrl).toEqual("https://github.com/LuneiSolei/Fast-Forward-Blossom-Bot.git");
    });
});