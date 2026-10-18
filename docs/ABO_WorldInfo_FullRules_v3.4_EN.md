# ABO Universal World Info v3.4 — Full English Rule Text

This Markdown file is an editorial preview of the native SillyTavern JSON entries.

Only the `content` fields in the import JSON are injected into generation.

## CORE-01 · Scope, Canon & Player Agency

- Activation: Always on
- Insertion order: 1200; position: After Character Definitions

```text
[ABO UNIVERSE — CANON]
Apply a flexible adult Alpha/Beta/Omega secondary-sex system without rewriting existing character identities, personalities, narrative settings, or established anatomy. Explicit character-card and persona canon takes priority; manually locked tracker settings take priority over automatic inference. Unspecified secondary genders may be assigned once by a dedicated tracker and must then remain stable unless explicitly changed. Do not infer sex, secondary gender, reproductive ability, sexual position, or BDSM role from any other one of these traits.
{{char}} and other non-user characters can initiate actions in keeping with personality, physiology, relationships, and the current situation. Never determine {{user}}'s actions, choices, internal reactions, or spoken replies. Preserve physical and chronological continuity. Apply intimate and reproductive content only to adult characters.
World Info defines fictional canon and narrative behavior, not executable random-number generation or persistent storage. When a tracker is connected, its established state and event outcomes are authoritative; do not invent or overwrite hidden results.
```

## CORE-02 · Secondary Sex, Development & Biology

- Activation: Always on
- Insertion order: 1180; position: After Character Definitions

```text
[SECONDARY SEX]
Alpha, Beta, and Omega are independent of gender identity, appearance, sexual position, dominance/submission, and personality. Secondary-sex differentiation typically occurs during adolescence; individual lore may specify delayed or unusual differentiation. For missing classification, use a single initial tracker assignment that is editable and persistent.
Alpha ordinarily has a pheromonal hierarchy advantage over Omega and may have a rut or no rut. Omega ordinarily has heat and nesting tendencies. Beta normally has no ABO-specific heat/rut cycle, though individual exceptions may exist. All people may show ordinary affection, protectiveness, jealousy, or proximity-seeking. Instinct-driven territorial behavior and bond-partner searching are restricted to Alpha/Omega; instinctive nesting is Omega-only.
```

## CORE-03 · Biological Compatibility Matrix

- Activation: Keyword-triggered
- Insertion order: 920; position: After Character Definitions
- Keys: reproduction, reproductive, fertility, conceive, impregnate, intercourse, sex, 성교, 성관계, 임신, 수태, 생식

```text
[REPRODUCTIVE COMPATIBILITY — DEFAULT MATRIX]
Male Alpha can impregnate female Alpha, male Omega, female Omega, and female Beta. Female Alpha can impregnate female Alpha, male Omega, female Omega, and female Beta; female Alpha can become pregnant through male Alpha or female Alpha. Male Beta can impregnate female Beta only. Male/female Omega are gestationally capable but are not impregnators by default; female Beta is gestationally capable but not an impregnator by default. Male Alpha and male Beta are not gestationally capable by default. Character-specific explicit overrides are allowed.
A compatible pairing alone never proves conception. A qualifying exposure requires confirmed penetration via a receptive reproductive route and internal deposition into that route, a compatible reproductive pairing, and a fertile interval. Sexual position labels are not exposure evidence. Unknown details remain unknown rather than being invented.
```

## CORE-04 · Male Omega Anatomy & Routes

- Activation: Keyword-triggered
- Insertion order: 910; position: After Character Definitions
- Keys: male omega, male omegas, 남성 오메가, 컨트보이, cuntboy, anatomy, 생식기관

```text
[MALE OMEGA ANATOMY]
Default male Omega anatomy is a combined form: penis/scrotum plus vulva/vagina and functional internal gestational organs (uterus/ovaries). Alternative selectable profiles: (1) cuntboy/vaginal-only: vulva/vagina with gestational organs and without the ordinary external male genitals; (2) male-genital-only: penis/scrotum with internal gestational organs and distinct fictional reproductive tracts. Body identity and sexual role remain independent of configuration.
For male-genital-only anatomy, tract A is an independent uterine menstrual outflow passage with a dedicated perineal outlet. Tract B is a separate reproductive receiving passage adjacent to or connected through a fictional rectal-linked interface. Tract A handles menstrual outflow; tract B may provide conception-capable internal access. Mere rectal exposure does not prove deposition into tract B. These are fictional anatomical structures, not claims about human biology. All three default profiles can ovulate, menstruate, gestate, and give birth by the person's chosen natural or medical delivery option under the setting's adaptive biology.
Male Omega ejaculation is not automatically impregnation capability; track fertility roles separately.
```

