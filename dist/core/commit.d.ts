export interface Commit {
    repository: {
        object: {
            oid: string;
            message: string;
            committedDate: string;
            author: {
                name: string;
                email: string;
            };
            associatedPullRequests: {
                nodes: {
                    headRefName: string;
                    baseRefName: string;
                };
            };
        };
    };
}
//# sourceMappingURL=commit.d.ts.map