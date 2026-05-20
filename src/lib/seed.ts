/**
 * Hand-authored seed receipts.
 *
 * Three real, locally-shaped Indonesian receipts so reviewers landing on the
 * /ledger page see actual content, not lorem. Each includes itemised lines,
 * a concrete one-sentence insight in Bahasa Indonesia, and a category that
 * fits the typical Jakarta-Bekasi spending profile of a 20-something dev.
 */
import type { Receipt } from './types';

export const SEED_RECEIPTS: Receipt[] = [
  {
    id: '20260518-indomaret-bekasi',
    date: '2026-05-18',
    capturedAt: '2026-05-18T19:32:00.000Z',
    merchant: {
      name: 'Indomaret Pekayon Raya',
      type: 'minimarket',
      location: 'Bekasi, Jawa Barat'
    },
    items: [
      { name: 'Indomilk UHT Coklat 1L',         quantity: 2, unitPrice: 18900, total: 37800 },
      { name: 'Indomie Goreng Original',         quantity: 5, unitPrice: 3500,  total: 17500 },
      { name: 'Telur Ayam Negeri 1kg',           quantity: 1, unitPrice: 28500, total: 28500 },
      { name: 'Sabun Lifebuoy Refill 450ml',     quantity: 1, unitPrice: 19500, total: 19500 },
      { name: 'Aqua 600ml',                      quantity: 6, unitPrice: 3500,  total: 21000 }
    ],
    total: 124300,
    currency: 'IDR',
    paymentMethod: 'GoPay',
    category: 'groceries',
    insight: 'Belanja minggu ini normal, dominan kebutuhan dapur dan air minum.',
    flag: 'ok',
    sourcePreview: null,
    tokens: { vision: 1820, reasoning: 540 }
  },

  {
    id: '20260519-gofood-kopi-tuku',
    date: '2026-05-19',
    capturedAt: '2026-05-19T08:14:00.000Z',
    merchant: {
      name: 'GoFood — Kopi Tuku Bintaro',
      type: 'food-delivery',
      location: 'Tangerang Selatan'
    },
    items: [
      { name: 'Es Kopi Susu Tetangga',           quantity: 2, unitPrice: 23000, total: 46000 },
      { name: 'Croissant Coklat',                 quantity: 1, unitPrice: 28000, total: 28000 },
      { name: 'Biaya pengiriman',                quantity: 1, unitPrice: 8000,  total: 8000 },
      { name: 'Biaya layanan',                    quantity: 1, unitPrice: 3500,  total: 3500 }
    ],
    total: 85500,
    currency: 'IDR',
    paymentMethod: 'GoPay',
    category: 'food-delivery',
    insight: 'Kopi pesan-antar udah lewat tiga kali minggu ini — coba bikin di rumah?',
    flag: 'watch',
    sourcePreview: null,
    tokens: { vision: 1450, reasoning: 510 }
  },

  {
    id: '20260520-spbu-pertamina-pertalite',
    date: '2026-05-20',
    capturedAt: '2026-05-20T11:08:00.000Z',
    merchant: {
      name: 'SPBU Pertamina 31.123.04',
      type: 'spbu',
      location: 'Jl. Kalimalang, Jakarta Timur'
    },
    items: [
      { name: 'Pertalite — 12.45 liter @ Rp 10.000', quantity: 1, unitPrice: 124500, total: 124500 }
    ],
    total: 124500,
    currency: 'IDR',
    paymentMethod: 'QRIS',
    category: 'fuel',
    insight: 'Isi BBM ~3 hari lebih cepat dari biasanya — cek pemakaian motor minggu ini.',
    flag: 'watch',
    sourcePreview: null,
    tokens: { vision: 980, reasoning: 480 }
  }
];

export function findSeed(id: string): Receipt | undefined {
  return SEED_RECEIPTS.find((r) => r.id === id);
}

/** Sum of all seed receipts — used in the landing page hero metric. */
export const SEED_TOTAL_IDR = SEED_RECEIPTS.reduce((s, r) => s + r.total, 0);
