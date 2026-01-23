import * as vscode from 'vscode';
import { BitbucketClient } from './bitbucket';

export async function activate(context: vscode.ExtensionContext) {
    const cmd = vscode.commands.registerCommand('madhosoi.bitbucketPR.createPR', async () => {
        await createPullRequest();
    });

    context.subscriptions.push(cmd);
}

async function createPullRequest() {
    try {
        const config = vscode.workspace.getConfiguration("madhosoi.bitbucketPRHelper");
        const baseUrl = config.get("baseUrl") as string;
        const username = config.get("username") as string;
        const appPassword = config.get("appPassword") as string;
        const defaultBranch = config.get("defaultBranch") as string;
        const authenticationType = config.get("authenticationType") as string;
        const autoMerge = config.get("autoMerge") as boolean;

        if (!baseUrl || !username || !appPassword) {
            vscode.window.showErrorMessage("Missing Bitbucket configuration.");
            return;
        }

        const gitExt = vscode.extensions.getExtension("vscode.git")?.exports;
        const git = gitExt.getAPI(1);
        const repo = git.repositories[0];
        if (!repo) return;

        const currentBranch = repo.state.HEAD?.name;
        const remote = repo.state.remotes.find((r: any) => r.name === "origin");

        const match = /^(https|ssh):\/\/.+\/(.+)\/(.+)\.git$/.exec(remote.fetchUrl);
        if (match) {
            const project = match[2];
            const repoSlug = match[3];

            // Add prompt to select the branch to merge
            const branches = await git.repositories[0].getBranches();
            //const defaultSelectedIndex = branches.findIndex((b: any) => b.name === defaultBranch);
            // const quickPickItems = branches.map((b: any) => {
            //     return {
            //       label: b.name,
            //       // picked: defaultSelectedIndex > -1 && b.name === defaultBranch,

            //     };
            // });
            const selectedBranch = await vscode.window.showQuickPick(
                branches.map((b: any) => b.name),
                {
                    placeHolder: 'Select the branch to merge',
                    canPickMany: false                 
                });

            if (!selectedBranch) {
                return;
            }

            const client = new BitbucketClient(baseUrl, username, appPassword, authenticationType);
            const pr = await client.createPR(project, repoSlug, currentBranch!, selectedBranch);

            if (autoMerge) {
                await client.mergePR(project, repoSlug, pr.id);

                vscode.window.showInformationMessage(`PR #${pr.id} merged.`);
            }
            else {
                vscode.window.showInformationMessage(`PR #${pr.id} created.`);
            }
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(err.message);
    }
}

export function deactivate() { }