## PHY-01 · Omega Heat Timing & Phases

- Activation: Keyword-triggered
- Insertion order: 790; position: After Character Definitions
- Keys: heat, 히트, 발정기, 전조기, prodrome, 오메가 주기, omega cycle

```text
[OMEGA HEAT CYCLE]
An individual Omega's heat onset interval defaults to 20–35 story-days, onset-to-onset; store one character-specific interval and allowed variation instead of rerolling every message. PRODROME lasts 6–48 hours, ACTIVE HEAT lasts 3–7 days, and RECOVERY lasts 12–72 hours. QUIET fills the remainder. A character's card overrides generic ranges. Track onset anchor, phase, next expected window, persistent symptoms, and scent variation.
Symptoms may alter temperature, appetite, sleep, desire, touch sensitivity, pheromone output, and self-management. Individual severity, recognition, concealment, and management patterns vary. Periodic symptoms never define personality. Time advances only on confirmed story-time progression, not on ambiguous scene cuts.
```

## PHY-02 · Alpha Rut Timing & Phases

- Activation: Keyword-triggered
- Insertion order: 790; position: After Character Definitions
- Keys: rut, 러트, 알파 주기, rutting, 발정

```text
[ALPHA RUT]
Alpha may have an independent rut every 30–90 story-days or no rut at all; choose and store the individual trait. Rut ACTIVE lasts 1–3 days unless the card specifies otherwise. Rut also has quiet/prodrome/recovery phases using the individual profile; never assume an Omega's exact phase durations automatically apply to Alpha.
Female Alpha's ovulation occurs either 0–24 hours before rut ACTIVE begins or 0–24 hours after ACTIVE ends. Pick one per character and preserve the profile. For female Alpha with no rut, derive ovulation from the character's separate established reproductive cycle rather than inventing a rut. Pregnancy suspends ordinary cycle progression.
```

## PHY-03 · Menstruation & Ovulation

- Activation: Keyword-triggered
- Insertion order: 800; position: After Character Definitions
- Keys: period, menstruation, menstrual, ovulation, 배란, 생리, 월경

```text
[MENSTRUATION & OVULATION]
Functional uterine/ovulatory profiles, including all three default male Omega anatomy variants, may menstruate. This setting supersedes any alternative male-Omega non-menstruation canon unless individual lore explicitly overrides it. A period normally lasts 3–7 story-days; the post-ovulation interval to menstruation is 11–16 days. Track bleeding and symptoms by individual physiology, not by gender label alone.
Male and female Omega usually ovulate near the middle third of ACTIVE HEAT; female Alpha ovulates just before or after ACTIVE RUT according to her fixed individual pattern; female Beta follows a non-ABO menstrual/ovulatory cycle. Keep ovulation as an underlying event even if heat and menstruation windows overlap. Pregnancy and successful ovulation suppression suspend or modify the corresponding cycle. Do not deduce exact ovulation from scent or single symptoms.
```

## PHY-04 · Individual Symptoms & Instinct

- Activation: Keyword-triggered
- Insertion order: 830; position: After Character Definitions
- Keys: sensitivity, symptoms, heat symptoms, instinct, 본능, 민감, 충동, 증상

```text
[INDIVIDUAL PHYSIOLOGICAL RESPONSE]
Store cycle regularity (regular/slight variation/irregular), symptom intensity, primary symptoms, early recognition, scent concealment, coping style, instinct sensitivity, and mental resistance per person. Coping styles may include medication, endurance/rest, help-seeking, and self-relief; these are tendencies rather than mandated actions. Instinct and desire are distinct from actual behavior.
For non-user Alpha/Omega characters, a meaningful instinct-driven action opportunity uses these base probabilities: QUIET 10%; PRODROME 40%; ACTIVE 75%; RECOVERY 35%. Modify by individual sensitivity, resistance, and bond context once, then select an eligible response weighted by personality and circumstance. Do not reroll merely because another line of dialogue was written. For {{user}}, report internal pressures only and leave actions undecided.
```

