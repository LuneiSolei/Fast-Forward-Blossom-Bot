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
    get MergeBaseSha(): string;
    get MergeBaseParentsAmount(): number
    get PrNodeId(): string;
    get BaseNodeId(): string;
    get HeadNodeId(): string;
    get IssueNumber(): number;
    SetEvent(
        event: ActionEvent,
        eventType: ActionEventType): void;
}