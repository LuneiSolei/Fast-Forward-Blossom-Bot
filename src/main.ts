import * as core from "@actions/core";
import {run_prechecks} from "./prechecks.js";
import Authenticator from "./authenticator.js";
import EventParser from "./eventParser.js";
import State from "./state.js";
import type {PullRequest, Repository} from "@octokit/webhooks-types";
import type {ActionInfo} from "./actionInfo.js";
import Comment from "./comment.js";

export default class Main
{
    private static _comment: string[] = [];

    public static async run()
    {
        let info: ActionInfo = {
            octokit: undefined as any,
            repo: EventParser.GetRepository(),
            pr: EventParser.GetPullRequest(),
            isPossible: false,
            userHasPerms: false,
        }
        run_prechecks();

        // Authenticate
        info.octokit = await Authenticator.GetOctokit(info);

        // Verify state
        info.userHasPerms = await State.UserHasPerms(info);
        info.isPossible = await State.FastForwardIsPossible(info);

        await Comment.AddVerifyingLine(info.pr, this._comment);
        await Comment.AddShellBlocks(info, this._comment);
        await Comment.AddPerformingLine(info, this._comment);

        this.Cleanup(info);
    }
}

// Used implicitly via "@github/local-action"
export function run() {
    Main.run().catch(err => core.error(err));
}