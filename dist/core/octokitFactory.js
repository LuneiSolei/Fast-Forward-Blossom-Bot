import { Octokit } from "@octokit/core";
import Logger from "./logger/logger.js";
import { createAppAuth } from "@octokit/auth-app";
import fs from "node:fs";
export default class OctokitFactory {
    static async Create(owner, repoName) {
        Logger.Debug("Creating Octokit instance...");
        const APP_ID = process.env["APP_CLIENT_ID"];
        const PRIVATE_KEY = fs.readFileSync(process.env["APP_PRIVATE_KEY_PATH"], "utf8");
        // Create Octokit JWT
        let octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: APP_ID,
                privateKey: PRIVATE_KEY
            }
        });
        Logger.Debug(`Getting installation key for ${owner}'s ${repoName}`);
        // Find repo installation
        let res;
        try {
            res = await octokit.request("GET /repos/{owner}/{repo}/installation", { owner, repo: repoName });
        }
        catch (error) {
            Logger.AppNotInstalledError(owner, repoName);
        }
        // Exchange installation ID for installation token
        const appAuth = createAppAuth({
            appId: APP_ID,
            privateKey: PRIVATE_KEY,
            installationId: res.data.id
        });
        const authRes = await appAuth({ type: "installation" });
        if (!authRes.token)
            Logger.InvalidInstallationTokenError();
        // Authenticate as app
        octokit = new Octokit({ auth: authRes.token });
        Logger.Debug("Done!");
        return octokit;
    }
}
//# sourceMappingURL=octokitFactory.js.map