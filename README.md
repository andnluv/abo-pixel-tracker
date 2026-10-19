# 그날의 사정 v0.3.15 (Beta)

Independent SillyTavern client extension (Tavern Helper is **not** required).

**Important:** Prototype/beta. Its worldbuilding and probability rules are fictional, not medical guidance. Some advanced scenarios are not yet fully implemented. Test in a backed-up chat before using in a long roleplay.

## Install or update from GitHub

This repository must have `manifest.json`, `index.js`, `style.css`, `core.mjs`, `analyzer.mjs`, and **`profile.mjs`** and **`npc-tracking.mjs`** at its root.

1. If this is a new installation, use **SillyTavern → Extensions → Install Extension**, with the public repository URL.
2. If an earlier version is installed, upload/commit the new files to the existing repository, keeping the same path and folder names. **Replace** the old files rather than creating a nested folder.
3. Run the extension updater in SillyTavern and refresh the page (hard refresh if styles are cached). If the updater does not detect the release, reload the extension from SillyTavern's extension manager.
4. Import `worldinfo/ABO_Universal_WorldInfo_v3.4_EN.json` separately if not already imported. If an earlier v3.4 is imported, **replace its PREG-02 entry** with the updated 150-day reference text to keep world rules aligned; avoid duplicate imports.

## v0.3.15 — Initial ABO-dependent physiology fix

The initial AI proposal must include a reasoned secondary sex for each unfixed adult character. The extension then derives genital anatomy and four fictional ABO defaults (gestation, insemination, menstruation, heat/rut) from that identity. It no longer treats a male sex label, TOP position, or missing card information as proof that gestation/menstruation/cycles are unavailable. Manually fixed facts and explicit card facts take precedence. The four defaults are suggestions, unchecked until approved. Editing secondary sex or anatomical type refreshes dependent proposals; older proposals with absent secondary sex require a fresh analysis. No change to the existing chat-global API profile or output token settings.

## v0.3.14 — Evidence-guided secondary proposal and global analysis settings

- If neither card nor manual configuration sets alpha/beta/omega, the FIRST model-based CHAR/USER profile analysis proposes a secondary type from established personality, interactions and preference evidence, with a written Korean rationale. It is an unchecked creative interpretation, not an observed card fact. Seeded tracker placeholders NEVER override this model proposal; missing proposals trigger the model-format retry.
- Genital form is separately assigned from the allowed candidate pool for the selected sex+ABO combination. Existing manual and explicit card statements win.
- Saved analysis connection/profile, direct API URL/model, and initial analysis max output tokens now persist through SillyTavern's extension-wide settings across all chats. On first access, prior chat-specific values are migrated once. API keys remain RAM-only (not persisted) by design.
- All other character, timeline, pregnancy, cycle and per-chat simulation state remain chat-local.

## v0.3.12 — Revert day selector · 120–180 day gestation (default 150)

The manual time control is restored to its prior hours-only form; automatic time progression from explicit story evidence is unchanged. Fictional gestation is nominally 150 story-days, with a deterministic, individually selected due date in the 120–180 day range. Both the simulation and the bundled World Info PREG-02 were updated. **If you already imported the earlier v3.4 World Info, update/replace its PREG-02 entry** (do not import a second duplicate World Info without removing the old one). Existing stored pregnancy due dates are recalculated from chat events on replay; back up active chats before upgrading.

## v0.3.11 — Pregnancy switch, fictional medication mechanics

The display name is now **그날의 사정**, while the repository and chat storage key remain unchanged for upgrades. The per-chat pregnancy ON/OFF switch disables conception calculations and pregnancy state injection when OFF, but does not delete raw events; turning ON replays the retained history. Back up a long-running chat before changing this setting.

A fictional `oral_contraceptive` medication event reduces qualifying exposure risk during its active 24h window (85% default), with editable efficacy. Emergency contraceptive reduction (75% default within 72 hours) and long suppressants' ovulation suppression chance (90% default) are now configurable; both preserve the original deterministic roll. Side-effect results have reproducible fictional symptom labels independent of medication tolerance and can be reviewed under Cycles. Confirmed doses can be recorded manually. The continuity prompt now includes confirmed vs latent preferences and recent scene tags to discourage generic repetitive roleplay while preserving user agency. Single selected-NPC tracking remains; simultaneous multi-partner pregnancy calculations are not implemented.

