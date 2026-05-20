import {Octokit} from "@octokit/core";
import {createAppAuth} from "@octokit/auth-app";
import * as core from "@actions/core";
import * as fs from "node:fs";
import type {ActionInfo} from "./actionInfo.js";

export default class Authenticator {
    private static _octokit: Octokit;

    public static async GetOctokit(info: ActionInfo): Promise<Octokit>
    {
        if (!this._octokit) {
            const APP_ID = process.env.APP_CLIENT_ID as string;
            const PRIVATE_KEY = fs.readFileSync(process.env.APP_PRIVATE_KEY_PATH as string, "utf8");

            // Create Octokit JWT
            const octokit = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    appId: APP_ID,
                    privateKey: PRIVATE_KEY
                }
            });

            // Find repo installation
            const { data: {id: installationId} } = await octokit.request(
                "GET /repos/{owner}/{repo}/installation",
                { owner: info.repo.owner.login, repo: info.repo.name }
            );

            // Exchange installation ID for installation token
            const appAuth = createAppAuth({
                appId: APP_ID,
                privateKey: PRIVATE_KEY,
                installationId
            });
            const token = (await appAuth({type: "installation"})).token;
            if (!token) core.error("Failed to obtain installation token.");

            // Authenticate as app
            process.env.APP_INSTALLATION_TOKEN = token;
            this._octokit = new Octokit({ auth: token });
        }

        return this._octokit;
    }
}