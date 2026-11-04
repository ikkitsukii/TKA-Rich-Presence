# TKA Discord Rich Presence — 0.4.0 beta

Author: IkkiTsuki (hikarinovamente).

## Installation: copy and play
Requires Windows x64, Discord desktop and working UE4SS. Tested environment: UE4SS v3.0.1-1195-g1ceefac8, ue4ss/Mods layout. No Node.js installation, installer or manual .cmd launch is required.

1. Close the game.
2. Extract the ZIP. Copy the entire TKA_RPC folder into:
   TheKillingAntidote/TheKillingAntidote/Binaries/Win64/ue4ss/Mods/
   The result must include Mods/TKA_RPC/Scripts/main.lua and Mods/TKA_RPC/Bridge/TKA-RPC.exe. Do not nest a second TKA_RPC folder inside the first.
3. Open Discord desktop and launch the game through Steam. The mod starts the helper automatically. Wait approximately 20 seconds.

Keep the complete mod folder together. The helper runs hidden and exits automatically after the game process closes. No Windows startup entry is created. If Discord is closed, the helper retries while the game is running.

## Language
Edit TKA_RPC/Bridge/rpc/config.json: "language": "en" for English or "language": "pt-BR" for Brazilian Portuguese. Save and restart the game. All viewers see the same selected activity language.

## Features
11 locations (office, two Story maps, eight challenges); four difficulties; health; session time; map/menu/room artwork; customization; shopping; temporary save-trigger status. Session time includes menus/loading. A save-trigger status does not confirm that writing the save completed. Room artwork appears during customization, not simply on entering a room. Updates are periodic.

## Update/uninstall
Close the game, preserve your language setting and replace TKA_RPC with the new version. To uninstall, close the game and remove only Mods/TKA_RPC. Leave UE4SS and other mods in place.

## Support
Check folder structure, Discord desktop and activity sharing. Launcher errors are recorded in TKA_RPC/Bridge/autostart.log; helper logs are in TKA_RPC/Bridge/rpc/rpc.log. The collector writes to UE4SS.log. Review personal information before sharing excerpts. Include mod, game and UE4SS versions in support requests.

The mod reads game data and communicates activity through local Discord IPC; no logs are uploaded to the author. Original code is all rights reserved; redistribution requires permission. Third-party components retain their own licenses. Game characters, environments and logo belong to their owners. Artwork uses game screenshots retouched with AI. Independent project with no official affiliation.
