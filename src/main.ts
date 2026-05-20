import * as core from "@actions/core";
import {run_prechecks} from "./prechecks.js";
import Authenticator from "./authenticator.js";
import EventParser from "./eventParser.js";
import State from "./state.js";
import type {ActionInfo} from "./actionInfo.js";
import Comment from "./comment.js";
import Git from "./git.js";
import {execFile} from "node:child_process";

export default class Main
{
    private static _comment: string[] = [];

    public static async run()
    {
        let info: ActionInfo = {
            octokit: undefined as any,
            repo: EventParser.GetRepository(),
            pr: EventParser.GetPullRequest(),
            isPossible: null,
            userHasPerms: null,
            mergeBaseCommit: null
        }
        run_prechecks();
        await Git.CloneRepo(info.repo);
        // Authenticate
        info.octokit = await Authenticator.GetOctokit(info);

        // Verify state
        info.userHasPerms = await State.UserHasPerms(info);
        info.isPossible = await State.FastForwardIsPossible(info);

        await Comment.AddVerifyingLine(info.pr, this._comment);
        await Comment.AddShellBlocks(info, this._comment);
        await Comment.AddPerformingLine(info, this._comment);

        core.info(this._comment.join("\n"));

        this.Cleanup(info);
    }

    private static Cleanup(info: ActionInfo) {
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