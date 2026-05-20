/**
 * Two-stage scan pipeline:
 *
 *   Stage 1 — Vision OCR    → mimo-v2.5-vision
 *     The receipt photo (base64 data-URL) is sent as an image_url part to
 *     the vision model with a strict JSON system prompt. Output: structured
 *     receipt with line items, total, merchant.
 *
 *   Stage 2 — Reasoning     → mimo-v2.5-reasoning
 *     The structured receipt is fed to a coach prompt that returns a
 *     category + flag ('ok' | 'watch' | 'spike') + a single Bahasa Indonesia
 *     insight sentence.
 *
 * The pipeline is deliberately resilient: if reasoning fails we still
 * surface the OCR'd receipt with category 'other' and a default insight,
 * so the user always gets *something* useful out of every scan.
 */
import { mimo, models, hasCredentials } from './mimo';
import { VISION_OCR_SYSTEM, COACH_SYSTEM } from './prompts';
import { ReceiptSchema, type Receipt, type ScanRequest } from '../types';

const RECEIPT_SCHEMA_DESC = `
{
  "date": "YYYY-MM-DD",
  "merchant": { "name": "string", "type": "minimarket|supermarket|food-delivery|restaurant|cafe|spbu|pharmacy|household|other", "location": "string|null" },
  "items": [{ "name": "string", "quantity": number, "unitPrice": number|null, "total": number }],
  "total": number,
  "paymentMethod": "string|null"
}
`.trim();

export async function scanReceipt(req: ScanRequest): Promise<Receipt> {
  if (!hasCredentials()) {
    throw new Error(
      'MIMO_API_KEY not configured on the server. The seed ledger still works — live scanning requires a Xiaomi MiMo key.'
    );
  }
  const client = mimo();
  const capturedAt = new Date().toISOString();

  let visionTokens = 0;
  let reasoningTokens = 0;

  // ── Stage 1: Vision OCR ─────────────────────────────────────────────────
  const visionResp = await client.chat.completions.create({
    model: models.vision(),
    messages: [
      { role: 'system', content: VISION_OCR_SYSTEM },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `Extract a structured receipt from this image. Return JSON of the shape:\n${RECEIPT_SCHEMA_DESC}\n` +
              (req.hint ? `\nHint from user: ${req.hint}` : '')
          },
          { type: 'image_url', image_url: { url: req.imageDataUrl } }
        ]
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  });
  visionTokens += visionResp.usage?.total_tokens ?? 0;
  const ocr = JSON.parse(visionResp.choices[0].message.content ?? '{}');

  // ── Stage 2: Coach (categorise + insight) ───────────────────────────────
  let category: Receipt['category'] = 'other';
  let flag: Receipt['flag'] = 'ok';
  let insight = 'Tercatat di ledger. Cek total minggu ini di tab Ledger.';

  try {
    const coachResp = await client.chat.completions.create({
      model: models.reasoning(),
      messages: [
        { role: 'system', content: COACH_SYSTEM },
        {
          role: 'user',
          content: `Receipt:\n${JSON.stringify(
            { merchant: ocr.merchant, items: ocr.items, total: ocr.total },
            null,
            2
          )}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5
    });
    reasoningTokens += coachResp.usage?.total_tokens ?? 0;
    const coach = JSON.parse(coachResp.choices[0].message.content ?? '{}');
    if (coach.category) category = coach.category;
    if (coach.flag) flag = coach.flag;
    if (coach.insight) insight = coach.insight;
  } catch {
    // Coach is allowed to fail; the receipt still ships.
  }

  // ── Assemble ─────────────────────────────────────────────────────────────
  const slugBase = (ocr.merchant?.name ?? 'receipt')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  const candidate: Receipt = {
    id: `${(ocr.date ?? capturedAt.slice(0, 10)).replace(/-/g, '')}-${slugBase}`,
    date: ocr.date ?? capturedAt.slice(0, 10),
    capturedAt,
    merchant: {
      name: ocr.merchant?.name ?? 'Unknown merchant',
      type: ocr.merchant?.type ?? 'other',
      location: ocr.merchant?.location ?? null
    },
    items: (ocr.items ?? []).map(
      (i: { name?: string; quantity?: number; unitPrice?: number | null; total?: number }) => ({
        name: i.name ?? 'Item',
        quantity: i.quantity ?? 1,
        unitPrice: i.unitPrice ?? null,
        total: i.total ?? 0
      })
    ),
    total: ocr.total ?? 0,
    currency: 'IDR',
    paymentMethod: ocr.paymentMethod ?? null,
    category,
    insight,
    flag,
    sourcePreview: req.imageDataUrl,
    tokens: { vision: visionTokens, reasoning: reasoningTokens }
  };

  const safe = ReceiptSchema.safeParse(candidate);
  if (!safe.success) {
    throw new Error(
      `Vision returned a malformed receipt: ${safe.error.issues.map((i) => i.message).join(', ')}`
    );
  }
  return safe.data;
}
