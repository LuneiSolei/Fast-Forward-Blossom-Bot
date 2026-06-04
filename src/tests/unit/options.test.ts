import {beforeEach, expect, test} from "@jest/globals";
import type IOptions from "../../core/actionInfo/IOptions.js";
import InvalidInputValueError from "../../core/errors/invalidInputValueError.js";
import TestFixtures from "./testFixtures.js";

let subject: IOptions,
    options: typeof TestFixtures.ConcreteOptions;

beforeEach(() => {
    // NOTE: Test environment variables are set via the run configuration
    options = TestFixtures.ConcreteOptions;
    subject = new options();
});


test("post comment getter fails when post comment is an invalid value", async () => {
    const original = process.env["INPUT_POST_COMMENT"] as string;
    process.env["INPUT_POST_COMMENT"] = "anInvalidValue";
    expect(() => new options().PostComment).toThrow(InvalidInputValueError);
    process.env["INPUT_POST_COMMENT"] = original;
});

test.each([
    { label: "auto merge", value: () => { return subject.AutoMerge }, expected: true },
    { label: "custom command",  value: () => { return subject.CustomCommand }, expected: "/fast-forward" },
    { label: "post comment",  value: () => { return subject.PostComment }, expected: "always" },
])("gets $label", ({ value, expected }) => {
    expect(value()).toEqual(expected);
    expect(value()).toEqual(expected); // Perform twice to test if branch
});