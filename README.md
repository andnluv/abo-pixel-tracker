# ABO Pixel Tracker · SillyTavern Extension (v0.2.0 Beta)

A standalone SillyTavern extension for tracking CHAR / USER ABO state, cycle events, medications, fertility, relationships and selected character preferences. Dark pixel-inspired UI. **No Tavern Helper dependency.**

> **Beta:** Not yet verified on a live Vultr/SillyTavern instance. Back up chat data and test with a separate chat. Some advanced scenario rules are still design-only.

## Install from GitHub (no SSH required)

1. Upload the **contents of this repository folder** to the **root of your GitHub repository**. `manifest.json` and `index.js` must be at the repository root, not inside an extra nested folder.
2. In SillyTavern, select **Extensions → Install Extension**.
3. Paste your repository URL, for example `https://github.com/<account>/<repository>` (replace with your real address). Install and refresh SillyTavern.
4. Open **World Info** and import [`worldinfo/ABO_Universal_WorldInfo_v3.4_EN.json`](worldinfo/ABO_Universal_WorldInfo_v3.4_EN.json) separately. Associate it with the intended chat or characters.
5. Open a chat and click the `▦ ABO` launcher. In **SETTINGS**, choose **Current connection** (default), a saved **Connection Manager profile**, or a direct OpenAI-compatible API. Test the connection before enabling automatic analysis.

For detailed Korean instructions see [README_KO.md](README_KO.md).

## Files

- `manifest.json` — SillyTavern extension entry point.
- `index.js`, `core.mjs`, `analyzer.mjs`, `style.css`, `rules.json` — extension runtime and rules.
- `worldinfo/` — importable English World Info JSON (not auto-imported).
- `docs/` — readable World Info rules.
- `tests/` — deterministic engine unit tests.

## Verify locally

Node.js 20+:

```bash
npm test
npm run check
```

## Connection privacy

Direct-mode API tokens are stored only in the active browser page's memory, never in the chat metadata or exported backup. API endpoints must support browser CORS for direct mode. Use a saved Connection Manager profile if the provider does not allow browser requests.

## Known limitations

- Automatic event extraction depends on the model; mistakes or missing event evidence are possible.
- This beta does not implement every advanced rule in the World Info specification.
- Main roleplay model calls and separate tracker analysis calls can incur usage fees.
- Installation from a repository URL needs Git on the SillyTavern server and permission to install extensions.
- No GitHub repository has been created or published by this package.
