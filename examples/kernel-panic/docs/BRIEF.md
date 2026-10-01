# kernel-panic-live — production brief

Production implementation of the interactive fullscreen talk
**"Escalando inferencia · de 0 a cientos de usuarios"** (Cristian Córdova, KERNEL PANIC #01, Madrid, 06 oct).

References (read-only):

- `reference/design-v3/Kernel Panic Live System v3.dc.html` — VISUAL + INTERACTION source of truth (approved).
- `reference/source/kernel_panic_01.pptx` (unzipped in `reference/source/pptx/`) — CONTENT source of truth.
- `reference/source/kernel-panic.gif` — event graphic (visual reference for the opening).

When they conflict: **PPTX decides WHAT is communicated. v3 decides HOW it feels and behaves.**

Docs: `docs/CONTENT-AUDIT.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/RUNBOOK.md`.

---

## Priority order

A. Preserve v3's visual system, interaction model, pacing and transitions.
B. Audit ALL 24 source slides against the implementation.
C. Restore content, real artefacts, images, logos, technical detail or narrative beats v3 simplified or omitted.
D. Do NOT revert to conventional slides.
E. Do NOT invent a new art direction.

Then: 1 content fidelity · 2 live reliability · 3 scene/beat correctness · 4 architecture continuity · 5 stage readability · 6 motion polish · 7 developer niceties.

## Design authority

HELMcode owns the talk, KERNEL PANIC owns the room (~80/20).

- Near-black stage, white/off-white type, Helmcode violet (#4934E1, small text #818CF8), Roboto + Roboto Mono (local), hairlines, huge editorial type, negative space, precise motion. No rounded startup cards, no dashboard look, no generic cyberpunk.
- KERNEL PANIC identity only in: opening, the panic, subtle Q&A mark. No recurring event tags / decorative stickers.
- Only two Helmcode stickers: `localhost enjoyer` (03.6) and `Qwencito` (04.6). Do not add more.
- Archivo Black only for event identity / panic. Cloudflare orange only where Cloudflare is represented.
- Do not add decorative labels just because a PPTX slide had a title.

## Stack and constraints

React + TypeScript + Vite, GSAP for authored timelines, SVG for architecture, Canvas 2D for particles, CSS for type/layout.
No Next.js, no backend, no external APIs, no CDN, no remote fonts. Everything bundled; must work with Wi-Fi off.
`npm run build` → self-contained `dist/`. `npm run present` → local production-like server.

Fixed logical stage 1920×1080 scaled proportionally with black letterbox. Nothing responsive inside the stage.

## State model

`{ scene, beat }` — 8 scenes, deterministic. One click = one beat. Automatic motion only inside a beat where v3 intends it
(boot, wordmark, user counter, warnings, panic, 50B counter). Every beat must be reconstructable directly from state
(hash `#s.b` + localStorage). Going back must produce a valid visual state.

Beats:

- 01 BOOT: standby · boot (auto) · wordmark (auto) · title
- 02 ORIGIN: una idea bastante mala · tweet · strip ui · isolate · zoom ollama
- 03 LOCAL ≠ SELF-HOSTED: 5 · 15 · 30 · 50 · 75 · labels · vLLM/SGLang · LiteLLM/Bifrost
- 04 BURN TOKENS: hardware · modelos · qué hacer · void · burn · qwencito
- 05 ARCHITECTURE: rtx 6000 pro · vllm · litellm · nginx · ~25 users · requests
- 06 SCALE: waitlist · server_02 · reyes magos · server_03 · warnings · kernel panic
- 07 REBUILD: reboot · cloudflare + kubernetes · cloudflare layer · kubernetes layer · traffic
- 08 FINALE: ~5 meses · 900+ · 80+ · 10+ · 50B tokens · still scaling · q&a

## Controls

→ / PageDown / Space(fullscreen) next · ← / PageUp prev · 1–8 scene · F fullscreen · O overview · P presenter ·
Home / End. Presenter view in a separate window synced by BroadcastChannel. `?debug=1` debug panel (never otherwise).

## Key content rules (see audit for the full mapping)

- Tweet: real text from the source screenshot, never invented copy.
- Restore the real vLLM / SGLang / LiteLLM / Bifrost logos, the RTX 6000 PRO photo, the Qwen release graphic, This is Fine.
- The three warnings keep their Spanish source text: *No hay HA en puntos críticos* · *Meter/quitar modelos supone caída de servicio* · *Todo dependía del server 01*.
- Current architecture (slide 22) must contain every source component: DNS, Cloudflared, Rutas, Workers / cloudflared, Traefik,
  api.nan.builders, LiteLLM (Fork), CNPG, Valkey, Grafana, Victoria Metrics, vLLM.
- Panic: 520 ms, then ABSOLUTE black (no grid, particles, chrome, logo) until the next input. Reduced motion keeps the cut.
- QR generated locally at build from `src/deck/deck.config.ts` → `speakerQrUrl`. Never guess the URL.

## Working style

Work autonomously. Ask only on ambiguity that would materially change the talk (record it in the audit).
Do not report "done" while placeholders remain (an unknown QR URL may stay as an explicit TODO).