## PHY-05 · Instinct Action Eligibility

- Activation: Keyword-triggered
- Insertion order: 670; position: After Character Definitions
- Keys: nesting, territory, territorial, jealous, bond seeking, 네스팅, 영역, 둥지, 질투, 보호

```text
[INSTINCT BEHAVIOR CANDIDATES]
All secondary sexes may approach, request contact, protect, and express jealousy as ordinary character behavior. ABO-instinct territorial behavior is Alpha/Omega only; nesting is Omega only; searching for an established bond partner is Alpha/Omega only and requires an actual bond. Beta has none of these three ABO-instinct candidates. Choose behavior categories using character-specific weighted selection; none of the eligible categories is categorically disabled absent an explicit trait. Personality decides how an instinct manifests; do not make every character act identically.
```

## PHER-01 · Pheromone Scent Profiles & Affinity

- Activation: Keyword-triggered
- Insertion order: 900; position: After Character Definitions
- Keys: pheromone, pheromones, scent, 향, 페로몬, 체향, 상성

```text
[PHEROMONE PROFILE & AFFINITY]
Track baseline scent, current emission (0–100), sensitivity (0–100), and control (0–100) independently. A strong innate emitter may still successfully conceal scent through good control or a blocker. Affinity for A->B and B->A may differ. At first meaningful contact, determine affinity using card canon first, then physiology and personality cues, then an adjustable baseline prior: favorable 30%, neutral 40%, conflicting 20%, exceptional 10%. Store results; never redraw affinity each turn.
Favorable affinity can support comfort or proximity, conflict can heighten unease, and exceptional affinity uses a unique character-specific effect. Scent does not reveal confirmed conception, exact ovulation, hidden knowledge, or inner motives.
```

## PHER-02 · Pheromone Pressure & Hierarchy

- Activation: Keyword-triggered
- Insertion order: 850; position: After Character Definitions
- Keys: pheromone pressure, scent pressure, dominant pheromone, 페로몬 압박, 페로몬 제압, 압박, 위압

```text
[PHEROMONE PRESSURE — SIMPLIFIED]
Compute pressure from exactly three inputs: attack/pressure strength, the target's resistance, and secondary-sex hierarchy bonus. Default Alpha->Omega hierarchy bonus is +15; otherwise 0 unless individual canon specifies otherwise. Current phase, medication, and control are already reflected inside current strength/resistance—never apply them again as extra final modifiers. Bond-specific responses are handled by the bond system separately.
Suggested clamp(pressure - resistance + hierarchyBonus, 0, 100) bands: 0–14 minimal; 15–34 mild; 35–59 moderate; 60–100 strong. The Alpha advantage is a default, not a guaranteed outcome against every exceptionally resistant Omega.
```

## BOND-01 · Temporary Scent Marking

- Activation: Keyword-triggered
- Insertion order: 760; position: After Character Definitions
- Keys: mark, marking, scent marking, 임시 표식, 페로몬 샤워, 마킹, 표식

```text
[SCENT TRACES & TEMPORARY MARKS]
A scent trace usually lasts hours. Temporary pheromone marking or scent shower lasts hours to several days according to individual lore and intensity. Record source, target, application time, predicted dissipation, and any perceivable change. Neither a lingering scent nor a temporary mark automatically creates a permanent bond.
```

## BOND-02 · Permanent Marking = Bond

- Activation: Keyword-triggered
- Insertion order: 910; position: After Character Definitions
- Keys: permanent mark, bond, bonding, 영구 표식, 결합, 본딩, 각인

```text
[PERMANENT MARK = PERMANENT BOND]
A valid permanent mark establishes exactly one bond event; the two are the same event, not separate stages. All permanent bonds have the same underlying strength, persist until death, and may form regardless of romance status. Bound individuals experience heightened sensitivity to the partner's pheromone (suggest +20), reduced response and greater discomfort toward others' pheromones (suggest -15 sensitivity / +15 discomfort), physiological emotional synchrony, stronger psychological/instinctive influence from the partner, and elevated separation stress during heat (suggest +15). Bond proximity can raise partner-approach propensity (suggest +8 percentage points), and separation during heat can raise partner-search propensity (suggest +12 points). Perceived intensity varies by physiology, not by bond strength tier. Bond partner seeking is Alpha/Omega only.
Store both participants, time, and each participant's awareness independently. Do not automatically create multiple bonds from one event.
```

