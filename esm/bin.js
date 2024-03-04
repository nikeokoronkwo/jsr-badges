import * as dntShim from "./_dnt.shims.js";
import { Command } from "./deps/deno.land/x/cliffy@v1.0.0-rc.3/command/mod.js";
import { getBadge, getBadgeMd } from './mod.js';
function splitPkg(pkgname) {
    const items = pkgname.split("/");
    return {
        scope: items[0].replace("@", ""),
        name: items[1]
    };
}
new Command()
    .name("jsr-badges")
    .description("Generate your JSR Badges!")
    .version("v1.0.0")
    .arguments("<output-type> <jsr-package-name> <badge-type>")
    .help(`
  <output-type>: markdown (md) | svg (svg)
  <jsr-package-name>: the jsr package to use in it's normal format: "@scope/name"
  <badge-type>: Supported badges are: version (version), publisher (pub), and package name (name)
  `)
    .parse(dntShim.Deno.args).then(res => {
    const { args: output } = res;
    const { scope: scope, name: name } = splitPkg(output[1]);
    const validTypes = ["name", "publisher", "version"];
    if (output[0] == "markdown" || output[0] == "md") {
        if (output[2] == "pub")
            output[2] = "publisher";
        console.log(getBadgeMd(scope, name, output[2]));
    }
    else if (output[0] == "svg") {
        if (output[2] == "pub")
            output[2] = "publisher";
        console.log(getBadge(scope, name, output[2]));
    }
    else {
        console.error("output type can only be markdown or svg.");
    }
});
;
