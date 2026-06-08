import { ActionEventType } from "../core/actionEvent/actionEventType.js";
import type IOptions from "../core/actionInfo/IOptions.js";
import type IEventInfo from "../core/actionInfo/IEventInfo.js";
import type { ActionEvent } from "../core/actionEvent/actionEvent.js";
import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
export default class EventInfo implements IEventInfo {
    private readonly _eventActionMap;
    private _options;
    private _apiCaller?;
    get ApiCaller(): IApiCaller;
    set ApiCaller(value: IApiCaller);
    private readonly _event;
    get Event(): ActionEvent;
    private readonly _eventType;
    get EventType(): ActionEventType;
    private _commandInvoked?;
    get CommandInvoked(): boolean;
    private _commentBody?;
    get CommentBody(): string | null;
    private _isPossible?;
    GetIsPossible: (repo: IRepoInfo) => Promise<boolean>;
    private _userHasPerms?;
    GetUserHasPerms: (repo: IRepoInfo) => Promise<boolean>;
    private _shouldExit;
    get ShouldExit(): boolean;
    set ShouldExit(value: boolean);
    private _user;
    get User(): string;
    constructor(options: IOptions, eventPath: string);
}
//# sourceMappingURL=eventInfo.d.ts.map