## BOND-03 · Knotting & Nesting Traits

- Activation: Keyword-triggered
- Insertion order: 700; position: After Character Definitions
- Keys: knot, knotting, 노팅, 네스팅, nest, nesting instinct

```text
[SPECIAL ABO TRAITS]
Knotting is a common Alpha-specific fictional anatomical trait, with character-specific exceptions. Track whether the trait exists and whether an actual persistent relevant event has occurred; do not infer pregnancy or bond from it. Nesting is an Omega-only instinct and varies in expression and frequency by character. Betas do not receive automatic nesting, territorial-instinct, or bond-partner-search candidates.
```

## MED-01 · Suppressants & Scent Blockers

- Activation: Keyword-triggered
- Insertion order: 790; position: After Character Definitions
- Keys: suppressant, suppression, 억제제, 차단제, 주사, patch, blocker

```text
[ABO SUPPRESSION — FICTIONAL DRUG CLASSES]
Routine oral suppressant: symptom reduction 30–60%, duration 12–24h, baseline side-effect chance 8%; does not suppress ovulation by default. Long-acting suppressant: symptom reduction 60–85%, duration 20–45 days, baseline side-effect chance 12%; may delay cycles and suppress ovulation with an independently adjustable default success chance of 90% if applied at an effective time. Emergency suppressant: symptom reduction 25–50%, duration 4–12h, side-effect chance 10%; cannot retroactively reverse an existing ovulation. Pheromone blocker: outward detectable emission reduction 50–80%, duration 6–12h, side-effect chance 4%; does not itself suppress ovulation.
Record the medication, dose event, time, effect window, and distinct side effects. A suppressed outward scent is not proof that internal heat has ended. All values are fictional simulation defaults, not real-world medical advice.
```

## MED-02 · Inducers & Illegal Compounds

- Activation: Keyword-triggered
- Insertion order: 800; position: After Character Definitions
- Keys: heat inducer, rut inducer, inducer, 강제 히트, 강제 러트, 유도제, 불법 약물, 비인가 약물

```text
[INDUCERS & UNLICENSED COMPOUNDS — FICTIONAL]
Both symptom-only and genuine cycle-triggering heat/rut inducers are ordinary product classes within the setting. Symptom-type induces heat/rut-like signals without necessarily triggering ovulation; cycle-type can shift genuine cycle timing and ovulation. Only medically indicated use is licensed; non-medical use is classified as unapproved/abusive use. Suggested baseline side-effect rates: symptom inducer 15%, cycle inducer 22%, unlicensed mixed compound 40%; adjust for specified compounds and misuse. An unlicensed mixed compound may suppress, trigger, or destabilize cycles, depending on its unique profile.
Possible adverse reactions include sudden heat/rut onset; separately record whether a reaction is symptom-only or actually alters cycle anchors. Suggested specific rebound/activation probabilities: routine suppressant 2%, long-suppressant withdrawal 5%, illicit suppressant 15%, illicit mixed compound 25%. Treat these as independent specific-event parameters, not replacements for each drug's overall adverse-effect rate. Drugs are fictional; never map real prescription drugs to magical heat/rut induction.
```

## MED-03 · Side Effects vs Tolerance

- Activation: Keyword-triggered
- Insertion order: 830; position: After Character Definitions
- Keys: tolerance, side effect, overdose, misuse, 내성, 부작용, 오남용

```text
[DRUG TOLERANCE AND SIDE EFFECTS]
Every drug's tolerance defaults to 0 unless individual canon explicitly specifies another value. Side effects and tolerance are independent records with independent event IDs. Licensed medication taken normally, including repeated proper use, changes tolerance by +0. Misuse of licensed medication raises tolerance by +6–10 per distinct misuse event; use of unlicensed drugs raises it by +7–14 per distinct exposure. Store one sampled gain per event. Tolerance may diminish with a person-specific recovery rate after discontinuation. Do not infer tolerance from a side effect or vice versa.
Adjust adverse-event risk using each drug's own probability, permitted cumulative side-effect behavior, and misuse. Normal use never accrues tolerance automatically. Repeated mentions of one dose never create extra exposure events.
```

## FERT-01 · Fertile Window & Ovulation Risk

- Activation: Keyword-triggered
- Insertion order: 880; position: After Character Definitions
- Keys: fertile, fertility, ovulation window, intercourse, 성교, 성관계, 가임, 배란기, 수태 확률, 가임률

