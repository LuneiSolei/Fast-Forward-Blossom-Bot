import type {Endpoints} from "@octokit/types";

export type IApiCompareResponse = Endpoints["GET /repos/{owner}/{repo}/compare/{basehead}"]["response"]