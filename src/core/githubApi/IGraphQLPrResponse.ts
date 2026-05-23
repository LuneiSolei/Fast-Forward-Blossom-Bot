export type IGraphQLPrResponse = {
    repository: {
        pullRequest: {
            baseRefName: string,
            baseRefOid: string,
            headRefName: string,
            headRefOid: string,
            headRepository: {
                name: string
            }
            headRepositoryOwner: {
                login: string
            },
            id: string
        }
    }
}