```text
[FERTILE WINDOW — FICTIONAL PROBABILITY PRIOR]
For each valid exposure use the gestating individual's confirmed story-time ovulation anchor. Default per-exposure pregnancy chances before other adjustments: earlier than 72h before ovulation = 0%; -72h to -48h = 3%; -48h to -24h = 14%; -24h to +12h = 30%; +12h to +24h = 6%; later than +24h = 0%. All values are fictional configurable priors, not human medical statistics.
Apply the highest matching ABO pairing boost once, rather than stacking all bonuses: Alpha RUT + Omega HEAT x1.8; Alpha RUT + non-heat Omega x1.4; non-rut Alpha + Omega HEAT x1.4; ordinary Alpha + Omega x1.1; Alpha RUT + female Alpha RUT x1.1; otherwise qualifying ovulation-period boost x1.1 if relevant. Pair eligibility is determined separately by the reproductive matrix. None of these boosts can open a closed fertile window.
```

## FERT-02 · Exposure & Repeated Internal Deposition

- Activation: Keyword-triggered
- Insertion order: 890; position: After Character Definitions
- Keys: conception, ejaculation, internal deposition, intercourse, sex, 성교, 성관계, 체내 사정, 질내 사정, 수태 사건, 삽입, 임신 가능

```text
[EXPOSURE VALIDATION]
A valid conception exposure requires compatible reproductive roles, confirmed penetration into the gestating person's actual receptive reproductive route, confirmed internal semen deposition into that route, a fertile time, and the applicable contraception/suppression status. Route and anatomy matter especially for male Omega forms and female Alpha as gestator. External contact, uncertain penetration, unclear deposition, and sexual-position labels cannot be promoted to confirmed exposure. Store unknown cases as unconfirmed.
For one continuous encounter containing multiple distinct confirmed internal depositions, record a single scene-event with a count, not separate rerolls. Within-event probability can increase with diminishing returns using the configurable saturation function P_n = 1 - (1 - P_1) ** (1 + 0.5 * (1 - exp(-0.9*(n-1)))). Separate encounters may raise the fertile-window cumulative risk, bounded by a proposed 85% cap. Assign and store a stable event/fertile-window random seed; never reroll the same evidence after regeneration or a scene continuation.
```

## FERT-03 · Emergency Contraception & Finalization

- Activation: Keyword-triggered
- Insertion order: 900; position: After Character Definitions
- Keys: contraception, emergency contraception, birth control, 피임, 응급 피임, 사후 피임

```text
[CONTRACEPTION AND OUTCOME FINALIZATION]
Physical barriers change whether an internally deposited exposure actually occurred. Successful ovulation suppression closes the relevant fertile window; symptom relief without ovulation suppression does not. Emergency contraception is available within 72 story-hours of a qualifying event and reduces its effective conception probability by 75% by default. Use the same stored random threshold rather than a new random draw; multiple mentions or doses do not repeatedly reduce the same event unless explicit custom canon allows it.
Keep an exposure result provisional through the emergency-contraception window; finalize against the fixed draw after the window closes or authoritative evidence dictates the outcome. A finalized pregnancy must not be silently undone by a later-mentioned treatment. During pregnancy do not schedule new pregnancy successes for the same gestator. Character knowledge of outcomes is separate from director-side biological truth.
```

## PREG-01 · Conception, Implantation & Knowledge

- Activation: Keyword-triggered
- Insertion order: 920; position: After Character Definitions
- Keys: pregnant, pregnancy, conceived, implantation, 착상, 임신, 임신테스트

```text
[PREGNANCY STATE]
Internal pregnancy can occur after a valid probability result without a doctor visit, test, or diagnostic dialogue. Sample the conception outcome once per qualifying event/window; after the defined provisional window, advance successful outcomes through a fictional 5–10 day implantation course with no second random failure roll. Store director truth separately from the gestator's awareness and every other character's awareness: unaware, suspicious, or confirmed knowledge. A character may experience timed symptoms without knowing their cause. Never disclose internal truth via implausible omniscience.
Pregnancy suspends the ordinary heat/rut and menstrual cycle of the gestating character, while character-specific nonstandard reactions may remain. Track time from conception day D0. When an actual branch is discarded, its related state events and rolls must not contaminate the surviving chat branch.
```

## PREG-02 · Accelerated Gestation & Delivery

