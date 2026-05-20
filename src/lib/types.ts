import { z } from 'zod';

/**
 * The shape MiMo Vision is asked to extract from any photographed receipt.
 *
 * Items are broken out one-per-line so we can colour-code categories in the
 * ledger view, and so the reasoning model has clean input to analyse.
 */
export const ReceiptItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nonnegative().default(1),
  unitPrice: z.number().nonnegative().nullable().default(null),
  total: z.number().nonnegative()
});

export const ReceiptSchema = z.object({
  /** A short, stable id we generate (e.g. yyyymmdd-merchant-slug). */
  id: z.string(),
  /** ISO 8601 date the receipt was issued. */
  date: z.string(),
  /** ISO timestamp when Nota processed it. */
  capturedAt: z.string(),
  merchant: z.object({
    name: z.string(),
    /** Indomaret, Alfamart, GoFood, Grab, SPBU, Cafe, etc. */
    type: z.string(),
    location: z.string().nullable().default(null)
  }),
  items: z.array(ReceiptItemSchema).min(1),
  total: z.number().nonnegative(),
  currency: z.string().default('IDR'),
  /** Optional payment method spotted on the receipt. */
  paymentMethod: z.string().nullable().default(null),
  /** Nota's classification of this receipt overall. */
  category: z.enum([
    'groceries',
    'food-delivery',
    'dine-in',
    'transport',
    'fuel',
    'pharmacy',
    'household',
    'entertainment',
    'utilities',
    'other'
  ]),
  /** A single sentence note from the reasoning model — Bahasa Indonesia. */
  insight: z.string(),
  /** Severity flag based on price-vs-history. */
  flag: z.enum(['ok', 'watch', 'spike']).default('ok'),
  /** What the user uploaded — kept only as a base64 data URL for the demo. */
  sourcePreview: z.string().nullable().default(null),
  /** Token usage attributed to this receipt. */
  tokens: z.object({
    vision: z.number().int().nonnegative(),
    reasoning: z.number().int().nonnegative()
  })
});

export type Receipt = z.infer<typeof ReceiptSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

/** Body of POST /api/scan — comes from the drag-drop component. */
export const ScanRequestSchema = z.object({
  /** data:image/...;base64,xxxxx */
  imageDataUrl: z.string().refine(
    (s) => /^data:image\/(png|jpe?g|webp);base64,/.test(s),
    'imageDataUrl must be a base64-encoded image'
  ),
  /** Optional hint the user can supply (merchant or category). */
  hint: z.string().trim().max(120).optional()
});
export type ScanRequest = z.infer<typeof ScanRequestSchema>;

/** Body of POST /api/recap — generates a weekly audio summary. */
export const RecapRequestSchema = z.object({
  /** ISO date marking the start of the week to recap. */
  weekStart: z.string(),
  /** All receipts to consider for the recap. */
  receipts: z.array(ReceiptSchema).max(120)
});
export type RecapRequest = z.infer<typeof RecapRequestSchema>;

export interface RecapResponse {
  audioUrl: string | null;
  script: string;
  totals: {
    spent: number;
    byCategory: Array<{ category: string; amount: number }>;
  };
  tokens: { reasoning: number; ttsChars: number };
}

/** Convenience: format a rupiah amount with Indonesian locale. */
export function formatIDR(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);
}

/** Subtle category metadata, used by the ledger UI for chips/colours. */
export const CATEGORY_META: Record<
  Receipt['category'],
  { label: string; emoji: string; tint: string }
> = {
  groceries:       { label: 'Groceries',       emoji: '🛒', tint: 'bg-lime-accentSoft text-ink-700' },
  'food-delivery': { label: 'Food delivery',   emoji: '🛵', tint: 'bg-orange-100 text-orange-900' },
  'dine-in':       { label: 'Dine in',         emoji: '🍜', tint: 'bg-rose-100 text-rose-900' },
  transport:       { label: 'Transport',       emoji: '🚇', tint: 'bg-sky-100 text-sky-900' },
  fuel:            { label: 'Fuel',            emoji: '⛽', tint: 'bg-yellow-100 text-yellow-900' },
  pharmacy:        { label: 'Pharmacy',        emoji: '💊', tint: 'bg-emerald-100 text-emerald-900' },
  household:       { label: 'Household',       emoji: '🏠', tint: 'bg-violet-100 text-violet-900' },
  entertainment:   { label: 'Entertainment',   emoji: '🎬', tint: 'bg-fuchsia-100 text-fuchsia-900' },
  utilities:       { label: 'Utilities',       emoji: '💡', tint: 'bg-amber-100 text-amber-900' },
  other:           { label: 'Other',           emoji: '📦', tint: 'bg-bone-200 text-ink-600' }
};
