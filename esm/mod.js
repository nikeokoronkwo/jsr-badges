export async function getBadge(name, pkg, type) {
    return await fetch(`https://badgen.net/https/nikechukwu.npkn.net/jsr-endpoint/${name}/${pkg}/${type}?icon=https://jsr.io/logo.svg`).then(response => {
        return response.text();
    }).then(data => {
        console.log(data);
    });
}
export function getBadgeMd(name, pkg, type) {
    return `![Custom Badge](https://badgen.net/https/nikechukwu.npkn.net/jsr-endpoint/${name}/${pkg}/${type}?icon=https://jsr.io/logo.svg)`;
}
