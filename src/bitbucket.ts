import fetch from 'node-fetch';

export class BitbucketClient {
    constructor(private baseUrl: string, private username: string, private appPassword: string, private authenticationType: string) {}

    private auth() {
        var token = Buffer.from(`${this.username}:${this.appPassword}`).toString("base64");
        if (this.authenticationType == "Bearer"){
            token = this.appPassword;
        }
        return { Authorization: `${this.authenticationType} ${token}` };
    }

    async createPR(project: string, repoSlug: string, from: string, to: string) {
        const body = {
            title: `Auto PR from ${from}`,
            description: "Auto-created by VS Code",
            fromRef: { id: `refs/heads/${from}`, repository: { slug: repoSlug, project: { key: project }}},
            toRef: { id: `refs/heads/${to}`, repository: { slug: repoSlug, project: { key: project }}}
        };

        const res = await fetch(`${this.baseUrl}/rest/api/1.0/projects/${project}/repos/${repoSlug}/pull-requests`, {
            method: "POST",
            headers: {...this.auth(), "Content-Type":"application/json"},
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`Failed to create PR : ${res.statusText}`);
        return res.json();
    }

    async mergePR(project: string, repoSlug: string, prId: number) {
        const res = await fetch(`${this.baseUrl}/rest/api/1.0/projects/${project}/repos/${repoSlug}/pull-requests/${prId}/merge?version=0`, {
            method: "POST",
            headers: {...this.auth(), "Content-Type":"application/json"},
        });

        if (!res.ok) throw new Error(`Failed to merge PR: ${res.statusText}`);
        return res.json();
    }
}
