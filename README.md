# ABO Pixel Tracker v0.3.0 (Beta)

Independent SillyTavern client extension (Tavern Helper is **not** required).

**Important:** Prototype/beta. Its worldbuilding and probability rules are fictional, not medical guidance. Some advanced scenarios are not yet fully implemented. Test in a backed-up chat before using in a long roleplay.

## Install or update from GitHub

This repository must have `manifest.json`, `index.js`, `style.css`, `core.mjs`, `analyzer.mjs`, and **`profile.mjs`** at its root.

1. If this is a new installation, use **SillyTavern → Extensions → Install Extension**, with the public repository URL.
2. If an earlier version is installed, upload/commit the new files to the existing repository, keeping the same path and folder names. **Replace** the old files rather than creating a nested folder.
3. Run the extension updater in SillyTavern and refresh the page (hard refresh if styles are cached). If the updater does not detect the release, reload the extension from SillyTavern's extension manager.
4. Import `worldinfo/ABO_Universal_WorldInfo_v3.4_EN.json` separately if not already imported. **No need to reimport World Info** merely to update this extension.

## Changes since v0.2.0

- **SETUP:** unified adult CHAR + USER profile analyzer suggests physical profile and up to 5 supported latent intimacy preferences per character. Explicit card preferences remain distinct from inferred interests. All results are editable. **Nothing is applied until `✓ 선택한 제안 적용` is clicked.** Inferred suggestions default to unchecked; unchecked items are ignored; existing manual overrides take priority.
- **STATUS:** anatomy selection is contextual. Male Omega: combined/cuntboy/male-only/custom; female Alpha: male-combined/female-only/custom; all other classic types: standard/default or custom. Female Alpha retains both gestation and impregnation ability, with editable fictional insemination-anatomy notes.
- **DESIGN:** accessible light and brighter dark variants, auto/system option, quick theme toggle ◐, larger select/label text, sans-serif Pretendard preferred (system-font fallback). Pretendard is fetched from an optional external CDN; no font files are included.
- Per-chat proposal and theme settings. Existing chat state remains in the same metadata namespace.
- Same current/default, saved Connection Manager profile, or direct-compatible API settings as before.

## Local verification

`npm run check && npm test` (Node.js 20+). This checks syntax and the deterministic engine/profile tests, **not** live API calls or SillyTavern/Vultr compatibility. See `README_KO.md` for detailed instructions.
