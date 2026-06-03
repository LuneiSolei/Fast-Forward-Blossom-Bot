import type {Octokit} from "@octokit/core";
import type ICommit from "../core/ICommit.js";
import type IApiCaller from "../core/actionInfo/IApiCaller.js";
import type {IApiCompareResponse} from "../core/githubApi/IApiCompareResponse.js";
import type {IGraphQlPrResponse} from "../core/githubApi/IGraphQlPrResponse.js";
import type {IGraphQlCollaboratorResponse} from "../core/githubApi/IGraphQlCollaboratorResponse.js";

export default class ApiCaller implements IApiCaller
{
    private _octokit: Octokit;

    public constructor(octokit: Octokit)
    {
        this._octokit = octokit;
    }

    public async GetPullRequest(owner: string, repoName: string, prNumber: number): Promise<IGraphQlPrResponse>
    {
        return await this._octokit.graphql(`
            query($owner: String!, $repoName: String!, $prNumber: Int!) {
                repository(owner: $owner, name: $repoName) {
                    pullRequest(number: $prNumber) {
                        baseRefName
                        baseRefOid
                        headRefName
                        headRefOid
                        headRepository {
                            name
                        }
                        headRepositoryOwner {
                            login
                        }
                        id
                    }
                }
            }        
        `, { owner, repoName, prNumber });
    }

    public async GetBaseHeadComparison(owner: string, repoName: string, baseSha: string, headLabel: string): Promise<IApiCompareResponse>
    {
        return await this._octokit.request("GET /repos/{owner}/{repo}/compare/{basehead}", {
            owner: owner,
            repo: repoName,
            basehead: `${baseSha}...${headLabel}`
        });
    }

    public async GetCollaborator(owner: string, repoName: string, user: string): Promise<IGraphQlCollaboratorResponse>
    {
        return await this._octokit.graphql(`
                query($owner: String!, $repoName: String!, $user: String!) {
                    repository(owner: $owner, name: $repoName) {
                        collaborators(login: $user) {
                            totalCount
                        }
                    }
                }
            `, { owner, repoName, user });
    }

    public async PostComment(nodeId: string, comment: string): Promise<void>
    {
        // Construct JSON comment
        await this._octokit.graphql(`
            mutation AddComment($input: AddCommentInput!) {
                addComment(input: $input) {
                    clientMutationId
                }
            }
        `, {
            input: {
                body: comment,
                clientMutationId: nodeId
            }
        });
    }

    public async GetCommit(owner: string, repoName: string, sha: string): Promise<ICommit>
    {
        return await this._octokit.graphql(`
            query($owner: String!, $repoName: String!, $sha: GitObjectID!) {
                repository(owner: $owner, name: $repoName) {
                    object(oid: $sha) {
                        ... on Commit {
                            oid
                            message
                            committedDate
                            author {
                                name
                                email
                            }
                            associatedPullRequests(first: 1) { 
                                nodes {
                                    headRefName
                                    baseRefName
                                }
                            }
                        }
                    }
                }
            }`,
            {owner, repoName, sha});
    }
}