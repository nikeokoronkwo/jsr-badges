import { Provider } from "../provider.js";
export class NestLandProvider extends Provider {
    constructor({ name } = {}) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "nest.land"
        });
        Object.defineProperty(this, "repositoryUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://nest.land/package/"
        });
        Object.defineProperty(this, "registryUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://x.nest.land/"
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
        const response = await fetch(`https://nest.land/api/package-client`, {
            method: "post",
            body: JSON.stringify({ data: { name: this.moduleName ?? name } }),
            headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
            throw new Error("couldn't fetch the latest version - try again after sometime");
        }
        const { body: { latestVersion, packageUploadNames } } = await response
            .json();
        return {
            latest: latestVersion,
            versions: packageUploadNames.map((version) => version.replace(new RegExp(`^${this.moduleName ?? name}@`), "")).reverse(),
        };
    }
    getRepositoryUrl(name) {
        return new URL(`${this.moduleName ?? name}/`, this.repositoryUrl).href;
    }
    getRegistryUrl(name, version) {
        return new URL(`${this.moduleName ?? name}@${version}/`, this.registryUrl)
            .href;
    }
}
