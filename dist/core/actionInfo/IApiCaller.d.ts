import type { IApiCompareResponse } from "../githubApi/IApiCompareResponse.js";
import type ICommit from "../ICommit.js";
import type { IGraphQlPrResponse } from "../githubApi/IGraphQlPrResponse.js";
import type { IGraphQlCollaboratorResponse } from "../githubApi/IGraphQlCollaboratorResponse.js";
export default interface IApiCaller {
    GetPullRequest(owner: string, repoName: string, prNumber: number): Promise<IGraphQlPrResponse>;
    GetBaseHeadComparison(owner: string, repoName: string, baseSha: string, headLabel: string): Promise<IApiCompareResponse>;
    GetCollaborator(owner: string, repoName: string, user: string): Promise<IGraphQlCollaboratorResponse>;
    PostComment(nodeId: string, comment: string): Promise<void>;
    GetCommit(owner: string, repoName: string, sha: string): Promise<ICommit>;
    GetNodeId(owner: string, repoName: string, qualifiedName: string): Promise<string>;
    FastForward(nodeId: string, oid: string): Promise<void>;
}
//# sourceMappingURL=IApiCaller.d.ts.map