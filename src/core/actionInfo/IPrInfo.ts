import type {ActionEventType} from "../actionEvent/actionEventType.js";
import type {ActionEvent} from "../actionEvent/actionEvent.js";
import type IApiCaller from "./IApiCaller.js";

export default interface IPrInfo
{
    FinishInitialization(
        apiCaller: IApiCaller,
        event: ActionEvent,
        eventType: ActionEventType): Promise<void>;
    get BaseRef(): string;
    get BaseSha(): string;
    get HeadRef(): string;
    get HeadSha(): string;
    get HeadLabel(): string;
    get HeadOwner(): string;
    get HeadRepo(): string;
    get MergeBaseSha(): string | undefined;
    get MergeBaseParentsAmount(): number
    get NodeId(): string;
    get IssueNumber(): number;
    SetEvent(
        event: ActionEvent,
        eventType: ActionEventType): void;
}