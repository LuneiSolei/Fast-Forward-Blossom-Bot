import * as core from "@actions/core";
import InvalidInputValueError from "../core/errors/invalidInputValueError.js";
export default class Options {
    static _options = {
        required: true,
        trimWhitespace: true
    };
    _autoMerge;
    _postComment;
    _customCommand;
    get AutoMerge() {
        if (this._autoMerge)
            return this._autoMerge;
        this._autoMerge = core.getBooleanInput("auto_merge", Options._options);
        return this._autoMerge;
    }
    get CustomCommand() {
        if (this._customCommand)
            return this._customCommand;
        this._customCommand = core.getInput("custom_command", Options._options);
        return this._customCommand;
    }
    get PostComment() {
        if (this._postComment)
            return this._postComment;
        this._postComment = core.getInput("post_comment", Options._options);
        if (this._postComment !== "always" && this._postComment !== "on-error" && this._postComment !== "never") {
            throw new InvalidInputValueError("post_comment", this._postComment, "Input 'post_comment' can only be \"always\", \"on-error\", or \"never\"");
        }
        return this._postComment;
    }
}
//# sourceMappingURL=options.js.map