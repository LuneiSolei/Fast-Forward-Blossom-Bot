import {beforeEach, expect, jest, test} from "@jest/globals";

beforeEach(() => {
    jest.resetModules();
});

test("Create() throws when GitHub App is not installed in repository", async () => {
    // Create mock octokit
    jest.unstable_mockModule("@octokit/core", () => {
        return {
            Octokit: class {
                constructor() {

                }
                request() {
                    return Promise.reject(new Error("Not installed"))
                }
            }
        }
    });

    await import("@octokit/core");
    const { default: OctokitFactory } = await import("../core/octokitFactory.js");
    const { default: AppNotInstalledError } = await import("../core/logger/appNotInstalledError.js");

    await expect(OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests")).rejects.toThrow(AppNotInstalledError);
});

test("Create() throws when installation token could not be obtained", async () => {
    // Create mock octokit
    const mockRequest = {
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
                constructor() {

                }
                request() {
                    return Promise.resolve(mockRequest)
                }
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
    const {default: InvalidInstallationTokenError} = await import("../core/logger/invalidInstallationTokenError.js");

    const { default: OctokitFactory } = await import("../core/octokitFactory.js");

    await expect(OctokitFactory.Create("luneisolei", "Fast-Forward-Blossom-Bot-Tests"))
        .rejects
        .toThrow(InvalidInstallationTokenError)
});