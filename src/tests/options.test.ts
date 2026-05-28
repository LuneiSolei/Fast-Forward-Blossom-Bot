import {beforeEach, describe, expect, test} from "@jest/globals";
import type IOptions from "../core/actionInfo/IOptions.js";
import Options from "../implements/options.js";

let subject: IOptions;

beforeEach(() => {
    // NOTE: Test environment variables are set via the run configuration
    subject = new Options();
});

describe("Property Getters", () => {
    test("fails when post comment has an invalid value", async () => {
        const original = process.env["INPUT_POST_COMMENT"] as string;
        process.env["INPUT_POST_COMMENT"] = "anInvalidValue";
        expect(() => new Options().PostComment).toThrow(TypeError);
        process.env["INPUT_POST_COMMENT"] = original;
    });

    test("gets auto merge", async () => {
        expect(subject.AutoMerge).toEqual(true);

        // Perform again to test if branch
        expect(subject.AutoMerge).toEqual(true);
    });

    test("gets custom command", async () => {
        expect(subject.CustomCommand).toEqual("/fast-forward");

        // Perform again to test if branch
        expect(subject.CustomCommand).toEqual("/fast-forward");
    });

    test ("gets post comment", async () => {
        expect(subject.PostComment).toEqual("always");

        // Perform again to test if branch
        expect(subject.PostComment).toEqual("always");
    });
});