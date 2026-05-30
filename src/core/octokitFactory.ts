import {Octokit} from "@octokit/core";
import {createAppAuth} from "@octokit/auth-app";
import fs from "node:fs";
import * as core from "@actions/core";
import AppNotInstalledError from "./errors/appNotInstalledError.js";
import InvalidInstallationTokenError from "./errors/invalidInstallationTokenError.js";
import OctokitInitError from "./errors/OctokitInitError.js";

export default class OctokitFactory
{
    public static async Create(owner: string, repoName: string): Promise<Octokit>
    {
        core.debug("Creating Octokit instance...");
        const APP_ID = process.env["APP_CLIENT_ID"] as string;
        const PRIVATE_KEY = fs.readFileSync(process.env["APP_PRIVATE_KEY_PATH"] as string, "utf8");
        let octokit: Octokit;

        // Create Octokit JWT
        try {
            octokit = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    appId: APP_ID,
                    privateKey: PRIVATE_KEY
                }
            });
        } catch (error) {
            throw new OctokitInitError((error as Error).message);
        }

        core.debug(`Getting installation key for ${owner}'s ${repoName}`);

        // Find repo installation
        let res;
        try {
            res = await octokit.request(
                "GET /repos/{owner}/{repo}/installation",
                { owner, repo: repoName }
            );
        } catch (error) {
            throw new AppNotInstalledError(owner, repoName, (error as Error).message);
        }

        // Exchange installation ID for installation token
        const appAuth = createAppAuth({
            appId: APP_ID,
            privateKey: PRIVATE_KEY,
            installationId: res.data.id
        });

        let authRes;
        try {
            authRes = await appAuth({type: "installation"})
        } catch(error) {
            throw new InvalidInstallationTokenError((error as Error).message);
        }

        if (!authRes.token) throw new InvalidInstallationTokenError("No token provided by Octokit response.");

        // Authenticate as app
        octokit = new Octokit({ auth: authRes.token });

        core.debug("Done!");
        return octokit;
    }
}