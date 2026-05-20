import type { APIRoute } from 'astro';
import { ScanRequestSchema } from '../../lib/types';
import { scanReceipt } from '../../lib/server/pipeline';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body must be valid JSON.' }, { status: 400 });
  }

  const parsed = ScanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid request', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  try {
    const receipt = await scanReceipt(parsed.data);
    return Response.json({ receipt }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};
