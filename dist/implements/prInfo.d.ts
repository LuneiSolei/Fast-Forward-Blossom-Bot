import { ActionEventType } from "../core/actionEvent/actionEventType.js";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type { ActionEvent } from "../core/actionEvent/actionEvent.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
export default class PrInfo implements IPrInfo {
    private _baseRef?;
    private _baseSha?;
    private _headRef?;
    private _headSha?;
    private _headLabel?;
    private _headOwner?;
    private _headRepo?;
    private _prNodeId?;
    private _headNodeId?;
    private _baseNodeId?;
    private _mergeBaseSha?;
    private _mergeBaseParentsAmount?;
    private _issueNumber?;
    SetEvent(event: ActionEvent, eventType: ActionEventType): void;
    FinishInitialization(apiCaller: IApiCaller, event: ActionEvent, eventType: ActionEventType): Promise<void>;
    private GetMergeBaseData;
    get IssueNumber(): number;
    get MergeBaseSha(): string;
    get MergeBaseParentsAmount(): number;
    get BaseRef(): string;
    get BaseSha(): string;
    get HeadRef(): string;
    get HeadSha(): string;
    get HeadLabel(): string;
    get PrNodeId(): string;
    get BaseNodeId(): string;
    get HeadNodeId(): string;
    get HeadOwner(): string;
    get HeadRepo(): string;
}
//# sourceMappingURL=prInfo.d.ts.map