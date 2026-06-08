export default class RepoInfo {
    _name;
    _pr;
    _owner;
    _cloneUrl;
    constructor(prInfo, event) {
        this._owner = event.repository.owner.login;
        this._name = event.repository.name;
        this._pr = prInfo;
        this._cloneUrl = event.repository.clone_url;
        return this;
    }
    get Name() {
        return this._name;
    }
    get Owner() {
        return this._owner;
    }
    get Pr() {
        return this._pr;
    }
    get CloneUrl() {
        return this._cloneUrl;
    }
}
//# sourceMappingURL=repoInfo.js.map