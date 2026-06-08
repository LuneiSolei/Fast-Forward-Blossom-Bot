import {afterEach, beforeEach, describe, test} from "@jest/globals";
import {ActionEventType} from "../../core/actionEvent/actionEventType.js";
import TestFixtures from "../testFixtures.js";
import type IActionInfo from "../../core/actionInfo/IActionInfo.js";
import {Octokit} from "@octokit/core";
import type {ActionEvent} from "../../core/actionEvent/actionEvent.js";

let actionInfoFactory = TestFixtures.ConcreteActionInfoFactory,
    actionInfo: IActionInfo,
    octokit: Octokit,
    event: ActionEvent,
    originalEventPath: string,
    owner: string,
    repoName: string,
    repoNodeId: string;

describe.each([
    { eventType: ActionEventType.PullRequestOpened, get eventPath() { return TestFixtures.PullRequestOpenedEventPath }}
])("when event type is $eventType", ({ eventPath }) => {
    beforeEach(async () => {
        // Set an event path to use for our data
        originalEventPath = process.env["GITHUB_EVENT_PATH"] as string;
        process.env["GITHUB_EVENT_PATH"] = eventPath;
        event = TestFixtures.ParseEventFile(eventPath);

        // Create octokit with Personal Access Token
        octokit = new Octokit({
            auth: process.env["PERSONAL_ACCESS_TOKEN"] as string,
        });

        actionInfo = await actionInfoFactory.Create(
            TestFixtures.ConcretePrInfo,
            TestFixtures.ConcreteOptions,
            TestFixtures.ConcreteEventInfo,
            TestFixtures.ConcreteRepoInfo,
            TestFixtures.ConcreteApiCaller,
            octokit
        );

        owner = actionInfo.Repo.Owner;
        repoName = actionInfo.Repo.Name;

        // @ts-ignore
        const { repository: { id }} = await octokit.graphql(`
            query($owner: String!, $repoName: String!) {
                repository(owner: $owner, name: $repoName) {
                    id
                }
            }
        `, { owner, repoName });

        repoNodeId = id;
    });

    afterEach(async () => {
        process.env["GITHUB_EVENT_PATH"] = originalEventPath
    });

    async function VerifyTestBranch()
    {
        // Get sha of master/main branch
        // @ts-ignore
        const { repository: { ref: { target: { oid }}}} = await octokit.graphql(`
            query($owner: String!, $repoName: String!, $qualifiedName: String!) {
                repository(owner: $owner, name: $repoName) {
                    ref(qualifiedName: $qualifiedName) {
                        target {
                            oid
                        }
                   }
                }
            }
        `, {
            owner: owner,
            repoName: repoName,
            qualifiedName: `refs/heads/${event.repository.master_branch}`
        });

        // Delete test branch (if it exists)
        try {
            await octokit.request("DELETE /repos/{owner}/{repo}/git/refs/{ref}", {
                owner: owner,
                repo: repoName,
                ref: `heads/automated-test-pr-branch`
            });
        } catch(error) {
            // Branch didn't exist
        }

        // Create new test branch
        await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
            owner: actionInfo.Repo.Owner,
            repo: actionInfo.Repo.Name,
            ref: `refs/heads/automated-test-pr-branch`,
            sha: oid
        });
    }

    async function VerifyTestFile()
    {
        // Check for "automated-test.txt"
        // @ts-ignore
        const { repository } = await octokit.graphql(`
            query($owner: String!, $repoName: String!, $expression: String!) {
                repository(owner: $owner, name: $repoName) {
                    object(expression: $expression) {
                        ... on Blob {
                            oid
                        }
                    }
                }
            }
        `, { owner: owner, repoName: repoName, expression: `${event.repository.master_branch}:automated-test.txt`});

        // Delete file if it exists
        if (repository.object !== null)
        {
            await octokit.request("DELETE /repos/{owner}/{repo}/contents/{path}", {
                owner: owner,
                repo: repoName,
                path: "automated-test.txt",
                message: "chore: remove test file",
                sha: repository.object.oid,
                branch: "automated-test-pr-branch"
            });
        }

        // Create new file
        await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
            owner: owner,
            repo: repoName,
            path: "automated-test.txt",
            message: "chore: create test file",
            content: Buffer.from(new Date().toISOString()).toString("base64"),
            branch: "automated-test-pr-branch"
        });
    }

    async function VerifyPullRequest(comment: string)
    {
        // Check for existing PR
        // @ts-ignore
        const { repository: { pullRequests }} = await octokit.graphql(`
            query($owner: String!, $repoName: String!, $head: String!) {
                repository(owner: $owner, name: $repoName) {
                    pullRequests(headRefName: $head, states: [OPEN], first: 1) {
                        nodes {
                            id
                            number
                        }
                    }
                }
            }
        `, {
            owner: owner,
            repoName: repoName,
            head: "automated-test-pr-branch"
        });

        if (pullRequests.nodes.length > 0)
        {
            await octokit.graphql(`
                mutation($input: ClosePullRequestInput!) {
                    closePullRequest(input: $input) {
                        pullRequest {
                            number
                        }
                    }
                }
            `, {
                input: {
                    pullRequestId: pullRequests.nodes[0].id
                }
            });
        }

        // Create new PR
        await octokit.graphql(`
            mutation($input: CreatePullRequestInput!) {
                createPullRequest(input: $input) {
                    pullRequest {
                        number
                        url
                    }
                }
            }
        `, {
            input: {
                repositoryId: repoNodeId,
                baseRefName: event.repository.master_branch,
                headRefName: "automated-test-pr-branch",
                title: "Automated Test PR",
                body: comment
            }
        })
    }

    test("successfully performs fast-forward when command is invoked via a user with perms", async () => {
        /*
            - Create a new branch labeled "automated-test-pr-branch".
            - Check current master/main branch for an "automated-test.txt" file containing a date and time.
                - If the file exists, use the new "automated-test-pr" branch to edit the file, overwriting it with the
                    current date/time.
                - If the file does not exist, use the new "automated-test-pr-branch" branch to create the file and write
                    the current date/time into it.
            - Create a new pull request with the master/main branch as the base target and the "automated-test-pr-branch"
                branch as the head target.
        */

        await VerifyTestBranch();
        await VerifyTestFile();
        await VerifyPullRequest("This is an example PR comment body.");
    });
});
