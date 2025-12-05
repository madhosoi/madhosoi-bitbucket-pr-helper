import * as vscode from 'vscode';
import { BitbucketClient } from './bitbucket';

export async function activate(context: vscode.ExtensionContext) {
    // const gitExt = vscode.extensions.getExtension('vscode.git')?.exports;
    // const git = gitExt.getAPI(1);

    // git.onDidRunOperation(async (e: any) => {
    //     if (e.operation === "Push") {
    //         vscode.window.showInformationMessage("Push detected. Creating Pull Request...");
    //         await createPullRequest();
    //     }
    // });

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

            //vscode.window.showInformationMessage(`Starting PR# on ${project}/${repoSlug}`)

            // Add prompt to select the branch to merge
            const branches = await git.repositories[0].getBranches();
            const selectedBranch = await vscode.window.showQuickPick(
                branches.map((b: any) => b.name), 
                { placeHolder: 'Select the branch to merge' });

            if (!selectedBranch) {
                return;
            }

            //vscode.window.showInformationMessage(`Creating PR# on ${project}/${repoSlug} for ${selectedBranch}`);

            const client = new BitbucketClient(baseUrl, username, appPassword);
            const pr = await client.createPR(project, repoSlug, currentBranch!, selectedBranch);

            await client.mergePR(project, repoSlug, pr.id);

            vscode.window.showInformationMessage(`PR #${pr.id} merged.`);
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(err.message);
    }
}

export function deactivate() { }
