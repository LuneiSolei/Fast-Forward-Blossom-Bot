export type IGraphQLPrResponse = {
    repository: {
        pullRequest: {
            baseRefName: string,
            baseRefOid: string,
            headRefName: string,
            headRefOid: string,
            headRepositoryOwner: {
                login: string
            },
            id: string
        }
    }
}