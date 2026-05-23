import type {Octokit} from "@octokit/core";
import type {ActionEventType} from "../actionEvent/actionEventType.js";
import type {ActionEvent} from "../actionEvent/actionEvent.js";

export default interface IPrInfo
{
    FinishInitialization(
        octokit: Octokit,
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
    get NodeId(): string;
    SetEvent(
        event: ActionEvent,
        eventType: ActionEventType): void;
}