import * as core from "@actions/core";
import ActionInfo from "../implements/actionInfo.js";
import Comment from "../implements/comment.js";
import Git from "../core/git.js";
import {execFile} from "node:child_process";
import {ValidEvent} from "../core/validEvent.js";

export default class Main
{
    public static async run()
    {
        // Ensure we're running via GitHub Actions
        if (!process.env.GITHUB_EVENT_PATH)
        {
            core.setFailed("GITHUB_EVENT_PATH environment variable not set. This script is intended to be run within a "
                + "GitHub Actions workflow.");
            process.exit(1);
        }

        let comment: string[] = [];
        let info: ActionInfo = new ActionInfo();

        // Was custom command invoked?
        if (info.Event.CommandInvoked)
        {
            // This is an issue comment event, but the command was not invoked, so do nothing.
            process.exit(0);
        }

        // Clone the repo locally
        await Git.CloneRepo(info.Repo.CloneUrl);

        // Verify state
        // TODO: rewrite comment formatting code
        comment.push(Comment.AddVerifyingLine(info.pr));
        comment.concat(await Comment.AddShellBlocks(info));

        if (!info.Event.IsPossible)
        {
            // Fast-forward is not possible
            comment.concat(await Comment.AddNotPossibleLines(info));
            info.Event.ShouldExit = true;
        }
        else if (!core.getBooleanInput("auto_merge"))
        {
            // Fast-forward is possible, but auto_merge is disabled
            comment.push(Comment.AddAutoMergeDisabledLine());
            info.Event.ShouldExit = true;
        }
        else if (!info.Event.UserHasPerms)
        {
            // User does not have proper permission(s)
            comment.push(Comment.AddNoPermsLine(info));
            info.Event.ShouldExit = true;
        }
        else if (!info.Event.CommandInvoked && info.Event.EventType === ValidEvent.PullRequestOpened) {
            // This is a pull request opened event, but the command was not invoked.
            comment.push(Comment.AddCommandNotInvokedLine());
            info.Event.ShouldExit = true;
        }

        if (core.getBooleanInput("post_comment")) {
            Comment.PostComment(info, comment).then(r => {return} );
        }

        core.info(comment.join("\n"));

        this.Cleanup();
    }

    private static Cleanup() {
        core.info("Performing Cleanup...");

        const cwd = process.cwd();
        const out = execFile("rm", ["-r", `./tmp/`], { cwd }, (error, stdout, stderr) => {
            if (error) core.error(stderr);
        });
    }
}

// Used implicitly via "@github/local-action"
export async function run() {
    await Main.run().catch(err => core.error(err));
}