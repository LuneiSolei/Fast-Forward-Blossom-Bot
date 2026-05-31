import * as core from "@actions/core";
import ActionInfo from "../implements/actionInfo.js";
import CommentBuilder from "../implements/commentBuilder.js";
import Git from "../core/git.js";
import {execFile} from "node:child_process";
import PrInfo from "../implements/prInfo.js";
import Options from "../implements/options.js";
import EventInfo from "../implements/eventInfo.js";
import RepoInfo from "../implements/repoInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import ApiCaller from "../implements/apiCaller.js";

export default class Main
{
    public static async run()
    {
        // Ensure we're running via GitHub Actions
        if (!process.env["GITHUB_EVENT_PATH"])
        {
            core.setFailed("GITHUB_EVENT_PATH environment variable not set. This script is intended to be run within a "
                + "GitHub Actions workflow.");
            process.exit(1);
        }

        let info: IActionInfo = await ActionInfo.Create(
            PrInfo,
            Options,
            EventInfo,
            RepoInfo
        );

        // Was custom command invoked?
        if (info.Event.CommandInvoked)
        {
            // This is an issue comment event, but the command was not invoked, so do nothing.
            process.exit(0);
        }

        // Clone the repo locally
        Git.CloneRepo(info.Repo.CloneUrl);

        // Create comment
        const comment= await new CommentBuilder(info, ApiCaller.GetCommit).Build();

        if (info.Options.PostComment == "always" || "on-error")
        {
            await ApiCaller.PostComment(info.Repo.Pr.NodeId, comment);
        }

        this.Cleanup();
    }

    private static Cleanup() {
        core.info("Performing Cleanup...");

        const cwd = process.cwd();
        execFile("rm", ["-r", `./tmp/`], { cwd }, (error, _, stderr) => {
            if (error) core.error(stderr);
        });
    }
}

// Used implicitly via "@github/local-action"
// noinspection JSUnusedGlobalSymbols
export async function run() {
    await Main.run().catch(err => core.error(err));
}