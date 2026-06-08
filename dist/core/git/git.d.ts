export default class Git {
    private static readonly repoWd;
    private static Exec;
    static CloneRepo(cloneUrl: string): void;
    static Log(exclude: string, baseSha: string, headSha: string): string;
    static GetMergeBaseSha(baseSha: string, headSha: string): string;
    static GetAmountOfParents(sha: string): number;
}
//# sourceMappingURL=git.d.ts.map