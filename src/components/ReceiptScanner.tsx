import { useRef, useState } from 'react';
import { CATEGORY_META, formatIDR, type Receipt } from '../lib/types';
import { SEED_RECEIPTS } from '../lib/seed';
import { Loader2, ScanLine, Sparkles, Upload, ImageIcon, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'reading' | 'thinking' | 'done' | 'error';

const stageCopy: Record<Exclude<Status, 'idle' | 'done' | 'error'>, string> = {
  reading:  'mimo-v2.5-vision is reading the receipt…',
  thinking: 'mimo-v2.5-reasoning is categorising and writing your insight…'
};

export default function ReceiptScanner() {
  const [status, setStatus] = useState<Status>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image. Please drop a photo of a receipt.');
      return;
    }
    setError(null);
    setReceipt(null);

    // Read as base64 data URL.
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setPreviewUrl(dataUrl);
    setStatus('reading');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl, hint: hint || undefined })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `Scan failed (${res.status})`);
      setStatus('thinking');
      // The server already runs both stages; we just show the second-stage UX briefly.
      await new Promise((r) => setTimeout(r, 350));
      setReceipt(json.receipt as Receipt);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  function loadSample(idx: number) {
    setError(null);
    setStatus('done');
    setReceipt(SEED_RECEIPTS[idx]);
    setPreviewUrl(null);
  }

  function reset() {
    setStatus('idle');
    setReceipt(null);
    setPreviewUrl(null);
    setError(null);
  }

  const meta = receipt ? CATEGORY_META[receipt.category] : null;
  const isWorking = status === 'reading' || status === 'thinking';

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      <div>
        <label
          className="group relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-ink-200 bg-white transition hover:border-ink-400"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-ink-700', 'bg-bone-100');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-ink-700', 'bg-bone-100');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-ink-700', 'bg-bone-100');
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
              {isWorking && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-x-0 h-1.5 bg-lime-accent shadow-lime animate-scan" />
                  <div className="absolute inset-0 bg-ink-800/30" />
                </div>
              )}
            </>
          ) : (
            <div className="px-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-800 text-bone-50 transition group-hover:bg-lime-accent group-hover:text-ink-800">
                <Upload className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tightest text-ink-800">
                Drop a receipt
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink-400">
                Photo, scan, or screenshot of a Indomaret / GoFood / SPBU / café
                receipt — anything Indonesian.
              </p>
              <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.16em] text-ink-300">
                or click to choose · jpg / png / webp
              </p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>

        {/* Sample chooser */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-300">No camera handy?</span>
          {SEED_RECEIPTS.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => loadSample(i)}
              className="rounded-md border rule bg-white px-2.5 py-1 font-medium text-ink-600 transition hover:border-ink-400"
            >
              {r.merchant.name.replace(/^GoFood — /, '').slice(0, 22)}
            </button>
          ))}
        </div>

        {/* Hint input */}
        <div className="mt-4">
          <label className="text-[11px] font-mono uppercase tracking-[0.16em] text-ink-300">
            Optional hint
          </label>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder='e.g. "kopi for the team", "groceries for ibu"'
            className="mt-1 w-full rounded-lg border rule bg-white px-3 py-2 text-sm text-ink-700 shadow-edge focus:border-ink-700 focus:outline-none"
            maxLength={120}
          />
        </div>
      </div>

      {/* ── Result panel ──────────────────────────────────────────────────── */}
      <aside className="flex flex-col gap-4">
        <div className="pop p-5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-ink-300">
              Live pipeline
            </div>
            {status === 'done' && receipt && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-medium text-ink-400 underline-offset-4 hover:text-ink-700 hover:underline"
              >
                Scan another
              </button>
            )}
          </div>

          <ol className="mt-5 space-y-3 text-sm">
            <Step
              n={1}
              label="Vision OCR"
              model="mimo-v2.5-vision"
              active={status === 'reading'}
              done={status === 'thinking' || status === 'done'}
              hint={status === 'reading' ? stageCopy.reading : 'JSON: items, total, merchant'}
            />
            <Step
              n={2}
              label="Coach"
              model="mimo-v2.5-reasoning"
              active={status === 'thinking'}
              done={status === 'done'}
              hint={status === 'thinking' ? stageCopy.thinking : 'Category, anomaly flag, Bahasa insight'}
            />
            <Step
              n={3}
              label="Persist"
              model="client-side ledger"
              active={false}
              done={status === 'done'}
              hint={status === 'done' ? 'Saved to your ledger.' : 'No server DB. No account.'}
            />
          </ol>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result card */}
        {receipt && meta && (
          <div className="pop p-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className={`chip ${meta.tint}`}>
                {meta.emoji} {meta.label}
              </span>
              <span className="chip font-mono">{receipt.date}</span>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink-800">
              {receipt.merchant.name}
            </h3>
            <div className="mt-1 num text-3xl font-semibold tracking-tightest text-ink-800">
              {formatIDR(receipt.total)}
            </div>

            <ul className="mt-4 divide-y rule rounded-md border rule text-sm">
              {receipt.items.slice(0, 6).map((item, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2">
                  <span className="truncate text-ink-700">
                    {item.quantity > 1 && (
                      <span className="mr-1 text-ink-300">{item.quantity}×</span>
                    )}
                    {item.name}
                  </span>
                  <span className="num text-ink-700">{formatIDR(item.total)}</span>
                </li>
              ))}
              {receipt.items.length > 6 && (
                <li className="px-3 py-2 text-center text-[11px] text-ink-300">
                  +{receipt.items.length - 6} more lines
                </li>
              )}
            </ul>

            <p className="mt-4 rounded-lg border-l-2 border-lime-accent bg-bone-100/70 px-3 py-2 text-sm text-ink-700">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-ink-500" />
              {receipt.insight}
            </p>
          </div>
        )}

        {!receipt && status === 'idle' && (
          <div className="pop flex flex-col items-center gap-2 p-8 text-center">
            <ScanLine className="h-6 w-6 text-ink-300" />
            <div className="font-display text-base font-semibold text-ink-800">
              Drop a receipt to start
            </div>
            <p className="max-w-xs text-xs text-ink-400">
              Or click a sample on the left. Nota will OCR it, categorise it, and
              write you a one-line insight in Bahasa.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Step(props: {
  n: number;
  label: string;
  model: string;
  active: boolean;
  done: boolean;
  hint: string;
}) {
  const { n, label, model, active, done, hint } = props;
  return (
    <li className="flex items-start gap-3">
      <div
        className={
          'grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-xs font-semibold ' +
          (done
            ? 'bg-ink-800 text-bone-50'
            : active
              ? 'bg-lime-accent text-ink-800'
              : 'bg-bone-200 text-ink-300')
        }
      >
        {active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? '✓' : n}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-ink-800">{label}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            {model}
          </span>
        </div>
        <div className="text-xs text-ink-400">{hint}</div>
      </div>
    </li>
  );
}
