import {beforeEach, describe, expect, jest, test} from "@jest/globals";

beforeEach(() => {
    jest.resetModules();
});

describe("Create()", () => {
    test("throws when octokit construction fails", async () => {
        jest.unstable_mockModule("@octokit/core", () => {
            return {
                Octokit: class {
                    constructor() {
                        throw new OctokitInitError("Test");
                    }
                }
            }
        });

        await import("@octokit/core");
        const { default: OctokitFactory } = await import("../core/octokitFactory.js");
        const { default: OctokitInitError } = await import("../core/errors/OctokitInitError.js");

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
        const { default: OctokitFactory } = await import("../core/octokitFactory.js");
        const { default: AppNotInstalledError } = await import("../core/errors/appNotInstalledError.js");


        await expect(OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests"))
            .rejects
            .toThrow(AppNotInstalledError);
    });

    test("throws when installation token could not be obtained", async () => {
        // Create mock octokit
        const mockResponse = {
            headers: {},
            status: 200,
            url: "",
            data: {
                id: "some id"
            }
        }

        jest.unstable_mockModule("@octokit/core", () => {
            return {
                Octokit: class {
                    constructor() {}
                    // @ts-ignore
                    request = jest.fn().mockResolvedValue(mockResponse);
                }
            }
        });

        jest.unstable_mockModule("@octokit/auth-app", () => {
            // @ts-ignore
            const appAuthFn = jest.fn().mockRejectedValue({ });
            return {
                // @ts-ignore
                createAppAuth: jest.fn(() => appAuthFn)
            }
        });

        await import("@octokit/core");
        await import("@octokit/auth-app");
        const {default: InvalidInstallationTokenError} = await import("../core/errors/invalidInstallationTokenError.js");
        const { default: OctokitFactory } = await import("../core/octokitFactory.js");

        await expect(OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests"))
            .rejects
            .toThrow(InvalidInstallationTokenError)
    });

    test("throws when installation token does not exist", async () => {
        // Create mock octokit
        const mockResponse = {
            headers: {},
            status: 200,
            url: "",
            data: {
                id: "some id"
            }
        }

        jest.unstable_mockModule("@octokit/core", () => {
            return {
                Octokit: class {
                    constructor() {}
                    // @ts-ignore
                    request = jest.fn().mockResolvedValue(mockResponse);
                }
            }
        });

        jest.unstable_mockModule("@octokit/auth-app", () => {
            return {
                // @ts-ignore
                createAppAuth: jest.fn(() => jest.fn().mockResolvedValue({token: null}))
            }
        });

        await import("@octokit/core");
        await import("@octokit/auth-app");
        const {default: InvalidInstallationTokenError} = await import("../core/errors/invalidInstallationTokenError.js");
        const { default: OctokitFactory } = await import("../core/octokitFactory.js");

        await expect(() => OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests"))
            .rejects
            .toThrow(InvalidInstallationTokenError);
    });
});