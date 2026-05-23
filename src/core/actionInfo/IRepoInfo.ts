import type IPrInfo from "./IPrInfo.js";

export default interface IRepoInfo
{
    get Name(): string;
    get Pr(): IPrInfo;
    get User(): string;
    get Owner(): string;
    get CloneUrl(): string;
}