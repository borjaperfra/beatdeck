# Content audit — kernel_panic_01.pptx vs Design v3

Sources inspected:

- `reference/source/kernel_panic_01.pptx` — 24 slides, 22 media files, speaker notes (the notes are layout instructions from the
  deck template, "DIVISORIA DE SECCION…", with no talk content).
- `reference/design-v3/Kernel Panic Live System v3.dc.html` — 8 scenes / 47 beats, persistent architecture world, Canvas field.
- `reference/source/kernel-panic.gif` — 800×450, 12 frames, event save-the-date graphic.
- Design project assets: `assets/avatar.png`, `assets/stickers/{localhost-enjoyer,qwencito}.png`, `fonts/*`,
  `assets/src/*` (re-encoded copies of the PPTX media; the PPTX originals are used instead because they are the originals).

Status legend: `COVERED` · `COVERED_BUT_SIMPLIFIED` · `RESTORE_SOURCE_ASSET` · `RESTORE_SOURCE_DETAIL` ·
`NEW_INTERPRETATION_APPROVED` · `MISSING`.

The ACTION column is what the production build does. Everything marked RESTORE is implemented, not planned.

| # | SOURCE CONTENT | V3 SCENE / BEAT | STATUS | ACTION |
|---|---|---|---|---|
| 01 | "Escalando inferencia" / "de 0 a cientos de usuarios" · Helmcode lockup (image2) + symbol (image3) · footer "helmcode.com 💙 nan.builders" · blank bg (image1) | 01.1–01.4 | COVERED_BUT_SIMPLIFIED | Keep the v3 boot → wordmark → title. Title, subtitle and footer are kept verbatim. The 💙 emoji becomes "·" (Helmcode voice: no emoji). The Helmcode lockup is represented by the `helmcode_` wordmark (the brand logo per the design system). |
| 02 | "Con Twitter empezó todo…" + tweet screenshot (image4): Cristian Córdova 🐧 ✓ @barckcode, 3 paragraphs, "12:59 a. m. · 10 abr. 2026 · 108,7 mil Visualizaciones", 109 · 21 · 475 · 144 | 02.1–02.4 | RESTORE_SOURCE_DETAIL | The tweet is rebuilt as live HTML with the exact source text (checked word by word against image4). Restored: 🐧 after the name, the verified badge, the source metadata wording ("Visualizaciones"), and the X action row as icons + numbers (reply 109 · repost 21 · like 475 in pink · bookmark 144 in blue · share) instead of v3's invented English "replies / reposts / likes / saves". The slide title itself is delivered by the v3 statement "Todo empezó con una idea bastante mala." (approved reinterpretation) and is kept in the presenter notes. |
| 03 | "¿Ollama? Wtf…" | 02.5 | COVERED | Zoom onto "con Ollama en 2 minutos", highlighted in violet (v3). The literal "¿Ollama? Wtf" is in the presenter notes (v3 had it as a disabled sticker; stickers stay limited to two). |
| 04 | "Local VS Self-hosted" + two illustrations (image5: dev at desk with `curl …/v1/models`; image6: globe network with Helmcode mark) | 03.1–03.6 | NEW_INTERPRETATION_APPROVED | The parallel-capacity simulation replaces the two illustrations; the simulation carries the technical meaning (capacity) that the pictures only suggested. The illustrations are decorative AI renders, not real artefacts, so they are not restored. "LOCAL ≠ SELF-HOSTED" labels at 03.6 plus the localhost-enjoyer sticker. |
| 05 | "~5 procesos concurrentes" vs "~75 procesos concurrentes" | 03.1–03.6 | COVERED | LOCAL stays at a 5-slot capacity and saturates (rejected requests in red). SELF-HOSTED capacity grows 10→20→40→60→80 slots while demand goes 5→15→30→50→75. Counters show "~5" / "~75". Status text is in Spanish ("procesos concurrentes") to match the source wording. |
| 06 | "Motores de inferencia Enterprise" + vLLM logo (image7) + SGLang logo (image8) | 03.7 | RESTORE_SOURCE_ASSET | The real logos replace v3's plain typography, at monumental scale in v3's offset composition with the violet "/". vLLM's dark-grey "LLM" letters are recoloured to off-white so they read on the black stage (the mark keeps its original yellow/blue). SGLang is used as is. Small system line "// motores de inferencia enterprise" kept, because it says what the logos are. |
| 07 | "Gobernanza" + LiteLLM logo (image9) + Bifrost logo (image10) | 03.8 | RESTORE_SOURCE_ASSET | Same treatment. The white backgrounds are keyed out and the black wordmarks recoloured to off-white; the LiteLLM train roundel and the Bifrost gradient ring keep their original colours. System line "// gobernanza". |
| 08 | Empty slide (only the corner symbol) | 04.4 | NEW_INTERPRETATION_APPROVED | Its narrative function is the void before BURN: everything is removed, and the drifting request particles fade out. |
| 09 | "¿Qué hardware (GPUs) necesitamos?" | 04.1 | COVERED | Editorial question, top-left (v3). |
| 10 | "¿Qué modelos queremos correr?" | 04.2 | COVERED | Editorial question, right-aligned (v3). |
| 11 | "¿Qué queremos hacer con la IA?" | 04.3 | COVERED | Editorial question at maximum scale (v3). |
| 12 | "Queremos quemar tokens para crear cosas con código" | 04.5 | COVERED | BURN / TOKENS. hero; the drifting particles become tokens pulled into the GPU. The source sentence is kept verbatim as the supporting line. |
| 13 | "Qwencito para los amigos" + Qwen3.6-35B-A3B release graphic (image11) | 04.6 | RESTORE_SOURCE_ASSET | Keep v3's MODEL SELECTED card (qwen3.6-35b-a3b · READY · qwencito) and the Qwencito sticker. Restored: the official release graphic as a framed contextual artefact next to the card ("// source: qwen3.6-35b-a3b open-source release"). "para los amigos" is carried by the `nickname qwencito` row. |
| 14 | "Nuestra primera GPU" + NVIDIA RTX PRO 6000 Blackwell product photo (image12) | 05.1 | RESTORE_SOURCE_ASSET | The real product photo (white background keyed out) appears inside the GPU node frame. At 05.2 the photo fades and the same node becomes the simplified architecture GPU node, so the photo and the node read as one object. The node status reads "nuestra primera gpu". |
| 15 | "Nuestra primera arquitectura (~25 users)" — diagram (image13): Linux Server ⊃ Nginx → LiteLLM → vLLM → RTX 6000 PRO ⊃ Qwencito | 05.2–05.6 | COVERED | Built live one node per beat: GPU ← vLLM ← LiteLLM ← Nginx ← ~25 users, then requests. The frame is labelled `server_01`, and the GPU sub-label is "qwencito". The old diagram image is not restored: the live architecture carries the same information. |
| 16 | "La waitlist no para de crecer" | 06.1 | COVERED_BUT_SIMPLIFIED | Active users animate 25 → 31 → 46 → 68 → 82 → 100 while the machine gets squeezed. Restored: the caption under the counter reads "usuarios activos · la waitlist no para de crecer". |
| 17 | "Primera evolución (~100 users activos)" — diagram (image14): server 01 (Nginx, LiteLLM, vLLM, GPU/Qwencito) + server 02 (vLLM, GPU/Qwencito), LiteLLM → vLLM₂ | 06.2 | COVERED | server_02 appears and restructures the world. The counter holds at 100 (= ~100 users activos). Edge LiteLLM → vLLM (server_02) as in the source. |
| 18 | "Carta a los reyes magos" | 06.3 | COVERED | Quiet beat: architecture dimmed to 15 %, statement large (v3). |
| 19 | "Múltiples modelos" — diagram (image15): server 03 (vLLM, GPU/Gemma4) + server 01 + server 02; LiteLLM routes to both | 06.4 | RESTORE_SOURCE_DETAIL | server_03 with Gemma4 (v3). Restored: a system block "// múltiples modelos" with the routing table `qwencito → server_01 · server_02` / `gemma4 → server_03`, and Gemma4 requests drawn in violet so the per-model routing is visible. |
| 20 | Three problems: "No hay HA en puntos críticos" · "Meter/quitar modelos supone caída de servicio" · "3. Todo dependía del server 01" | 06.5 | RESTORE_SOURCE_DETAIL | v3 warnings (`warning: single_point_of_failure`, …) kept, and the Spanish source line under each one made larger and higher-contrast (it is the message, not a footnote). Wording restored exactly: v3 said "Meter **o** quitar"; the source says "Meter/quitar". Numbered 1–3 as in the source. |
| — | (new) KERNEL PANIC | 06.6 | NEW_INTERPRETATION_APPROVED | 520 ms failure, then absolute black until the next input. Reduced motion: no jitter or RGB split, the hard cut stays. |
| 21 | "El combo para escalar" · Cloudflare logo (image16) "+" Kubernetes logo (image17) | 07.2 | RESTORE_SOURCE_ASSET | Monumental CLOUDFLARE + KUBERNETES words (v3). Restored: the real marks next to each word (the Cloudflare cloud in its own orange/amber; the Kubernetes helm wheel in its own blue). They shrink with the words into the layer labels at 07.3/07.4. The slide title goes in the presenter notes. |
| 22 | "Parte de la arquitectura actual" — diagram (image18): **Cloudflare**: DNS · Cloudflared · Rutas · Workers / **Kubernetes**: Cloudflared · Traefik · api.nan.builders · LiteLLM (Fork) · CNPG · Valkey · Grafana · Victoria Metrics · vLLM | 07.3–07.5 | RESTORE_SOURCE_DETAIL | All 13 components present, with the source spelling ("Victoria Metrics", "LiteLLM (Fork)", "Cloudflared" in both layers). "Parte de" restored as a system line "// parte de la arquitectura actual". The source has **no arrows**; see ambiguity A1 for how the relationships are drawn. |
| 23 | "En ~5 meses" · "+900 usuarios" · "+80 países" · "+10 modelos (no solo LLMs)" · "Procesamos casi 50B de tokens en un solo día" + "This is Fine" image (image19) | 08.1–08.6 | RESTORE_SOURCE_ASSET | One metric per beat (v3), then the 50,000,000,000 counter (~4.6 s) with "// procesamos casi 50B de tokens en un solo día" keeping the source's "casi". Restored: This is Fine appears 1.2 s after the counter lands, as a small framed punchline bottom-right with the system line "status: this is fine". It never covers the number and is gone by 08.6. Number format: v3 uses "900+"; the source uses "+900". Kept as v3 "900+" (same meaning, reads as a quantity at 620 px). |
| 24 | "¡Muchas gracias!" · "Cristian Córdova" · "@barckcode" · X icon (image20) · LinkedIn icon (image21) · QR placeholder (image22, a hand-drawn box with the letters "QR") | 08.7 | RESTORE_SOURCE_DETAIL | v3 Q&A: gracias, name, @barckcode, small KERNEL PANIC! mark, helmcode.com · nan.builders. Restored: the X and LinkedIn marks next to the handle (monochrome, like the source icons' role). Added at the speaker's request (supplied after the audit): a photo of Cristian presenting, 400×400, hairline frame, in the QR slot while no QR exists, next to it once one does. QR: **the source has no real QR** (image22 is a placeholder), so the destination is unknown. It lives in `src/deck/deck.config.ts → speakerQrUrl`, the QR SVG is generated at build time, and while it is `"TODO"` no QR is drawn on stage (presenter view and build output warn). |

## Event graphic (kernel-panic.gif)

| ELEMENT | USE |
|---|---|
| "KERNEL PANIC!" Archivo Black with violet offset shadow | Rebuilt in HTML/CSS for 01.3 (per-letter tilt as in v3), the panic (06.6) and the Q&A mark (08.7). |
| "// AI OPEN MODELS CONFERENCE · #01" | 01.3, above the wordmark. |
| "MADRID · 06 OCT · CASA DEL LECTOR, MATADERO" | 01.3, below the wordmark. |
| "SUDO RM -RF /BORING_TALKS" tilted sticker | Typed as the boot command (01.2) and shown as the tilted event sticker on the 01.3 wordmark (v3's only active text sticker; event identity, opening only). |
| Dot grid background | The Canvas dot field (7 %). |
| "COMING SOON" / "$ SAVE --THE-DATE" | **Not used**: save-the-date copy is wrong on the day itself. |
| Sponsor strip (Helmcode · Hugging Face · INDITEXTECH · Cloudflare) | **Not restored**: the only source is 800×450 GIF pixels, with no clean logo assets for Hugging Face or Inditex, and v3 does not include it. See "Could not restore". |

## Restored source assets (all bundled locally, `src/assets/source/`)

| FILE | FROM | PROCESSING |
|---|---|---|
| `vllm.png` | image7 | "LLM" grey → off-white; the mark keeps its colours |
| `sglang.png` | image8 | none (resized) |
| `litellm.png` | image9 | white keyed out, black text → off-white |
| `bifrost.png` | image10 | white keyed out, black text → off-white |
| `qwen-release.jpg` | image11 | resized to 1280 px, JPEG |
| `rtx-pro-6000.png` | image12 | white background keyed out (flood fill from the edges) |
| `cloudflare-mark.png` | image16 | cloud mark cropped |
| `kubernetes-mark.png` | image17 | helm wheel cropped |
| `this-is-fine.jpg` | image19 | resized |
| X / LinkedIn marks | image20 / image21 | redrawn as inline monochrome SVG glyphs |
| `cristian-cordova.jpg` | supplied separately by the user (`reference/source/cristian-cordova.jpg`) | none (400×400, shown at native size) |
| `avatar.png` | design-v3 `assets/avatar.png` (cropped from the tweet) | none |
| stickers | design-v3 `assets/stickers/*` | qwencito resized to 1024 px |

## Could not restore

1. **QR destination**: the PPTX only has a placeholder drawing. Needs the real URL (`speakerQrUrl`).
2. **Event sponsor strip** from the GIF: no clean vector or high-res logos for Hugging Face / INDITEXTECH, and it is not in v3.
   If wanted on the 01.3 wordmark, supply the logo files.
3. **Local / Self-hosted illustrations** (image5, image6): intentionally not restored (decorative; the simulation replaces them).
4. **Old diagram screenshots** (image13, 14, 15, 18): intentionally not restored; their meaning lives in the architecture world.

## Other discrepancies found vs v3

- v3 `"Meter o quitar modelos"` → source `"Meter/quitar modelos"` (fixed).
- v3 `VictoriaMetrics` → source `Victoria Metrics` (fixed).
- v3 tweet stats in English ("replies / reposts / likes / saves") → source is the X UI with icons (fixed).
- v3 tweet omits 🐧 and the verified badge (restored).
- v3 `"4.0 nuestra primera gpu"` etc.: v3 kept the slide titles as stickers but disabled them (`STK.slice(0, 1)`). The titles
  are not on stage (brief: no decorative labels); every beat's source title is in the presenter notes.
- Brief expected mapping §25 matches the PPTX. One addition: slide 01 also carries the "helmcode.com · nan.builders" footer (kept).

## Ambiguities (need the speaker's confirmation; they do not block the build)

- **A1: current-architecture relationships (slide 22).** The source is a component inventory with no edges. To show live
  traffic, one request path is drawn solid and animated: *DNS → Cloudflared (tunnel) → cloudflared (in cluster) → Traefik →
  LiteLLM (Fork) → vLLM*. This is the standard shape of a Cloudflare Tunnel + Traefik ingress, and v3 drew the same path.
  Supporting relationships from v3 are drawn **dashed and dim** to mark them as implied, not stated: api.nan.builders ↔ LiteLLM,
  LiteLLM → CNPG, LiteLLM → Valkey, vLLM → Victoria Metrics → Grafana. Rutas and Workers stay unconnected inside the
  Cloudflare layer, as in the source. If any of these is wrong, it is a one-line change in `src/architecture/architecture-layouts.ts`
  (`EDGES`).
- **A2: 50B.** The source says "casi 50B". The brief asks the counter to land on 50,000,000,000; the "casi" is preserved in the line
  under it.

## Acceptance checklist (brief §33) — verified 2026-09-30

How each item was checked: `npm run build` (typecheck + offline scan), `npm run screenshots` (all 47 beats + a mid-panic frame + direct-from-hash +
backwards + presenter + overview; 0 console errors, 0 remote requests), `node scripts/interaction-test.mjs` (25/25 pass),
`npm run perf` (Chrome, 1920×1080), and a manual pass over every screenshot.

CONTENT
- [x] All 24 source slides have an explicit mapping (table above).
- [x] No important source message has silently disappeared (titles not on stage are listed and live in the presenter notes).
- [x] vLLM / SGLang present, as real logos (03.7).
- [x] LiteLLM / Bifrost present, as real logos (03.8).
- [x] First GPU present, as the real product photo becoming the GPU node (05.1).
- [x] First architecture present (05.2–05.6).
- [x] ~100-user evolution present (06.1–06.2).
- [x] Multiple models present (06.4: Gemma4 on server_03 + routing table).
- [x] All three source scaling problems present, in exact Spanish wording (06.5).
- [x] Current architecture contains all 13 source components (07.3–07.5).
- [x] Final source metrics preserved (08.1–08.5, "casi" kept).
- [x] Q&A has the speaker identity (name, @barckcode, X/LinkedIn, photo). The QR is configurable; its **URL is still TODO**.

DESIGN
- [x] Normal scenes Helmcode-owned (v3 system unchanged).
- [x] Kernel Panic identity only in the opening (01.2–01.3), the panic (06.6) and the Q&A mark (08.7).
- [x] No recurring event tags; only the two approved Helmcode stickers.
- [x] No generic cyberpunk UI, no PowerPoint layouts.
- [x] Architecture readable at stage size (labels 30 px+, subs 18–20 px mono).
- [x] Typography legible at distance (screenshots at 1920×1080).

INTERACTION
- [x] PageDown / PageUp / arrows (interaction-test).
- [x] Fullscreen (F → Fullscreen API on `documentElement`; Esc exits natively). Needs a real browser window, so it was checked
      by code path rather than headlessly.
- [x] Presenter sync both ways, and recovery after a presenter refresh.
- [x] Hash recovery, refresh reconstructs the exact state, and localStorage fallback.
- [x] Previous beat is deterministic (every beat renders from `{scene, beat}` + its own timeline; see `back-*` screenshots).
- [x] Scene number shortcuts, Home/End, overview.

TECHNICAL
- [x] Works offline: no remote references in `dist/`, 0 non-local requests while walking every beat.
- [x] All fonts and images local.
- [x] Production build succeeds.
- [x] No console errors.
- [x] 60 fps on every heavy beat (3.5, 4.5, 5.6, 6.1, 6.5, 7.4, 7.5, 8.5), 0 frames over 25 ms (`artifacts/perf.json`).
- [x] The panic ends on absolute black (canvas stops drawing, chrome hidden, black overlay).
- [x] Reduced motion: static takeover, cut to black kept (`reduced-06-06*.png`).

STAGE
- [x] 1920×1080 composition; letterbox checked at 1024×768.
- [x] Cursor hides after 2 s and returns on movement; no scrollbars; no selection.
- [x] Q&A is static (no loops; the canvas stops once the field fades out).
- [x] Presenter recovers after refresh.

## Remaining TODOs

1. **QR destination**: set `speakerQrUrl` in `src/deck/deck.config.ts` and rebuild (source had only a placeholder).
2. **A1**: confirm the implied relationships in the current architecture (dashed wires). They are a one-line change each.
3. Optional: supply sponsor logos if the event strip from the GIF should appear on the 01.3 wordmark.

## Revision 2 (speaker feedback, 30/09)

- Title: "de 0 a +1000 usuarios"; Cristian Córdova · Founder & CEO de Helmcode (intro and outro); Helmcode lockup
  (official SVG, `helmcode-design/assets/logo/SVG/logo-negativo.svg`) on the title and the Q&A.
- One left edge (x=120) for all text; no staggered indents or right-aligned blocks.
- New beat 02.6 "¿Ollama? Wtf…" (slide 03, typed). Removed the empty 04 "void" beat (slide 08 had no content).
- Removed: localhost-enjoyer sticker, Qwen release graphic + source line, RTX product photo (replaced by an original
  line drawing of the card that traces itself in), bottom chrome labels, secondary status text in 03.
- Big text-only slides type in with a cursor (02.1, 02.6, 04.1–04.3, 06.3, 07.2).
- Packets redesigned as light pulses along the wires (no head/tail); 06.1 keeps server_01 at a fixed size.
- 06.5 warnings smaller; 06.6 ends on black with a kernel panic message instead of an empty screen.
- 07.2 smaller: CLOUDFLARE / KUBERNETES type into their selection boxes, marks land after.
- Finale metrics each build a pixel visual: activity grid since the tweet (~5 meses), 900 user cells, dithered world
  map with 80 points (**illustrative: the 80 most populous countries, not the real user list**), ten model glyphs.
- Q&A: "¡Muchas gracias!" large, speaker small; 1-bit portrait from helmcode.com/about assembling dot by dot.

## Revision 3 (30/09)

- Typewriter cursor: cap-height bar on the baseline (was 0.06em high and too tall).
- **A1 resolved with the speaker:** clients call `https://api.nan.builders/v1` (NaN docs), so the request path is
  DNS → Cloudflared → cloudflared → Traefik → **api.nan.builders** → LiteLLM (Fork) → vLLM, laid out as a staircase.
  Still implied (dashed): LiteLLM → CNPG, LiteLLM → Valkey, vLLM → Victoria Metrics → Grafana.
- 80 países: pins only in the Americas (Canada, USA, LatAm, Caribbean) and Europe — none in Africa, Asia or Oceania.
  80 countries picked from Natural Earth 50m (Russia excluded).
- 10+ modelos: the real cluster list from nan.builders/docs/models (13 models, mimo-v2.6-flash and qwen-image-2.1
  marked new).
- Q&A portrait: helmcode.com/about photo → our own 100×100 Atkinson dither in the site's colours (4 px dots),
  photo first, then the dither takes over.
