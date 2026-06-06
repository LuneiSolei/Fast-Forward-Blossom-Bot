import {execSync as nodeExec} from "node:child_process";
import * as core from "@actions/core";

export default class Git
{
    private static readonly repoWd: string = "./tmp/repo";

    private static Exec(args: string[], cwd?: string): string
    {
        return nodeExec(args.join(' '), { cwd }).toString();
    }

    public static CloneRepo(cloneUrl: string): void
    {
        core.info(`Cloning repo from ${cloneUrl}...`);
        this.Exec(["rm -rf", `${this.repoWd}/*`]);
        this.Exec(["mkdir -p", this.repoWd])
        this.Exec(["git", "clone", cloneUrl, "./tmp/repo"]);
    }

    public static Log(exclude: string, baseSha: string, headSha: string): string {
            return this.Exec([
                "git",
                "log",
                "--pretty=oneline",
                "--graph",
                `${exclude}`,
                baseSha,
                headSha
            ], this.repoWd)
    }

    public static GetMergeBaseSha(baseSha: string, headSha: string): string
    {
        return this.Exec(["git", "merge-base", baseSha, headSha], this.repoWd);
    }

    public static GetAmountOfParents(sha: string): number
    {
        const output = this.Exec(["git", "log", "--parents", "-n 1", `${sha}`], this.repoWd);
        if (!output) return 0;

        const parts = output.split(' ');

        return parts.length - 1; // First element is the commit itself
    }
}