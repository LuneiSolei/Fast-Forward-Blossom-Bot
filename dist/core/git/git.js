import { execSync as nodeExec } from "node:child_process";
import * as core from "@actions/core";
export default class Git {
    static repoWd = "./tmp/repo";
    static Exec(args, cwd) {
        return nodeExec(args.join(' '), { cwd }).toString();
    }
    static CloneRepo(cloneUrl) {
        core.info(`Cloning repo from ${cloneUrl}...`);
        this.Exec(["rm -rf", `${this.repoWd}/*`]);
        this.Exec(["mkdir -p", this.repoWd]);
        this.Exec(["git", "clone", cloneUrl, "./tmp/repo"]);
    }
    static Log(exclude, baseSha, headSha) {
        return this.Exec([
            "git",
            "log",
            "--pretty=oneline",
            "--graph",
            `${exclude}`,
            baseSha,
            headSha
        ], this.repoWd);
    }
    static GetMergeBaseSha(baseSha, headSha) {
        return this.Exec(["git", "merge-base", baseSha, headSha], this.repoWd);
    }
    static GetAmountOfParents(sha) {
        const output = this.Exec(["git", "log", "--parents", "-n 1", `${sha}`], this.repoWd);
        if (!output)
            return 0;
        const parts = output.split(' ');
        return parts.length - 1; // First element is the commit itself
    }
}
//# sourceMappingURL=git.js.map