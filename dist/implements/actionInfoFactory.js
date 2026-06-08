import * as core from "@actions/core";
import ActionInfo from "./actionInfo.js";
import UnknownReferenceError from "../core/errors/unknownReferenceError.js";
import OctokitFactory from "./octokitFactory.js";
export default class ActionInfoFactory {
    static async Create(prInfo, options, eventInfo, repoInfo, apiCaller, octokit) {
        core.debug("Constructing new ActionInfo instance...");
        core.debug("Retrieving options...");
        const newOptions = this.isConstructor(options)
            ? new options()
            : options;
        core.debug("Done!");
        // Get basic info first
        core.debug("Retrieving basic event info...");
        const eventPath = process.env["GITHUB_EVENT_PATH"];
        if (!eventPath)
            throw new UnknownReferenceError("GITHUB_EVENT_PATH", "Environment variable GITHUB_EVENT_PATH is required");
        const newEventInfo = (this.isConstructor(eventInfo)
            ? new eventInfo(newOptions, eventPath)
            : eventInfo);
        core.debug("Done!");
        core.debug("Retrieving basic pull request info...");
        const newPrInfo = this.isConstructor(prInfo)
            ? new prInfo()
            : prInfo;
        newPrInfo.SetEvent(newEventInfo.Event, newEventInfo.EventType);
        core.debug("Done!");
        core.debug("Retrieving basic repository info...");
        const newRepo = (this.isConstructor(repoInfo)
            ? new repoInfo(newPrInfo, newEventInfo.Event)
            : repoInfo);
        core.debug("Done!");
        // Assign octokit to ApiCaller
        const newOctokit = (this.isConstructor(apiCaller) && !octokit)
            ? await OctokitFactory.Create(newRepo.Owner, newRepo.Name)
            : octokit;
        const newApiCaller = (this.isConstructor(apiCaller)
            ? new apiCaller(newOctokit)
            : apiCaller);
        // Get any authentication required info
        await newRepo.Pr.FinishInitialization(newApiCaller, newEventInfo.Event, newEventInfo.EventType);
        newEventInfo.ApiCaller = newApiCaller;
        return new ActionInfo(newApiCaller, newRepo, newOptions, newEventInfo);
    }
    static isConstructor(value) {
        if (typeof value !== "function")
            return false;
        return /^\s*class\s+/.test(value.toString());
    }
}
//# sourceMappingURL=actionInfoFactory.js.map