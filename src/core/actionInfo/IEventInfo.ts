import type {ActionEventType} from "../actionEvent/actionEventType.js";
import type IRepoInfo from "./IRepoInfo.js";
import type {ActionEvent} from "../actionEvent/actionEvent.js";

export default interface IEventInfo
{
    get ShouldExit(): boolean;
    set ShouldExit(value: boolean);
    GetUserHasPerms: (repo: IRepoInfo) => Promise<boolean>;
    GetIsPossible: (repo: IRepoInfo) => Promise<boolean>;
    get CommentBody(): string | null;
    get CommandInvoked(): boolean;
    get EventType(): ActionEventType;
    get Event(): ActionEvent;
    get User(): string;
}