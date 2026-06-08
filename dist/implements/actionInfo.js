export default class ActionInfo {
    _apiCaller;
    _repo;
    _options;
    _event;
    constructor(apiCaller, repo, options, event) {
        this._apiCaller = apiCaller;
        this._repo = repo;
        this._options = options;
        this._event = event;
    }
    get ApiCaller() {
        return this._apiCaller;
    }
    get Repo() {
        return this._repo;
    }
    get Options() {
        return this._options;
    }
    get Event() {
        return this._event;
    }
}
//# sourceMappingURL=actionInfo.js.map