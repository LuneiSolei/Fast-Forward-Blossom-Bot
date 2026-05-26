import * as core from "@actions/core";

export default class Options {
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
        this._postComment = Options.GetPostComment();

        return this;
    }

    private static GetPostComment(): string
    {
        const comment: string = core.getInput("post_comment", this._options);
        switch (comment) {
            case "always":
            case "on-error":
            case "never":
                return comment;
            default:
                core.setFailed(`Invalid value '${comment}' for workflow input 'comment'`);
                throw new TypeError();
        }
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