All rates and medication effects are **fictional world-building values**, not medical information. No external writing or proprietary source code has been copied. Run `npm run check && npm test`; integration testing in a real SillyTavern instance is still pending.

## v0.3.10 — Pregnancy tab wording

- The UI tab is now labelled `임신` instead of `수태`; related screen copy has been clarified.
- No calculation, event schema, persistence, or NPC tracking logic was modified.

## v0.3.9 — One active NPC in multi-character / narrator cards

The STATUS tab now supports **Normal Character** (unchanged default) and **Multi-NPC** modes. In Multi-NPC mode, click **월드 인포에서 NPC 찾기** to discover NPC profile entries from the embedded character book, chat-bound lorebook (`chatMetadata.world_info`), and the character's primary/linked world info. Select one NPC as CHAR, or use **＋ NPC 직접 추가** for a manually named NPC with optional aliases and profile text. A narrator/world-engine `{{char}}` is not implicitly treated as the selected NPC.

Each selected NPC has its own stored source profile, manual CHAR overrides and CHAR event log. The USER persona and ordinary USER/time events are shared. Switching the NPC does not delete prior NPC records. NPC-specific partner interactions (pregnancy risk, bond) are **not yet merged globally across multiple NPCs**; this is one active CHAR at a time, not concurrent multi-NPC reproduction. Model instructions avoid attributing other NPC events to the selected NPC, but a real RP run is still required to verify identity classification.

Existing chat metadata and 1:1 behavior remain under their old keys. The extension does not alter world-info content; only the selected source excerpt is persisted in this chat. World-info fetches require access to SillyTavern's `/api/worldinfo/get` endpoint. Minor NPC profiles and non-NPC world rule entries are excluded from the suggestion list. Back up the chat and test this beta before relying on it for long RP sessions.

## Changes since v0.2.0

- **SETUP:** unified adult CHAR + USER profile analyzer suggests physical profile and up to 5 supported latent intimacy preferences per character. Explicit card preferences remain distinct from inferred interests. All results are editable. **Nothing is applied until `✓ 선택한 제안 적용` is clicked.** Inferred suggestions default to unchecked; unchecked items are ignored; existing manual overrides take priority.
- **STATUS:** anatomy selection is contextual. Male Omega: combined/cuntboy/male-only/custom; female Alpha: male-combined/female-only/custom; all other classic types: standard/default or custom. Female Alpha retains both gestation and impregnation ability, with editable fictional insemination-anatomy notes.
- **DESIGN:** accessible light and brighter dark variants, auto/system option, quick theme toggle ◐, larger select/label text, sans-serif Pretendard preferred (system-font fallback). Pretendard is fetched from an optional external CDN; no font files are included.
- Per-chat proposal and theme settings. Existing chat state remains in the same metadata namespace.
- Same current/default, saved Connection Manager profile, or direct-compatible API settings as before.

## Local verification

`npm run check && npm test` (Node.js 20+). This checks syntax and the deterministic engine/profile tests, **not** live API calls or SillyTavern/Vultr compatibility. See `README_KO.md` for detailed instructions.


## Persona sync fix (v0.3.1)
- Live active persona name, avatar identity, and description are resynced after chat/persona changes.
- CHAR and USER data continue to be stored per chat, but USER manual overrides and preference selections are kept separately per persona within a chat.
- Previous persona's pending setup proposals are discarded on identity change. In-flight model analysis for an old persona is rejected.
- Legacy USER-related events from another persona are not replayed into the newly selected persona; story time and CHAR-only events remain.
- SillyTavern controls which persona is actually selected. Use its persona locks if you want a different persona automatically selected per character.

### v0.3.1 — Active Persona Refresh

Resolves stale USER data when switching characters/chats or personas by reading the actual current SillyTavern persona avatar identity, name and description. Separates per-persona manual overrides and selected preferences, blocks stale in-flight setup proposals, and filters old USER-related events from another persona during replay. This does not automatically switch SillyTavern's persona; configure SillyTavern persona-to-character locks if needed. Existing chats are migrated on first refresh; back up important chats first.

New **required root module**: `persona-sync.mjs`. Upload all root files when updating via GitHub.


## v0.3.3 Saved Connection Profile compatibility fix

