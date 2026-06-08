import type { Endpoints } from "@octokit/types";
type CompareResponse = Endpoints["GET /repos/{owner}/{repo}/compare/{basehead}"]["response"];
export type MergeBase = CompareResponse["data"]["merge_base_commit"];
export {};
//# sourceMappingURL=mergeBase.d.ts.map