import {Octokit} from "@octokit/core";
import {createAppAuth} from "@octokit/auth-app";
import fs from "node:fs";
import * as core from "@actions/core";
import AppNotInstalledError from "../core/errors/appNotInstalledError.js";
import OctokitInitError from "../core/errors/octokitInitError.js";

export default class OctokitFactory
{
    public static async Create(owner: string, repoName: string): Promise<Octokit>
    {
        core.debug("Creating Octokit instance...");
        const appId = process.env["APP_CLIENT_ID"] as string;
        if (appId === undefined)
        {
            throw new OctokitInitError("GitHub App Client ID could not be obtained.");
        }

        let privateKey;
        if (process.env["APP_PRIVATE_KEY_PATH"] as string)
        {
            privateKey = fs.readFileSync(process.env["APP_PRIVATE_KEY_PATH"] as string, "utf8");
        } else {
            privateKey = process.env["APP_PRIVATE_KEY"] as string;
        }

        if (privateKey === undefined)
        {
            throw new OctokitInitError("GitHub App Private Key could not be obtained.");
        }

        let octokit: Octokit;

        // Create Octokit JWT
        try {
            octokit = new Octokit({
                authStrategy: createAppAuth,
                auth: { appId, privateKey }
            });
        } catch (error) {
            throw new OctokitInitError((error as Error).message);
        }

        core.debug(`Getting installation key for ${owner}'s ${repoName}`);

        // Find repo installation ID
        let installationId: number;
        try {
            const res = await octokit.request(
                "GET /repos/{owner}/{repo}/installation",
                { owner, repo: repoName }
            );
            installationId = res.data.id;
        } catch (error) {
            throw new AppNotInstalledError(owner, repoName, (error as Error).message);
        }

        // Authenticate - Octokit should automatically handle getting an installation token using the installation ID
        try
        {
            return new Octokit({
                authStrategy: createAppAuth,
                auth: { appId, privateKey, installationId }
            });
        } catch (error) {
            throw new OctokitInitError((error as Error).message);
        }
    }
}