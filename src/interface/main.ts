import * as core from "@actions/core";
import ActionInfo from "../implements/actionInfo.js";
import CommentFormatter from "../implements/commentFormatter.js";
import Git from "../core/git.js";
import {execFile} from "node:child_process";
import {ActionEventType} from "../core/actionEvent/actionEventType.js";
import PrInfo from "../implements/prInfo.js";
import Options from "../implements/options.js";
import EventInfo from "../implements/eventInfo.js";
import RepoInfo from "../implements/repoInfo.js";

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

        let info: ActionInfo = await ActionInfo.Create(
            PrInfo,
            Options,
            EventInfo,
            RepoInfo
        )

        // Was custom command invoked?
        if (info.Event.CommandInvoked)
        {
            // This is an issue comment event, but the command was not invoked, so do nothing.
            process.exit(0);
        }

        // Clone the repo locally
        Git.CloneRepo(info.Repo.CloneUrl);

        // Verify state
        // TODO: rewrite comment formatting code
        const commentFormatter = new CommentFormatter(info.Repo.Pr);

        commentFormatter.AddVerifyingLine();
        await commentFormatter.AddShellBlocks(info.Octokit, info.Repo);

        if (!info.Event.IsPossible)
        {
            // Fast-forward is not possible
            commentFormatter.AddNotPossibleLines(info.Repo.Pr);
            info.Event.ShouldExit = true;
        }
        else if (!core.getBooleanInput("auto_merge"))
        {
            // Fast-forward is possible, but auto_merge is disabled
            commentFormatter.AddAutoMergeDisabledLine();
            info.Event.ShouldExit = true;
        }
        else if (!info.Event.UserHasPerms)
        {
            // User does not have proper permission(s)
            commentFormatter.AddNoPermsLine(info.Repo);
            info.Event.ShouldExit = true;
        }
        else if (!info.Event.CommandInvoked && info.Event.EventType === ActionEventType.PullRequestOpened) {
            // This is a pull request opened event, but the command was not invoked.
            commentFormatter.AddCommandNotInvokedLine();
            info.Event.ShouldExit = true;
        }

        if (core.getInput("post_comment") == "always" || "on-error") {
            await commentFormatter.PostComment(info.Octokit, info.Repo.Pr.NodeId);
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
export async function run() {
    await Main.run().catch(err => core.error(err));
}