Use the official `ConnectionManagerRequestService.validateProfile()` and `sendRequest()` without custom API classification or payload temperature override. The official request service handles Chat Completion and Text Completion (including instruct formatting). Failed profile requests show a more helpful error, and never silently fall back to the current RP connection. The analysis connection defaults to the current connection when unselected.

If a saved profile reports 401/Unauthorized/Secret errors, open Connection Manager, activate and **Update** that profile while the intended provider is active, and retry. Do not share secrets. Some SillyTavern versions have a known profile `secret-id` issue.

Tests are mocked unit tests; a live deployment connection test is still required.


## v0.3.4 — Korean preference display strings

Adds `preference-labels.mjs` to display localized labels for common preference IDs, including context-aware BDSM/NSFW terms. Existing machine IDs, preference extraction prompts, suggestions, profile merge rules, saved metadata, and world info are unchanged. Editing an unchanged translated label preserves the original ID. Replace the repository root files and include the new module before updating SillyTavern.


## v0.3.6 — NSFW-aware voice analysis and titlebar polish

- Initial setup now guides `vocalStyle` to describe source-grounded nonverbal reactions relevant to intimacy (breathing, moans where applicable, restrained/expression of sound, pitch, volume); `speechStyle` handles register, address terms, requests, teasing, and shifts in intimate speech. Hypothetical reactions remain editable suggestions, not past events.
- Additional Korean NSFW vocabulary is **reference-only**, not a fixed translation table or mandatory list of interests. Candidate counts, classifications, selection rules, and machine IDs are unchanged.
- Replaced unrelated `✦ ▣` titlebar symbols with a single CSS-drawn pixel emblem for light and dark themes.

## v0.3.5 — Korean-language profile analysis

Initial CHAR/USER setup requests Korean output for all descriptive profile fields, proposal reasons, and Korean candidate display labels. Machine-readable IDs/enums remain unchanged; a model-provided Korean label is editable and retained with a selected preference, including new arbitrary snake_case IDs. The prompt includes a **reference-only** vocabulary of common adult-intimacy, BDSM, vocalization and ABO terms; it does not force translations of user-supplied examples or affect candidate selection/classification. Existing static ID translations remain as backwards-compatible fallbacks.

Exact Korean UI strings: `잠재 후보 3~5개 · 확정 후보 별도` and `선택을 돕기 위해 제공되는 일반 후보입니다. 체크 시에만 적용됩니다.` The RP event analyzer retains source-language exact evidence quotes for validation.

## Credits & Inspiration

The menstrual/reproductive cycle tracking concept was inspired in part by **Koofer-zia's 《角色生理状态引擎》**:
https://github.com/koofer-zia/sillytavern-life-state

ABO Pixel Tracker is implemented separately; it does not include or modify Koofer-zia's original code, prompts, or assets.


## v0.3.8 — Setup token length & JSON retry

- Initial setup output token value now accepts 512–65,536, subject to model/provider limits.
- The current SillyTavern connection now receives `responseLength` on `generateRaw()`; saved profiles and custom endpoints keep their request routing.
- Retries occur only for invalid/empty/truncated profile JSON, not arbitrary API errors. A second JSON failure produces a specific error.
- No changes to preference candidate ranking, proposal counts, IDs, or stored state.


## v0.3.8 — Manual ABO selections and pheromone scent proposals

- Changing CHAR/USER ABO in the STATUS panel saves to chat metadata immediately. Use **ABO 선택 저장** to explicitly confirm the displayed classification, including seeded defaults that already match the desired value.
- The initial profile analysis now receives explicit STATUS-panel choices. When Alpha/Omega is manually selected but no established pheromone is present, the model is instructed to propose a tailored Korean-language scent, unchecked by default.
- Do not invent pheromone scents for manually selected Beta or unspecified characters. Preserve existing user-fixed scents and prefer explicit source facts. Suggestions are only stored after the user checks them and applies the proposal.
- The v0.3.7 token/JSON fixes, preference candidate counts, inference thresholds, and internal IDs remain unchanged.


### First-analysis ABO and anatomy proposals (v0.3.14)
- The AI suggests ABO type based on the existing personality, established preferences, and narrative characterization. It does not reuse the status panel's pre-analysis seeded value.
- Genital form alone uses a stable candidate-pool assignment based on sex and the selected ABO. Explicit card facts and manual settings always take precedence.
- Both are editable suggestions and remain unapplied until selected.
