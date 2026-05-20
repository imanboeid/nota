# Nota

> Snap a struk. Sleep richer. AI personal-finance coach for Indonesia, built end-to-end on **Xiaomi MiMo**.

Nota turns any photographed Indonesian receipt — Indomaret, GoFood, SPBU, kopi tetangga — into a parsed, categorised line in your personal ledger, with one warm Bahasa Indonesia sentence telling you what just happened to your wallet. On Sundays, it reads the week back to you in 60 seconds.

[Live demo](https://nota-receipt.netlify.app) · [Architecture](./ARCHITECTURE.md) · [How it works (in-app)](https://nota-receipt.netlify.app/how-it-works)

---

## Why this exists

Personal-finance apps make you log every transaction. Receipt scanners want an account, a subscription, and a referral code. Nobody just looked at the paper, told you what you bought, and stopped there.

Nota is the smallest possible app that closes that gap — drop a struk, get one Bahasa sentence, see the week add up. It was built for the **Xiaomi MiMo Orbit 100T Creator Incentive Program** because it is the rare consumer product that exercises *all three* MiMo model families per request:

| MiMo model            | Role in Nota                                      | Approx. usage / receipt |
| --------------------- | -------------------------------------------------- | ----------------------- |
| `mimo-v2.5-vision`    | OCRs the photo into structured JSON               | ~1,200 tokens           |
| `mimo-v2.5-reasoning` | Categorises + writes a Bahasa insight + flag      | ~520 tokens             |
| `mimo-v2.5-tts`       | Reads the weekly recap aloud (~once / week)       | ~600 chars / week       |

Disable any one and the product breaks.

## What's in here

- **Astro 5 + React islands + Tailwind 3** — server-rendered shell, interactive scanner.
- **Three hand-crafted seed receipts** (`src/lib/seed.ts`) — Indomaret, GoFood Kopi Tuku, SPBU Pertalite. Real numbers, real merchants, real Indonesian context.
- **Two-stage server pipeline** (`src/lib/server/pipeline.ts`) — vision OCR → reasoning coach.
- **Drag-drop scanner** with live pipeline progress UI.
- **Privacy by default** — no account, no server database. The ledger lives in the user's browser tab.

## Quick start

### 1. Install

```bash
git clone https://github.com/<your-handle>/nota.git
cd nota
npm install
```

### 2. Configure (optional — demo runs without a MiMo key)

```bash
cp .env.example .env
# then edit .env:
# MIMO_API_KEY=mimo_sk_xxxxxxxxxxxxxxxx
```

Without `MIMO_API_KEY` the seed ledger and demo card still work — only the live scanner endpoint requires it.

### 3. Run

```bash
npm run dev      # http://localhost:4321
npm run build    # production build → ./dist
```

### 4. Try the pipeline directly

```bash
# Encode a receipt photo as base64 first.
IMG=$(base64 -w0 receipt.jpg)
curl -X POST http://localhost:4321/api/scan \
  -H 'content-type: application/json' \
  -d "{\"imageDataUrl\":\"data:image/jpeg;base64,$IMG\"}"
```

Returns the parsed `Receipt` JSON.

## Project layout

```
src/
├── styles/global.css        # Tailwind directives + tokens
├── layouts/Layout.astro     # Shell with header + footer
├── components/
│   ├── Brandmark.astro      # Receipt-with-lime-stripe brand mark
│   ├── Header.astro
│   ├── Footer.astro
│   ├── ReceiptCard.astro    # Compact + full receipt display
│   └── ReceiptScanner.tsx   # ⬅ React island: drag-drop + live pipeline UI
├── lib/
│   ├── types.ts             # Zod schemas + IDR formatter + category meta
│   ├── seed.ts              # Three hand-authored seed receipts
│   └── server/
│       ├── mimo.ts          # OpenAI SDK pointed at MiMo
│       ├── prompts.ts       # Vision + coach + recap system prompts
│       └── pipeline.ts      # scanReceipt(req) → structured Receipt
└── pages/
    ├── index.astro          # Landing
    ├── scan.astro           # Drag-drop scanner page
    ├── ledger.astro         # Charts + receipts list
    ├── how-it-works.astro   # Pipeline detail + token budget
    ├── about.astro
    └── api/scan.ts          # POST endpoint that runs the pipeline
```

## Deploy

Netlify-native via `@astrojs/netlify`. `netlify.toml` ships in the repo. The only required env var is `MIMO_API_KEY`.

```bash
npm run build
netlify deploy --prod
```

## License

MIT.
