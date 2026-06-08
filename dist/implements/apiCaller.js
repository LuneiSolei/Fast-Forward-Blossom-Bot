export default class ApiCaller {
    _octokit;
    constructor(octokit) {
        this._octokit = octokit;
    }
    async GetPullRequest(owner, repoName, prNumber) {
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
    async GetBaseHeadComparison(owner, repoName, baseSha, headLabel) {
        return await this._octokit.request("GET /repos/{owner}/{repo}/compare/{basehead}", {
            owner: owner,
            repo: repoName,
            basehead: `${baseSha}...${headLabel}`
        });
    }
    async GetCollaborator(owner, repoName, user) {
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
    async PostComment(nodeId, comment) {
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
    async GetCommit(owner, repoName, sha) {
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
            }`, { owner, repoName, sha });
    }
    async GetNodeId(owner, repoName, qualifiedName) {
        const res = await this._octokit.graphql(`
            query GetNodeId($owner: String!, $repoName: String!, $qualifiedName: String!) {
                repository(owner: $owner, name: $repoName) {
                    ref(qualifiedName: $qualifiedName) {
                        id
                    }
                }
            }
        `, { owner, repoName, qualifiedName });
        return res.repository.ref.id;
    }
    async FastForward(nodeId, oid) {
        await this._octokit.graphql(`
            mutation FastForwardBranch($input: UpdateRefInput!) {
                updateRef(input: $input) {
                    ref {
                        name
                        target {
                            oid
                        }
                    }
                }
            }
        `, {
            input: {
                refId: nodeId,
                oid: oid,
                force: false
            }
        });
    }
}
//# sourceMappingURL=apiCaller.js.map