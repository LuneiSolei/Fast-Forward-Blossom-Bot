import type IOptions from "../core/actionInfo/IOptions.js";
export default class Options implements IOptions {
    private static _options;
    private _autoMerge?;
    private _postComment?;
    private _customCommand?;
    get AutoMerge(): boolean;
    get CustomCommand(): string;
    get PostComment(): string;
}
//# sourceMappingURL=options.d.ts.map