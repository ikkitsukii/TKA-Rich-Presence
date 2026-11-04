# Build and executable review

## Exact toolchain

The v0.4.0-beta executable was built on Windows x64 with Node.js **v26.13.0 x64**. Use the official Node distribution of that exact version when attempting a matching build. Run `node --version` and `node -p process.arch` before compiling.

`scripts/build-executable.cjs` writes the following bootstrap as plain text:

```js
const {createRequire}=require('node:module'); const path=require('node:path'); createRequire(process.execPath)(path.join(path.dirname(process.execPath),'rpc','bridge.cjs'));
```

It writes a SEA config pointing to that entry and `TKA-RPC.exe`, with:

```json
{
  "disableExperimentalSEAWarning": true,
  "useSnapshot": false,
  "useCodeCache": false,
  "execArgvExtension": "none"
}
```

Then it runs the current `node.exe --build-sea <config>`. No postject, custom compiler, packer, minifier, npm runtime package or downloaded build script is involved. Disabling the experimental SEA warning suppresses Node's SEA startup notice; it does not disable antivirus or a system security feature.

The bootstrap loads readable files adjacent to the executable. To reproduce the application, review **both** the generated executable and the adjacent `rpc/*.cjs`, configuration, Lua and PowerShell files. Changing a sidecar module changes application behavior even when the executable hash stays the same.

## Commands

```powershell
node scripts/build-executable.cjs
node scripts/package-autostart.cjs
```

The package script builds the `TKA_RPC/Bridge/rpc` directory, copies the executable and sources, uses a portable blank `logPath`, and includes notices and user documentation. It writes SHA256SUMS.txt for package files. It refuses to overwrite an existing output directory.

## Reproducibility limits

Reproduction of the source/build procedure is distinct from a guaranteed bit-for-bit identical Windows PE file. Node binary provenance, SEA implementation, PE metadata and tool versions can affect the result. The release document records the original executable hash and a fresh rebuild comparison from this source checkout. Do not claim byte-identical reproduction unless that comparison succeeds.

The clean-checkout rebuild had a different SHA-256, with its build path present in SEA data. Build paths can therefore be embedded in the compiled artifact. Do not place credentials or sensitive information in build directory names. This repository excludes compiled artifacts and personal absolute paths from its selected source.

Official mechanism: https://nodejs.org/api/single-executable-applications.html
