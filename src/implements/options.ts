import * as core from "@actions/core";
import type IOptions from "../core/actionInfo/IOptions.js";

export default class Options implements IOptions {
    private static _options: core.InputOptions = {
        required: true,
        trimWhitespace: true
    };

    private readonly _autoMerge: boolean;
    private readonly _postComment: string;
    private readonly _customCommand: string;

    public constructor() {
        this._autoMerge = core.getBooleanInput("auto_merge", Options._options);
        this._customCommand = core.getInput("custom_command", Options._options);
        this._postComment = core.getInput("post_comment", Options._options);

        if (this._postComment !== "always" && this._postComment !== "on-error" && this._postComment !== "never") {
            core.setFailed(`Invalid value '${this._postComment}' for workflow input 'comment'`)
        }

        return this;
    }

    public get AutoMerge(): boolean
    {
        return this._autoMerge;
    }

    public get CustomCommand(): string
    {
        return this._customCommand;
    }

    public get PostComment(): string
    {
        return this._postComment;
    }
}