# Nota — architecture

Two-stage scan pipeline, three MiMo models. This document is for the Xiaomi
MiMo reviewer — every architectural decision is defended.

## End-to-end request flow

```
                          ┌────────────────────────────────────┐
                          │ User drops a struk photo on /scan   │
                          │  (React island: ReceiptScanner.tsx) │
                          └──────────────┬─────────────────────┘
                                         │ POST /api/scan
                                         │ { imageDataUrl, hint? }
                                         ▼
                          ┌────────────────────────────────────┐
                          │ src/pages/api/scan.ts               │
                          │  - validates body with Zod          │
                          │  - calls scanReceipt(req)           │
                          └──────────────┬─────────────────────┘
                                         │
                                         ▼
       ┌──────────────────────────────────────────────────────────────┐
       │ src/lib/server/pipeline.ts                                   │
       ├──────────────────────────────────────────────────────────────┤
       │  STAGE 1 — Vision OCR        mimo-v2.5-vision                │
       │     → JSON {date, merchant, items[], total, paymentMethod}   │
       │     temperature 0.1, response_format=json_object             │
       │                                                               │
       │  STAGE 2 — Coach             mimo-v2.5-reasoning             │
       │     → JSON {category, flag, insight}                          │
       │     temperature 0.5, response_format=json_object             │
       │     (graceful degradation if it fails)                       │
       │                                                               │
       │  ASSEMBLE                                                    │
       │     Validate full Receipt with Zod, return.                  │
       └──────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
                          ┌────────────────────────────────────┐
                          │ Browser receives Receipt JSON       │
                          │ → renders into result panel         │
                          │ → appends to localStorage ledger    │
                          └────────────────────────────────────┘

       Sunday morning (separate cron / button):
       ┌──────────────────────────────────────────────────────────────┐
       │ POST /api/recap → reasoning model writes a 60-second script  │
       │ → mimo-v2.5-tts renders the script as MP3                    │
       │ → /ledger plays the audio                                    │
       └──────────────────────────────────────────────────────────────┘
```

## File-by-file

### `src/lib/server/mimo.ts`

Thin wrapper around the OpenAI SDK pointed at `platform.xiaomimimo.com/v1`.
Model ids and TTS voice are environment-overridable so the same code path
works against future MiMo models without editing source.

### `src/lib/server/prompts.ts`

Three system prompts, deliberately separated from the pipeline so they can
be A/B tested without touching route code:

- **`VISION_OCR_SYSTEM`** — turns a photo into a strict JSON receipt. Calls
  out the local context (rupiah, mixed Bahasa/English, thumbs in frame).
- **`COACH_SYSTEM`** — categorises, flags anomalies, writes ONE warm
  Bahasa sentence. Forbids English, exclamation marks, and moralising.
- **`RECAP_SYSTEM`** — writes a 60-second weekly audio script that the TTS
  model then narrates.

### `src/lib/server/pipeline.ts`

Two MiMo calls per scan. Notable design choices:

- **Vision is run with `temperature: 0.1`** — we want OCR to be
  near-deterministic. Coach runs warmer (0.5) because insights benefit
  from a little personality.
- **The Coach stage is allowed to fail.** The receipt still ships with
  category `'other'` and a default insight. We never hand the user nothing.
- **The final `Receipt` is Zod-validated.** If MiMo Vision returns
  something malformed, the request errors loudly instead of silently
  rendering broken data.
- **Token usage is surfaced per receipt** (`receipt.tokens.{vision,reasoning}`)
  and shown on the receipt card — full audit trail end-to-end.

### `src/components/ReceiptScanner.tsx` (React island)

- File drop → base64 → POST to `/api/scan`.
- Live pipeline UI shows three discrete steps animating in sequence
  (vision → coach → persist). Critical UX detail: the user sees the work
  happening, not a blank spinner.
- Sample buttons load seed receipts so the demo works without a key.

### `src/pages/ledger.astro`

Pure server-rendered Astro page that takes the seed receipts, sums them by
category, and renders a horizontal-bar chart with no chart library.
Performance budget: zero KB of JS shipped to render this page.

## Why three MiMo models per workflow

Not because we wanted to tick boxes. Because each model brings something
the others can't:

- **Vision** is the only model that can take a JPEG of a creased receipt and
  output structured items+prices+totals. Replacing it would mean shipping
  Tesseract or a cloud OCR API — losing the platform-singular dependency.
- **Reasoning** is the only model that can look at the OCR'd line items
  and write a culturally fluent Bahasa sentence about whether ~125k at
  Indomaret is "wajar" or a "spike" for that user. GPT-Indonesian is
  uncanny; MiMo is native.
- **TTS** turns the weekly recap from a paragraph nobody reads into a
  60-second listen during the Sunday morning shower.

Disable any one and the product visibly degrades.

## Per-week MiMo footprint

```
Component         Model                        Per scan       Per week (8 scans)
─────────         ─────                        ────────       ──────────────────
Vision OCR        mimo-v2.5-vision             ~1,200 tok     ~9,600 tokens
Coach             mimo-v2.5-reasoning          ~520 tok       ~4,160 tokens
Weekly recap      mimo-v2.5-reasoning          —              ~800 tokens
Weekly recap      mimo-v2.5-tts                —              ~600 chars
                                                              ──────────────────
                                                              ~14.5K tokens + 600 chars / user-week
```

At launch (10,000 active users × 8 receipts / day × 7 days):

- **96M vision tokens / week**
- **41M reasoning tokens / week**
- **6M TTS characters / week**

This is the kind of usage the 100T program is calibrated for — recurring,
multi-family, predictable.

## Privacy

- **No accounts.** No login button, no OAuth, no signup form anywhere in the codebase.
- **No server database.** The user's ledger is `localStorage` in the user's browser tab.
- **No analytics pixels.** Look at the network panel: only `/api/scan` calls hit the server, and only with the receipt the user just dropped.
- **No image retention.** The base64 photo is sent to MiMo Vision, then dropped. We never log it server-side.

## Future work

1. **IndexedDB persistence** for ledgers > 50 receipts (currently localStorage).
2. **Native PWA** with `share_target` so users can share a receipt photo from any
   gallery app and Nota auto-opens with it pre-loaded.
3. **Whisper voice notes** — speak a one-line memo per receipt (mimo-v2.5-tts inverse).
4. **Multi-language coach** — same product, Mandarin / English variants of `COACH_SYSTEM`.
5. **Budget mode** — set a weekly cap, get a coloured ring instead of just a number.