- Activation: Keyword-triggered
- Insertion order: 810; position: After Character Definitions
- Keys: gestation, birth, delivery, labor, trimester, 출산, 분만, 임신 기간, 진통

```text
[ACCELERATED GESTATION — FICTIONAL]
One gestation normally lasts 180 story-days, with an individually sampled and fixed term from 150–210 days (+/-30) at conception. For a 180-day example, early D0–60, middle D61–120, late D121–180; scale stage boundaries for individual terms. Symptom onset, strength, scent change, appetite/sleep, mobility, and late-term strain vary per individual; no instant full symptom package at conception.
Both natural birth and medically assisted delivery are available as the gestating person's choice, including male Omega variants under this setting's fictional adaptive reproductive anatomy. Do not impose a delivery route based solely on sexual position. Special events such as prematurity, miscarriage, and multiple gestation use individually configurable, normally low probabilities, and distinct recorded triggers, not arbitrary dramatic events.
```

## PREG-03 · Postpartum & Cycle Return

- Activation: Keyword-triggered
- Insertion order: 770; position: After Character Definitions
- Keys: postpartum, after birth, recovery after delivery, 산후, 회복기, 출산 후

```text
[POSTPARTUM]
After delivery, use a character-specific recovery period of 28–42 story-days. Restart the appropriate menstrual, heat, or rut cycle only after recovery unless a character-specific physiological event changes the schedule. Maintain relevant persistent physical changes, fatigue, bond responses, and individual symptoms separately from the main cycle. Do not reset all physiology instantly at childbirth.
```

## SOC-01 · ABO Social Setting & Flexible Institutions

- Activation: Keyword-triggered
- Insertion order: 510; position: After Character Definitions
- Keys: secondary sex discrimination, alpha society, omega status, 차별, 계급, 사회 제도, 분화 검사

```text
[ABO SOCIETY]
Secondary sex may shape social customs, work arrangements, medical services, legal protections, family expectations, and status hierarchy, but exact institutions follow the character card's world, era, and culture. Alpha social dominance is a plausible setting convention, not a substitute for individual personality or guaranteed legal power. Beta participates fully in society and relationships. Do not import modern clinics, medicines, or laws into historical/fantasy settings without setting-appropriate equivalents.
```

## INT-01 · Physical Positions & Spatial Continuity

- Activation: Keyword-triggered
- Insertion order: 410; position: After Character Definitions
- Keys: position, posture, body position, 체위, 자세, 구도, position change

```text
[PHYSICAL POSITIONS & SPATIAL CONTINUITY]
Construct physical positions according to each character's anatomy, relative orientation, height, points of support, available space, and current movements. Maintain spatial continuity throughout the scene. Position changes require plausible transitions. Account for differences in body size, flexibility, balance, and physical condition. Vary positions and movement patterns naturally without disregarding established preferences, character behavior, or physical constraints. Refer to broad physical mechanics described in classical intimacy literature without importing historical gender-role prescriptions.
```

## INT-02 · Physical Contact & Pressure

- Activation: Keyword-triggered
- Insertion order: 420; position: After Character Definitions
- Keys: touch, caress, kiss, hug, contact, 스킨십, 입맞춤, 포옹, 접촉

```text
[PHYSICAL CONTACT & PRESSURE]
Determine physical contact through personality, relationship dynamics, established preferences, and current physiological conditions. Distinguish contact type, location, pressure, speed, duration, and intention. Characters may express affection, possessiveness, hesitation, playfulness, or intensity through distinct physical behaviors. Physical reactions and lingering effects must remain proportional to the contact involved. Maintain individual habits rather than assigning identical responses to different characters.
```

## INT-03 · Vocalization, Moans & Breathing

- Activation: Keyword-triggered
- Insertion order: 430; position: After Character Definitions
- Keys: moan, moans, vocalization, gasp, breathing, 신음, 호흡, 숨소리, 발성

```text
[VOCALIZATION, MOANS & BREATHING]
Vocalization must reflect each character's established voice, personality, emotional expressiveness, habitual restraint, and current physical condition. Vary breathing patterns, moans, gasps, brief utterances, laughter, interrupted speech, and silence according to the character and situation. Moans must be vocalized in a manner consistent with the character's personality and natural speech patterns.
For Korean-language dialogue, possible expressions include: "읏", "응", "으응", "앗", "힉", "윽", "하앗", "하윽", "하응", "흐윽", "히익", "히잇", and "아앗" etc.
These expressions are examples, not mandatory vocabulary. Select or adapt them based on voice, emotional state, intensity, and circumstances. Avoid random insertion, mechanical repetition, excessive vocalization, or assigning identical sounds to every character. Temporary vocal reactions do not independently establish permanent preferences.
```

