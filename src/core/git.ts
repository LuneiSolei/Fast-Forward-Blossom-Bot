import {exec} from "node:child_process";
import * as core from "@actions/core";

export default class Git
{
    public static Exec(args: string[]): string
    {
        return exec("git ".concat(args.join(' '))).stdout?.read();
    }

    public static CloneRepo(cloneUrl: string): void {
        core.info(`Cloning repo from ${cloneUrl}...`);
        exec("rm-rf ./tmp/* && mkdir -p ./tmp");
        this.Exec(["clone", cloneUrl, "./tmp/repo"]);
        process.chdir(`./tmp/repo`);
    }

    public static Log(exclude: string, baseSha: string, headSha: string): string {
        return this.Exec([
            "log",
            "--pretty=oneline",
            "--graph",
            `${exclude}`,
            baseSha,
            headSha
        ]);
    }

    public static GetMergeBaseSha(baseSha: string, headSha: string): string    {
        return this.Exec(["merge-base", baseSha, headSha]);
    }

    public static GetAmountOfParents(sha: string): number
    {
        const output = this.Exec(["log", "--parents", "-n 1", `${sha}`]);
        if (!output) return 0;

        const parts = output.split(' ');

        return parts.length - 1; // First element is the commit itself
    }
}