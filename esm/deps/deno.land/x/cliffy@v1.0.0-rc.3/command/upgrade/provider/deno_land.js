import { Provider } from "../provider.js";
export class DenoLandProvider extends Provider {
    constructor({ name } = {}) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "deno.land"
        });
        Object.defineProperty(this, "repositoryUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://deno.land/x/"
        });
        Object.defineProperty(this, "registryUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://deno.land/x/"
        });
        Object.defineProperty(this, "moduleName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.moduleName = name;
    }
    async getVersions(name) {
        const response = await fetch(`https://cdn.deno.land/${this.moduleName ?? name}/meta/versions.json`);
        if (!response.ok) {
            throw new Error("couldn't fetch the latest version - try again after sometime");
        }
        return await response.json();
    }
    getRepositoryUrl(name) {
        return new URL(`${this.moduleName ?? name}/`, this.repositoryUrl).href;
    }
    getRegistryUrl(name, version) {
        return new URL(`${this.moduleName ?? name}@${version}/`, this.registryUrl)
            .href;
    }
}
