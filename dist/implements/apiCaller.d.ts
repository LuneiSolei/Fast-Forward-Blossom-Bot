import type { Octokit } from "@octokit/core";
import type ICommit from "../core/ICommit.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import type { IApiCompareResponse } from "../core/githubApi/IApiCompareResponse.js";
import type { IGraphQlPrResponse } from "../core/githubApi/IGraphQlPrResponse.js";
import type { IGraphQlCollaboratorResponse } from "../core/githubApi/IGraphQlCollaboratorResponse.js";
export default class ApiCaller implements IApiCaller {
    private _octokit;
    constructor(octokit: Octokit);
    GetPullRequest(owner: string, repoName: string, prNumber: number): Promise<IGraphQlPrResponse>;
    GetBaseHeadComparison(owner: string, repoName: string, baseSha: string, headLabel: string): Promise<IApiCompareResponse>;
    GetCollaborator(owner: string, repoName: string, user: string): Promise<IGraphQlCollaboratorResponse>;
    PostComment(nodeId: string, comment: string): Promise<void>;
    GetCommit(owner: string, repoName: string, sha: string): Promise<ICommit>;
    GetNodeId(owner: string, repoName: string, qualifiedName: string): Promise<string>;
    FastForward(nodeId: string, oid: string): Promise<void>;
}
//# sourceMappingURL=apiCaller.d.ts.map