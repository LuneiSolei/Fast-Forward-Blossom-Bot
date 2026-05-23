import type PrInfo from "./prInfo.js";

export default interface IEventParser
{
    GetOwner(): string;
    GetRepoName(): string;
    GetUser(): string;
    GetBaseRef(): string;
    GetBaseSha(): string;
    GetHeadRef(): string;
    GetHeadSha(): string;
    GetPullRequestInfo(): PrInfo
}