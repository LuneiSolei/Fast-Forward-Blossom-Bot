import { Octokit } from "@octokit/core";
export default class OctokitFactory {
    static Create(owner: string, repoName: string): Promise<Octokit>;
}
//# sourceMappingURL=octokitFactory.d.ts.map