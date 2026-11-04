# v0.4.0-beta source review

Original executable SHA-256: 9d1aa2ff93609bfd3f39f35ac7d43ecf3c2e4f69a688470ba8f48fd554137335

Original distribution ZIP SHA-256: 49c1e207d4223a0af99ef4e4c0306d49a6c94c5047e9d836e702edd026efcaa0

Runtime source files were byte-compared with the local Workshop upload/release staging copy. All nine Lua/PowerShell/JavaScript runtime files matched. Portable config is copied from the distribution with empty logPath. Binary artifacts are excluded from Git. See release-v0.4.0-beta.json for machine-readable source hashes.

A source commit/tag will be prepared locally; nothing has been pushed to GitHub. Nexus review and approval remain the responsibility of Nexus Mods.

## Fresh source-checkout rebuild

Rebuilt executable SHA-256: `3ea852975ea9d08e0f4d4f25e935475c91c184ad19f4aee4bc357a5ebe7c69dd`.
Both files are 100,240,200 bytes, but their full hashes differ. Inspection confirms that the fresh checkout's build-directory component is embedded in its SEA data and is absent from the original build path. PE timestamps and checksums were equal. This identifies a concrete path-dependent difference; it does not establish that every differing byte has been independently explained. No byte-for-byte reproducibility claim is made.

Validation in the clean source checkout: executable build and release packaging succeeded; 12 Node tests passed; both optional Lua test files passed with Fengari Node CLI 0.1.0. Generated binaries and all local test/build artifacts remain ignored by Git.
