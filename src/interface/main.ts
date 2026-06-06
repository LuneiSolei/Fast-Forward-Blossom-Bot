import * as core from "@actions/core";
import CommentBuilder from "../implements/commentBuilder.js";
import Git from "../core/git.js";
import {execFile} from "node:child_process";
import PrInfo from "../implements/prInfo.js";
import Options from "../implements/options.js";
import EventInfo from "../implements/eventInfo.js";
import RepoInfo from "../implements/repoInfo.js";
import type IActionInfo from "../core/actionInfo/IActionInfo.js";
import ApiCaller from "../implements/apiCaller.js";
import ActionInfoFactory from "../implements/actionInfoFactory.js";

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

        let info: IActionInfo = await ActionInfoFactory.Create(
            PrInfo,
            Options,
            EventInfo,
            RepoInfo,
            ApiCaller
        );

        // Was custom command invoked?
        if (info.Event.CommandInvoked)
        {
            // This is an issue comment event, but the command was not invoked, so do nothing.
            core.info("Command not invoked. Skipping...");
            process.exit(0);
        }

        // Clone the repo locally
        Git.CloneRepo(info.Repo.CloneUrl);

        // Create comment
        const comment = await new CommentBuilder(info, info.ApiCaller.GetCommit).Build();

        // Check if we must exit early
        const shouldPostComment = info.Options.PostComment === "always" || info.Options.PostComment === "on-error";
        if (info.Event.ShouldExit)
        {
            // There is some reason we cannot proceed. Comment output should contain reason.
            if (shouldPostComment) await info.ApiCaller.PostComment(info.Repo.Pr.PrNodeId, comment);

            process.exit(0);
        }

        // Perform fast-forward
        // info.ApiCaller.FastForward();

        // TODO: detect comment posting conditions
        if (info.Options.PostComment == "always" || "on-error")
        {
            await info.ApiCaller.PostComment(info.Repo.Pr.PrNodeId, comment);
        }

        // TODO: perform fast-forward locally(?)
        //  Or perhaps see if graphql/rest APIs support doing so remotely

        this.Cleanup();
    }

    private static Cleanup() {
        core.info("Performing Cleanup...");

        const cwd = process.cwd();
        execFile("rm", ["-r", `./tmp/repo/*`], { cwd }, (error, _, stderr) => {
            if (error) core.error(stderr);
        });
    }
}

// Used implicitly via "@github/local-action"
// noinspection JSUnusedGlobalSymbols
export async function run() {
    await Main.run().catch(err => core.error(err));
}