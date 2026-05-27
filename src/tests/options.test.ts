import {beforeEach, describe, expect, test} from "@jest/globals";
import type IOptions from "../core/actionInfo/IOptions.js";
import Options from "../implements/options.js";

let subject: IOptions;

beforeEach(() => {
    // NOTE: options are set via .env
    subject = new Options();
});

describe("Property Getters", () => {
    test("gets auto merge", async () => {
        expect(subject.AutoMerge).toEqual(true);
    });

    test("gets custom command", async () => {
        expect(subject.CustomCommand).toEqual("/fast-forward");
    });

    test ("gets post comment", async () => {
        expect(subject.PostComment).toEqual("always");
    });
});