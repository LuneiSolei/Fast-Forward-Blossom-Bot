import {beforeEach, describe, expect, jest, test} from "@jest/globals";

beforeEach(() => {
    jest.resetModules();
});

describe("Create()", () => {
    test("successfully constructs an instance of Octokit", async () => {
        jest.unstable_mockModule("@octokit/core", () => {
            return {
                Octokit: class {
                    constructor() {}
                    // @ts-ignore
                    request = jest.fn().mockResolvedValue({
                        data: {
                            id: "SomeInstallationId"
                        }
                    })
                }
            }
        });

        await import("@octokit/core");
        const { default: OctokitFactory } = await import("../../implements/octokitFactory.js");

        await expect(OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests")).resolves.toBeDefined();
    });

    test("throws when octokit construction fails", async () => {
        jest.unstable_mockModule("@octokit/core", () => {
            return {
                Octokit: class {
                    constructor() {
                        throw new Error("construction test");
                    }
                }
            }
        });

        await import("@octokit/core");
        const { default: OctokitFactory } = await import("../../implements/octokitFactory.js");
        const { default: OctokitInitError } = await import("../../core/errors/octokitInitError.js");

        await expect(() => OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests"))
            .rejects
            .toThrow(OctokitInitError)
    });

    test("throws when GitHub App is not installed in repository", async () => {
        // Create mock octokit
        jest.unstable_mockModule("@octokit/core", () => {
            return {
                Octokit: class {
                    constructor() {}
                    // @ts-ignore
                    request = jest.fn().mockRejectedValue(new Error("Test"));
                }
            }
        });

        await import("@octokit/core");
        const { default: OctokitFactory } = await import("../../implements/octokitFactory.js");
        const { default: AppNotInstalledError } = await import("../../core/errors/appNotInstalledError.js");


        await expect(OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests"))
            .rejects
            .toThrow(AppNotInstalledError);
    });

    test("throws when authentication fails", async () => {
        jest.unstable_mockModule("@octokit/core", () => {
            const MockOctokit = jest.fn()
                .mockImplementationOnce(() => ({
                    // @ts-ignore
                    request: jest.fn().mockResolvedValue({
                        data: { id: "SomeInstallationId" }
                    })
                }))
                .mockImplementationOnce(() => {
                    throw new Error("authentication test");
                });

            return { Octokit: MockOctokit }
        });

        await import ("@octokit/core");
        const { default: OctokitFactory } = await import("../../implements/octokitFactory.js");
        const { default: OctokitInitError } = await import("../../core/errors/octokitInitError.js");

        await expect(OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests"))
            .rejects
            .toThrow(OctokitInitError)
    })
});