import {exec} from "node:child_process";
import * as core from "@actions/core";
import type {Repository} from "@octokit/webhooks-types";
import type RepoInfo from "./repoInfo.js";

export default class Git
{
    public static async Exec(args: string[]): Promise<string>
    {
        return new Promise((resolve, reject) => {
            exec("git ".concat(args.join(' ')), (err, stdout, stderr) => {
                if (err) return reject(stderr || err);
                resolve(stdout);
            });
        });
    }

    public static async CloneRepo(cloneUrl: string): Promise<string> {
        core.info(`Cloning repo from ${cloneUrl}...`);

        // Move to tmp directory
        await new Promise((resolve, reject) => {
            exec("mkdir -p ./tmp", (err, stdout, stderr) => {
                if (err) return reject(stderr || err);
                resolve(stdout);
            });
        });

        // Clone repo
        await this.Exec(["clone", cloneUrl, "./tmp/repo"]);

        // Move into newly cloned repo
        return new Promise((resolve, reject) => {
            exec(`cd ./tmp/repo`, (err, stdout, stderr) => {
                if (err) return reject(stderr || err);
                resolve(stdout);
            });
        });
    }

    public static async Log(exclude: string, baseSha: string, headSha: string): Promise<string> {
        return await this.Exec([
            "log",
            "--pretty=oneline",
            "--graph",
            `${exclude}`,
            baseSha,
            headSha
        ]);
    }
}