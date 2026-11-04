# Security review notes for Nexus Mods

This is a description of reviewed source behavior, not a security certification or a guarantee of Nexus approval.

## Files to review

- `TKA_RPC/Scripts/main.lua`: game-thread sampling, JSON output to UE4SS.log.
- `TKA_RPC/Scripts/Interactions.lua`: read-only UI inspection and save function hooks; callbacks do not override game return values.
- `TKA_RPC/Scripts/AutoStart.lua`: absolute mod-path discovery, UTF-16LE/Base64 command encoding and `os.execute`.
- `TKA_RPC/Bridge/AutoStart.ps1`: game process/path matching and hidden helper startup.
- `rpc/bridge.cjs`: log parsing, singleton named-pipe control endpoint, Discord activity loop, game PID liveness check and shutdown.
- `rpc/discord.cjs`: Discord local named-pipe framing and requests.
- `rpc/presence.cjs`, `maps.cjs`, `locales.cjs`: display formatting and translations.
- `scripts/build-executable.cjs`: entire executable build procedure.

## Encoded PowerShell command

AutoStart.lua generates an expression equivalent to:

```powershell
& '<absolute installed mod path>\Bridge\AutoStart.ps1'
```

Apostrophes inside the path are escaped by doubling them. The expression is converted to UTF-16LE and Base64, then supplied to:

```text
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand <encoded expression>
```

The purpose is robust path quoting, including spaces/Unicode/shell characters. This is encoded command text, not encrypted payload code. The encoder and the called script are fully present in the repository. `ExecutionPolicy Bypass` is passed to that PowerShell process; the script does not change the machine's persistent execution policy. Hidden PowerShell, encoded commands, process launching and a PE executable are behaviors that scanners or manual reviewers may reasonably examine. We do not know which behavior triggered Nexus quarantine or a VirusTotal tag.

To inspect an emitted command independently, decode its Base64 argument without executing it:

```powershell
[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('<Base64 argument>'))
```

## Executable and obfuscation

TKA-RPC.exe is Node's Windows executable with a SEA bootstrap. No intentional JavaScript minification/obfuscator, custom packer, encryption, encrypted asset archive or remote script loader was found in the selected mod source. SEA packaging itself and the encoded launch command can complicate automated classification. A scanner's “obfuscated” label alone does not establish the cause or malicious intent.

The screenshot supplied by the author shows a Nexus quarantine and a VirusTotal result with 0/65 vendor detections at that time. That is not proof of safety, nor confirmation that Nexus will approve it. The mod has not been modified to evade detection.

## Data, network and persistence

- Application code uses Discord local `discord-ipc-*` named pipes, plus a `tka-rpc-<applicationId>` singleton/control pipe. It does not implement an HTTP client, remote updater or log-upload endpoint.
- Data sent to Discord consists of activity fields and asset identifiers. Discord controls downstream profile visibility/network behavior.
- The helper reads UE4SS.log, writes its own runtime log, and checks whether the passed game PID exists. Signal 0 is a liveness probe, not a request to terminate the game.
- PowerShell enumerates the named game process to verify its executable path and starts the helper hidden.
- No registry autorun, scheduled task, service install, antivirus exclusion or privilege-elevation code was found in these source files.
- The application ID is public configuration, not an authentication token.

## Review limitations

This audit is limited to this source selection and comparison to the local release staging files. It is not a complete third-party audit of Node.js, UE4SS, Discord or Windows. It does not independently verify Steam's remote stored files or the scanner's classification. Source availability supports review but does not replace review. Keep runtime behavior unchanged while reviewing v0.4.0-beta.

## Suggested Nexus review request (after source publication)

Subject: Source and build instructions for TKA Rich Presence v0.4.0-beta

Hello Nexus Mods support,

My TKA Rich Presence v0.4.0-beta upload was quarantined. I am providing its source and build instructions for review. After the source has been pushed, the intended version URL is https://github.com/ikkitsukii/TKA-Rich-Presence/tree/v0.4.0-beta . Please do not use that link until the tag is actually available.

README.md explains installation and compilation; docs/BUILD.md describes the Node SEA bootstrap; docs/SECURITY-REVIEW.md explains encoded PowerShell startup and process/IPC behavior. docs/RELEASE-v0.4.0-beta.md records original/rebuilt hashes and reproducibility limits. The executable embeds Node.js, while application JavaScript is provided as readable adjacent files. Please let me know if you need additional information to review the upload.

Thank you,
IkkiTsuki (hikarinovamente)
