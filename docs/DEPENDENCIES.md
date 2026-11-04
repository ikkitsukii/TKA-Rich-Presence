# Dependencies and versions

| Component | Version / role | Included? |
| --- | --- | --- |
| Node.js for building | v26.13.0, Windows x64 | Install separately for developers |
| Node.js runtime | v26.13.0, embedded with SEA bootstrap | Included in compiled helper |
| UE4SS | Tested v3.0.1-1195-g1ceefac8 | External player prerequisite |
| The Killing Antidote | Steam app 2254890; tested Unreal Engine 4.27 environment | External; exact game build not recorded |
| Discord desktop | Local RPC named-pipe client; exact client version not pinned | External |
| Windows PowerShell | powershell.exe, Windows built-in; 5.1-compatible script | OS component; no PowerShell module dependency |
| JavaScript application/build | Node built-in modules only | Source provided |
| Lua test interpreter | Compatible Lua 5.3/5.4; optional Fengari Node CLI 0.1.0 used in development | Not included or needed to build/run |

The project does not depend on discord-rpc, Electron, an SDK DLL, a bot token or a Client Secret. Node built-ins used by application/build/tests include fs, path, net, crypto, string_decoder, child_process, assert, test, events and os.

Sharp 0.35.5 was used in a separate artwork/publication workflow. It is not used by the mod, this executable build or its tests and is excluded from this source repository. FFmpeg, hair experiments and diagnostic tools from the author's working directory are also excluded.

No npm dependency lockfile is needed for the core because there are no npm package dependencies. Third-party code within Node itself is documented in THIRD-PARTY-NOTICES.txt; this repository does not claim those components have no dependencies of their own.

Build scripts do not download prerequisites. Sources:
- https://nodejs.org/
- https://github.com/UE4SS-RE/RE-UE4SS/releases
- https://github.com/nodejs/node/tree/v26.13.0
