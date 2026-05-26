import type IRepoInfo from "../core/actionInfo/IRepoInfo.js";
import type IPrInfo from "../core/actionInfo/IPrInfo.js";
import type {ActionEvent} from "../core/actionEvent/actionEvent.js";

export default class RepoInfo implements IRepoInfo
{
    private readonly _name: string;
    private readonly _pr: IPrInfo
    private readonly _user: string;
    private readonly _owner: string;
    private readonly _cloneUrl: string;

    public constructor(
        prInfo: IPrInfo,
        event: ActionEvent)
    {
        this._owner = event.repository.owner.login;
        this._name = event.repository.name;
        this._user = event.sender.login;
        this._pr = prInfo;
        this._cloneUrl = event.repository.clone_url;

        return this;
    }

    public get Name(): string
    {
        return this._name;
    }

    public get Owner(): string
    {
        return this._owner;
    }

    public get User(): string
    {
        return this._user;
    }

    public get Pr(): IPrInfo {
        return this._pr;
    }

    public get CloneUrl(): string
    {
        return this._cloneUrl;
    }
}