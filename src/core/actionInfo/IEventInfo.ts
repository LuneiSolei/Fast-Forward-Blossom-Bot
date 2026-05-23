import type {Octokit} from "@octokit/core";
import type {ActionEventType} from "../actionEvent/actionEventType.js";
import type IRepoInfo from "./IRepoInfo.js";
import type {ActionEvent} from "../actionEvent/actionEvent.js";

export default interface IEventInfo
{
    get Octokit(): Octokit;
    get ShouldExit(): boolean;
    set ShouldExit(value: boolean);
    UserHasPerms: (repo: IRepoInfo) => Promise<boolean>;
    IsPossible: (repo: IRepoInfo) => Promise<boolean>;
    get CommentBody(): string;
    get CommandInvoked(): boolean;
    get EventType(): ActionEventType;
    get Event(): ActionEvent;
}