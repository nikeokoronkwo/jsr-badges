# JSR Badges
Create your own jsr badges for use in your project!

If you are using deno:
```bash
deno run bin.ts <output-type> <jsr-package-name> <badge-type>
```

If you are using npm:
```bash
npm run esm/bin.js <output-type> <jsr-package-name> <badge-type>
```

If you are using any other javascript runtime, run `bin.o.js` with the given arguments: `<output-type> <jsr-package-name> <badge-type>`

```log
<output-type>: markdown (md) | svg (svg)
<jsr-package-name>: the jsr package to use in it's normal format: "@scope/name"
<badge-type>: Supported badges are: version (version), publisher (pub), and package name (name)
```

## Building
If you want to build an npm compatible version of this you will need to have `deno` installed, then run:
```bash
deno run -A scripts/npm.ts
```

## Contributing
Contributions are welcome. Ensure to follow community guidelines!

## Contributors
- Nikechukwu Okoronkwo