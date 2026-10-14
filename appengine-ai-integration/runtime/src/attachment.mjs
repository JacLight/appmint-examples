// Read a small text attachment through appengine as the employee. Never fetch
// arbitrary attachment URLs or expose signed URLs, raw storage data or tokens.
export const MAX_TEXT_BYTES = 16_000;
const MAX_RESPONSE_BYTES = 512_000;

export async function readAttachment(state, index, fetcher = fetch) {
  if (!/^[1-9]\d*$/.test(String(index))) throw new Error('usage: ./ae file <file-attachment-number>');
  const attachment = state.fileAttachments?.[Number(index) - 1];
  if (!attachment) throw new Error('No such file attachment on this job.');
  const org = String(state.orgId || '');
  const stored = String(attachment.path || '');
  if (!org || !stored || /[\\:%?#\u0000-\u001f]/.test(stored) || stored.startsWith('/') || stored.split('/').some(p => !p || p === '.' || p === '..')) {
    throw new Error('Attachment needs a valid stored file path; URL-only and traversal paths are not supported.');
  }
  const relative = stored.startsWith(`${org}/`) ? stored.slice(org.length + 1) : stored;
  if (!relative) throw new Error('Attachment needs a file path.');
  // Always provide the exact org prefix, avoiding ambiguous prefix matching in
  // the storage adapter. Permission checks still run on both API requests.
  const location = `${org}/${relative}`;
  const mime = String(attachment.mime || '').split(';')[0].trim().toLowerCase();
  if (!/\.(txt|md|csv|tsv|json|log)$/i.test(relative) || (mime && !mime.startsWith('text/') && !['application/json', 'application/octet-stream'].includes(mime))) {
    throw new Error('Only small UTF-8 text attachments (.txt, .md, .csv, .tsv, .json, .log) are supported.');
  }
  const request = async endpoint => {
    const res = await fetcher(`${state.apiBaseUrl.replace(/\/+$/, '')}/repository/file/${endpoint}`, {
      method: 'POST',
      headers: { orgid: org, authorization: `Bearer ${state.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ location }),
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`Attachment ${endpoint} refused (HTTP ${res.status}); check the employee's file access and the attachment path.`);
    }
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES) throw new Error('Attachment API response is too large.');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new Error('Attachment API returned an unsupported response.'); }
  };
  const stat = await request('stat');
  if (!Number.isSafeInteger(stat.size) || stat.size < 0 || stat.size > MAX_TEXT_BYTES) {
    throw new Error(`Attachment size must be known and at most ${MAX_TEXT_BYTES} bytes.`);
  }
  const result = await request('buffer');
  const content = result.content;
  let bytes;
  if (typeof content === 'string') bytes = Buffer.from(content, 'utf8');
  else if (content?.type === 'Buffer' && Array.isArray(content.data) && content.data.length <= MAX_TEXT_BYTES && content.data.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) bytes = Buffer.from(content.data);
  else throw new Error('Attachment API did not return supported text or Buffer content.');
  if (bytes.length > MAX_TEXT_BYTES) throw new Error(`Attachment exceeds ${MAX_TEXT_BYTES} bytes.`);
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('Attachment is not valid UTF-8 text.'); }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new Error('Attachment contains binary or terminal control characters.');
  return text;
}
