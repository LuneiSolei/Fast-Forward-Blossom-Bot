import type {Octokit} from "@octokit/core";
import type {Commit} from "../core/commit.js";

export default class ApiCaller
{
    private static _octokit: Octokit;
    public static set Octokit(value: Octokit)
    {
        this._octokit = value;
    }

    public static async PostComment(nodeId: string, comment: string)
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

    public static async GetCommit(owner: string, repoName: string, sha: string): Promise<Commit>
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
            { owner, repoName, sha });
    }
}