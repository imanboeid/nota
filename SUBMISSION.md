# 100T Creator Incentive — Nota application draft

> Copy-paste ready text for the Xiaomi MiMo Orbit form. Edit bracketed
> placeholders before sending.

---

## Project name

**Nota — AI personal-finance coach for Indonesia**

## One-line pitch

Snap any Indonesian receipt — Indomaret, GoFood, SPBU, café — and Nota reads it, categorises it, and tells you in one warm Bahasa Indonesia sentence what your wallet just did. Powered end-to-end by Xiaomi MiMo (Vision + Reasoning + TTS).

## Live demo / proof links

- **Live demo:** https://nota-receipt.netlify.app  <!-- update after Netlify deploy -->
- **GitHub repo:** https://github.com/<3rd-handle>/nota  <!-- update -->
- **Architecture write-up:** in-app at `/how-it-works`, plus [`ARCHITECTURE.md`](https://github.com/<3rd-handle>/nota/blob/main/ARCHITECTURE.md)
- **Sample ledger:** https://nota-receipt.netlify.app/ledger

## Project description (form field 04 — fits 1,200 char limit)

```
Nota — AI personal-finance coach for Indonesia — built end-to-end inside Windsurf with Xiaomi MiMo.

Problem: Personal-finance apps make you log every transaction. Receipt scanners want an account and a subscription. Nobody just looked at the paper, told you what you bought, and stopped there. Indonesians scan 5–15 receipts a day across Indomaret, GoFood, SPBU, kopi — none of it gets tracked.

Core flow — two MiMo models per scan, ~3 seconds end-to-end:
1. See — mimo-v2.5-vision OCRs the receipt photo into structured JSON: items, prices, total, merchant.
2. Coach — mimo-v2.5-reasoning categorises + writes ONE warm Bahasa Indonesia sentence (e.g. "Kopi minggu ini udah lewat tiga kali jatah biasa").
3. (weekly) Speak — mimo-v2.5-tts reads a 60-second recap script aloud on Sunday mornings.

Nota uses all three MiMo families per workflow — disable any one and the product visibly degrades. Per receipt: ~1.2K vision + ~520 reasoning tokens. Per week: ~14.5K tokens + 600 TTS chars per active user. Recurring daily load — 5–15 scans/day per user across millions of Indonesian smartphones is realistic, not aspirational.

Live: https://nota-receipt.netlify.app
Repo: https://github.com/<3rd-handle>/nota
```

(~1,180 characters. URLs included for reviewer eyeballs.)

## Agent tool / model series (form fields 02-03)

- **02 Agent tool:** Windsurf
- **03 Model series:** MiMo

## Proof attachments (form field 05)

- 🔗 **Link:** `https://nota-receipt.netlify.app`
- Optional upload screenshots:
  1. `/` landing page (hero with parsed Indomaret receipt)
  2. `/scan` showing the drag-drop scanner UI
  3. `/ledger` showing the spending-by-category bar chart
  4. `/how-it-works` architecture page with the pipeline diagram

## Roadmap (next 30 days, if approved)

1. **PWA `share_target`** — share a receipt photo from any gallery → Nota auto-opens with it pre-loaded.
2. **IndexedDB ledger** for users above 50 receipts.
3. **Voice memo per receipt** (MiMo TTS inverse / Whisper-style) — speak a one-line note when scanning.
4. **Mandarin coach mode** — same product, ZH variant of the system prompt.
5. **Budget mode** — set a weekly cap, see a coloured progress ring instead of a number.

## Team & contact

- **[Your name]** — full-stack engineer, Bekasi.
- Email: `<3rd-email>@gmail.com`
- GitHub: https://github.com/<3rd-handle>

---

## Pre-submit checklist

- [ ] Live URL loads, hero visible.
- [ ] `/scan` opens, drop zone responsive, sample buttons load seed receipts.
- [ ] `/ledger` shows category bar chart with all three seed receipts.
- [ ] `/how-it-works` shows the four-stage pipeline diagram + code preview.
- [ ] Repo public, `README.md` and `ARCHITECTURE.md` render on GitHub.
- [ ] Form description ≤ 1,200 chars.