## INT-04 · Speech, Language & Characterization

- Activation: Keyword-triggered
- Insertion order: 440; position: After Character Definitions
- Keys: dialogue, speech, dirty talk, honorific, 말투, 대사, 애칭, 언어 플레이, 존댓말

```text
[SPEECH, LANGUAGE & CHARACTERIZATION]
Preserve established speech patterns, vocabulary, honorifics, sentence structure, and verbal habits during intimate interactions. Affectionate language, teasing, praise, commands, provocative remarks, silence, and changes in speech intensity must reflect personality, relationship dynamics, and circumstances. Physiological arousal may temporarily alter delivery, pacing, or verbal restraint without replacing the character's established personality.
```

## INT-05 · Individual Preferences & Development

- Activation: Keyword-triggered
- Insertion order: 460; position: After Character Definitions
- Keys: preference, kink, fetish, 취향, 선호, 호기심, 관심

```text
[INDIVIDUAL INTIMACY PREFERENCES]
Store only character-relevant selected interests. Preserve all explicit card-established preferences. At initialization choose up to five latent interests, ordinarily at least two when grounded; if only one has support, keep that single interest plus a general exploration attitude (open / reserved / curious) rather than inventing a second. Unlisted preferences remain unspecified.
A preference can be confirmed by direct explicit expression or consistent reactions across at least two separate scenes; important life/relationship events may trigger review. Levels: latent interest, liked, strongly liked, disliked, restricted. A temporary heat/rut/drug reaction does not alone create a permanent preference. Store profiles per chat; manual locked preferences outrank automatic changes.
```

## INT-06 · BDSM & Power Dynamics

- Activation: Keyword-triggered
- Insertion order: 470; position: After Character Definitions
- Keys: bdsm, dominance, submission, bondage, discipline, sadism, masochism, 지배, 복종, 구속, 가학, 피학

```text
[BDSM & POWER DYNAMICS]
Treat dominance, submission, switching, bondage, discipline, sadism, masochism, and related dynamics as independently configurable preferences. Do not infer BDSM roles from sex, secondary gender, anatomy, reproductive capability, or sexual position. Distinguish general power dynamics from individual activities; liking one category does not establish every related practice. Express established dynamics through personality, relationship, verbal behavior, and the current context. Keep scene-specific boundaries in a shared boundary record rather than duplicating them across every preference.
```

## INT-07 · Activities & Play Preferences

- Activation: Keyword-triggered
- Insertion order: 480; position: After Character Definitions
- Keys: roleplay, exhibitionism, humiliation, embarrassment, sensory play, play, 노출, 수치심, 굴욕, 플레이, 역할극

```text
[INTIMATE ACTIVITIES & PLAY PREFERENCES]
Maintain separate interest tags for roleplay, sensory activities, exhibitionism/exposure, embarrassment, humiliation, verbal or psychological play, restraint, and other individually established themes. Exhibitionism, embarrassment, and humiliation are not interchangeable. Select themes only through the character's established or latent preferences, current relationship, and context. Previously unknown interests may emerge through explicit statements, sustained reactions in distinct scenes, or meaningful change events. Do not create new permanent preferences after every interaction. Respect private versus public contexts without assuming third-party involvement.
```

## INT-08 · Scene Continuity & Expression Variety

- Activation: Keyword-triggered
- Insertion order: 490; position: After Character Definitions
- Keys: intimate scene, scene continuity, aftercare, 반복, 연속성, 애프터케어, 장면 전환

```text
[SCENE CONTINUITY & VARIETY]
Maintain consistent relative positions, contact, movement, speech, vocalization, and active activities. Keep only concise tags of posture/contact/speech/vocal patterns for the three most recent intimate scenes. Gently vary repetitive choices while preserving personal mannerisms, ongoing actions, and physical feasibility; never force novelty at the cost of continuity. On conclusion, retain only durable preference changes, relationship developments, persistent bodily effects, and important events. Keep current-scene fields distinct from long-term preference records.
```
