import * as core from "@actions/core";
import type IOptions from "../core/actionInfo/IOptions.js";
import {Logger} from "../core/logger.js";

export default class Options implements IOptions {
    private static _options: core.InputOptions = {
        required: true,
        trimWhitespace: true
    };

    private _autoMerge?: boolean;
    private _postComment?: string;
    private _customCommand?: string;

    public get AutoMerge(): boolean
    {
        if (this._autoMerge) return this._autoMerge;

        this._autoMerge = core.getBooleanInput("auto_merge", Options._options);
        return this._autoMerge;
    }

    public get CustomCommand(): string
    {
        if (this._customCommand) return this._customCommand;

        this._customCommand = core.getInput("custom_command", Options._options);
        return this._customCommand;
    }

    public get PostComment(): string
    {
        if (this._postComment) return this._postComment;

        this._postComment = core.getInput("post_comment", Options._options);

        if (this._postComment !== "always" && this._postComment !== "on-error" && this._postComment !== "never") {
            Logger.InvalidWorkflowValueError("post_comment", this._postComment, 1);
        }

        return this._postComment;
    }
}